var Mailjet      = require ('node-mailjet')
  .connect("b66aeb1489a86390a6ff914f915e423f", "3a414a588dd751e931bcdf3162d3b636"),
    messagebird  = require('messagebird')('igX4NnV7kaK3HQoRYElNq6cxk'),
    csv          = require('fast-csv'),
    path         = require('path'),
    fs           = require('fs'),
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
  encodeImage(imageContent, callback);

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
}

/**
* Will encode the image downloaded in base64.
* @param {string} path represents the path of the temp directory where the image is located
*/
function encodeImage(path, callback) {
  var  fileupload = require('fileupload').createFileUpload('./uploadImages');
  fileupload.put(path, function(err, file) {
   if(err) throw err;
   console.log("File successfuly uploaded.", file);
   callback(file);
 });
 var bitmap = fs.readFileSync(path);
 encodedImage =  new Buffer(bitmap).toString('base64');
}



/**
 * Will send SMS via API of MessageBird
 * @param {NoParam}
 * @param {Object} fileObject the object that contains everything about the file info.
 */
function prepareSMS(fileObject) {
  fs.readdir(pathToLink, function(err, files) {
    if(err) throw err;
    files.forEach(function(file) {
      var tmp = path.resolve(pathToLink, file);
      fs.stat(tmp, function(err2, stat) {
        if(err2) throw err2;
        if(stat.isDirectory()) {
          pathToLink += '/' + file;
          fs.readdir(pathToLink, function(err, images) {
            if(err) throw err;
            pathToLink += '/' + images;
            console.log(pathToLink);
            executeSendingSMS(pathToLink);
          });
        } else {
          return;
        }
      });
    });
  });
}

/**
 * 
 * @param {*} pathOfImage 
 */
function executeSendingSMS(pathOfImage) {
  csv
   .fromPath("smsContacts.csv")
    .on("data", function(data) {
      smsList.push(data);
    })
    .on("end", function() {
      smsList.forEach(function(smsReceiver) {
        var params = {
          'originator': 'MessageBird',
          'recipients': [
            smsReceiver[0]
          ],
          'body': 'Bonjour, voici notre nouveau produit, cliquez ici pour y avoir accès: http://dev.bcgschool.com:9001/display' //+ pathToLink.replace("uploadImages/","")
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
  readMailList(informations.text, informations.imageContent, prepareSMS);
}

/**
 * Get path to link for image
 * @param {function} callback method to execute after the read of the link
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
            callback(pth);
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