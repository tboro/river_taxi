#!/usr/bin/env node

// This hook sets custom icon for the app

var filestocopy = [{
    "www/res/icon/android/icon-72-hdpi.png":
    "platforms/android/res/drawable-hdpi/icon.png"
}, ];
 
var fs = require('fs');
var path = require('path');

var rootdir = process.argv[2];
 
filestocopy.forEach(function(obj) {
    Object.keys(obj).forEach(function(key) {
        var val = obj[key];
        var srcfile = path.join(rootdir, key);
        var destfile = path.join(rootdir, val);
        //console.log("copying "+srcfile+" to "+destfile);
        var destdir = path.dirname(destfile);
        if (fs.existsSync(srcfile) && fs.existsSync(destdir)) {
            fs.createReadStream(srcfile).pipe(
               fs.createWriteStream(destfile));
        }
    });
});
