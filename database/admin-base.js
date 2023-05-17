var db = require('../connection/connect_db')
var consts = require('../connection/const_collection')
var Promise = require('promise')
var objectId = require('mongodb').ObjectId

module.exports =
{
    add_products: (data) => {
        return new Promise((resolve, reject) => {
            data.Price=parseInt(data.Price)
            db.get().collection(consts.Admin_Base).insertOne(data).then((data) => {
                //console.log(data)
                resolve(data.ops[0]._id)
            })
        })
    },
    get_products: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(consts.Admin_Base).find().toArray().then((data) => {
                //console.log(data)
                resolve(data)
            })
        })
    },
    delete_products: (id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(consts.Admin_Base).removeOne({ _id: objectId(id) }).then((data) => {
                /// console.log(data)
                resolve(data)
            })
        })
    },
    click_edit: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(consts.Admin_Base).findOne({ _id: objectId(id) }).then((data) => {
                //console.log(data)
                resolve(data)
            })
        })
    },
    Edited_Products: (id, data) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(consts.Admin_Base).updateOne({ _id: objectId(id) },
                {
                    $set:
                    {
                        Name: data.Name,
                        Discription: data.Discription,
                        Price: data.Price
                    }
                }).then((data) => {
                   // console.log(data)
                   resolve(data)
                })
        })
    }
}