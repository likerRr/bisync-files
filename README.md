# Bidirectional files synchronization
Plugin will watch for changes in source directory and will copy them to destination directory. All of these works in 
reverse direction. So in result you will have two mirrored folders.

**Please, note, that it is very preview alpha version.**

# How to use
`npm install bisync-files`

Create `test.js` file, add few lines of code:

```javascript
var bisyncFiles = require('bisync-files');
bisyncFiles.watch('srcPath', 'destPath');
```

Run `node test.js`

# API
`watch(source, destination, ignoredSource, ignoredDestination)` - start watching for changes in both directories and 
synchronizing them.
- source - source path
- destination - destination path, where files from source path will copy on initial
- ignoredSource - array of regexps that specify ignored files and folders (they will not be copied) in source folder
- ignoredDestination - array of regexps that specify ignored files and folders (they will not be copied) in destination folder
