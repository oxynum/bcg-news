var Mailjet      = require ('node-mailjet')
  .connect("2d4b4c79bcede8af4a8037b72576c578", "bc41e577e597ae3e0a28331d014c9064"),
    messagebird  = require('messagebird')('k5U3TrQXK4g20rGhCRIXjE8Fo'),
    csv          = require('fast-csv'),
    path         = require('path'),
    fs           = require('fs'),
    jsonfile     = require('jsonfile'),
    encodedImage = "",
    pathToLink   = "uploadImages",
    mailList     = [],
    smsList      = [];


/**
* Will read the mail list of people located in csv file.
* @param {string} text the text given by the view. (via input)
* @param {string} imageContent path of the image content.
*/
function readMailList(text, imageContent, callback) {
  csv
   .fromPath("contacts.csv")
    .on("data", function(data) {
      mailList.push(data);
    })
    .on("end", function(){
        sendMails(text, imageContent, callback);
    });
}

/**
* Will send Email via MailJet API
* @param {string} text the text given by the view. (via input)
* @param {string} imageContent path of the image content.
*/
function sendMails(text, imageContent, callback) {

  var sendEmail    = Mailjet.post('send');
  encodeImage(imageContent, callback, function(){
      mailList.forEach(function(receiver) {
    var emailData = {
        'FromEmail': 'hello@acbbvolley.fr',
        'FromName': 'Nord Sud Textiles',
        'Subject': 'Nouveautés: Nord Sud Textiles',
        'Text-part': text,
        'Recipients': [{'Email': receiver[0]}],
        'Attachments': [{
          "Content-Type": "image/jpeg",
          "Filename": "Image.jpeg",
          "Content": encodedImage.toString()
        }],
    };
    sendEmail
      .request(emailData)
        .then(function() {
          console.log("Mail sent to: " + receiver);
        })
        .catch(function(e) {
          console.log("Error when sending mail", e);
        });
      });
  });
}

/**
* Will encode the image downloaded in base64.
* @param {string} path represents the path of the temp directory where the image is located
*/
function encodeImage(path, callback1, callback2) {
  var  fileupload = require('fileupload').createFileUpload('./uploadImages');
  fileupload.put(path, function(err, file) {
   if(err) throw err;
   console.log("File successfuly uploaded.", file);
   var bitmap = fs.readFile(path, function(err, filePath){
     if(err) throw err;
    encodedImage =  new Buffer(filePath).toString('base64');
    callback2();
    callback1(file);
   });
 });
}



/**
 * Will send SMS via API of MessageBird
 * @param {NoParam}
 * @param {Object} fileObject the object that contains everything about the file info.
 */
function prepareSMS(fileObject) {
  console.log("Preparing the SMS...", fileObject);
  executeSendingSMS();
}

/**
 * 
 * @param {*} pathOfImage 
 */
function executeSendingSMS() {
  console.log('Execute SMS sending.');
  csv
   .fromPath("smsContacts.csv")
    .on("data", function(data) {
      smsList.push(data);
    })
    .on("end", function() {
      smsList.forEach(function(smsReceiver) {
        var params = {
          'originator': 'NORDSUDTEXT',
          'recipients': [
            smsReceiver[0]
          ],
          'body': 'Bonjour, voici notre nouveau produit, cliquez ici pour y avoir accès: https://goo.gl/h4zbYK'
        };
        messagebird.messages.create(params, function (err, response) {
         if (err) {
           return console.log(err);
         }
         console.log(response);
        });
      });
    });
}

/**
 * Main executable of the app.
 * @param {*} informations 
 */
function launchMailRoutine(informations) {
  jsonfile.writeFile("text.json", informations, function (err) {
    if(err) throw err;
  });
  readMailList(informations.text, informations.imageContent, prepareSMS);
}

/**
 * Get path to link for image
 * @param {function} callback method to execute after the read of the link, take pth and text in params
 */
function getPathToLink(callback) {
  var pth = "uploadImages";
  fs.readdir(pth, function(err, files) {
    if(err) throw err;
    files.forEach(function(file) {
      var tmp = path.resolve(pth, file);
      fs.stat(tmp, function(err2, stat) {
        if(err2) throw err2;
        if(stat.isDirectory()) {
          pth += '/' + file;
          fs.readdir(pth, function(err, images) {
            if(err) throw err;
            pth += '/' + images;
            console.log(pth);
            jsonfile.readFile("text.json", function(err, obj) {
              if(err) throw err;
              callback(pth, obj.text);
            });
          });
        } else {
          return;
        }
      });
    });
  });
}

module.exports = {
  mailRoutine: launchMailRoutine,
  pathToImage: getPathToLink
};