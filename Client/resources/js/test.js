var numSensors = 10;
var refreshRate = 10000; //ms
var sendDelay = 1; //ms, delay between request from each sensor
var sensors = []; // sensor ID and value array
var executeOnce = 1; //flag to choose if you want continuous execution or not
var primeDB = 0; //flag to choose if you want to fill the DB with 0 for each sensor
var baseUrl = 'http://localhost:5000/';
var setIntervalRet = null;

$(document).ready(function(){
    //ping server first time
    $.get(baseUrl+'status',(response)=>{}).done(()=>{
        $("#serverStatus").prop("checked", true);
        console.log("Server is availible");
    }).fail(()=>{
        $("#serverStatus").prop("checked", false);
        console.log("Server is not availible");
    });
    //ping server every min for avalability
    setInterval(function(){
        $.get(baseUrl+'status',(response)=>{}).done(()=>{
            $("#serverStatus").prop("checked", true);
            console.log("Server is availible");
        }).fail(()=>{
            $("#serverStatus").prop("checked", false);
            console.log("Server is not availible");
        });
        
    }, 10000);

    $(".inputField").keyup(()=>{
        checkKeys();
    });

    $("#start").click(function(){
        if(!checkKeys()){
            baseUrl = $('#baseUrl').val();
            numSensors = $('#numSensors').val();
            refreshRate = $('#refreshRate').val();
            sendDelay = $('#sendDelay').val();
        }
        executeOnce = $('#sendOnce').is(':checked');
        primeDB = $('#primeDB').is(':checked');
        //send numSensors to server
        $.post(baseUrl+'manager/setNumSensors',{numSenz : numSensors},(data, status)=>{
            console.log("Data: " + data + "\nStatus: " + status);
        });
        //create initial sensor array
        for(var i = 0; i < numSensors; i++){
            sensors.push({id : i, data: 0})
        }
        //fill DB with zeroes 
        if(primeDB == true){
        console.log("Priming DB");
        var sensorID = 0;
            //send initial information
            for(var i = 0; i < numSensors; i++){
                setTimeout(function(){
                    //request.post('http://localhost:5000/update').form(sensors[sensorID]);
                    $.post(baseUrl+'update',{id: sensorID, data: 0},(data, status)=>{
                        console.log("Status: " + status);
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
            $.post(baseUrl+'update',sensors[alreadyPicked.pop()],(data, status)=>{
                console.log("Status: " + status);
            });
        },sendDelay);    
    }  
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