const { query } = require('express');
var express = require('express');
var router = express.Router();
var admindb = require('../database/admin-base')

/* GET home page. */
router.get('/', function (req, res, next) {

  admindb.get_products().then((products) => {
    res.render('./admin/list-products', { admin: true, products });
  })


});

router.get('/add', (req, res) => {
  res.render('./admin/add-products', { admin: true })
})

router.post('/add', (req, res) => {
  console.log(req.body)
  //console.log(req.files.Image)
  admindb.add_products(req.body).then((id) => {
    var image = req.files.Image
    var pdf = req.files.Pdf
    if (pdf) {
      pdf.mv("public/admin-pdf/" + id + ".pdf",(err,dn)=>
      {
        if(err)
        {
          console.log(err)
        }
      })
    }

    image.mv("public/admin_image/" + id + ".jpg", (err, done) => {
      if (err) {
        console.log(err)
      }
      else {
        res.redirect('/admin/add')
      }
    })

  })
})

router.get('/delete', (req, res) => {
  //console.log(req.query.id)
  admindb.delete_products(req.query.id).then((data) => {
    res.redirect('/admin')
  })
})

router.get('/edit', (req, res) => {
  admindb.click_edit(req.query.id).then((data) => {
    res.render('./admin/edit-products', { admin: true, data })
  })
})

router.post('/edit', (req, res) => {
  console.log(req.query.id)
  console.log(req.body)
  admindb.Edited_Products(req.query.id, req.body).then((data) => {
    res.redirect('/admin')
    if (req.files.Image) {
      // console.log("hi hellllo")
      var image = req.files.Image
      image.mv("public/admin_image/" + req.query.id + ".jpg", (err, done) => {
        if (err) {
          // console.log(err)
        }
      })
    }
  })
})


module.exports = router;
