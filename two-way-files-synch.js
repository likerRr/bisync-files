var path = require('path');
var fse = require('fs-extra');
var chalk = require('chalk');
var chokidar = require('chokidar');

function print(str) {
  console.log(str);
}

var log = {
  added: function(text) {
    return print(chalk.green(text));
  },
  changed: function(text) {
    return print(chalk.blue(text));
  },
  unlinked: function(text) {
    return print(chalk.dim(text));
  },
  error: function(text) {
    return print(chalk.white.bgRed.bold(text));
  },
  log: function(text) {
    return print(chalk.underline(text));
  },
  welcome: function(text) {
    return print(chalk.bgMagenta(text));
  }
};

function Synchronizer(source, destination, ignored, ignoreInitialFire) {
  var self = this;

  self.source = path.normalize(source);
  self.destination = path.normalize(destination);
  self.ignored = (ignored === undefined) ? '' : ignored;
  self.ignoreInitialFire = (ignoreInitialFire === undefined) ? false : ignoreInitialFire;

  validateParams();

  self.pathSubstitution = function(path) {
    return path.replace(self.source, self.destination);
  };

  function validateParams() {
    //if (!fse.ensureDirSync(path.resolve(self.source))) {
    //  throw Error('Source folder doesn\'t exist');
    //}
    //if (!fse.ensureDirSync(self.destination)) {
    //  throw Error('Source folder doesn\'t exist');
    //}
  }

  function handleFseError(evt, path, err) {
    if (err) return log.error(path + ' on ' + evt + ', ' + err);
  }

  self.watch = function() {
    chokidar.watch(self.source, {ignored: self.ignored})
      .on('all', function(evt, path) {
        switch (evt) {
          case 'add':
          case 'addDir':
            fse.copy(path, self.pathSubstitution(path), function(err) {
              handleFseError(evt, path, err);
              log.added(path + ' added');
            });
            break;
          case 'change':
            fse.readFile(path, 'utf8', function (err, data) {
              handleFseError(evt, path, err);
              fse.outputFile(self.pathSubstitution(path), data, function(err) {
                handleFseError(evt, path, err);
                log.changed(path + ' changed');
              });
            });
            break;
          case 'unlink':
          case 'unlinkDir':
            fse.remove(self.pathSubstitution(path), function(err) {
              handleFseError(evt, path, err);
              log.unlinked(path + ' deleted');
            });
            break;
          default:
            log.log(path + ' ' + evt);
        }
      })
    .on('ready', function() {
      log.welcome('----------------------------------------');
      log.welcome('| Initial scan complete, watching... |');
      log.welcome('----------------------------------------');
    })
    .on('error', function(err) {
      log.error(err);
    });
  }
}

new Synchronizer('dir1', 'dir2').watch();
new Synchronizer('dir2', 'dir1', null, true).watch();