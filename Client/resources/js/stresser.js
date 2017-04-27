var minNumSensors = 5;
var numSensors = 0
var maxNumSensors = 8;
var sendDelay = 1; //ms, delay between request from each sensor
var sensors = []; // sensor ID and value array
var baseUrl = 'http://localhost:5000/';
var finished = true;
var times = [];
$(document).ready(function(){
    //ping server first time
    checkServer();

    //ping server every min for avalability
    setInterval(function(){
        checkServer();    
    }, 10000);

    $(".inputField").keyup(()=>{
        //checkKeys();
    });

    $("#change").click(()=>{
        baseUrl = baseUrl = $('#baseUrl').val();
    });

    $("#start").click(function(){
        //if(!checkKeys()){
        numSensors = $('#sensorRange').val();
        sendDelay = $('#sendDelay').val();
        //}
        if($('#baseUrl').val() != "")
            baseUrl = $('#baseUrl').val();
        
        //create initial sensor array
        for(var i = 0; i < numSensors; i++){
            sensors.push({id : i, data: 0, time: 0})
        }

        //start stessing server
        if($('#serverStatus').is(':checked')){
            $("#clientStatus").prop("checked", true);
            $("#clientStatus").text('Clients are working'); 
            numSensors = minNumSensors;
            //triger first send
            $.post(baseUrl+'manager/setNumSensors',{numSenz : numSensors},(data, status)=>{
                console.log("Data: " + data + "\nStatus: " + status);             
                sendSensorData();
            });
        
        }
        else{
            console.log("Can't send if server is not online");
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
    if(numSensors < maxNumSensors){
    for(var i = 0; i < numSensors; i++){
            setTimeout(function(){
                var tmpSensor = sensors[alreadyPicked.pop()];
                tmpSensor.time = new Date().getTime();
                $.post(baseUrl+'update',tmpSensor,(data, status)=>{
                    //var dataObj = JSON.parse(data);
                    if(data == "")
                        console.log("Status: " + status);
                    else if(data != ""){
                        var responseObj = JSON.parse(data);
                        console.log("this is the last one "+data);
                        times.push({sensorIndex: numSensors, data: data});
                        setTimeout(()=>{
                            $.post(baseUrl+'manager/setNumSensors',{numSenz : numSensors},(data, status)=>{
                                console.log("Data: " + data + "\nStatus: " + responseObj);  
                                numSensors++;
                                sendSensorData();
                            });
                        },5000);
                        if(numSensors >= maxNumSensors){
                            console.log(times);
                            $("#clientStatus").prop("checked", false);
                            $("#clientStatus").text('Clients are not working'); 
                        }
                    }
                });
            },sendDelay);    
        
        }  
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
    });/*
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
    });*/
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