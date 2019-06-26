var express = require("express");
var multer = require('multer');

var app = express();

/* serves main page */
app.get("/", function(req, res) {
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

var storage = multer.diskStorage({
  destination: function(req, file, callback) {
    console.log("upload");
    callback(null, './public/style');
  },
  filename: function(req, file, callback) {
    callback(null, file.originalname);
  }
});

var upload = multer({storage: storage}).single('myFile');

app.post('/myAction', function(req, res){
  upload(req,res, function(err){
    if(err){
      return res.end("Error");
    }
    res.redirect('/app.html');
  });
});
