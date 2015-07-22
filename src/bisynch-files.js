"use strict";

var path = require('path');
var fse = require('fs-extra');
var chokidar = require('chokidar');
var logger = require('./lib/log');
// TODO implement
var utils = require('./lib/utils');


function initVar(param, fnDefault, fnParam) {
  if (param !== undefined) {
    return (typeof fnParam === 'function') ? fnParam(param) : param;
  }

  return (typeof fnDefault === 'function') ? fnDefault() : fnDefault;
}

function Synchronizer(source, destination, ignored, ignoreInitialFire) {
  var self = this;

  self.source = path.normalize(source);
  self.destination = path.normalize(destination);
  self.ignored = [/__jb_/];
  self.ignoreInitialFire = initVar(ignoreInitialFire, false);

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

  self.pathSubstitution = function(inPath) {
    return inPath.replace(self.source, self.destination);
  };

  function handleSimpleError(err) {
    return logger.error(err);
  }

  function handleFseError(evt, inPath, err) {
    return logger.error(inPath + ' on ' + evt + ', ' + err);
  }

  self.watch = function() {
    chokidar.watch(self.source, {ignored: self.ignored})
      .on('all', function(evt, inPath) {
        switch (evt) {
          case 'add':
          case 'addDir':
            fse.copy(inPath, self.pathSubstitution(inPath), function(err) {
              if (err) {
                return handleFseError(evt, inPath, err);
              }
              logger.added('+ ' + utils.flattenPath(inPath) + ' <=> ' + utils.flattenPath(self.pathSubstitution(inPath)));
            });
            break;
          case 'change':
            fse.readFile(inPath, 'utf8', function (errRead, data) {
              if (errRead) {
                return handleFseError(evt, inPath, errRead);
              }
              fse.outputFile(self.pathSubstitution(inPath), data, function(errOut) {
                if (errOut) {
                  return handleFseError(evt, inPath, errOut);
                }
                logger.changed('* ' + utils.flattenPath(inPath) + ' <=> ' + utils.flattenPath(self.pathSubstitution(inPath)));
              });
            });
            break;
          case 'unlink':
          case 'unlinkDir':
            fse.remove(self.pathSubstitution(inPath), function(err) {
              if (err) {
                return handleFseError(evt, inPath, err);
              }
              logger.unlinked('- ' + utils.flattenPath(inPath) + ' <=> ' + utils.flattenPath(self.pathSubstitution(inPath)));
            });
            break;
          default:
            logger.log(evt + ' ' + inPath);
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

new Synchronizer('dir1', 'dir2').watch();

module.exports = Synchronizer;
