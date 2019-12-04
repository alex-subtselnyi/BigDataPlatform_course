# Assignment 3


## Part 1 - Ingestion with batch


AS mentioned already previously in the assignments we will use document-based database model for storing data in the core-dm.

Some data naturally comes as a never-ending stream of events. To do batch processing, you need to store it, stop data collection at some time and processes the data. Then you have to do the next batch and then worry about aggregating across multiple batches. In contrast, streaming handles neverending data streams gracefully and naturally. You can detect patterns, inspect results, look at multiple levels of focus, and also easily look at data from multiple streams simultaneously.

The idea of an app will be:
Place events in a message broker topic (e.g. ActiveMQ, RabbitMQ, or Kafka), write code to receive events from topics in the broker ( they become your stream) and then publish results back to the broker. 

1.  As running example example we take the data from Sensor Network. This feed of data provides sensor information from artificial sensors. 

EXAMPLE

```javascript
{
"ambient_temperature":"38.47",
"sensor_uuid":"probe-d3338025",
"photosensor":"761.90",
"humidity":"79.7832",
"radiation_level":"199",
"timestamp":1574976498}

```

![alt text](https://github.com/alex-subtselnyi/BigDataPlatform_stream_analytics/blob/master/sensor_stream_vizual_data.png)

For this type of data we can use both batch analytics when we store the data in the storage and than calculate average temperature, humidity etc, grouping by sensors(based on location of sensor), by time window, or do batch analytics everyday at midnight to calculate important data etc.

Also we use stream analytics when the data comes, this could be needed for example processing temperature and forecasting the whether, processing radiation_level and triggering hewn it gets a critical value, etc. We can use it for ML algorithms, based on all of the results ML can forecast the future nature changes. 


2. So actually it depends on the data. If it can be grouped by some certain keys than it is nice to use keys, if no then we have to use non-keyed (windowAll). 
For our example it can be used both, depends on the demands.
Firstly it can be keyed handled, for example by sensor_uid, in order to analyze the data for one sensor (or group of nearby sensors). So the data coming will be splittedour infinite stream into logical keys streams. This will allow windowed computation to be performed in parallel by multiple tasks, as each logical keyed stream can be processed independently from the rest. All elements referring to the same key will be sent to the same parallel task.

Also we can use non-keyed handler, so we will get data from all sensors and the window will depend on time frame.


The best delivery guarantee will be exactly-once delivery. As we do not want to lose the data and repeat it, as it will give us false result at the end and this data will be treated as outliers in the ML algorithms.  And if we don’t get one of the data and the value was critical or significant it would be a pity to lose it.
If exactly-once delivery is impossible we have to use at least once delivery not to lose data and then preprocess the data and get rid of dublicates.


3. The data from example has timestamps, so this time should be associated for the analytics. Later the data will be grouped for batch processing based on the timestamps.  

For this kind of data the following windows can be used:
- Global window: this type of window is useful to specify a custom trigger, and no computations will be performed, in our case it is a trigger on critical radiation_level value.
- Sliding window: we will have windows of size 30 minutes that slide by 10 minutes. With this we get every 10 minutes a window that contains the events that arrived during the last 10 minutes.


4.  The most important thing is how fast the data comes to the system and processed and given back as a result. So the time between the data was created (timestamp inside the data) and the time it was processed. The difference between it has to be constant and minimum small. 

5.  ![alt text](https://github.com/alex-subtselnyi/BigDataPlatform_stream_analytics/blob/master/architecture.png) 

On the scheme we can observe several datasources from which the data is coming , they all are coming to MessageBroker the message broker is chosen as RMQ. Actually now Kafka can guarantee exactly-once delivery, when still RMQ does not guarantee 100%. It would be better to use Kafka in this case< but we still will be using RMQ for our example application. Anyway the MessageBroker can be changed.
So we will use al least once delivery.

> RabbitMQ offers a wide range of messaging templates thanks to the many features that it has. Thanks to its full-featured routing, it can save recipients from having to retrieve, deserialize, and check each message when it only needs a subset. It is easy to work with, scaling up and down is done by simply adding and removing recipients. Its plug-in architecture allows it to support other protocols and add new features, such as consistent hashing of exchanges, which is an important addition. And Kafka uses  automatic generation of internal storages for application states in topics, which can lead to an increase in the amount of processed data.

Then the Broker gives the data to analytics app which processes data and returns to the another Chanel of message broker back to clients or service. Also it send raw data to the DB for storing. Besides the message broker send the analytics to DB for storing and future reusing for another service or batch analytics. 
Batch analytics is started on demand and takes the data from DB and returns data to some certain services. As a DB Cassandra is chosen as it is perfectly used on high load storing and redundant to downs.


## Part 2 -Implementation of streaming analytics 


1. The process goes like that:
- The data appears in the queue of RMQ
- Nodejs analytics app connects to the RMQ and listens to the channel coresponding to it.
- When a new data appears Nodejs get the message from RMQ
- Data comes in JSON format, so it has to be decoded (deserialized) first.
- Data is being processed by functions. In our example for simplicity we use simple function that checks whether the radiation is less than critical. In real solutions it can be used for machine learning staff like separation or classification problems, etc.
- After the data is being processed by the function if the critical value was detected another function is called in order to send the data and the alert message back to another queue for the service to show that the critical value was found. The data has to be encoded(serialized) in JSON format before sending.


2.The key logic of functions lies in getting the data from input data process it and give the output result(It can be value, flag, alert, function….etc). 
So the job of the whole streamingapp is to get the serialized data, deserialize it and give to the functions. The job of the function is to get a ready object and work eith it to get a result at the end of processing.
In our example a simple trigger function was created that checks whether the radiation level from the sensor is normal

> const checkCriticalRadiation = (radiation_value) => radiation_value < radiationCritical;


3. Logs of the console provided in ../logs/test.log
Screenshots of RMQ GUI are provided in the folder ../logs/
The deployment and instructions provided in Assignment-3-Deployment.MD

The data is visualized on the photo sensor_stream_vizual. Where you can observe the graphical changes of the data through time.

the data that was fed to the RMQ was

```javascript
{
"ambient_temperature":"38.47",
"sensor_uuid":"probe-d3338025",
"photosensor":"761.90",
"humidity":"79.7832",
"radiation_level":"199",
"timestamp":1574976498}

```
so the function did not trigger on this data. The operation was logged.

and

```javascript
{
"ambient_temperature":"38.47",
"sensor_uuid":"probe-d3338025",
"photosensor":"761.90",
"humidity":"79.7832",
"radiation_level":"252",
"timestamp":1574976498}

```
And function triggered on the data and pushed a message to the analytics queue. As can be seen on the picture Load_queue_analytics there is a jump because a new message in the queue appeared. Some customer service should connect to this queue and read the data. The operation was logged.

The performance between getting the data from the RMQ and sending back to the  queue was measured. It takes from 0 to 1 ms to do the actions (deserialize, calculate, serialize,send). The log performance is presented in performance.log file.
Locally I also tested the real upcomming data from PubNub developer website to get the real stream of data. The timestamps in the data are shown only in timestamp in seconds, so I had to calculate the performance in seconds (not ms as previous) and it gave 0 in all cases. The log files are in performance.log

The analytics are correctly triggered in all cases of tests only when the rediation is above the norm and function successfuly triggered every time it has to be triggered.

4. It depends on the validity of the data:
- If the data has wrong values it will not give no errors, it will just work with it as a normal data . It can be improved later to check the validity of numbers
- If the data has differnect structure it will not still give error if it still has the neccesary keys in the object. The example is shown in test.log file
- If the data does not have the neccesary key in the object, so it will console log an undefined value, because it can not find it. It is possible to catch such cases and log them in a separate file, but no failure and no error are found, so the app continues warking, The log file is presented in test.log
- If the data is not valid (not valid JSON, not JSON etc) the data would not be processed and it would be console logged. It is possible to log this in separate files also. The example is shown in test.log file

5. The parallelism can be done on the level of data: the data can be grouped by sensor_uid and be processed parallel for each sensor_uid separately. 
Also it can be divided in another way: the data can be spited to different analytics app. One of them has to calculate temperature, another radiation, third humidity etc…
Another level of parallelism can be when we get more customers, so we get more customerstreamingapp’s and they can be run simultaneously, so the data will be processed parallel.






## Part 3 - Connection



1. ![alt text](https://github.com/alex-subtselnyi/BigDataPlatform_stream_analytics/blob/master/architecture.png) 

It was already shown on the diagram. We store raw data from the clients and also the MessageBroker duplicates the data sent to the clients into the database. So later the data stored in the DB can be used for batch analytics or other stuff. 

2. First thing we can do it every day at midnight for the last day. The analytics data from the whole would be gathered and depending on the demands the values would be processed somehow for analytics(average values, maximal values, minimal, some formulas for forecasting, observe the changes of the nature behavior ). The same thing could be done for weeks, month or event batch analytics for several years. 


3. ![alt text](https://github.com/alex-subtselnyi/BigDataPlatform_stream_analytics/blob/master/trigger.png) 

My solution would be to use some wrapper Proxy function that uses some sort of magic method. 
So when analytics app detects a critical value in the data it marks the data.
The Proxy function just takes the data and transfers it to the Message broker, but it also has a get magic method (trigger on a target which is the flag whether the data is critical) and it is called when the analytics app has detected the critical value. So the function does not just transfers the data, but also calls synchronically the batch analytics.

4. Firstly we have to have a look on MessageBroker as it get the whole data from customers. As now we have to set keys for customers data and if customer sends more than 1 type of data(semantics) and thus has more stream analytics app< so we have to add keys also for data of customer to send to proper stream app. Then we have to focus on DB, whether it can stores more data. The important thing to use parallelism than, so all the functions and all the customerstreamingapp’s would be run parallel.

5. It is still not possible to achieve with RMQ. But Kafka has the updates and if the applications uses Kafka it can guarantee exactly-once delivery. Ofcourse if don’t take in to the account network downs.
What we can do that if we get the data from MessageBroker, process it and send to another Chanel of broker and only after that we delete it from the queue, than we can achieve exactly-once delivery.


