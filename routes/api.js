/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var StockHandler = require('../controllers/stockHandler.js')

module.exports = function (app) {
  var stockHandler = new StockHandler();
  
  //We'll handle the majority of the action in the //controllers/stockHandler.js file.
  app.route('/api/stock-prices')
    .get(function (req, res){
    //We have to ensure the integrity of the data; that is, since two 'stocks' can be queried it could either be a string or array.
    //You'll see why in the handler file why I convert a single value to an array.
    let comp;
    if (typeof req.query.stock == "string") {
      comp = [req.query.stock.toUpperCase()]
    }
    else {
      comp = req.query.stock.map(x => x.toUpperCase())
    }
    //These are for the purposes of the handler.
    let like = req.query.like
    let ipAddr = req.headers['x-forwarded-for'].split(',')[0];
    
    //We'll use these down below.  The handler hosts some heavy duty asynchronous action, we have to do a lot of manipulation to return it to the assignment's specs.
    let stockData = []
    let likesArr = []
    let relLikes = []
    let retVal;
    //This is our callback function that we passed into our handler.  It will do the asynchronous processing for us.
    const pullData = function(data) {
      //We have a couple scenarios here - one stock, one stock + like, two stocks, two stocks + like.
      //The returned object looks very different if two stocks are passed, hence why the actions get a little complicated here.

      //If our initial query is only 1 element our final value is just going to tally up the ip addresses that have been 'liked' and add them up in the 'likes' property.
      if (comp.length == 1) {
        data.ipAddr == null ? likesArr.push(0) : likesArr.push(data.ipAddr.length)
        stockData.push({stock: data.stock, price: data.price, likes: likesArr[likesArr.length - 1]})
        //The sort is necessary for the functional tests.  Without it, these actions don't care what order the object array returns as, which makes it impossible to consistently test.
        stockData.sort((a, b) => (a.stock > b.stock) ? 1 : -1)
        //Our final return, the stockData object.
        res.json({stockData})
      }
      //The game changes if we have two stocks.  We have to change our final property to rel_likes instead, then perform a loop to calculate the difference between the objects.
      //I found it easiest just to push the likes data then change it with a loop with math and simple map, which is what I do below.
      if(comp.length == 2) {
        data.ipAddr == null ? likesArr.push(0) : likesArr.push(data.ipAddr.length)
        stockData.push({stock: data.stock, price: data.price, rel_likes: likesArr[likesArr.length - 1]})
        
        if (stockData.length == 2) {
        for (let i = 0; i < likesArr.length; i++) {
          if (i != 0) {
            retVal = likesArr[i] - likesArr[i - 1]
            relLikes.push(retVal)
          }
          else if (i != likesArr.length - 1) {
            retVal = likesArr[i] - likesArr[i + 1]
            relLikes.push(retVal)
          }
        }
        stockData.map(function (x,i) {
          x.rel_likes = relLikes[i]
        })
          
        stockData.sort((a, b) => (a.stock > b.stock) ? 1 : -1)
        //Final return for two stocks.
        res.json({stockData})
      }
        else {
          console.log("Gathering data..")
        }
      }
    }
    //Run the function.
    stockHandler.getStock(comp, like, ipAddr, res, pullData)
    })
    
};
