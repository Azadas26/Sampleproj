var mongoClient = require('mongodb').MongoClient
var Promise = require('promise')

var state =
{
    db: null,
}

module.exports =
{
    connection: () => {
        return new Promise((resolve, reject) => {
            var dbname = "ReLearning100"

            mongoClient.connect("mongodb://127.0.0.1:27017", { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true },(err, data) => {
                if (err) {
                    reject("DataBase connection error....")
                }
                else {
                    state.db = data.db(dbname)
                    resolve("DataBase connection successfull....")
                }
            })
        })
    },
    get: () => {
        return state.db;
    }
}

