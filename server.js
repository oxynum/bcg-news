const port             = process.env.PORT || 9001;
var express            = require('express'),
    app                = express(),
    colors             = require('colors'),
    multipart          = require('connect-multiparty')(),
    rimraf             = require('rimraf'),
    fs                 = require('fs'),
    path               = require('path'),
    mailController     = require('./app/controllers/mailController');

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/uploadImages'));

// DEFINE ROUTES : '/'
app.get('/', function(req, res) {
  //REMOVE Uploadfolder
  var pth = "uploadImages";
  fs.readdir(pth, function(err, files) {
    if(err) throw err;
    if(files.length == 0) {
      res.render('index');
      return;
    }
    files.forEach(function(file) {
      var tmp = path.resolve(pth, file);
      console.log(tmp);
      fs.stat(tmp, function(err2, stat) {
        if(err2) throw err2;
        if(stat.isDirectory()) {
          pth += '/' + file;
          rimraf(pth, function() {
            console.log('Removing Folder: Done');
            res.render('index');
          });
        }
      });
    });
  });
});

app.get('/display', function(req, res) {
  var imageName = {value: mailController.pathToImage};

  mailController.pathToImage(function(path, txt) {
    res.render('display', {
       imageName: path.replace('uploadImages/', ''),
       text: txt
      });
  });
});

app.post('/sendMail', multipart, function(req, res) {
  console.log(req.body);
  mailController.mailRoutine({
    text: req.body.name,
    imageContent: req.files.imageContent.path
  });

  res.render('confirm');
});

app.listen(port, function() {
  console.log('App running on: '.green + port);
});
