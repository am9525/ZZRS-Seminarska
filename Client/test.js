var numSensors = 10;
var refreshRate = 10000; //ms
var sendDelay = 1; //ms, delay between request from each sensor
var sensors = []; // sensor ID and value array
var executeOnce = 1; //flag to choose if you want continuous execution or not
var primeDB = 0; //flag to choose if you want to fill the DB with 0 for each sensor
var setIntervalRet = null;

$(document).ready(function(){
    //get data from form
    $("#test").click(function(){
        
        if(!$.isNumeric($('#numSensors').val()))
            alert("numSensors is not numeric");
        else
            numSensors = $('#numSensors').val();
        
        refreshRate = $('#refreshRate').val();
        sendDelay = $('#sendDelay').val();
        executeOnce = $('#sendOnce').is(':checked');
        primeDB = $('#primeDB').is(':checked');

        //send numSensors to server
        $.post('http://localhost:5000/manager/setNumSensors',{numSenz : numSensors},(data, status)=>{
            console.log("Data: " + data + "\nStatus: " + status);
        });
        //create initial sensor array
        for(var i = 0; i < numSensors; i++){
            sensors.push({id : i, data: 0})
        }
        //fill DB with zeroes 
        if(primeDB == true){
        var sensorID = 0;
            //send initial information
            for(var i = 0; i < numSensors; i++){
                setTimeout(function(){
                    //request.post('http://localhost:5000/update').form(sensors[sensorID]);
                    $.post('http://localhost:5000/update',sensors[sensorID],(data, status)=>{
                        console.log("Status: " + status);
                    });
                    sensorID++
                },sendDelay);
            }
        }
        if(executeOnce == false){
            $("#clientStatus").text('Clients are working'); 
            //update sensors every n ms
            setIntervalRet = setInterval(function(){
                sendSensorData();
            },refreshRate);
        }
        else{
            sendSensorData();
        }
    });
    $("#stop").click(function(){
        $("#clientStatus").text('Clients are not working'); 
        clearInterval(setIntervalRet);
    });
});

var sendSensorData = function(){

    //generate random variables for data
    for(var i = 0; i < numSensors; i++){
        sensors[i] = {id : i, data: Math.floor(Math.random()*1000)}
    }
    var alreadyPicked = [];
    //randomize which sensor gets to send first
    console.log("numSensors:",numSensors);
    do{
        var whichIsNext = Math.floor(Math.random()*numSensors);
        if(alreadyPicked.indexOf(whichIsNext) === -1){
            alreadyPicked.push(whichIsNext);
        }
    }while(alreadyPicked.length != numSensors);
    console.log("picked order", alreadyPicked);
    //send request in random order
    for(var i = 0; i < numSensors; i++){
        setTimeout(function(){
            //request.post('http://localhost:5000/update').form(sensors[alreadyPicked.pop()]);
            $.post('http://localhost:5000/update',sensors[alreadyPicked.pop()],(data, status)=>{
                console.log("Status: " + status);
            });
        },sendDelay);    
    }  
}
