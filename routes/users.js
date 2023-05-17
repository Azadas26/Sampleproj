var express = require('express');
var router = express.Router();
var admindb = require('../database/admin-base')
var userdb = require('../database/user-base')
var objectId = require('mongodb').ObjectId

module.exports.common = (req, res, next) => {
  if (req.session.status) {
    next()
  }
  else {
    res.redirect('/login')
  }
}

/* GET users listing. */
router.get('/', (req, res, next) => {

  admindb.get_products().then(async (products) => {

    if (req.session.status) {
      var user = req.session.user

      var count = 0
      await userdb.get_cartCount(req.session.user._id).then((data) => {
        count = data
      })


      res.render('./user/first-page', { admin: false, products, user, count })



    }
    else {
      res.render('./user/first-page', { admin: false, products })
    }

  })

});
router.get('/signup', (req, res) => {
  res.render('./user/signup-page', { admin: false })
})

router.post('/signup', (req, res) => {
  userdb.Do_signup(req.body).then((data) => {
    res.redirect('/signup')
  })
})

router.get('/login', (req, res) => {
  if (req.session.falase) {
    var errr = "Incorrect Username or password"
    res.render('./user/login-page', { admin: false, errr })
    req.session.falase = false
  }
  else {
    res.render('./user/login-page', { admin: false })
  }

})

router.post('/login', (req, res) => {
  userdb.Do_login(req.body).then((state) => {
    if (state.status) {
      req.session.status = true;
      req.session.user = state.user
      // console.log(req.session.user)
      res.redirect('/')
    }
    else {

      req.session.falase = true
      res.redirect('/login')

    }
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/login')
})

router.get('/cart',(req, res) => {
  //console.log(req.query.id)
  console.log("api called")
  userdb.Do_cart(req.session.user._id, req.query.id).then((data) => {
    //res.redirect('/')
    res.json({status:true})
    //res.json({status:true})

  })
})

router.get('/selectpro', this.common, (req, res) => {

  userdb.Get_carted_pro(req.session.user._id).then((cartpro) => {

    userdb.Totelpayment(req.session.user._id).then((total)=>
    {
      res.render('./user/cart-page', { admin: false, cartpro, user: req.session.user,total})
    })
   // console.log(cartpro)

    
  })

})

router.post('/changequt',(req,res)=>
{
  console.log(req.body);
  //console.log(req.body.cart, req.body.pro, req.body.cut, req.body.quantity)

  console.log(req.body);
  userdb.changecut(req.body.cart, req.body.pro, req.body.cut, req.body.quantity).then((response)=>
   {
     
    userdb.Totelpayment(req.body.userid).then((total)=>
    {
      response.total=total
      res.json(response)
      console.log(response)
    })
    
    
   })
})

router.get('/placeorder',this.common,async(req,res)=>
{
  await userdb.Totelpayment(req.session.user._id).then((total)=>
  {
    if(total==0)
    {
      res.redirect('/selectpro')
    }
    else
    {
      res.render('./user/payment-page', { admin: false, user: req.session.user, total })
    }
    
  })
   
})

router.post('/placeorder',(req,res)=>
{
  
  req.body.date=new Date()
  req.body.userId = objectId(req.session.user._id)
  userdb.Get_products_From_Cart_Base(req.session.user._id).then((pro)=>
  {
      userdb.Totelpayment(req.session.user._id).then((total)=>
      {
           req.body.product=pro.products;
           req.body.total=total;
           req.body.status=req.body.pay==='cod' ? 'placed' : 'penting';
           //console.log(req.body);
           userdb.Get_order_placement(req.body).then((orderId)=>
           {
              if(req.body.pay==='cod')
              {
                res.json({ codstatus: true })
              }
              else
              {
                 userdb.Generate__Razopay(orderId,total).then((response)=>
                 {
                     res.json(response)  
                     //console.log(response);/afterplaced
                 })
              }
           })
      })
  })
   
})

router.get('/afterplaced',(req,res)=>
{
    var data="Order Placed SuccessFully...."
    res.render('./user/success-order',{admin:false,user:req.session.user,data})
})

router.get('/vieworder',this.common,(req,res)=>
{
  userdb.View_Orders_fROM_ORDER_bASE(req.session.user._id).then((info)=>
  {
      res.render('./user/view-order',{admin:false,info,user:req.session.user})
  })
})

router.post('/verfypay',(req,res)=>
{
  console.log(req.body);
   userdb.Verfy_Payment(req.body).then(()=>
   {
     
     userdb.Chabge_PaymentStatus(req.body['order[receipt]']).then(()=>
      {
         console.log("Payment success full...");
         res.json({status:true})
      })
   }).catch((err)=>
   {
        res.json({status:false})
   })
})
module.exports = router;
