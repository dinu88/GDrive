var Drive = function() {
  "use strict";
  var google = require('googleapis'),
      OAuth2 = google.auth.OAuth2,
      fs = require('fs'),
      drive = null;

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

  var gui = require('nw.gui');
  var user = new PouchDB('user');
  var files = new PouchDB('files');
  var events = {};

  var showHide = function() {
    if (self.window.state == 'visible') {
      self.window.hide();
    } else {
      self.window.show();
    }
  };

  // Create a tray icon
  var tray = new gui.Tray({title: 'Tray', icon: 'app/images/icon.png'});

  // Give it a menu
  var menu = new gui.Menu();
  menu.insert(new gui.MenuItem({type: 'normal', label: 'Show main window', click: showHide}), 0);
  tray.menu = menu;

  var self = this;
  self.credentials = null;
  self.window = gui.Window.get();
  self.window.hideWindow = self.window.hide;
  self.window.showWindow = self.window.show;
  self.window.hide = function () {
    self.window.state = 'hidden';
    self.window.hideWindow();
  };
  self.window.show = function () {
    self.window.state = 'visible';
    self.window.showWindow();
  };
  self.window.state = 'visible';

  var getCredentials = function (code, fn) {
    oauth2Client.getToken(code, function (err, token) {
      // Now tokens contains an access_token and an optional refresh_token. Save them.
      if (!err) {
        console.log(token);
        fn(null, true);
        oauth2Client.setCredentials(token);
        credentials._id = 'credentials';
        user.put(credentials);
      } else {
        console.log(err);
      }
    });
  };

  var isRoot = function(doc) {
    if (doc.doc.parents.length > 0 && doc.doc.parents[0].isRoot) {
      console.log('test');
      return true;
    } else {
      return false;
    }
  };

  var getFiles = function(source, folder, fn) {
    //TODO: different sources;
    if (source == 'remote') {
      files.allDocs({include_docs: true}).then(function(docs){
        var found = [];
        docs = docs.rows;
        if (!folder || folder == 'root') {
          for (var i = 0; i < docs.length; i++) {
            if (docs[i].doc.parents.length > 0 && docs[i].doc.parents[0].isRoot) {
              found.push(docs[i].doc);
              //console.log(found);
            }
          }
        } else {
          //TODO: search in folder
        }
        //console.log(found);
        fn(found);
      })
    }

    var fileStat = function(id, file, fn) {
      fs.stat('/home/undefined/Google Drive/' + file, function(err, res) {
        if (err) {
          console.log(err);
        } else {
          //console.log(res);
          fn(id, res)
        }
      })
    };

    if (source == 'local') {
      fs.readdir('/home/undefined/Google Drive/', function(err, files) {
        "use strict";
        if (err) {
          console.log(err);
        } else {
          //console.log(files);
          var j = files.length;
          for (var i in files) {
            fileStat(i, files[i], function(id, stat) {
              files[id] = {title: files[id], stat: stat};
              j = j-1;
              if (j == 0) {
                fn(files);
              }
            })
          }
        }
      });
    }

  };

  var syncFolder = function(folder) {

    var remoteFiles = [],
        localFiles = [],
        newRemoteFiles = [],
        newLocalFiles = [];

    var fileExists = function(source, title) {
      var exists = false;
      if (source == 'remote') {
        for (var i in remoteFiles) {
          console.log(i);
          if (remoteFiles[i].title == title) {
            exists = true
          }
        }
      }
      if (source == 'local') {
        for (var i in localFiles) {
          if (localFiles[i].title == title) {
            exists = true;
          }
        }
      }
      return exists;
    };

    var getNewRemoteFiles = function() {
      for (var i in remoteFiles) {
        if (!fileExists('local', remoteFiles[i].title)) {
          if (!remoteFiles[i].labels.trashed) {
            newRemoteFiles.push(remoteFiles[i]);
          }
          //if (remoteFiles[i].copyable && !remoteFiles[i].labels.trashed && remoteFiles[i].downloadUrl) {
            //var newFile = {
            //  copyable: true,
            //  title: remoteFiles[i].title,
            //  downloadUrl: remoteFiles[i].downloadUrl
            //};

          //}
        }
      }
    };

    var downloadFile = function(url, title) {

      var file = fs.createWriteStream('/home/undefined/Google Drive/' + title);

      request.get(url, {
        'auth': {
          'bearer': self.credentials.access_token
        }
      }, function(err, res) {
        "use strict";
        if (err) {
          alert('error');
          console.err(err);
        } else {
          console.log("Got response: " + res.statusCode);
        }
      }).pipe(fs.createWriteStream('/home/undefined/Desktop/' + title));


    };

    var downloadNewRemoteFiles = function() {
      console.log(newRemoteFiles);
      for (var i in newRemoteFiles) {
        if (newRemoteFiles[i].copyable &&
            newRemoteFiles[i].downloadUrl &&
            newRemoteFiles[i].title.indexOf('/') == -1) {
          console.log('downloading ' + newRemoteFiles[i].title);
          downloadFile(newRemoteFiles[i].downloadUrl, newRemoteFiles[i].title)
        }
      }
    };

    var getNewLocalFiles = function() {

    };

    getFiles('remote', folder, function(files) {
      remoteFiles = files;
      if (localFiles) {
        getNewRemoteFiles();
        getNewLocalFiles();
        downloadNewRemoteFiles();
        console.log(newRemoteFiles);
      }
    });
    getFiles('local', folder, function(files) {
      console.log(files);
      localFiles = files;
      if (remoteFiles) {
        console.log('get');
        getNewLocalFiles();
        getNewRemoteFiles();
        console.log(newRemoteFiles);
      }
    })
  };

  var getRemoteFiles = function(fn) {
    var params = {
      corpus: 'DEFAULT',
      maxResults: 1000
    };
    drive.files.list(params, function(err, res) {
      if (err) {
        console.log(err)
      } else {
        for (var i in res.items) {
          res.items[i]._id = res.items[i].id;
          files.put(res.items[i]);
        }
        if (res.items.length >= 1000){
          if (res.nextPageToken)
            getRemoteFiles(res.nextPageToken);
        } else {
          if (fn) fn();
        }

      }
    })
  };

  var callEvent = function(event) {
    if (events[event]) {
      for (var i in events[event]) {
        events[event][i]();
      }
    }
  };

  this.on = function(event, fn) {
    switch (event) {
      case 'ready':
          if (!events['ready'])
            events['ready'] = [];
          events['ready'].push(fn);
        break;
    }
  };

  this.authUrl = null;

  this.init = function() {
    user.get('credentials').then(function (credentials) {
      console.log(credentials);
      self.credentials = credentials;
      oauth2Client.setCredentials(credentials);
      drive = google.drive({ version: 'v2', auth: oauth2Client });
      callEvent('ready');
      getRemoteFiles();
    }).catch(function (err) {
      self.authUrl = oauth2Client.generateAuthUrl({
        access_type: config.access_type,
        scope: config.scopes,
        approval_prompt: 'force'
      });
      console.log(err);
      if (err.message == 'missing') {
        console.log('missing');
        callEvent('ready');
      }

    });
  };

  this.auth = function(key, fn) {
    getCredentials(key, fn);
  };

  this.sync = function() {
    getRemoteFiles(function() {
      console.log('sync');
      syncFolder('root');
    });
  }
};