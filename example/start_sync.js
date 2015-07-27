var bisyncFiles = require('bisync-files');
bisyncFiles.watch('ex_dir1', 'ex_dir2', [/ignoredInSource/], [/ignoredInDestination/]);
