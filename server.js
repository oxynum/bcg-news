const port             = process.env.PORT || 9001;
var express            = require('express'),
    app                = express(),
    colors             = require('colors'),
    multipart          = require('connect-multiparty')(),
    rimraf             = require('rimraf'),
    mailController     = require('./app/controllers/mailController');

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/uploadImages'));

// DEFINE ROUTES : '/'
app.get('/', function(req, res) {
  //REMOVE Uploadfolder
  rimraf('uploadImages', function() {
     console.log('Removing Folder: Done');
   });
  res.render('index');
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
