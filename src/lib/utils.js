"use strict";

var path = require('path');

/**
 * Returns flattened path name
 * @param fp
 * @param maxNest
 * @returns {String}
 */
module.exports.flattenPath = function(fp, maxNest) {
  maxNest = maxNest || 8;
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
