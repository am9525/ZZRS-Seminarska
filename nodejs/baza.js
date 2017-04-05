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


	/*WIP
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
		    values=values.concat(" 0,");

		}
		 stolpci= stolpci.concat(" " + predponaStolpcev+i +"= 0");
		 values= values.concat(" 0");
		  //console.log(stolpci);
		 //console.log(values);
 
		for(var row = 0; row < steviloVrstic; row++){
 
			SQL_STRING = SQL_STRING +("INSERT INTO " + imeTabele+ " ("+imeKljuca+ ") VALUES ("+ row +  "); ");
 
		}
		

		database.connect(process.env.DATABASE_URL, function(err, client) {
			 var copy2 = SQL_STRING;
			 console.log("copy2: "+ copy2+"\n\n")
			client.query(copy2)
			.on('end', () => {
				console.log("Done!"); 

				setTimeout(function(){
			 		SQL_UPDATE = "UPDATE "+imeTabele+" SET " + stolpci;
			 		console.log("\n\n\n"+SQL_UPDATE);
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
				TODO: generacija vrstic z INSERT
		*/

	},
	/*
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

 
function w(){
	for(var r = 0; r < steviloVrstic; r++){
		okej = okej && ok[r];
	};
	console.log("okej: " +okej)
	return okej
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