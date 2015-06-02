var google = require('googleapis'),
    OAuth2 = google.auth.OAuth2,
    fs = require('fs'),
    files = new PouchDB('files'),
    user = new PouchDB('user'),
    querystring = require('querystring');


var https = require('https');
var fs = require('fs');
var urlParser =  require('url');
var request = require('request');


var config = {};

config.CLIENT_ID = '558482327446-n17ivr8gbbpiccelbmdt6efljfe9ahh3';
config.CLIENT_SECRET = 'D-mraJWjL1uVr39xJNrYNWq1';
config.REDIRECT_URL = 'urn:ietf:wg:oauth:2.0:oob';
config.scopes = 'https://www.googleapis.com/auth/drive';   // If you only need one scope you can pass it as string else as array
config.access_type = 'offline';     // 'online' (default) or 'offline' (gets refresh_token)


var oauth2Client = new OAuth2(
    config.CLIENT_ID,
    config.CLIENT_SECRET,
    config.REDIRECT_URL
);

var url = oauth2Client.generateAuthUrl({
  access_type: config.access_type,
  scope: config.scopes,
  approval_prompt: 'force'
});

//var files = [];
//var folders = [];

var updateView = function() {
  "use strict";
  var filesHtm = 'Files: ';
  var folderHtm = '';
  for (var i in files) {
    filesHtm = filesHtm + '<br>' + files[i].title;
  }
  for (var i in folders) {
    folderHtm = folderHtm + '<br>' + folders[i].title;
  }

  $('.files').html(filesHtm);
  $('.folders').html(folderHtm);



};

var downloadFile = function(url, title) {
  console.log(url);
  if (url) {
    var file = fs.createWriteStream('/home/undefined/Desktop/' + title);
    console.log(Token);

    request.get(url, {
      'auth': {
        'bearer': Token.access_token
      }
    }, function(err, res) {
      "use strict";
      if (err) {
        console.log(err);
      } else {
        console.log("Got response: " + res.statusCode);
      }
    }).pipe(fs.createWriteStream('/home/undefined/Desktop/' + title));

    //url = urlParser.parse(url);
    //console.log(url);
    //
    //var options = {
    //  hostname: url.host,
    //  path: url.path,
    //  method: 'GET',
    //  auth: 'Authorization: Bearer ' + Token,
    //  rejectUnauthorized: false
    //};



    //var request = https.get(options, function(response) {
    //  console.log("Got response: " + response.statusCode);
    //  response.pipe(file);
    //  response.on('end', function() {
    //    "use strict";
    //    console.log('download complete ' + title);
    //  })
    //});
    //request.on('error', function (err) {
    //  console.log(err);
    //})
  }
};

var Token = '';

console.log(url);
$(document).ready(function () {
  $('.key_link').attr('href', url);

  user.get('creddentials').then(function (credentials) {
    console.log(credentials);
  }).catch(function (err) {
    console.log(err);
    if (err.message == 'missing') {
      console.log('missing');
    }
  });

  $('#authenticate').submit(function(e) {
    "use strict";
    e.preventDefault();
    console.log('submit');

    var code = $('#token').val();
    getToken(code, function (credentials) {
      //var q = querystring.stringify({
      //  token: token.access_token,
      //  refresh_token: token.refresh_token
      //});
      oauth2Client.setCredentials(credentials);
      credentials._id = 'credentials';
      user.put(credentials);
      console.log(credentials);
      Token = credentials;



      var drive = google.drive({ version: 'v2', auth: oauth2Client });
      var params = {
        folderId: 'root'
      };
      //drive.children.list(params, function (err, res) {
      //  if (err) {
      //    console.log(err);
      //  } else {
      //    console.log(res);
      //    for (var i in res.items) {
      //      drive.files.get({fileId: res.items[i].id}, function(err, res){
      //        if (err) {
      //          console.log(err);
      //        } else {
      //          if (!res.labels.trashed) {
      //            if (res.copyable) {
      //              console.log(res);
      //              files.push(res);
      //              downloadFile(res.downloadUrl, res.title);
      //            } else {
      //              folders.push(res);
      //            }
      //            updateView();
      //          }
      //        }
      //      });
      //    }
      //    //drive.files.get
      //  }
      //});
      //syncFiles();
      uploadFile('/home/undefined/Desktop/112.jpg');
    });





    return false;
  });


});

fs.readdir('/home/undefined/Google Drive/', function(err, files) {
  "use strict";
  if (err) {
    console.log(err);
  } else {
    console.log(files);
    for (var i in files) {
      fs.stat('/home/undefined/Google Drive/' + files[i], function(err, res) {
        if (err) {
          console.log(err);
        } else {
          console.log(res);
        }
      })
    }
  }
});

var uploadFile = function (file) {
  "use strict";
  var fstatus = fs.statSync(file);
  fs.open(file, 'r', function (error, fileDescripter) {
    if (error) {
      console.log(error);
      return;
    }
    var buffer = new Buffer(fstatus.size);

    fs.read(fileDescripter, buffer, 0, fstatus.size, 0, function (err, num) {

      request.post(
          {
            'url': 'https://www.googleapis.com/upload/drive/v2/files',
            'qs': {
              //request module adds "boundary" and "Content-Length" automatically.
              'uploadType': 'multipart'

            },
            'auth': {
              'bearer': Token.access_token
            },
            'multipart': [
              {
                'Content-Type': 'application/json; charset=UTF-8',
                'body': JSON.stringify({
                  'title': file,
                  'parents': [
                    {
                      'id': 'root'
                    }
                  ]
                })
              },
              {
                //'Content-Type': 'image/png',
                'body': buffer
              }
            ]
          },
          function (err, res) {
            if (err) {
              console.log(err);
            } else {
              console.log(res);
            }
          });
    });


  });
};

var syncFiles = function(nextPageToken) {
  "use strict";

  var drive = google.drive({ version: 'v2', auth: oauth2Client });
  var params = {
    corpus: 'DEFAULT',
    maxResults: 10
  };

  if (nextPageToken) {
    params.nextPageToken = nextPageToken;
  }

  drive.files.list(params, function(err, res) {
    if (err) {
      console.log(err)
    } else {
      console.log(res);
      for (var i in res.items) {
        res.items[i]._id = res.items[i].id;
        files.put(res.items[i]);
      }
      if (res.items.length >= 1000)
        if (res.nextPageToken)
          syncFiles(res.nextPageToken);
    }
  })

};


var getToken = function (code, fn) {
  oauth2Client.getToken(code, function (err, tokens) {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (!err) {
      console.log(tokens);
      fn(tokens);
      oauth2Client.setCredentials(tokens);
    } else {
      console.log(err);
    }
  });
};