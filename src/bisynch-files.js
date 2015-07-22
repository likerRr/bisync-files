"use strict";

var path = require('path');
var fse = require('fs-extra');
var chokidar = require('chokidar');
var logger = require('./lib/log');
var utils = require('./lib/utils');

function handleSimpleError(err) {
  return logger.error(err);
}

function handleFseError(evt, inPath, err) {
  return logger.error(inPath + ' on ' + evt + ', ' + err);
}

/**
 *
 * @param source
 * @param destination
 * @param ignored
 * @param ignoreInitialFire
 * @constructor
 */
function Synchronizer(source, destination, ignored, ignoreInitialFire) {
  var self = this;

  self.source = path.normalize(source);
  self.destination = path.normalize(destination);
  self.ignored = [/__jb_/];
  self.ignoreInitialFire = utils.set(ignoreInitialFire, false);

  function init() {
    if (Array.isArray(ignored)) {
      Array.prototype.push.apply(self.ignored, ignored);
    } else {
      self.ignored.push(ignored);
    }

    fse.ensureDir(self.source, function(err) {
      if (err) {
        return handleSimpleError(err);
      }
    });
    fse.ensureDir(self.destination, function (err) {
      if (err) {
        return handleSimpleError(err);
      }
    });
  }

  self.getWatchOptions = function() {
    return {
      ignorePermissionErrors: true,
      ignored: self.ignored,
      ignoreInitial: self.ignoreInitialFire,
      alwaysStat: true
    };
  };

  self.pathSubstitution = function(inPath) {
    return inPath.replace(self.source, self.destination);
  };

  self.watch = function() {
    chokidar.watch(self.source, self.getWatchOptions())
      .on('all', function(evt, inPath) {
        var fseError = handleFseError.bind(handleFseError, evt, inPath);

        switch (evt) {
          case 'add':
          case 'addDir':
            fse.copy(inPath, self.pathSubstitution(inPath), function(err) {
              if (err) {
                return fseError(err);
              }
              logger.added('+ ' + utils.flattenPath(inPath) + ' <=> ' + utils.flattenPath(self.pathSubstitution(inPath)));
            });
            break;
          case 'change':
            fse.readFile(inPath, 'utf8', function (errRead, data) {
              if (errRead) {
                return fseError(errRead);
              }
              fse.outputFile(self.pathSubstitution(inPath), data, function(errOut) {
                if (errOut) {
                  return fseError(errOut);
                }
                logger.changed('* ' + utils.flattenPath(inPath) + ' <=> ' + utils.flattenPath(self.pathSubstitution(inPath)));
              });
            });
            break;
          case 'unlink':
          case 'unlinkDir':
            fse.remove(self.pathSubstitution(inPath), function(err) {
              if (err) {
                return fseError(err);
              }
              logger.unlinked('- ' + utils.flattenPath(inPath) + ' <=> ' + utils.flattenPath(self.pathSubstitution(inPath)));
            });
            break;
          default:
            logger.log('-> ' + evt + ' ' + inPath);
        }
      })
    .on('ready', function() {
      logger.welcome('Initial scan complete, watching "' + self.source + '" ...');
    })
    .on('error', function(err) {
      logger.error(err);
    });
  };

  init();
}

module.exports.watch = function(source, destination, ignored) {
  fse.emptyDir(destination, function(err) {
    if (!err) {
      (new Synchronizer(source, destination, ignored)).watch();
      (new Synchronizer(destination, source, ignored, true)).watch();
    }
  });
};
