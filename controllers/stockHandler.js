const apiRoutes = require('../routes/api.js');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const request = require('request');const CONNECTION_STRING = process.env.DB;
const dbName = "test";
const collectionName = "stocks";
const shortid = require('shortid');

//This is a free API (with restrictions) that can perform the same function as the Google API (which seems defunct now).
//The restriction is that you have a limit on how many queries you can run.  For this API it is:
//Limit 5 api calls per minute.
const url = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&interval=1min&apikey=" + process.env.ALPH_DEMO + "&symbol="

function stockHandler () {
  
    this.getStock = function(comp, like, ipAddr, res, caller) {
      
      //Here we'll cycle through every element of the 'comp' array defined in our get request.  These are for stocks, the rest of the values should stay the same.
      comp.forEach(function(x) {
      let newUrl = url + x;
      //Using the request package to make a request to our alpha advantage API and pull data.
      request.get(newUrl, function (err, resp, data) {
      //This request does not actually return an "err" from what I've seen if it takes an invalid parameter.
      //We will log for it anyway.
      /*Example data from invalid query: 
      {
        "Error Message": "Invalid API call. Please retry or visit the documentation (https://www.alphavantage.co/documentation/) for TIME_SERIES_INTRADAY."
      }
      */
      if (err) {
        console.log(err)
        res.send("There was an error retrieving the request - please try again.")
      }
      if(!data) {
        console.log("No data found at URL.")
        res.send("No data found at URL, check your stock index.")
      }
      else if (data.includes("Error Message")) {
        console.log("Error getting URL.")
        res.send("There was an error getting the data, please try again.")
      }
      else {
        //Here we need to do some work to parse the data.  It returns a huge JSON object that we need to pull a property out of, then parse THAT property, THEN extract the values.
        let parser = JSON.parse(data)['Time Series (1min)']
        let dateKeys = Object.keys(parser)
        let price = parser[dateKeys[0]]["4. close"]
        
        
        let mongDB = MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if (err) {
          throw(err)
          }
        else {
          console.log("Connected correctly to server - performing stock operation.");
          const db = client.db(dbName);
          const collection = db.collection(collectionName)
          //If we have a like, we have some different mechanisms to handle.  Mainly, the ipAddr array.  addToSet will ensure we add no duplicates.  This answers the requirement of 'duplicate likes'.
          //Remember, we simply count this array for likes in our route and return.
          //Upsert makes it even easier - if this value isn't in our DB we'll add it.  Otherwise, update it!
            if (like) {
                 collection.findOneAndUpdate({stock: x}, {'$set' : {stock: x}, '$set' : {price: price}, '$addToSet': {ipAddr: ipAddr}}, {upsert: true, returnOriginal: false}, (err, result) => {
                  if (err) {
                    throw(err)
                  res.status(400).send("Sorry, it seems there was a problem.  Please try again.")
                  }
                  else if (result) {
                  console.log("Like operation completed.")
                  //Our callback will be used to funnel this data into our route so we can do more with it.  Right now, we can't do what we need to do with it.
                  caller({
                    stock: result.value.stock,
                    price: result.value.price,
                    ipAddr: result.value.ipAddr
                  })
                }
                else {
                  console.log("No entry found.")
                  res.status(400).send("There was an issue finding that entry, try again.")
                }
                client.close();
                })
              }
          else {
            //If there's no likes we want nothing to do with the ipAddr array.  We have to do minimal work to convert empty ipAddr arrays to '0' for likes but that's simple.
            //Upsert again will plop this guy right in the DB for us, or perform an update.
            collection.findOneAndUpdate({stock: x}, {'$set' : {stock: x}, '$set' : {price: price}}, {upsert: true, returnOriginal: false}, (err, result) => {
            if (err) {
              throw(err)
            }
            else if (result) {
              console.log("Entry added with no like.")
              caller({
                stock: result.value.stock,
                price: result.value.price,
                ipAddr: result.value.ipAddr
              })
            }
            else {
              console.log("No entry found for like operation.")
            }
          })
          }
      }
          client.close();
    })
  }
})})
}
}

module.exports = stockHandler;