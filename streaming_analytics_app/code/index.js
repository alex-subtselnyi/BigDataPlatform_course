"use strict";
var amqp = require('amqplib/callback_api');
const radiationCritical = 250;
const CONN_URL = 'amqp://localhost';
amqp.connect(CONN_URL, function (err, conn) {
    conn.createChannel(function (err, ch) {
        ch.consume('sensor', function (msg) {
                let date1 = Date.now()
                console.log('.....');
                console.log("Message:", msg.content.toString());
                try {
                    const json = JSON.parse(msg.content);
                    console.log(json.radiation_level)
                    const alert = checkCriticalRadiation(json.radiation_level)
                    if (alert) {
                        console.log("Detecred Critical Value");
                        sendAnalytics(ch, 'analytics', msg.content)
                        let date = Date.now()/1000 - date1
                        console.log('time to perform actions ' + date + 'ms')
                    }
                } catch (e) {
                    console.log("not JSON");
                }
            },{ noAck: true }
       );
    });
});


const checkCriticalRadiation = (radiation_value) => radiation_value > radiationCritical;


const sendAnalytics =  (ch, queueName, data) => {
    ch.sendToQueue(queueName, new Buffer(data));
}