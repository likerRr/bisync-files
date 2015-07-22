"use strict";

var path = require('path');

/**
 * Returns flattened path name
 * @param fp
 * @param maxNest
 * @returns {String}
 */
module.exports.flattenPath = function(fp, maxNest) {
  maxNest = maxNest || 5;
  var pathArr = fp.split(path.sep),
    newPath = [],
    pathLen = pathArr.length,
    half = Math.floor(maxNest / 2);

  if (pathArr.length <= maxNest) {
    return fp;
  }

  Array.prototype.push.apply(newPath, pathArr.splice(0, half));
  for (var i = 0; i < pathLen - maxNest; i++) {
    newPath.push('..');
  }
  Array.prototype.push.apply(newPath, pathArr.splice(-half));

  return newPath.join(path.sep);
};

/**
 * Sets the variable or default value
 * @param param
 * @param defaultParam
 * @param fnParam
 * @returns {*}
 */
module.exports.set = function(param, defaultParam, fnParam) {
  if (param !== undefined) {
    return (typeof fnParam === 'function') ? fnParam(param) : param;
  }

  return (typeof defaultParam === 'function') ? defaultParam() : defaultParam;
};
