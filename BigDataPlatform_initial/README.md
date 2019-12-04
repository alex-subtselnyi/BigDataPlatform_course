# BigDataPlatform
# Assignment 1

## Constraints and inputs for the assignment

>a key component to store and manage data called mysimbdp-coredms. This component is
a platform-as-a-service.
a key component, called mysimbdp-daas, of which APIs can be called by external data
producers/consumers to store/read data into/from mysimbdp-coredms. This component is
a platform-as-a-service.
a key component, called mysimbdp-dataingest, to read data from data sources
(files/external databases) of the tenant/user and then store the data by calling APIs of
mysimbdp-coredms.

1. For mysimbdp-coredms I have chosen Cassandra as it easy to scale, create clusters and different nodes on docker or kubernetes. It scales automatically according to the load of requests (so to speak loadbalancer itself) and stable to DOWN's (if master is down another nodes can handle all the requests).
2. For mysimbdp-daas Y use Nodejs as it would be the perfect way to communicate with cassandra and create an API for clients. It is easy to create consumers to work with data after getting it from different sources and producers to get actual data from sources. Also we can create as many nodes of them and gather in a docker swarm.
3. For mysimbdp-dataingest there are 2 ways: To use Apache NiFi to get the data from the sources and insert directly to the DB (Cassandra) as it has all possible tools to measure the load or to create a injector from NodeJS server and install consul together with casandra to check the performance.

## Part 1 - Design


1. ![alt text](https://github.com/alex-subtselnyi/BigDataPlatform/blob/master/Diagram.png)
According to the diagram we have a SWARM of producers/consumers for injection (NodeJS)they gather information from sources(in our case from csv file) and store in the DB. The circle of DB's is cassandra DB having clusters started on some nodes. We also have SWARM of API for clients. They get the requests from clients on endpoints (API endpoint will be provided) handle them, process and return the result. Depending on type of request the NodeJS server can select(Pull) information from DB, preprocess, send as a response or store.
It depends on the number of request how many nodes in SWARMS we need.

NOTE: It could be used another schema: setting a number of producers to gather data from sources, send them through RabbitMQ to set of consumers that will either store data to DB, or translate like socket, can update information etc. But having SWARM and Cassandra we do not need RMQ anymore.

2. For starting we start 3 nodes of Cassandra DB. Due to its easy scalability the number of nodes can be expanded if the load is too high. TO control the load we have installed consul together with cassandra.

3. I use containers in docker, as we get the possibility of using swarms and easy increasing/decreasing number of nodes, moreover it would be easy to transfer the whole platform to kubernetes.

4. If we get more sources(users) that use mysimbdp-injest we increase the number of nodes in SWARM of mysimbdp-injest, we dont have to increase the number of nodes in cassandra or add some message broker, as Cassandra balances the load automatically and has it own (queue). If we see the consul loading the cassandra approx 100% on all nodes we will have to add new.

5. Cassandra is solving the problem of distributed and Scalable systems, and built to cope with data management challenges of modern business. Cassandra database automatically replicate the data of failed node to another node without any halt in work. Cassandra database provide horizontal scaling, and enhance performance with increase load. Cassandra is durable and provide data consistency, which makes it best fit to hold critical data of companies. Cassandra provides simple query language (CQL) ,very much similar to relational database.
Cassandra is decentralized system - There is no single point of failure, if minimum required setup for cluster is present - every node in the cluster has the same role.

## Part 2 - Development and deployment

1. Casandra provides the possibility to dynamically set the columns of the tables as also create tables. We can scale the columns by partitioning them or insert the whole files divided into parts.
But accordingly to the data csv file from google play market we define 5 columns as the csv file has with primary key on app field.
Cassandra can define multiple keyspaces, a key space can have multiple tables, and it can change the structure of your table "on the fly".
> CREATE TABLE application_google ( app text, translated_review text, sentiment text, sentiment_polarity decimal, sentiment_subject decimal PRIMARY KEY (app));


2. Cassandra does partition across nodes. All of the data for a Cassandra cluster is divided up onto the ring and each node on the ring is responsible for one or more key ranges.
we can use  Shard Table strategy
- create a shard table
- query the shard table
- do queries for each shard (using async in the driver)
- ingest will have to first create shards (say every 10k or split up by workers)
- insert into table using the shard you just created
- repeat insert until fill up the shard with calculated max


3. Assignment1-Deployment.md file is provided for Tasks3

4. Log files are provided for Task4

5. No failure was observed due to too small data for such a platform. No failure will be observed later as SWARM has it own queue if there are too many request and servers cant handle all of them and cassandra has it's own. We can observe only the delays -> In this case we have to add more nodes depending on that: where the delays start. All statistics and metrics can be observed in consul or docker stats.


## Part 3 Extension with discovery

1. As a dedicated mysimbdp-coredms Cassandra has keyspaces to provide it for each user/tenant. And we can update the columns "on the fly" for each tenant and its keyspace in DB

2. No implementation

3. In order to integrate a service discovery feature with mysimbdp-dataingest we can use Apache NiFi, that has already it. According to our SWARM of NodeJS servers we can create the folowwing schema with Consul as Consul provides REST based HTTP api for interaction, service database can be queried using DNS, does dynamic load balancing, integretes perfect with docker
![alt text](https://github.com/alex-subtselnyi/BigDataPlatform/blob/master/Consul.png)

4. We have to create endpoints for user/developer: 
- create new keyspace in cassandra
- store data
- update data
- select data
The API would be used only by registered users to set the keyspace and tokens for each, so that they would use token in headers information when querying the API.
 The API would be described for every endpoint
Example: 
Create new Keyspace
POST request on https://mysimpbdp.com/api/create-keyspace
parameters:
required header: bearer token
required parameters: keyspace_name:string, columns:array[{column_name1:string, datatype:string}, {column_name2:string, datatype:string},...], primary_key:string
optional parameters: index:array[column_name1:string, column_name2:string, ...]

Same API would be described for other requests

5. If only mysimbdp-daas can read and write data into mysimbdp-coredms, we would have to create API from daas for datainjest. The common idea with Task4 we create endpoints for writing and reading data from coredms and use this API from daas service. So after getting data from users/sources we preprocess data and send it through API of daas to coredms. 
The best idea would be to open a socket on the daas NodeJS server and connect datainjest with daas through socket so the data flow will be smooth fast and continuous. So We will open private socket connection(no broadcast) to send messages from datainjest to daas and daas will store data as it it simple server connected to cassandra.


## Bonus points

The mysimbdp-daas is implemented for storing and selecting data. Dockerfile and docker-sompose.yml are provided.


