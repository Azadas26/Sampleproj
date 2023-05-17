var Proimse = require('promise')
var db = require('../connection/connect_db')
var consts = require('../connection/const_collection')
var bcrypt = require('bcrypt')
var objectid = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const { resolve, reject } = require('promise')


var instance = new Razorpay({
    key_id: 'rzp_test_lBqfqkZtfYY8r3',
    key_secret: 'N60QtTbxW5307iegUvyTeIt5',
});

module.exports =
{
    Do_signup: (data) => {
        return new Proimse(async (resolve, reject) => {
            data.Password = await bcrypt.hash(data.Password, 10)
            db.get().collection(consts.User_base).insertOne(data).then((data) => {
                //console.log(data)
                resolve(data)
            })
        })
    },
    Do_login: (user) => {
        return new Proimse(async (resolve, reject) => {
            await db.get().collection(consts.User_base).findOne({ Email: user.Email }).then((datas) => {
                if (datas) {
                    bcrypt.compare(user.Password, datas.Password).then((data) => {
                        if (data) {
                            var state =
                            {
                                status: true,
                                user: datas
                            }
                            //console.log("login successfull...")
                            resolve(state)
                        }
                        else {
                            resolve({ status: false })
                            console.log("login faild")
                        }
                    })
                }
                else {
                    resolve({ status: false })
                    console.log("Incoorect Email address...")
                }
            })
        })
    },
    Do_cart: (userId, proId) => {

        return new Proimse(async (resolve, reject) => {
            var proObj =
            {
                item: objectid(proId),
                qut: 1
            }
            var cartpro = await db.get().collection(consts.Cart_base).findOne({ userid: objectid(userId) })

            if (cartpro) {
                var proindex = cartpro.products.findIndex(pro => pro.item == proId)
                console.log(proindex);

                if (proindex != -1) {
                    await db.get().collection(consts.Cart_base).updateOne({ 'products.item': objectid(proId) },
                        {
                            $inc: { 'products.$.qut': 1 }
                        }).then((data) => {
                            resolve(data)
                        })
                }
                else {

                    db.get().collection(consts.Cart_base).updateOne({ userid: objectid(userId) },
                        {
                            $push:
                            {
                                products: proObj
                            }
                        }).then((data) => {
                            //console.log("addeddd........")
                            resolve(data)
                        })

                }


            }
            else {
                var state =
                {
                    userid: objectid(userId),
                    products: [proObj]
                }
                db.get().collection(consts.Cart_base).insertOne(state).then((data) => {
                    console.log(data)
                    resolve(data)
                })
            }
        })
    },
    Get_carted_pro: (userId) => {
        return new Proimse(async (resolve, reject) => {
            var cartItems = await db.get().collection(consts.Cart_base).aggregate([
                {
                    $match:
                    {
                        userid: objectid(userId)
                    }

                },
                {
                    $unwind: "$products"
                },
                {
                    $project:
                    {
                        item: '$products.item',
                        qut: '$products.qut'
                    }
                },
                {
                    $lookup:
                    {
                        from: consts.Admin_Base,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project:
                    {
                        item: 1, qut: 1,
                        pro: {

                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }



            ]).toArray()

            // console.log(cartItems)
            if (cartItems) {
                resolve(cartItems)
            }
            else {
                resolve(null)
            }

        })
    },
    get_cartCount: (userId) => {
        return new Proimse(async (resolve, reject) => {
            var cartnum = 0
            var cart = await db.get().collection(consts.Cart_base).findOne({ userid: objectid(userId) })
            if (cart) {
                cartnum = cart.products.length
            }
            console.log(cartnum)
            resolve(cartnum)

        })
    },
    changecut: (cartId, proId, cut, qut) => {
        return new Proimse(async (resolve, reject) => {
            if (cut == -1 && qut == 1) {
                console.log("hello worls")
                await db.get().collection(consts.Cart_base).updateOne({ _id: objectid(cartId) },
                    {
                        $pull: { products: { item: objectid(proId) } }
                    }).then((response) => {
                        resolve({ removepro: true })
                    })
            }
            else {
                console.log("hello worls")
                await db.get().collection(consts.Cart_base).updateOne({ _id: objectid(cartId), 'products.item': objectid(proId) },
                    {
                        $inc: { 'products.$.qut': parseInt(cut) }
                    }).then((response) => {
                        resolve({ status: true })
                    })
            }

        })
    },
    Totelpayment: (userId) => {
        return new Proimse(async (resolve, reject) => {
            var Total = await db.get().collection(consts.Cart_base).aggregate([
                {
                    $match:
                    {
                        userid: objectid(userId)
                    }

                },
                {
                    $unwind: "$products"
                },
                {
                    $project:
                    {
                        item: '$products.item',
                        qut: '$products.qut'
                    }
                },
                {
                    $lookup:
                    {
                        from: consts.Admin_Base,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project:
                    {
                        item: 1, qut: 1,
                        pro: {

                            $arrayElemAt: ['$product', 0]
                        }
                    }
                },
                {
                    $group:
                    {
                        _id: null,
                        totalAmount: { $sum: { $multiply: ['$pro.Price', '$qut'] } }
                    }
                }



            ]).toArray()

            if (Total[0]) {
                console.log(Total[0].totalAmount)
                //console.log(cartItems[0].product)
                resolve(Total[0].totalAmount)
            }
            else {
                resolve(0)
            }

        })
    },
    Get_products_From_Cart_Base: (userId) => {
        return new Proimse(async (resolve, reject) => {
            var pro = await db.get().collection(consts.Cart_base).findOne({ userid: objectid(userId) })
            resolve(pro)
        })
    },
    Get_order_placement: (info) => {
        return new Proimse((resolve, reject) => {
            db.get().collection(consts.Order_Base).insertOne(info).then(async (data) => {
                await db.get().collection(consts.Cart_base).removeOne({ userid: objectid(info.userId) })
                resolve(data.ops[0]._id)
            })
        })
    },
    View_Orders_fROM_ORDER_bASE: (userId) => {
        return new Proimse(async (resolve, reject) => {
            var datas = await db.get().collection(consts.Order_Base).aggregate([
                {
                    $match: { userId: objectid(userId) }
                },
                {
                    $unwind: "$product"
                },
                {
                    $project:
                    {
                        pay: 1,
                        date: 1,
                        total: 1,
                        userId: 1,
                        status: 1,
                        item: '$product.item',
                        quantity: '$product.qut'
                    }
                },
                {
                    $lookup:
                    {
                        from: consts.Admin_Base,
                        localField: "item",
                        foreignField: "_id",
                        as: 'proo'
                    }
                },
                {
                    $project:
                    {
                        pay: 1,
                        date: 1,
                        total: 1,
                        userId: 1,
                        quantity: 1,
                        status: 1,
                        products: {
                            $arrayElemAt: ['$proo', 0]
                        }
                    }
                }

            ]).toArray()
            console.log(datas[0]);
            resolve(datas)
        })
    },
    Generate__Razopay: (orderId,total) => {
        return new Proimse((resolve, reject) => {

            instance.orders.create({
                amount: total*100,
                currency: "INR",
                receipt: ''+orderId,
                notes: {
                    key1: "value3",
                    key2: "value2"
                }
            },(err,order)=>
            {
                if(err)
                {
               console.log("Erorr......",err);
                }
                else
                {
                    //console.log(order);
                    resolve(order)
                }
            })
           
        })
    },
    Verfy_Payment:(details)=>
    {
        return new Proimse((resolve,reject)=>
        {
            const crypto = require("crypto");
            const hmac = crypto.createHmac('sha256','N60QtTbxW5307iegUvyTeIt5');
            hmac.update(details['payment[razorpay_order_id]'] + "|" + details['payment[razorpay_payment_id]']);
            let generatedSignature = hmac.digest('hex');

            if (generatedSignature == details['payment[razorpay_signature]'])
            {
                console.log("Azad checked");
                    resolve()
            }
            else
            {
                reject()
            }
        })
    },
    Chabge_PaymentStatus:(orderId)=>
    {
        console.log(orderId);
        return new Proimse((resolve,reject)=>
        {
            db.get().collection(consts.Order_Base).updateOne({_id:objectid(orderId)},
            {
                $set:
                {
                    status:'placed'
                }
            }).then((data)=>
            {
                console.log(data);
                resolve()
            })
        })
    }
}



