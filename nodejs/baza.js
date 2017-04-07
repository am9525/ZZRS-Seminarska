/*

Tu notri bom zbasal vso kodo za dostop do postgres baze
in njen management

-Anže

*/


//povezava za postgres
var database = require('pg');
database.defaults.ssl = true;

tabele={};
 

/*
	deinicija funkcij za export v druge skripte
*/
module.exports = {
	/*
		Ta funkcija ustvari tabelo, če tabela z istim imenom še ne obstaja obstaja
	*/
	ustvariTabelo: function (imeTabele, imeKljuca, tipKljuca, predponaStolpcev,tipStolpcev, stStolpcev, callback) {
	    // whatever
		var SQL_STRING = "CREATE TABLE IF NOT EXISTS " + imeTabele +"("+imeKljuca+" "+ tipKljuca +",";
		for(var i = 0; i < stStolpcev-1; i++){
		  SQL_STRING = SQL_STRING + " " + predponaStolpcev+i+" " + tipStolpcev + ",";
		}

		SQL_STRING = SQL_STRING + " " + predponaStolpcev+i+" " + tipStolpcev + ");";

		if(baza_dela){
			database.connect(process.env.DATABASE_URL, function(err, client) {
					  client.query(SQL_STRING)
					  .on('end', () => {tabele[imeTabele] = true; callback( SQL_STRING, tabele)})
					   
			});
				
		};
	},
	/*
		Na hitro se preveri če podatkovna baza obstaja
	*/
	dela: function(callback){
		database.connect(process.env.DATABASE_URL, function(err, client) {
	        if(!err && process.env.DATABASE_URL) baza_dela = true;
	        else baza_dela = false;

		    if(callback) callback(err, baza_dela);
		});

	},


	/*
		Ta funkcija zgenerira vrstice v tabelo. 
	*/
	generateRows: function(imeTabele, steviloVrstic, imeKljuca, predponaStolpcev, stStolpcev, callback){
		//generira 
		var SQL_STRING = "";

		//generacija stolpcev za klicanje
		var stolpci = "";
		var values = "";
		for(var i = 0; i < stStolpcev-1; i++){
			stolpci=stolpci.concat(" " + predponaStolpcev+i+" = 0,");
		}
		 stolpci= stolpci.concat(" " + predponaStolpcev+i +"= 0");
		 values= values.concat(" 0");
		SQL_STRING_FRONT = "INSERT INTO " + imeTabele+ " ("+imeKljuca+ ") VALUES (";
		//Generacija INSERT vrstic
		for(var row = 0; row < steviloVrstic; row++){
			SQL_STRING = SQL_STRING + SQL_STRING_FRONT + row +  "); " ;
		}
		//Aktivacija ukaza SQL
		database.connect(process.env.DATABASE_URL, function(err, client) {
 			client.query(SQL_STRING).on('end', () => {
				console.log("Done! INSERT"); 
				setTimeout(function(){
			 		SQL_UPDATE = "UPDATE "+imeTabele+" SET " + stolpci; 
			 		database.connect(process.env.DATABASE_URL, function(err, client) {
						client.query(SQL_UPDATE)
						.on('end', () => {
							console.log("Done! UPDATE"); 
						});
			 		});
			 	}, 1000); 
			});
 		});
	 	
		if(callback)	callback();
		/*
				TODO: Polepšaj kodo in dodaj komentarje
		*/

	},
	/*
		nadgradi en zapis v podatkovni bazi
	*/
	updateOne:function(imeTabele,imeKljuca,predponaStolpcev,stStolpcev,id,data,okCallback,errorCallback){
		var vrstica = Math.floor(id/stStolpcev);
		var stolpec = id%stStolpcev;
		var SQLSTAVEK = "UPDATE " + imeTabele + " SET " + predponaStolpcev+stolpec+" WHERE " + imeKljuca+" = "+vrstica;

		database.connect(process.env.DATABASE_URL, function(err, client) {
			if(!err){
				client.query(SQLSTAVEK)
					.on('end', () => {okCallback();})
					.on('error', () => {errorCallback(err);});


			}else{
				errorCallback(err);
			}
	         
		});


	},
	/*WIP
		Administratorska funkcija za drop tabele
	*/
 	dropTable: function(imeTabele){
		/*
				TODO: Naredi drop tabele
		*/
	},
	seznamTabel: function() {
		console.log("[f:seznamTabel]: " + JSON.stringify(tabele));
		return tabele;
	}                            
}


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