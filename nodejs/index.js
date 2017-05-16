var express = require('express');
var bodyParser = require('body-parser');
var os = require("os");
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('nodejs/resources/db/results.db');
var path = require('path');

// Endianness
console.log('endianness : ' + os.endianness());

// OS type
console.log('type : ' + os.type());

// OS platform
console.log('platform : ' + os.platform());

// Total system memory
console.log('total memory : ' + os.totalmem() + " bytes.");

// Total free memory
console.log('free memory : ' + os.freemem() + " bytes.");
console.log("cpu model:" + os.cpus()[0].model );
console.log("cpu speed:" + os.cpus()[0].speed );
console.log("cpu times:" + os.cpus()[0].times );
/*
var OSDATA = setInterval(()=>{
	console.log("[osData]: " + (os.totalmem()-os.freemem())  + " B; " + parseFloat(os.loadavg()[0]*100).toFixed(1) +" %, " + parseFloat(os.loadavg()[1]*100).toFixed(1) +" %, "+ parseFloat(os.loadavg()[2]*100).toFixed(1) +" %, ");


}, 1000);
*/

var app = express();
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/', express.static(path.join(__dirname, 'stresser')));
// views is directory for all template files
//app.set('views', __dirname + '/view/ejs');
//app.set('view engine', 'ejs');

app.set('port', (process.env.PORT || 5000));
 /*
    
 */
//app.use(express.static(__dirname + '/public'));

//Spremenljivke za naso bazo.
//Ob koncanem testiranju bodo bolj urejene
var baza = require('./baza');

var baza_dela = baza.dela(function(err, dela){
	
	baza_dela = dela;

});  //Ali je baza dostopna?

var baza_steviloStolpcev = 1000;  //stevilo podatkovnih stolpcev v tabeli, brez stolpca za kljuc
                                  //v resnici je steviloStolpcev + 1 stolpcev

var baza_imeTabele = "Test";   //Ime tabele
var testSeIzvaja = false; //boolean, ki pove ali se izvaja test

//parametri za senzorje
var stASenz = 5;     //število aktivnih senzorjev
var stSprej = 0;      //število prejetih stanj senzorjev
var stPrispel = 0;
var casZadnji = 0     //čas zadnjega obdelanega
var casPrvi = 0;      //cas prvega obdelanega paketa
var senzorPing = 0;
var casBaze = 0;
var sendDelay = 1; //delay between sending time of sensors, sensorSend <---sendDelay---> nextSensorSend

app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname + '/stresser/stresser.html'));
});
app.post('/time', function(request, response) {
  var time = new Date();
  var jsonResponse = JSON.stringify({serverTime: time});
  response.end(jsonResponse);
});
app.delete('/results', (request, response)=>{
  db.serialize(()=>{
    db.run("DROP TABLE if exists results"+ request.body.sendDelay);
    db.run("CREATE TABLE if not exists results"+request.body.sendDelay+" (numSensors INTEGER(6) PRIMARY KEY, ping REAL, dbTime REAL, ram INT(4), numResults INT(4))");
    response.status(200).send("results"+ request.body.sendDelay+ " erased");
  });
});
app.post('/results', (request, response)=>{
  console.log("Got request for",request.body.sendDelay,"ms results");
  getDataFromResultTable(request.body.sendDelay,request.body.min, request.body.max, request.body.step,(err, rows)=>{
    if(err != null){
      response.status(500).send("Something went wrong")
    }
    response.status(200).send(JSON.stringify(rows));
  });
});
/*
primer funkcije za prikaz statusa
*/
app.get('/statusBaza', function(request, response) {
  baza.dela(function(err, dela){
    baza_dela = dela;
    RESPONSE='Status screen\nBaza dostopna: ' + baza_dela + "\nDataUrl: " + process.env.DATABASE_URL;
    if(dela) RESPONSE = RESPONSE + "\nSeznam tabel:\n"+ Object.keys(baza.seznamTabel());
    var jsonResponse = JSON.stringify({ 
    DBAccessible: true, 
    DataURL: process.env.DATABASE_URL, 
    TableList: Object.keys(baza.seznamTabel()),
  });
    response.end(jsonResponse);
  });
});

app.get('/status',(request, response)=>{
  var jsonResponse = JSON.stringify({status: "online"});
  response.end(jsonResponse);
});
/*
primer funkcije za postavitev baze in
Dostopno je na: /manager/postaviBazo
*/
app.get('/manager/postaviBazo', function(request, response) {
  baza.dela(function(err, dela){
    try{

        baza.ustvariTabelo(baza_imeTabele, "ID", "int", "st","int", baza_steviloStolpcev, function(err, SQL_STRING, tabele){
          if(err) {
            response.end("Napaka: " + err); 
          }
          else{
            baza.generateRows(baza_imeTabele, 1000, "ID", "st", baza_steviloStolpcev, function(err){
              if(err) response.end("Generacija vrstic ni uspela, ker: " + err); 
              else response.end("Postavitev baze z ukazom:\n"+SQL_STRING); 
            });
          }
          
      });
    }catch(err){
      console.log("tryCatch"+err);
    }
  });
});

app.get('/senzorji', function(request, response) {
  console.log("recieved /seonzorji request");
  baza.dela(function(err, dela){
    if(dela && !err){
      baza.preberiSenzorje(baza_imeTabele,baza_steviloStolpcev,"st", function(err, data){
        
        response.end(""+JSON.stringify(data));
      })
    }else{
      console.log("DB is not working");
      response.end(""+err);
    }
     
  });
});

app.get('/manager/uniciTabelo', function(request, response){
  baza.dropTable(baza_imeTabele, function(err, droppedTable){
    response.end("Drop tabele: "+droppedTable);
  });
});
/*
Aktivacija nodeJS
*/
app.listen(app.get('port'), function() {

  console.log('Node app is running on port', app.get('port'));
});

app.post('/update', function(request, response) {
  //save the time of request handling
  var requestArrivalTime = new Date().getTime();
  //for all request but the last one
  if (stPrispel < stASenz-1){
    //console.log("time took for",stASenz,"requests",testEndTime-request.body.time);
    senzorPing+= requestArrivalTime-request.body.time;
    response.end();
  }
  stPrispel++;
  if(stPrispel == stASenz){
    senzorPing+= requestArrivalTime-request.body.time;
    //console.log("time took for",stASenz,"requests",testEndTime-request.body.time);
    senzorPing /= stASenz;
    stPrispel = 0;
    console.log("ping for numSensors", stASenz,"->",senzorPing,"ms");
  }
  //vstavljanje v bazo
  baza.updateOne(baza_imeTabele,"ID","st",baza_steviloStolpcev,request.body.id,request.body.data,function(vrstica, stolpec,id,data, DBQueryStart){
    //save time when SQL query was processed
    var DBQueryEnd= new Date().getTime();
    casBaze += DBQueryEnd-DBQueryStart;
    var usedRAM = process.memoryUsage().heapUsed;

    //console.log("vrstica:",vrstica ,"stolpec:",stolpec,"Value:",data);
    //console.log("Porabljen RAM",usedRAM,"B,"," OK QueryTime",DBQueryEnd-DBQueryStart,"ms");
    //zapomnimo obdelave prve zahteve
    stSprej++;
    if(stSprej == stASenz) {
      //we recieved all sensor data
      //save time of last request
      casZadnji = new Date().getTime();
      baza.setUpdateTime(casZadnji);
      console.log("Prejel",stSprej,"zahtev");
      casBaze/=stASenz;
      console.log("dbTime took for one request ->",casBaze,"ms");
      //if this is the last resposne send back data
      var jsonResponse = JSON.stringify({ping: senzorPing, dbTime: casBaze, ram: usedRAM});
      //save data to internal DB
      db.serialize(()=>{
        var numResults = sqlDBTime = sqlPing = sqlRam = 0;
        var SQLstmt = "SELECT * FROM results"+sendDelay+" WHERE numSensors="+stASenz;
        db.each(SQLstmt,(err, row)=>{
          if(row != undefined){
            numResults = parseInt(row.numResults);
            sqlPing = parseFloat(row.ping);
            sqlDBTime = parseFloat(row.dbTime);
            sqlRam = parseInt(row.ram);
            sqlPing *= numResults;sqlDBTime *= numResults;sqlRam *= numResults;
            sqlPing += senzorPing; sqlDBTime += casBaze; sqlRam+= usedRAM; numResults++;
            sqlPing /= numResults; 
            sqlDBTime /= numResults;
            sqlRam /= numResults;
            SQLstmt = "UPDATE OR IGNORE results"+sendDelay+" SET ping="+sqlPing+", dbTime="+sqlDBTime+", ram="+sqlRam+", numResults="+numResults+"  WHERE numSensors="+stASenz;
            db.run(SQLstmt);
          }
          senzorPing = 0;
          casBaze = 0;
          stSprej = 0;
          response.end(jsonResponse);
        });
        db.get(SQLstmt,(err, row)=>{
          if(row == undefined){
            SQLstmt = "INSERT OR IGNORE INTO results"+sendDelay+"(numSensors, ping, dbTime, ram, numResults) VALUES ("+stASenz+","+senzorPing+","+casBaze+","+usedRAM+","+1+")";
            db.run(SQLstmt);
            senzorPing = 0;
            timeDiffms = 0;
            stSprej = 0;
            response.end(jsonResponse);
          }
        });
      });

    }
  },(err)=>{
    console.log(err);
  });
  
});
app.post("/manager/createLocalTable", (request, response)=>{
  //Each command inside the serialize() function is guaranteed to finish executing before the next one starts.
  db.serialize(()=>{
    //runs SQL query dosent retrive any data
    db.run("CREATE TABLE if not exists results"+request.body.sendDelay+" (numSensors INTEGER(6) PRIMARY KEY, ping REAL, dbTime REAL, ram INT(4), numResults INT(4))");
    console.log("Result local DB for",request.body.sendDelay,",ms was initialized");
    response.end("Result local DB for "+request.body.sendDelay+" ms was initialized");
  });
});
app.post('/manager/setNumSensors', function(request, response) {
  stASenz = request.body.numSenz
  sendDelay = request.body.sendDelay;
  console.log("Set the number of sensors to: "+stASenz)
  response.end("Set the number of sensors to: "+stASenz);
});
app.get('/manger/testStatus',(request, response)=>{
  
  response.send({statusTest: testSeIzvaja, statusBaza: baza_dela});

});
//variables for testing DB
var sensorIndex = 0;
var currTestRepeat = 0;
var currTest = 0;
var maxTestRange = 0;
var tmpResult = 0;
var tmpRepeatResult = 0;
var testDB = function(request, results, callback){

  for(var k = 0; k < currTest; k++){
    setTimeout(()=>{
      baza.updateOne(baza_imeTabele,"ID","st",baza_steviloStolpcev,Math.floor(Math.random()*k), 0,
      (vrstica, stolpec, id,data, startTime)=>{
        if(sensorIndex == 0)
          tmpResult = 0;
        //initialise results index
        var queryEndTime = new Date().getTime();
        tmpResult += (queryEndTime - startTime);
        //console.log("time for request",queryEndTime - startTime,"ms","currTest",currTest,"testRepeat",currTestRepeat);
        sensorIndex++;
        //finished one reapeat of test
        if(sensorIndex >= currTest){
          sensorIndex = 0;
          //console.log("tmpResult",tmpResult, request.body.numRepeats);
          //console.log("result for one repeat",  tmpResult/currTest);
          currTestRepeat++;
          tmpRepeatResult += tmpResult/currTest;
          //finished all repeats of one test
          if(currTestRepeat >= request.body.numRepeats){
            tmpRepeatResult /= request.body.numRepeats;
            console.log("result for",currTest," sensors:", tmpRepeatResult);
            results.push({data: JSON.stringify({ping: 0, dbTime: tmpRepeatResult, ram: 0}), numSensors: currTest});
            currTest+= parseInt(request.body.testStep);
            tmpRepeatResult = 0;
            currTestRepeat = 0;
          }
          if(currTest <= maxTestRange){
            setTimeout(()=>{testDB(request, results, callback)},100);
          }
          else{
             callback(results);
          }
        }
      });
    }, k*request.body.sendDelay);
  }
  
}
app.post('/test/baza', function(request, response){
  console.log(request.body);
  var results = [];
  var tmpRange  = request.body.testRange.split("-");
  var minTestRange = parseInt(tmpRange[0]);
  maxTestRange = parseInt(tmpRange[1]);
  currTest = minTestRange;
  console.log(minTestRange, maxTestRange);
  console.log("zacelo se je testiranje baze");
  tmpRepeatResult = 0;
  testDB(request, results, (results)=>{
    console.log("end",results);
    response.status(200).send(results)
  });
  
  /*
  for(var i = 0; i < request.body.numTests; i++){
    setTimeout(()=>{
      var numCompletedtests = 0;
      for(var j = 0; j < request.body.numRequests; j++){
        setTimeout(()=>{
          baza.updateOne(baza_imeTabele,"ID","st",baza_steviloStolpcev,Math.floor(Math.random()*request.body.numRequests), 0,
          (vrstica, stolpec, id,data, startTime)=>{
            var endTime = new Date().getTime();
            timeForQuery += (endTime-startTime);
            numCompletedtests++;
            console.log("repeat",numCompletedtests,"ok", vrstica, stolpec, (endTime-startTime),"ms");
            //if its the last test
            if(numCompletedtests >= request.body.numRequests){
              timeForQuery /= request.body.numRequests;
              console.log(timeForQuery,"ms");
              console.log("testiranje se je koncalo", testRepeat);
              result += timeForQuery;
              if(testRepeat >= request.body.numTests){
                console.log("result",result);
                result /= request.body.numTests;
                testSeIzvaja = false;
                console.log("final",result);
              }
              
              testRepeat++;
              numCompletedtests= 0;
            }

          });
        },j*request.body.SendDelay);
      }
      
    },i*1000);
  }*/
  

  //testSeIzvaja = false;
	//console.log(Object.getOwnPropertyNames(request.body) );
	//response.redirect("/");
  
});

var getDataFromResultTable = function(requestSendDelay,min,max,step,callback){
  db.serialize(()=>{
    db.all("SELECT * FROM results"+requestSendDelay+" WHERE(numSensors >= "+min+" AND numSensors <= "+max+") AND (rowid-(SELECT rowid FROM results"+requestSendDelay+" where numSensors >= "+min+" ORDER BY numSensors LIMIT 1))%"+step+" = 0", (err, rows)=>{
      if(err != null){
        console.log(err);
        callback(err, rows);
      }
      console.log(rows);
      callback(err, rows);
     // db.close();
    });
  });
}