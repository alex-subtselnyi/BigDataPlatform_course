const argv = require('yargs').argv;
const fs = require('fs');
const files = JSON.parse(argv.files)

var cassandra = require('cassandra-driver');
var client = new cassandra.Client({contactPoints:['cassandra'], keyspace:  'user1'});

files.forEach(file => {
    fs.readFile(file, {encoding: 'utf-8'}, function(err,data){
        if (!err) {
            query = 'insert into user1 (json) values (?);';
            client.execute(query,[data],function(err,result){
                if(err){
                    console.log(err);
                }
                console.log("Inserted");
            });

        } else {
            console.log(err);
        }
    });
})
