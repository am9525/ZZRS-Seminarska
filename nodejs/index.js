
var express = require('express');


var app = express();
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.set('port', (process.env.PORT || 5000));

//app.use(express.static(__dirname + '/public'));

//Spremenljivke za naso bazo.
//Ob koncanem testiranju bodo bolj urejene
var baza = require('./baza');

var baza_dela = false;  //Ali je baza dostopna?

var baza_steviloStolpcev = 1000;  //stevilo podatkovnih stolpcev v tabeli, brez stolpca za kljuc
                                  //v resnici je steviloStolpcev + 1 stolpcev

var baza_imeTabele = "Test";   //Ime tabele



app.get('/', function(request, response) {
  response.end('Hello Node.js FFFServer!');

});


/*
primer funkcije za prikaz statusa
*/
app.get('/status', function(request, response) {
  baza.dela(function(err, dela){
    baza_dela = dela;
    RESPONSE='Status screen\nBaza dostopna: ' + baza_dela+ "\nDataUrl: " + process.env.DATABASE_URL;
    if(dela) RESPONSE = RESPONSE + "\nSeznam tabel:\n"+ Object.keys(baza.seznamTabel());
    response.end(RESPONSE);

  });
});

/*
primer funkcije za postavitev baze in
Dostopno je na: /manager/postaviBazo
*/
app.get('/manager/postaviBazo', function(request, response) {
  baza.dela(function(err, dela){
    try{
        baza.ustvariTabelo(baza_imeTabele, "ID", "int", "st","int", baza_steviloStolpcev, function(  SQL_STRING){
          baza.generateRows(baza_imeTabele, 1000, "ID", "st", baza_steviloStolpcev, function(){
          response.end("Postavitev baze z ukazom:\n"+SQL_STRING);

        });
      });
    }catch(err){
      console.log(err);
    }
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
  baza.updateOne(baza_imeTabele,"ID","st",baza_steviloStolpcev,request.body.id,request.body.data,function(){},function(err){});
  //response.end();

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