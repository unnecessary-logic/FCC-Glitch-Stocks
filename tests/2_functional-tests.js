/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    //We need some values to be a bit more dynamic in testing.  Remember that IP's are tracked so if we use the same one every time it's not a real test.
    let fakeIP = (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255) + 0)+"."+(Math.floor(Math.random() * 255) + 0)+"."+(Math.floor(Math.random() * 255) + 0);
    //This like will be used to test single likes later.
    let likes;
    
    suite('GET /api/stock-prices => stockData object', function() {
      //I'm adding a timeout here just because of the API's limitations.  Just to be safe.
      afterEach(function(done) {
        this.timeout(30000)  
        setTimeout( function() {
          console.log("Pausing, this API will time you out if you make too many requests.");
          done();
        }, 20000);
      });
      //Simple test, we should readily see the values/properties listed below if all goes well.
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .set("x-forwarded-for", fakeIP)
        .end(function(err, res){
         //We need to extract this value to test the next two tests with likes.
          likes = res.body.stockData[0].likes
          likes == null ? likes = 0 : likes
          assert.equal(res.status, 200);
          assert.isObject(res.body.stockData[0]);
          assert.equal(res.body.stockData[0].stock, "GOOG")
          assert.property(res.body.stockData[0], "price")
          done();
        });
      });
      //With this test, our like should be equal to like + 1 if successful.  We are generating a random IP every time so it SHOULD be + 1 every time.
      test('1 stock with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like: true})
        .set("x-forwarded-for", fakeIP)
        .end(function(err, res){
          console.log(res.body.stockData[0])
          assert.equal(res.status, 200);
          assert.isObject(res.body.stockData[0]);
          assert.equal(res.body.stockData[0].stock, "GOOG")
          assert.property(res.body.stockData[0], "price")
          assert.equal(res.body.stockData[0].likes, likes + 1, "This test should work once per run due to randomizing an IP and grabbing likes from an earlier step.")
          done();
        });
      });
      //Similarly, since our random IP is set (for this test), we should see the SAME like field recorded here.
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like: true})
        .set("x-forwarded-for", fakeIP)
        .end(function(err, res){
          console.log(res.body.stockData[0])
          assert.equal(res.status, 200);
          assert.isObject(res.body.stockData[0]);
          assert.equal(res.body.stockData[0].stock, "GOOG")
          assert.property(res.body.stockData[0], "price")
          assert.equal(res.body.stockData[0].likes, likes + 1, "This test should work once per run due to randomizing an IP and grabbing likes from an earlier step.  This test should work AGAIN because the IP should be barred from adding a like.")
          done();
        });
      });
      
      //Here, we should verify our rel_likes property is present and that subtracting (or doing any math between them) is 0.
      //Because two stocks does not return likes we cannot really reliably calculate 'likes' between them, we have to perform a pseudo test to ensure functionality.
      test('2 stocks', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: ['atlo', 'yumm']})
        .set("x-forwarded-for", fakeIP)
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isObject(res.body.stockData[0]);
          assert.equal(res.body.stockData[0].stock, "ATLO")
          assert.property(res.body.stockData[0], "price")
          assert.property(res.body.stockData[0], "rel_likes")
          assert.isObject(res.body.stockData[1]);
          assert.equal(res.body.stockData[1].stock, "YUMM")
          assert.property(res.body.stockData[1], "price")
          assert.property(res.body.stockData[1], "rel_likes")
          assert.equal(res.body.stockData[0].rel_likes - res.body.stockData[1].rel_likes, 0)
          //These should both be 0 - specifically picked less common values.  0 denotes equal as rhel_likes is a subtraction operation.
          done();
        });
      });
      //This pseudo test continues here - with a like tacked onto both of these stock values, they should increment to 1 and should STILL = 0 in the mathmatical equation.
      test('2 stocks with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: ['atlo', 'yumm'], like : true})
        .set("x-forwarded-for", fakeIP)
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isObject(res.body.stockData[0]);
          assert.equal(res.body.stockData[0].stock, "ATLO")
          assert.property(res.body.stockData[0], "price")
          assert.property(res.body.stockData[0], "rel_likes")
          assert.isObject(res.body.stockData[1]);
          assert.equal(res.body.stockData[1].stock, "YUMM")
          assert.property(res.body.stockData[1], "price")
          assert.property(res.body.stockData[1], "rel_likes")
          assert.equal(res.body.stockData[0].rel_likes - res.body.stockData[1].rel_likes, 0)
          //These should both be 0 - specifically picked less common values.  0 denotes equal as rhel_likes is a subtraction operation.
          //These should remain 0 or equal even after a like is added to both stock entries - aka still equal.
          done();
        });
      });
    });

});

//FUNCTIONAL TESTS PASSING BELOW:
/*
Listening on port 3000

Running Tests...




  Functional Tests

    GET /api/stock-prices => stockData object

(node:6878) DeprecationWarning: current URL string parser is deprecated, and will be removed in a future version. To use the new parser, pass option { useNewUrlParser: true } to MongoClient.connect.

Connected correctly to server - performing stock operation.

Entry added with no like.

      ✓ 1 stock (1115ms)

Pausing, this API will time you out if you make too many requests.

Connected correctly to server - performing stock operation.

Like operation completed.

{ stock: 'GOOG', price: '1188.3000', likes: 23 }

      ✓ 1 stock with like (594ms)

Pausing, this API will time you out if you make too many requests.

Connected correctly to server - performing stock operation.

Like operation completed.

{ stock: 'GOOG', price: '1188.3000', likes: 23 }

      ✓ 1 stock with like again (ensure likes arent double counted) (209ms)

Pausing, this API will time you out if you make too many requests.

Connected correctly to server - performing stock operation.

Connected correctly to server - performing stock operation.

Entry added with no like.

Gathering data..

Entry added with no like.

      ✓ 2 stocks (482ms)

Pausing, this API will time you out if you make too many requests.

Connected correctly to server - performing stock operation.

Like operation completed.

Gathering data..

Connected correctly to server - performing stock operation.

Like operation completed.

      ✓ 2 stocks with like (707ms)

Pausing, this API will time you out if you make too many requests.



  5 passing (2m)


*/

