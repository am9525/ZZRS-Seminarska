var numSensors = 10;
var refreshRate = 10000; //ms
var sendDelay = 1; //ms, delay between request from each sensor
var sensors = []; // sensor ID and value array
var executeOnce = 1; //flag to choose if you want continuous execution or not
var primeDB = 0; //flag to choose if you want to fill the DB with 0 for each sensor
var baseUrl = 'http://localhost:5000/';
var setIntervalRet = null;
var serverTimeOffset = 0;

$(document).ready(function(){
    //ping server first time
    checkServer();

    //ping server every min for avalability
    setInterval(function(){
        checkServer();    
    }, 10000);

    $(".inputField").keyup(()=>{
        checkKeys();
    });

    $("#change").click(()=>{
        baseUrl = baseUrl = $('#baseUrl').val();
    });

    $("#start").click(function(){
        if(!checkKeys()){
            numSensors = $('#numSensors').val();
            refreshRate = $('#refreshRate').val();
            sendDelay = $('#sendDelay').val();
        }
        if($('#baseUrl').val() != "")
            baseUrl = $('#baseUrl').val();
        
        executeOnce = $('#sendOnce').is(':checked');
        primeDB = $('#primeDB').is(':checked');
        //send numSensors to server
        $.post(baseUrl+'manager/setNumSensors',{numSenz : numSensors},(data, status)=>{
            console.log("Data: " + data + "\nStatus: " + status);
        });
        //create initial sensor array
        for(var i = 0; i < numSensors; i++){
            sensors.push({id : i, data: 0, time: 0})
        }
        //fill DB with zeroes 
        if(primeDB == true){
        console.log("Priming DB");
        var sensorID = 0;
            //send initial information
            for(var i = 0; i < numSensors; i++){
                setTimeout(function(){
                    $.post(baseUrl+'update',{id: sensorID, data: 0, time: new Date().getTime()},(data, status)=>{
                        console.log("Status: " + status+ "\nData:"+data);
                    });
                    sensorID++
                },sendDelay);
            }
        }
        if(executeOnce == false){
            $("#clientStatus").prop("checked", true);
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
        $("#clientStatus").prop("checked", false);
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
            var tmpSensor = sensors[alreadyPicked.pop()];
            tmpSensor.time = new Date().getTime();
            $.post(baseUrl+'update',tmpSensor,(data, status)=>{
                console.log("Status: " + status+ "\nData:"+data);
            });
        },sendDelay);    
    }  
}
var checkServer = function(){/*
    $.get(baseUrl+'time', (response)=>{
        var responseObj = JSON.parse(response);
        var serverTime = new Date(responseObj.serverTime);
        var clientTime = new Date();
        var timeDiffms = Math.abs(serverTime-clientTime);
        var timeDiff = new Date(timeDiffms);
        console.log("time took -> "+ timeDiffms+ "ms -> "+ timeDiff.getMinutes()+"min, "+timeDiff.getSeconds()+"sec");
        console.log(serverTime + " | " +clientTime);    
    });*/
    $.get(baseUrl+'status',(response)=>{
        var responseObj = JSON.parse(response);
        console.log("Server: "+responseObj.status);
        $("#serverStatus").prop("checked", true);
    })
    .fail(()=>{
        $("#serverStatus").prop("checked", false);
        console.log("Server: offline");
    });
    $.get(baseUrl+'statusBaza',(response)=>{
        var responseObj = JSON.parse(response);
        console.log("DB status:"+responseObj.DBAccessible);
        if(responseObj.DBAccessible){
            //console.log("DB is accessible at:"+responseObj.DataURL);
            $("#DBStatus").prop("checked", true);
        }
    }).fail(()=>{
        console.log("DB status: offline")
        $("#DBStatus").prop("checked", false);
    });
}
var checkKeys = function(){
    var isValid = true;
    var allEmpty = true;
    $(".inputField").each(function() { // iterate through all elemnts with same class

    if ($(this).val() == "" || !$.isNumeric($(this).val())){
        isValid = false;
        previousValid = isValid;
        $(this).css({"border": "2px solid red"});
    }
    else
        $(this).css({"border": "2px solid dodgerblue"});
    
    if ($(this).val() == "")
        allEmpty &= true;
    else
        allEmpty &= false;
    });
    if(isValid == true || allEmpty == true){
        $("#start").attr("disabled", false).removeClass("buttonDisabled").addClass("button");
        $(".inputField").each(function() {
            $(this).css({"border": "2px solid dodgerblue"});
        });
        $("#inputError").remove();
    }
    else {
        $("#start").attr("disabled", true).removeClass("button").addClass("buttonDisabled");
        if($("li").length == 0)
             $("ul").append("<li id=\"inputError\">One or more input fields contain illegal values</li>");
        console.log($("li").length );
        
    }
    return allEmpty;
}