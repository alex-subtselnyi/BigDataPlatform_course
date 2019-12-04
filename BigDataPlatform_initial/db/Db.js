
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({contactPoints:['cassandra']});

function getRecords(query,callback){
    query = 'select key from '+query;
    client.execute(query,function(err,result){
        if(err){
            return callback(err);
        }
        console.log("result Found");
        return callback(null,result);
    });
}

function createTable(query,callback){
    query = 'CREATE TABLE ' + query + ' ( app text, translated_review text, sentiment text, sentiment_polarity decimal, sentiment_subject decimal PRIMARY KEY (app));';
    client.execute(query,function(err,result){
        if(err){
            return callback(err);
        }
        console.log("Created table");
        return callback(null,result);
    });
}

exports.getRecords = getRecords ;
exports.createTable = createTable ;
