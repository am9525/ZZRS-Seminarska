var minNumSensors = 10; //the lower threshold for the number of sensor to be tested
var maxNumSensors = 20; //the higher threshold fot the number of sensor to be tested
var sensorStep = 10; //for how much does the sensor value change during the test
var numOfTests = (maxNumSensors-minNumSensors)/sensorStep+1; //number of tests to be executed
var currTestNumber = 0;
var currNumSensors = minNumSensors;//number of sensorts for the current test
var maxTestRepeat = 5; // how many times is each test repeated
var currTestRepeat = 0; // at which repetition is the current test
var sendDelay = 1; //ms, delay between request from each sensor
var sensors = []; // sensor ID and value array
var baseUrl = 'http://localhost:5000/';
var finished = true;
var times = []; //array containing all the results
//charts
var pingChart = null;
var dbChart = null;
var ramChart = null;
var scaleStep = 10;
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
    $('#dropTable').click(()=>{
        $.ajax({
            url: baseUrl+'results',
            type: 'DELETE',
            success: function(response) {
                // Do something with the result
                console.log(response);
            }
        });
    });
    $('#pullData').click(()=>{
        $('progress').attr('value', 0);
        //if(!checkKeys()){
        if($('#sendDelay').val() != "")
            sendDelay = parseInt($('#sendDelay').val());
        //}
        if($('#baseUrl').val() != "")
            baseUrl = $('#baseUrl').val();
        //parse sensorRange
        if($('#sensorRange').val() != ""){
            var tmpRange  = $("#sensorRange").val().split("-");
            minNumSensors = parseInt(tmpRange[0]);
            maxNumSensors = parseInt(tmpRange[1]);
        }
        if($('#sensorStep').val() != "")
            sensorStep = parseInt($('#sensorStep').val());
        
        if($('#numTests').val() != "")
            maxTestRepeat = parseInt($('#numTests').val());

        $.post(baseUrl+'results', {sendDelay: sendDelay, min: minNumSensors, max: maxNumSensors, step: sensorStep},(response)=>{
            var testResult = JSON.parse(response);
            
            
            //console.log(testResult[0]);
            if(pingChart != null)
                pingChart.destroy();
            if(dbChart != null)
                dbChart.destroy();
            if(ramChart != null)
                ramChart.destroy(); 
            //parse sensorRange
            if($('#sensorRange').val() != ""){
                var tmpRange  = $("#sensorRange").val().split("-");
                minNumSensors = parseInt(tmpRange[0]);
                maxNumSensors = parseInt(tmpRange[1]);
            }
            if($('#sensorStep').val() != "")
                sensorStep = parseInt($('#sensorStep').val());
            maxTestRepeat = 1;
            numOfTests = testResult.length;
            getDataFromResults(testResult, false,(pings, dbTime, ram, labels)=>{
                drawGraphs(pings, dbTime, ram, labels);
            });
        });
    });
    $("#start").click(function(){
        $('progress').attr('value', 0);
        //if(!checkKeys()){
        if($('#sendDelay').val() != "")
            sendDelay = parseInt($('#sendDelay').val());
        //}
        if($('#baseUrl').val() != "")
            baseUrl = $('#baseUrl').val();
        //parse sensorRange
        if($('#sensorRange').val() != ""){
            var tmpRange  = $("#sensorRange").val().split("-");
            minNumSensors = parseInt(tmpRange[0]);
            maxNumSensors = parseInt(tmpRange[1]);
        }
        if($('#sensorStep').val() != "")
            sensorStep = parseInt($('#sensorStep').val());
        
        if($('#numTests').val() != "")
            maxTestRepeat = parseInt($('#numTests').val());
        
        //create initial sensor array
        for(var i = 0; i < maxNumSensors; i++){
            sensors.push({id : i, data: 0, time: 0})
        }
        if(pingChart != null)
            pingChart.destroy();
        if(dbChart != null)
            dbChart.destroy();
        if(ramChart != null)
            ramChart.destroy();
        //start stressing server
        if($('#serverStatus').is(':checked')){
            $("#clientStatus").prop("checked", true);
            $("#clientStatus").text('Clients are working'); 
            currNumSensors = minNumSensors;
            numOfTests = (maxNumSensors-minNumSensors)/sensorStep+1; 
            currTestRepeat= 1;
            currTestNumber = 0;
            times= [];
            $('#state').text("executing test: "+currTestNumber+"/"+numOfTests);
            //triger first send
            $.post(baseUrl+'manager/createLocalTable', {sendDelay: sendDelay}, (data, status)=>{
                $.post(baseUrl+'manager/setNumSensors',{numSenz : currNumSensors, sendDelay: sendDelay},(data, status)=>{
                    console.log("Data: " + data + "\nStatus: " + status);    
                    sendSensorData();
                });
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
    if(currNumSensors <= maxNumSensors){
        console.log("numSensors:",currNumSensors);
        //generate random variables for data
        for(var i = 0; i < currNumSensors; i++){
            sensors[i] = {id : i, data: Math.floor(Math.random()*1000)}
        }
        //array used for randomization
        var alreadyPicked = [];
        //randomize which sensor gets to send first
        do{
            var whichIsNext = Math.floor(Math.random()*currNumSensors);
            if(alreadyPicked.indexOf(whichIsNext) === -1){
                alreadyPicked.push(whichIsNext);
            }
        }while(alreadyPicked.length != currNumSensors);
        
        console.log("picked order", alreadyPicked);
        //send request in random order
        for(var i = 0; i < currNumSensors; i++){
            //time between each test
            setTimeout(function(){
                var tmpSensor = sensors[alreadyPicked.pop()];
                tmpSensor.time = new Date().getTime();
                $.post(baseUrl+'update',tmpSensor,(data, status)=>{
                    if(data == "")
                        console.log("Status: " + status);
                    else if(data != ""){
                        var responseObj = JSON.parse(data);
                        times.push({numSensors: currNumSensors, data: data});
                        console.log("time pushing: ",currNumSensors, data);
                        if(currTestRepeat >= maxTestRepeat){
                            currTestRepeat  = 0;
                            currTestNumber++;
                            currNumSensors += sensorStep;  
                            $('progress').attr('value', (currTestNumber/numOfTests)*100);
                            $('#state').text("executing test: "+currTestNumber+"/"+numOfTests);
                        }
                        currTestRepeat++;
                        //timetout between tests
                        setTimeout(()=>{
                            $.post(baseUrl+'manager/setNumSensors',{numSenz : currNumSensors, sendDelay: sendDelay},(data, status)=>{
                                console.log("Data: " + data + "\nStatus: " + responseObj);  
                                sendSensorData();
                            });
                        },100);
                    }
                });
            },i*sendDelay);    
            
        }  
    }
    if(currNumSensors > maxNumSensors){
        console.log(currNumSensors,maxNumSensors);
        getDataFromResults(times, true,(pings, dbTime, ram, labels)=>{
            drawGraphs(pings, dbTime, ram, labels);
        });
        $("#clientStatus").prop("checked", false);
        $("#clientStatus").text('Clients are not working'); 
        saveData(times, "results.json");
        
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
//function to save data
var saveData = (function (data, fileName) {
    $('body').append("<a id=\"downloadLink\">downloadResults</a>");
   
    var json = JSON.stringify(data),
            blob = new Blob([json], {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);

    $("#downloadLink").attr("href", url);
    $("#downloadLink").attr("download", fileName);
    $("#downloadLink").click();
    $("#downloadLink").trigger('click');

});
var getDataFromResults = function(times/*raw data*/, isJson, callback){
    
    var pings = []; // holds the recieved ping data
    var dbTime = []; // holds the recieved DB time data
    var ram = []; // holds the recived ram data
    var labels = []; // holds the numSensor of the executed test
    var tmpPing = 0; // temporary value used for mean
    var tmpDBTime = 0;// temporary value used for mean
    var tmpRam = 0;// temporary value used for mean
    //get data from results
    console.log(times);
    console.log(numOfTests);
    for(var i = 0; i < numOfTests; i++){
        for(var j = 0; j < maxTestRepeat; j++){
            var dataObj = null;
            if(isJson == true)
                dataObj = JSON.parse(times[i*maxTestRepeat+j].data);
            else{
                dataObj = times[i*maxTestRepeat+j];
            }
            //console.log("numSensors:"+times[i*maxNumTests+j].sensorIndex+ " DBTime: "+dataObj.DBTime)
            tmpPing += dataObj.ping;
            tmpDBTime += dataObj.dbTime;
            tmpRam += parseInt(dataObj.ram/1048576);
        }
        //write to array
        tmpPing /= maxTestRepeat;
        tmpDBTime /= maxTestRepeat;
        tmpRam /= maxTestRepeat;
        pings.push(tmpPing);
        dbTime.push(tmpDBTime);
        ram.push(tmpRam);
        if(times[i*maxTestRepeat].numSensors % scaleStep == 0){
            labels.push(times[i*maxTestRepeat].numSensors);
        }
        else{
            labels.push("");
        }
        
        tmpPing = 0;
        tmpDBTime = 0;
        tmpRam = 0;
    }
    callback(pings, dbTime, ram, labels);
}
var drawGraphs = function(pings, dbTime, ram, labels){
    var dataPing = {
        labels: labels,
        datasets: [
            {
                label: "Ping [ms]",
                data: pings,
                fill: false,
                backgroundColor: "rgba(0, 255, 0,0.4)",//color of the fill under the curve
                borderColor: "rgba(0, 255, 0,1)", // color of the line
                pointBorderColor: "rgba(0,255,0,1)", // color od data points
                pointBackgroundColor: "rgba(0,255,0,0.4)",
                showLine: true,
            }
        ]
    };
    var dataDBTime = {
        labels: labels,
        datasets: [
            {
                label: "DBTime [ms]",
                data: dbTime,
                fill: false,
                backgroundColor: "rgba(0, 0, 255,0.4)",//color of the fill under the curve
                borderColor: "rgba(0, 0, 255,1)", // color of the line
                pointBorderColor: "rgba(0,0,255,1)", // color od data points
                pointBackgroundColor: "rgba(0,0,255,0.4)",
                showLine: true,
            }
        ]
    };
    var dataRam = {
        labels: labels,
        datasets: [
            {
                label: "RAM [MB]",
                data: ram,
                fill: false,
                backgroundColor: "rgba(255, 0, 0,0.4)",//color of the fill under the curve
                borderColor: "rgba(255, 0, 0,1)", // color of the line
                pointBorderColor: "rgba(255,0,0,1)", // color od data points
                pointBackgroundColor: "rgba(255,0,0,0.4)",
                showLine: true,
            }
        ]
    };
    pingChart= new Chart($("#ping"), {
        type: 'line',
        data: dataPing,
        options: {
            responsive: false,
            scales:
            {
                xAxes: [{
                    display: true,
                    ticks:{
                        autoSkip: true,
                    }
                }],
                yAxes: [{
                    ticks: {  
                        beginAtZero: true,
                    }
                }]
            },
            layout: {
                padding: {
                top: 5,
                right: 10,
            }
        },
        }
        
    });
    dbChart =  new Chart($("#dbTime"), {
        type: 'line',
        data: dataDBTime,
        options: {
            responsive: false,
            scales:
            {
                xAxes: [{
                    display: true,
                    autoSkip: true,
                }],
                yAxes: [{
                    ticks: {
                        
                        beginAtZero: true,
                    }
                }]
            },
            layout: {
                padding: {
                    top: 5,
                    right: 10,
                }
            },
        }
            
    });
    ramChart =  new Chart($("#ram"), {
        type: 'line',
        data: dataRam,
        options: {
            responsive: false,
            scales:
            {
                xAxes: [{
                    display: true,
                    autoSkip: true,
                }],
                yAxes: [{
                    ticks: {
                        
                        beginAtZero: true,
                    }
                }]
            },
            layout: {
                padding: {
                    top: 5,
                    right: 10,
                }
            },
        }
            
    });  
}
/*fill: false, // fills the area under the curve
lineTension: 0.1,//how smooth is the line 
backgroundColor: "rgba(255, 0, 0,0.4)",//color of the fill under the curve
borderColor: "rgba(255, 0, 0,1)", // color of the line
borderWidth: 3, // how fat is the line
borderCapStyle: 'butt', //line ending, square, butt, round
//borderDash: [10,10], // first is dash length seconds in space between dashes
borderDashOffset: 0.0, //gow much are the dashed from border of screen
borderJoinStyle: 'miter',//shape of joint, round, miter, bevel
//stepped: true, line tension will be ignored
pointBorderColor: "rgba(255,0,0,1)", // color od data points
pointBackgroundColor: "#fff",
pointBorderWidth: 2, // how big are border of points
pointHoverRadius: 5, // how rounded are the points
pointHoverBackgroundColor: "rgba(255,0,0,1)", // when you how what color is the point
pointHoverBorderColor: "rgba(220,0,0,1)", // when you hover what color is the background of the point
pointHoverBorderWidth: 10, //radius around point when ou hover 
pointRadius: 2,
pointHitRadius: 5,*/