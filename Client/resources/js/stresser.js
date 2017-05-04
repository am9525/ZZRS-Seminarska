var minNumSensors = 10;
var maxNumSensors = 20;
var numAllSensors = 0;
var numSensors = 0;
var maxNumTests = 5;
var numTests = 0;
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
        $('progress').attr('value', 0);
        //if(!checkKeys()){
        sendDelay = $('#sendDelay').val();
        //}
        if($('#baseUrl').val() != "")
            baseUrl = $('#baseUrl').val();
        //parse sensorRange
        if($('#sensorRange').val() != ""){
            var tmpRange  = $("#sensorRange").val().split("-");
            minNumSensors = tmpRange[0];
            maxNumSensors = tmpRange[1];
            
        }
        if($('#numTests').val() != ""){
            maxNumTests = $('#numTests').val();
        }
        //create initial sensor array
        for(var i = 0; i < maxNumSensors; i++){
            sensors.push({id : i, data: 0, time: 0})
        }

        //start stressing server
        if($('#serverStatus').is(':checked')){
            $("#clientStatus").prop("checked", true);
            $("#clientStatus").text('Clients are working'); 
            numSensors = minNumSensors;
            numAllSensors = maxNumSensors - minNumSensors;
            numTests = 1;
            $('#state').text("executing test: "+numSensors+"/"+maxNumSensors);
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
    if(numSensors < maxNumSensors){
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
            //time between each test
            setTimeout(function(){
                var tmpSensor = sensors[alreadyPicked.pop()];
                tmpSensor.time = new Date().getTime();
                $.post(baseUrl+'update',tmpSensor,(data, status)=>{
                    if(data == "")
                        console.log("Status: " + status);
                    else if(data != ""){
                        var responseObj = JSON.parse(data);
                        console.log("NumSensors: "+numSensors+data);
                        times.push({sensorIndex: numSensors, data: data});
                        if(numTests == maxNumTests){
                            numTests = 0;
                            numSensors++;
                            $('progress').attr('value', (numSensors/numAllSensors)*100);
                            $('#state').text("executing test: "+numSensors+"/"+maxNumSensors);
                        }
                        numTests++;
                        setTimeout(()=>{
                            $.post(baseUrl+'manager/setNumSensors',{numSenz : numSensors},(data, status)=>{
                                console.log("Data: " + data + "\nStatus: " + responseObj);  
                                sendSensorData();
                            });
                        },100);
                    }
                });
            },sendDelay);    
            
        }  
    }
    if(numSensors >= maxNumSensors){
        //console.log(times);
        var pings = [];
        var dbTime = [];
        var ram = [];
        var labels = [];
        var tmpPing = 0;
        var tmpDBTime = 0;
        var tmpRam = 0;
        var numDiffTests = maxNumSensors-minNumSensors; // number of all senors
        for(var i = 0; i < numDiffTests; i++){
            for(var j = 0; j < maxNumTests; j++){
                var dataObj = JSON.parse(times[i*maxNumTests+j].data);
                //console.log("numSensors:"+times[i*maxNumTests+j].sensorIndex+ " DBTime: "+dataObj.DBTime)
                tmpPing += dataObj.ping;
                tmpDBTime += dataObj.DBTime;
                tmpRam += dataObj.PorabaRAM;
            }
            //write to array
            tmpPing /= maxNumTests;
            tmpDBTime /= maxNumTests;
            tmpRam /= maxNumTests;
            pings.push(tmpPing);
            dbTime.push(tmpDBTime);
            ram.push(tmpRam);
            labels.push(times[i*maxNumTests].sensorIndex);
            tmpPing = 0;
            tmpDBTime = 0;
            tmpRam = 0;
        }
        //console.log(labels);
        //console.log(pings);
        $("#clientStatus").prop("checked", false);
        $("#clientStatus").text('Clients are not working'); 
        saveData(times, "results.json");
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
                    data: dbTime,
                    fill: false,
                    backgroundColor: "rgba(255, 0, 0,0.4)",//color of the fill under the curve
                    borderColor: "rgba(255, 0, 0,1)", // color of the line
                    pointBorderColor: "rgba(255,0,0,1)", // color od data points
                    pointBackgroundColor: "rgba(255,0,0,0.4)",
                    showLine: true,
                }
            ]
        };
        var pingChart= new Chart($("#ping"), {
            type: 'line',
            data: dataPing,
            options: {
                responsive: false,
                scales:
                {
                    xAxes: [{
                        display: false
                    }],
                    yAxes: [{
                        ticks: {
                            max: 100,    
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
        var dbChar =  new Chart($("#dbTime"), {
            type: 'line',
            data: dataDBTime,
            options: {
                responsive: false,
                scales:
                {
                    xAxes: [{
                        display: false
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
        var ramChar =  new Chart($("#ram"), {
            type: 'line',
            data: dataRam,
            options: {
                responsive: false,
                scales:
                {
                    xAxes: [{
                        display: false
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