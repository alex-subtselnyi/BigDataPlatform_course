"use strict"; 
const express = require('express');
const router = express.Router();
const db = require('../../db/Db.js');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const childProcess = require('child_process');
const path = require('path')

const contraints = {
    "size": 100000000, //100MB
    "format": "application/json"
}

function runScript(scriptPath, files, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath, ['--files='+files]);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });

}

router.use(fileUpload({
    createParentPath: true
}));

router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));
router.use(morgan('dev'));

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('Time: ',req.url)
  next()
})
// define the home page route
router.get('/test', function (req, res,next) {
    db.getRecords('system.local',function(err,result){
        if(err){
            next(err);
        }else{
            res.send({"result":process.pid,"db":result})     
        }
       
    });

})


router.post('/dir_user', function (req, res,next) {
    var user_id = req.param('user_id');
    var dir = './users_dir/user_' + user_id;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    db.createKeyspace('user' + user_id,function(err,result){
        if(err){
            console.log('could not create keyspace')
            next(err);
        }
    });

    db.createTable('user' + user_id, 'user' + user_id, function(err,result){
        if(err){
            console.log('could not create table')
            next(err);
        }
    });

    res.send({"result":process.pid,"dir":dir})

})

router.post('/batchapp-save', function (req, res,next) {
    var dir = './users_dir/user_' + req.param('user_id') + '/';

    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let script = req.files.script;

            if (script.mimetype !==  'application/javascript'|| script.size > contraints.size ) {
                return
            }

            script.mv(dir + 'script.js');

            res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: script.name,
                    mimetype: script.mimetype,
                    size: script.size
                }
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }

})

router.post('/fetch-file', function (req, res,next) {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let user_id = req.param('user_id');

            let data = [];

            _.forEach(_.keysIn(req.files.files), (key) => {

                let file = req.files.files[key];

                if (file.mimetype !==  contraints.format|| file.size > contraints.size ) {
                    return
                }

                file.mv('./users_dir/user_' + user_id + '/' + file.name);

                data.push({
                    name: file.name,
                    mimetype: file.mimetype,
                    size: file.size
                });
            });

            //return response
            res.send({
                status: true,
                message: 'Files are uploaded',
                data: data
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }

})

router.post('/batch-ingest_manager', function (req, res,next) {
    var user_id = req.param('user_id');
    var dir = './users_dir/user_' + user_id + '/';
    var files = [];

    var size = 0;
    var count = 0;
    fs.readdirSync(dir).forEach(file => {
        if (path.extname(file) === ".json"){
            let filePath = dir + file;
            var stats = fs.statSync(filePath);
            var fileSizeInBytes = stats["size"];
            var fileSizeInKilobytes = fileSizeInBytes / 1000.0;
            size += fileSizeInKilobytes;
            count++;
            files.push(filePath)
        }
    });

    files = JSON.stringify(files)
    const startTimeScript = Date.now();
    runScript(dir + 'script.js', files, function (err) {
        if (err) throw err;
        console.log('finished running script.js');
    });
    const time = Date.now() - startTimeScript;

    let data = {
        "time": time,
        "size": size,
        "count": count
    }

    fs.appendFile('user' + user_id + '.log', data, function (err) {
        if (err) throw err;
        console.log('Saved!');
    });

    res.send({"result":process.pid,"dir":dir})

})

router.use(function (err, req, res, next) {
    //console.error(err.stack)
    res.status(500).send(err);
})

module.exports = router