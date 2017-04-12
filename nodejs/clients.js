var request = require('request');

var numSensors = 5;
var sensors = [];
var refreshRate = 10000; //ms
var sendDelay = 100; //ms, delay between request from each sensor
//create initial sensor array
for(var i = 0; i < numSensors; i++){
    sensors.push({id : i, data: 0})
}
var sensorID;

//send initial information
for(var i = 0; i < numSensors; i++){
    setTimeout(function(){
        request.post('http://localhost:5000/update').form(sensors[sensorID]);
        sensorID++
    },sendDelay);
}
sensorID = 0;
//update sensors every 2 min
setInterval(function(){
    sensorID = 0;
    //generate random variables for data
    for(var i = 0; i < numSensors; i++){
        sensors[i] = {id : i, data: Math.floor(Math.random()*1000)}
    }
    for(var i = 0; i < numSensors; i++){
        setTimeout(function(){
            request.post('http://localhost:5000/update').form(sensors[sensorID]);
            sensorID++
        },sendDelay);
    }
},refreshRate)