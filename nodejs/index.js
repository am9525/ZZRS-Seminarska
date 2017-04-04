
var express = require('express');


var app = express();

//Spremenljivke za naso bazo.
//Ob koncanem testiranju bodo bolj urejene
var baza = require('./baza');

var baza_dela = false;  //Ali je baza dostopna?

var baza_steviloStolpcev = 1000;  //stevilo podatkovnih stolpcev v tabeli, brez stolpca za kljuc
                                  //v resnici je steviloStolpcev + 1 stolpcev

var baza_imeTabele = "Test";   //Ime tabele

/*Kkao se konektat:


pg.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Connected to postgres! Getting schemas...');

  client
    .query('SELECT table_schema,table_name FROM information_schema.tables;')
    .on('row', function(row) {
      console.log(JSON.stringify(row));
    });
});
*/

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.end('Hello Node.js FFFServer!');

});




app.get('/status', function(request, response) {
  baza.dela(function(err, dela){
    baza_dela = dela;
    response.end('Status screen\nBaza dostopna: ' + baza_dela+ "\nDataUrl: " + process.env.DATABASE_URL);

  });
  

});

app.get('/manager/postaviBazo', function(request, response) {
  baza_povezi(pg,function(err2){
    baza.ustvariTabelo(pg,baza_imeTabele, "ID", "int", "st","int", baza_steviloStolpcev, function(err, SQL_STRING){
      if(err) {
        console.log(err);
        response.end("ERROR:\n"+err);

      }else{
        response.end("Postavitev baze z ukazom:\n"+SQL_STRING);
      }
    });
  });
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
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