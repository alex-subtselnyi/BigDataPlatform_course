const argv = require('yargs').argv;
const fs = require('fs');
const files = JSON.parse(argv.files)

files.forEach(file => {
    fs.readFile(file, {encoding: 'utf-8'}, function(err,data){
        if (!err) {



        } else {
            console.log(err);
        }
    });
})
