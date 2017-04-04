
var express = require('express');


var app = express();

//povezava za postgres
var pg = require('pg');
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

function baza_povezi(){
  pg.connect(process.env.DATABASE_URL, function(err, client) {
	   
	  console.log('Connected to postgres! Getting schemas...' + err);
  });
}


app.get('/status', function(request, response) {
  baza_povezi();
  response.end('Status screen');

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