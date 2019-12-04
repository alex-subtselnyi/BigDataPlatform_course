
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

function createKeyspace(query, callback){
    query = "CREATE KEYSPACE " + query + " WITH replication = {'class': 'SimpleStrategy', 'replication_factor' : 3};";
    client.execute(query,function(err,result){
        if(err){
            return callback(err);
        }
        console.log("keyspace created");
        return callback(null,result);
    });
}

function createTable(query, keyspace, callback){
    const temp_client = new cassandra.Client({ contactPoints: ['cassandra'], keyspace:  keyspace});
    var checkquery = "SELECT " + query + "  FROM system_schema.tables WHERE keyspace_name='" + keyspace + "';";
    temp_client.execute(checkquery,function(err,result){
        if(err){
            return callback(err);
        }
        if (result){
            return callback(null,result);
        }
    });
    query = "CREATE TABLE " + query + " ( id decimal PRIMARY KEY AUTOINCREMENT, json text);";
    temp_client.execute(query,function(err,result){
        if(err){
            return callback(err);
        }
        console.log("Created table");
        return callback(null,result);
    });
}

exports.getRecords = getRecords ;
exports.createKeyspace = createKeyspace ;
exports.createTable = createTable ;