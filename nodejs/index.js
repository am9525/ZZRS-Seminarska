var express = require('express');


var app = express();
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 


app.use(express.static(__dirname + '/view/css'));

// views is directory for all template files
app.set('views', __dirname + '/view/ejs');
app.set('view engine', 'ejs');



app.set('port', (process.env.PORT || 5000));
 /*
    
 */
//app.use(express.static(__dirname + '/public'));

//Spremenljivke za naso bazo.
//Ob koncanem testiranju bodo bolj urejene
var baza = require('./baza');

var baza_dela = false;  //Ali je baza dostopna?

var baza_steviloStolpcev = 1000;  //stevilo podatkovnih stolpcev v tabeli, brez stolpca za kljuc
                                  //v resnici je steviloStolpcev + 1 stolpcev

var baza_imeTabele = "Test";   //Ime tabele
var testSeIzvaja = false; //boolean, ki pove ali se izvaja test

//parametri za sentorje
var stASenz = 5;     //število aktivnih senzorjev
var stSprej = 0;      //število prejetih stanj senzorjev
var stPrispel = 0;
var casZadnji = 0     //čas zadnjega obdelanega
var casPrvi = 0;      //cas prvega obdelanega paketa
var timeDiffms = 0; //time difference between first and last request
var senzorPing = 0;


app.get('/', function(request, response) {
  	response.render('index',{
  		stAktivnihSenzorjev: stASenz,
  		testSeIzvaja: testSeIzvaja,
	});
});
app.post('/time', function(request, response) {
  var time = new Date();
  var jsonResponse = JSON.stringify({serverTime: time});
  response.end(jsonResponse);
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
  console.log("ID: " + request.body.id+"\nData: " + request.body.data);
  var senzorTime = request.body.time;
  var serverTime = new Date().getTime();
  senzorPing += Math.abs(serverTime - senzorTime);
  stPrispel++;
  if(stPrispel == stASenz){
    senzorPing /= stASenz;
    console.log("time took -> "+ senzorPing+ "ms");
    stPrispel = 0;
    senzorPing = 0;
  }
  
  //vstavljanje v bazo
  baza.updateOne(baza_imeTabele,"ID","st",baza_steviloStolpcev,request.body.id,request.body.data,function(vrstica, stolpec, id,data){
    console.log("vrstica: " + vrstica +" stolpec: "+ stolpec + " Value: " + data + " OK" );
  
    //zapomnimo obdelave prve zahteve
    if(stSprej === 0){
      casPrvi = new Date().getTime();
    }
    stSprej++;
    if(stSprej == stASenz) {
      //aplikacija je prejela podatke za vse senzorje
      //shrani se čas zadnjega obdelanega
      casZadnji = new Date().getTime();
      baza.setUpdateTime(casZadnji);
      console.log("Prejel " + stSprej + " zahtev" );
      timeDiffms = casZadnji-casPrvi;
      var timeDiff = new Date(timeDiffms);
      
      console.log("time took -> "+ timeDiffms+ "ms -> "+ timeDiff.getMinutes()+"min, "+timeDiff.getSeconds()+"sec");
      stSprej = 0;
    }
  },function(err){
    console.log(err);
  });
  //zato da nas clienti ne cakajo na repoonse
  response.end();
});
app.post('/manager/setNumSensors', function(request, response) {
  stASenz = request.body.numSenz
  console.log("Set the number of sensors to: "+stASenz)
  response.end("Set the number of sensors to: "+stASenz);

});
app.post('/manager/zacniTestiranje', function(request, response){
	/*
		To se sproži, ko kliknemo gumb na index.ejs strani
	*/

});




/*	Uporabiti bo lažje express, se mi zdi 

const http = require('http')  
const port = process.env.PORT || 3000;

const requestHandler = (request, response) => {  
  console.log(request.url)
  response.end('Hello Node.js FFFServer!')
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {  
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
*/