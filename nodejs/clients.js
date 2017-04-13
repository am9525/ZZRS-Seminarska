var request = require('request');

const numSensors = 10000;
const refreshRate = 100000; //ms
const sendDelay = 1; //ms, delay between request from each sensor
var sensors = []; // sensor ID and value array
var executeOnce = 1; //flag to choose if you want continuous execution or not
var primeDB = 0; //flag to choose if you want to fill the DB with 0 for each sensor
document.write();
/*
request.get('http://localhost:5000/status').on('response',(response)=>{
    var test = JSON.parse(JSON.stringify(response));
    console.log(test)
});
*/
//preverjamo ali je baza dostopna

//send numSensors to server
request.post('http://localhost:5000/manager/setNumSensors').form({numSenz : numSensors});
//create initial sensor array
for(var i = 0; i < numSensors; i++){
    sensors.push({id : i, data: 0})
}
if(primeDB == 1){
var sensorID;
    //send initial information
    for(var i = 0; i < numSensors; i++){
        setTimeout(function(){
            request.post('http://localhost:5000/update').form(sensors[sensorID]);
            sensorID++
        },sendDelay);
    }
}
if(executeOnce === 0){
    //update sensors every n ms
    setInterval(function(){
        //generate random variables for data
        for(var i = 0; i < numSensors; i++){
            sensors[i] = {id : i, data: Math.floor(Math.random()*1000)}
        }
        var alreadyPicked = [];
        //randomize which sensor gets to send first
        do{
            var whichIsNext = Math.floor(Math.random()*numSensors);
            if(alreadyPicked.indexOf(whichIsNext) === -1){
                alreadyPicked.push(whichIsNext);
                console.log(whichIsNext);
            }
        }while(alreadyPicked.length !== numSensors);

        //send request in random order
        for(var i = 0; i < numSensors; i++){
            setTimeout(function(){
                request.post('http://localhost:5000/update').form(sensors[alreadyPicked.pop()]);
            },sendDelay);    
        }  
    },refreshRate);
}
else{
    //generate random variables for data
    for(var i = 0; i < numSensors; i++){
        sensors[i] = {id : i, data: Math.floor(Math.random()*1000)}
    }
    var alreadyPicked = [];
    //randomize which sensor gets to send first
    do{
        var whichIsNext = Math.floor(Math.random()*numSensors);
        if(alreadyPicked.indexOf(whichIsNext) === -1){
            alreadyPicked.push(whichIsNext);
            console.log("Sensor with ID: "+whichIsNext+" is sending data");
        }
    }while(alreadyPicked.length !== numSensors);
    
    //send request in random order
    for(var i = 0; i < numSensors; i++){
        setTimeout(function(){
            request.post('http://localhost:5000/update').form(sensors[alreadyPicked.pop()]);
        },sendDelay);    
    }  
}