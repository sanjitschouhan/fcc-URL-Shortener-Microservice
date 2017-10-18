// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var validUrl = require('valid-url');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var mongo_url = "mongodb://san:san@ds125255.mlab.com:25255/san-fcc";

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/*", function (request, response) {
  
  var url = unescape(request.path.substr(1));
  
  if (validUrl.isUri(url)){
    var output = {
      "original_url":url
    };
    
    MongoClient.connect(mongo_url, function (err, db) {
      if (err) {
        throw err;
      } else {
        var urls = db.collection('urls');
        urls.find(output,{"original_url":1,"short_url":1,"_id":0}).toArray(function(err,data){
          if(data.length>0){
            output=data[0];
            response.end(JSON.stringify(output));
        } else{
            urls.find({}).count(function(error, nbDocs) {
              output["short_url"] = nbDocs+1;
              urls.insert(output);
              db.close();
              response.end(JSON.stringify(output))
            })
          }
        });
      }
    })
  }
  else {
    var output = {
      "error":"Not a valid url, should have http or https protocol"
    };
    
    MongoClient.connect(mongo_url, function (err, db) {
      if (err) {
        throw err;
      } else {
        var urls = db.collection('urls');
        urls.find({
          "short_url":Number(url)
        }).toArray(function(err,data){
          if(data.length){
            output=data[0];
            response.redirect(output.original_url);
            response.end();
          }
          else{
            response.end(JSON.stringify(output));
          }
        });
      }
    })
  }
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
