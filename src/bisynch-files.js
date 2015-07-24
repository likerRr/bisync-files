"use strict";

var path = require('path');
var pathExists = require('path-exists');
var fse = require('fs-extra');
var fs = require('fs');
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
  self.initialScanCount = 0;
  self.showInitialScanCounter = true;

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

  self.watch = function(onReady) {
    chokidar.watch(self.source, self.getWatchOptions())
    .on('all', function(evt, inPath, statsWatch) {
      var fseError = handleFseError.bind(handleFseError, evt, inPath);

      switch (evt) {
        case 'add':
        case 'addDir':
          pathExists(self.pathSubstitution(inPath), function(errPath, isExists) {
            if (errPath) {
              return fseError(errPath);
            }

            if (!isExists) {
              fse.copy(inPath, self.pathSubstitution(inPath), function (errCopy) {
                if (errCopy) {
                  return fseError(errCopy);
                }
                logger.added('+ ' + utils.flattenPath(inPath) + ' <=> ' + utils.flattenPath(self.pathSubstitution(inPath)));
              });
            }
          });
          self.initialScanCount++;
          break;
        case 'change':
          fs.stat(self.pathSubstitution(inPath), function(errStat, statsFs) {
            if (errStat) {
              return fseError(errStat);
            }

            if (statsFs.size !== statsWatch.size) {
              fse.readFile(inPath, 'utf8', function (errRead, data) {
                if (errRead) {
                  return fseError(errRead);
                }
                fse.outputFile(self.pathSubstitution(inPath), data, function (errOut) {
                  if (errOut) {
                    return fseError(errOut);
                  }
                  logger.changed('* ' + utils.flattenPath(inPath) + ' <=> ' + utils.flattenPath(self.pathSubstitution(inPath)));
                });
              });
            }
          });
          self.initialScanCount++;
          break;
        case 'unlink':
        case 'unlinkDir':
          pathExists(self.pathSubstitution(inPath), function(errPath, isExists) {
            if (errPath) {
              return fseError(errPath);
            }

            if (isExists) {
              fse.remove(self.pathSubstitution(inPath), function (errRemove) {
                if (errRemove) {
                  return fseError(errRemove);
                }
                logger.unlinked('- ' + utils.flattenPath(inPath) + ' <=> ' + utils.flattenPath(self.pathSubstitution(inPath)));
              });
            }
          });
          self.initialScanCount++;
          break;
        default:
          logger.log('-> ' + evt + ' ' + inPath);
      }
      if (self.showInitialScanCounter) {
        logger.welcome('Scanning "' + utils.flattenPath(inPath) + '": ' + self.initialScanCount + '...');
      }
    })
    .on('ready', function() {
      logger.welcome('Initial scan complete, watching "' + self.source + '" ...');
      self.showInitialScanCounter = false;
      if (typeof onReady === 'function') {
        onReady();
      }
    })
    .on('error', function(err) {
      logger.error(err);
    });
  };

  init();
}

/**
 *
 * @param source
 * @param destination
 * @param ignoredSource
 * @param ignoredDestination
 */
module.exports.watch = function(source, destination, ignoredSource, ignoredDestination) {
  if (ignoredDestination === undefined) {
    ignoredDestination = ignoredSource;
  }
  (new Synchronizer(source, destination, ignoredSource)).watch(function() {
    (new Synchronizer(destination, source, ignoredDestination)).watch();
  });
};
