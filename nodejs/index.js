
var express = require('express');


var app = express();

//povezava za postgres
var pg = require('pg');
var baza_dela = false;


pg.defaults.ssl = true;

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

function baza_povezi(callback){
  pg.connect(process.env.DATABASE_URL, function(err, client) {
	   
	  console.log('Connected to postgres! Getting schemas...' + err);
    if(!err) baza_dela = true;
    if(callback) callback(err);
  });
}

function baza_ustvari_tabelo(imeTabele, imeKljuca, tipKljuca, predponaStolpcev,tipStolpcev, stStolpcev, callback){
  var SQL_STRING = "CRATE TABLE " + imeTabele + "("+imeKljuca+" "+ tipKljuca +",";
  for(var i = 0; i < stStolpcev-1; i++){
      SQL_STRING = SQL_STRING + " " + predponaStolpcev+i+" " + tipStolpcev + ",";
  }

  SQL_STRING = SQL_STRING + " " + predponaStolpcev+i+" " + tipStolpcev + ");";
  console.log(SQL_STRING);
  if(baza_dela){
    pg.connect(process.env.DATABASE_URL, function(err, client) {
      client.query(SQL_STRING).on('end', callback(err, SQL_STRING))
    });
  };
  

}

app.get('/status', function(request, response) {
  baza_povezi();
  response.end('Status screen\nBaza dostopna: ' + baza_dela);

});

app.get('/manager/postaviBazo', function(request, response) {
  baza_povezi(function(err2){
    baza_ustvari_tabelo("imeTabele", "ID", "int", "st","int", 10, function(err, SQL_STRING){
    console.log();
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