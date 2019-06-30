var express = require("express");
var fs = require('fs');
var multer = require('multer');

var app = express();

/* serves main page */
app.get("/", function(req, res) {
  fs.unlink(__dirname +'/public/style/map.JPEG', (err)=>{
    if(err){
        console.log("no map");
    } else {
      fs.unlink(__dirname +'/public/script/data.js', (err)=>{
        if(err){
          console.log("no data");
        }
      });
    }
  });
  res.sendfile('public/index.html')
});

 app.post("/user/add", function(req, res) { 
   /* some server side logic */
   res.send("OK");
 });

/* serves all the static files */
app.get(/^(.+)$/, function(req, res){ 
    console.log('static file request : ' + req.params);
    res.sendfile( __dirname +"/public/" + req.params[0]); 
});

var port = process.env.PORT || 3344;
app.listen(port, function() {
  console.log("Listening on " + port);
});

var storageMap = multer.diskStorage({
  destination: function(req, file, callback) {
    console.log("upload");
    callback(null, './public/style');
  },
  filename: function(req, file, callback) {
    callback(null, file.originalname);
  }
});

var storageData = multer.diskStorage({
  destination: function(req, file, callback) {
    console.log("upload");
    callback(null, './public/script');
  },
  filename: function(req, file, callback) {
    callback(null, file.originalname);
  }
});

var uploadMap = multer({storage: storageMap}).single('myFile');
var uploadData = multer({storage: storageData}).single('myFile');

app.post('/uploadMap', function(req, res){
  uploadMap(req,res, function(err){
    if(err){
      return res.end("Error");
    }
    res.redirect('/uploadData.html');
  });
});

app.post('/uploadData', function(req, res){
  uploadData(req,res, function(err){
    if(err){
      return res.end("Error");
    }
    res.redirect('/app.html');
  });
});
