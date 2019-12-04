# Assignment 2

How to create separate network : 

 1. Using the below command we can easily see the Current network

    ​            $ docker network inspect bridge

 2. Create a new network

      ​	        $ docker network create --driver bridge service

 3. Using docker compose applying the network to the containers.

       * Please refer the docker-compose.yml file. 
       * From the out put you  can verify the network
         * using this command : docker network inspect ls


### **To run this program :** 

​      Step 1 : create your network with the name of  "service"

​      Step 2 : run the below command

​		$ docker-compose up --build

​      Step 3 : make the test rest call  GET : ip:8000/account/test


API Instructions:

Create directory and keyspace in cassandra for user

> POST request localhost:8000/account/dir_user?user_id=1


Upload clientbatchingestapp (script) 

> POST request localhost:8000/account/batchapp-save?user_id=1 (field script as parameter with a file)


Upload files for ingestion

> POST request localhost:8000/account/fetch-file?user_id=1 (field files(array) as parameter with files)


Ingest data (takes files from users directory and passes to customer's script, invokes clientingestapp, logs metrics and saves to separate .log file

> POST request localhost:8000/account/batch-ingest_manager?user_id=1 

 

