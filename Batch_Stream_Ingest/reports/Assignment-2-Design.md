# Assignment 2


## Part 1 - Ingestion with batch


1. Firstly we assume having file-based model as it would be easier adn faster to store, because all customers will have their own data (different syntaxes and/or semantics) so we dont have to parse the data for each customer and use column-based model, as anyway all customers will have their clientbatchingestapp that knows the data inside and can easily parse it.
Constarints:
	All files should be in JSON format. The injesting for 1 client can proccess 10 files not more than 100MB each, but it should be tested and discovered during real implementation.
	Later during the development this constraints would be described as validation rules.
Moreover the customer injestion applications should also take not more than 10 files frm the directory for ingesting to coredms.
> if (file.mimetype !==  contraints.format|| file.size > contraints.size ) {return}

2. mysimbdp-fetchdata would be a simple REST API that receives a file in JSON format and saves to the users directory with validation rules that the file is not more than 100MB
> POST request with user_id and array files[] with files to /account/fetch-file

But firstly we have to creeate a new keyspace for the user and a directory
> POST reequst with user_id to /account/dir_user

3. mysimbdp-batchingestmanager should be devided in to:
-  Saving the customers program in the same derictory for future calling it the program should be designed in such way that it takes all the files from the same derictory, reads them and saves as a json file into the coredms and deletes from the directory
> POST request with user_id and file .js to /account/batchapp-save

- The manager that executes the program

> POST request with user_id /account/batch-ingest_manager

Each script clientbatchingestapp should be .js file and has the folowing code at the beginning to get the files which can be processed
```javascript
 const argv = require('yargs').argv;
 const fs = require('fs');
 const files = JSON.parse(argv.files)
 files.forEach(file => {
    fs.readFile(file, {encoding: 'utf-8'}, function(err,data){
        if (!err) {
            // Work with data
        } else {
            console.log(err);
        }
    });
 })
```
Then the customer gets the array of files and he can work with them


4. There is a special directory users_dir for all clients directories, each user has its own id, so the directories are marked as user1, user2..... there some directories user1 and user2 withs scripts for batchingestion ans files json, everything was uploaded via REST API through Postman. To check the script API is provided
> POST request with user_id to /account/batch-ingest_manager


5. ingest_manager containts logging features that take the time of ingestion, the total size of files and number(count) of files and saves into .log file for each user in his own directory(creates if not exists)



## Part 2 - Near-realtime ingestion


1. ingestmessagestructure is a simple array with objects. It would the easiest and most convenient way for the provider and all customers. As customers have the possibility to push the array of objects later to the coredms and easy to store in coredms, as the model is filebased
	> data: [{},{}, ...]

2. mysimbdp-databroker will be an RabbitMQ with a queue of files
mysimbdp-streamingestmanager would also be devided in to:
	- Saving the customers program in the same derictory for future calling it the program should be designed in such way that it takes the file from Message Broker and injests into coredms, so it should take the parameters of keyspace of user and ip of broker
	- The manager that executes the program on demand (start, stop)
All data files in broker will have field of user_id to know whose files are they.

3. [Developing]

4. The report that receives mysimbdpstreamingestmanager contains of avarage injestion time, total data size and number of messages, so it could be a JSON object
> {"avg_time": time, "size": size, "count": count}
In this case in some fixed time the report comes to mysimbdpstreamingestmanager through some REST API.

5. The mysimbdpstreamingestmanager should be able to calculate the "performance", for now lets assume that we have some contraint for 1 instance is 200pr(positive rate), performance is calculated as (size*count)/avg_time (MB*int/sec) 
when the formala gives less than 200 we have to encrease the number of instances, when it is bigger we have to decrease the number as it would stay on the level of 200pr
P.S. the precise numbers would be set during the real implementation and testing


## Part 3 - - Integration and Extension

1. ![alt text](https://github.com/alex-subtselnyi/BigDataPlatform_Batch_Stram_Ingest/blob/master/Architecture.png)

2. The files are JSON files mostly arrays of objects, so the file can be splitted into several files.
The provider can provide an app that would read the file 100MB one by one and feed to ingestapp
The second solution is to use the stream ingestion, so if the file is an array of objects as the structure for streamingest then it could be feeded to broker. But the client should create streamingestapp for this purpose.

3. First idea: for the programer to implement such a platform that can abstract of types of data and except as much as it can.
Second idea: we dont have to worry about the data inside the files, so it would depend only on the customer.
We have to know the code if we start intercating with the user to improve or speed up the whole work of the ingesting, large the data types and so on... (All non-custom operations for the data of the specific user)
The best idea would be to search through the code for security reasons, as we execute the code on the server without knowing what is inside, it is vulnarable to different injections. We have to give the file permissions to work only with special keyspace of cassandra related to the user and no other permissions.

4. This feature is not applicable for file-based system, as we dont parse it and save just the files without going through it. If we parse it and have another model the good thing would be if the customer provides the file with constraints that describe the quality of data. WE as a provider can provide and api for getting the file describing the quality description. Based on the quality of files we cound estimate the data from this files and decline them or mark them as unqualified if the customer whats to. 

5. In this case the users would have the files of different types , so in case of batch ingesting we have to mark them with some additional text in name for example in order to feed the proper files and data to apps of users, in case of stream ingest each file in a queue should have field "type" for each user to understand which files the app can take from the broker.


