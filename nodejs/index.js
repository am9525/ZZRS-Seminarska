var express = require('express');
var os = require("os");
var bodyParser = require('body-parser');

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
console.log("CORS should be working")
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

var baza_dela = baza.dela(function(err, dela){
	
	baza_dela = dela;

});  //Ali je baza dostopna?

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
var casPrispelPrvi = 0;
var casPrispelZadnji = 0;
var casBaze = 0;

app.get('/', function(request, response) {
	response.render('index',{
	  		stAktivnihSenzorjev: stASenz,
	  		testSeIzvaja: testSeIzvaja,
	  		bazaDela : baza_dela
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
  /*console.log("ID: " + request.body.id+"\nData: " + request.body.data);
  var senzorTime = request.body.time;
  var serverTime = new Date().getTime();
  senzorPing += Math.abs(serverTime - senzorTime);
  stPrispel++;
  if(stPrispel == stASenz){
    senzorPing /= stASenz;
    console.log("time took -> "+ senzorPing+ "ms");
    stPrispel = 0;
    senzorPing = 0;
  }*/
  //zahteva za vstavljanje je prispela
  if(stPrispel == 0){
      //zapomnimo si cas prve prejete zahteve
      casPrispelPrvi = new Date().getTime();
      response.end();
  }
  else if (stPrispel < stASenz-1){
    response.end();
  }
  stPrispel++;
  if(stPrispel == stASenz){
    casPrispelZadnji = new Date().getTime();
    senzorPing = casPrispelZadnji - casPrispelPrvi;
    senzorPing /= stASenz;
    stPrispel = 0;
    console.log("aprox ping for one request -> "+senzorPing+"ms");
  }
  //vstavljanje v bazo
  var tic = new Date().getTime();
  baza.updateOne(baza_imeTabele,"ID","st",baza_steviloStolpcev,request.body.id,request.body.data,function(vrstica, stolpec, id,data){
    //var usedRAM = (os.totalmem()-os.freemem());
    var toc = new Date().getTime();
    casBaze += (toc - tic);
    var usedRAM = process.memoryUsage().heapUsed;

    console.log("vrstica: " + vrstica +" stolpec: "+ stolpec + " Value: " + data + " Porabljen RAM" +  usedRAM + " B " +" OK" );

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
      timeDiffms/=stASenz;
      casBaze/=stASenz;
      //console.log("time took -> "+ timeDiffms+ "ms -> "+ timeDiff.getMinutes()+"min, "+timeDiff.getSeconds()+"sec");
      console.log("time took for one request -> "+ timeDiffms+ "ms");
      var jsonResponse = JSON.stringify({ping: senzorPing, DBTime: casBaze, PorabRAM: usedRAM});
      response.end(jsonResponse);
      senzorPing = 0;
      timeDiffms = 0;
      casBaze = 0;
      stSprej = 0;
    }
  },function(err){
    console.log(err);
  });
  //zato da nas clienti ne cakajo na repoonse
  
});
app.post('/manager/setNumSensors', function(request, response) {
  stASenz = request.body.numSenz
  console.log("Set the number of sensors to: "+stASenz)
  response.end("Set the number of sensors to: "+stASenz);

});
app.post('/manager/zacniTestiranje', function(request, response){
	/*
		To se sproži, ko kliknemo gumb na index.ejs strani
		===
		request.body lastnosti:
		'aktSenzorji', 			število koliko senzorjev naj bo aktivnih zatest
 		'izbiraTesta',			tip testa, ki se bo izvajal (še ne naredi nič)
	   	'stZaporedTestov',		kolikokrat se bo test ponovil (še ne naredi nič)	
 		'btZazeniTest'			ime gumba, ki se uporabi za aktivacijo testa
 		'RefreshRate'			v clientu za čas med pošiljanji
 		'SendDelay'				v clientu za čas med posameznim podatkom

	*/
	if(!testSeIzvaja){
		testSeIzvaja=true;
	} 

	console.log(Object.getOwnPropertyNames(request.body) );
	response.redirect("/");
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