/*

Tu notri bom zbasal vso kodo za dostop do postgres baze
in njen management

-Anže

*/


//povezava za postgres
var database = require('pg');
database.defaults.ssl = true;

//hrani key : value vrednost, key = imeTabele, value = true/false, ali tabela obstaja ali ne
//ce tabela ze obstaja jo funkcija ustvariTabelo ne gre postavljat
var tabele={};
 
//hranimo stevilo prebranih in posodobljenih senzorjev
var senzorji={};
 senzorji["lastUpdate"] = -1;
 senzorji["lastRead"] = -1;
/*
	Definicije funkcij za export v druge skripte.
	Urejene so po abecednem vrstnem redu
*/
module.exports = {

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
		Administratorska funkcija za drop tabele
	*/
 	dropTable: function(imeTabele, callback){		 
		database.connect(process.env.DATABASE_URL, function(err, client) {
			if(!err){
				client.query("DROP TABLE " + imeTabele)
					.on('end', () => {
						delete tabele[imeTabele];
						callback(false,imeTabele);
					})
					.on('error',(err2) => {callback(err2 , imeTabele);});
			}else{
				callback(err2, imeTabele);
			}
	         
		});
	},
	/*
		Ta funkcija zgenerira vrstice in jih vstavi v tabelo. 
	*/
	generateRows: function(imeTabele, steviloVrstic, imeKljuca, predponaStolpcev, stStolpcev, callback){
		//SQL stavek za kasnejso uporabo
		var SQL_STRING = "";

		//generairanej vrstic 
		//SQL ukaz oblike INSERT INTO imeTabele (imeKljuca) VALUES(0);INSERT INTO imeTabele (imeKljuca) VALUES(1);...
		SQL_STRING_FRONT = "INSERT INTO " + imeTabele+ " ("+imeKljuca+ ") VALUES (";
		//Generacija INSERT vrstic
		for(var row = 0; row < steviloVrstic; row++){
			SQL_STRING = SQL_STRING + SQL_STRING_FRONT + row +  "); " ;
		}
		//generiramo vrednost stolpcev 
		//SQL ukaz je oblike UPDATE imeTabele SET predponaStolpcev = 0
		var stolpci = "";
		for(var i = 0; i < stStolpcev-1; i++){
			stolpci=stolpci.concat(" " + predponaStolpcev+i+" = 0,");
		}
		 stolpci= stolpci.concat(" " + predponaStolpcev+i +"= 0");

		//Aktivacija ukaza SQL
		database.connect(process.env.DATABASE_URL, function(err, client) {
 			//Izvedemo INSERT SQL ukaz ki smo ga prej generirali
			 client.query(SQL_STRING).on('end', () => {
				console.log("Done! Created "+steviloVrstic+" rows from ID:0 to ID:",steviloVrstic); 
				setTimeout(function(){
					//Izvedemo UDPATE SQL ukaz 1000x(se mi zdi), ki smo ga prej generirali
			 		SQL_UPDATE = "UPDATE "+imeTabele+" SET " + stolpci; 
			 		database.connect(process.env.DATABASE_URL, function(err, client) {
						client.query(SQL_UPDATE)
						.on('end', () => {
							console.log("Done! Filled all entries with value 0"); 
						});
			 		});
			 	}, 1000);
 			});
 		});
	 	
		if(callback)callback();
		/*
				TODO: Polepšaj kodo in dodaj komentarje
		*/
	},
	/*WIP
		prebere podatke iz baze
	*/
	preberiSenzorje: function(imeTabele,stStolpcev, predponaStolpcev,callback){
		database.connect(process.env.DATABASE_URL, function(err, client) {
			  if (err) {callback(err )}
			  else{
				var raben = 0;
				if((senzorji["lastUpdate"] > senzorji["lastRead"]) || senzorji["lastRead"] < 0 ){
					console.log("reading senzor data ...");
					client
					.query('SELECT * FROM ' + imeTabele)
					.on('row', function(row) { // za izvede za vsako vrstico ki nam vrne SELECT
						if(raben == 0){
							//console.log(Object.getOwnPropertyNames(row).sort())
							raben++;
						}
						// ID = 0 imamo senozrje od 0 -999 ID =1 od 1000-1999 zato rabim dodatek
						var dodatek = (row.id) *1000; 
						for(var st = 0; st < stStolpcev; st++){
							senzorji[(st)+dodatek] = row[predponaStolpcev+st];
						}
					})
					.on('end', () => {
						senzorji["lastRead"] =  new Date().getTime();
						if( senzorji["lastUpdate"] < 0){
							 senzorji["lastUpdate"] = senzorji["lastRead"] ;
						}
						callback(false, senzorji);
					});
				}else {
					console.log("data already present");
					callback(false, senzorji)
				}
			}	
		});
	},

	seznamTabel: function() {
		console.log("[f:seznamTabel]: " + JSON.stringify(tabele));
		return tabele;
	},
	/*
		nadgradi en zapis v podatkovni bazi
	*/
	updateOne:function(imeTabele,imeKljuca,predponaStolpcev,stStolpcev,senzorId,data,okCallback,errorCallback){
		var vrsticaId = Math.floor(senzorId/stStolpcev);
		var stolpecId = senzorId%stStolpcev;
		
		var SQLSTAVEK = "UPDATE " + imeTabele + " SET " + predponaStolpcev+stolpecId+"="+data+" WHERE " + imeKljuca+" = "+vrsticaId+";";
		console.log("Updating sensor with ID = "+senzorId+" value")
		database.connect(process.env.DATABASE_URL, function(err, client) {
			if(!err){
				client.query(SQLSTAVEK)
					.on('end', () => {okCallback(vrsticaId, stolpecId, senzorId,data);})
					.on('error',(err2) => {console.log("updateOne error");errorCallback(err2);});


			}else{
				console.log("updateOne error2");
				errorCallback(err);
			}
	         
		});
	},
	/*
		Ta funkcija ustvari tabelo, če tabela z istim imenom še ne obstaja obstaja
	*/
	ustvariTabelo: function (imeTabele, imeKljuca, tipKljuca, predponaStolpcev,tipStolpcev, stStolpcev, callback) {
	    //zgeneriramo SQL stavek ki ustvari tabelo z 1000 + 1 stolpci, ker je 1 stolpec id
		var SQL_STRING = "CREATE TABLE IF NOT EXISTS " + imeTabele +"("+imeKljuca+" "+ tipKljuca +",";
		for(var i = 0; i < stStolpcev-1; i++){
		  SQL_STRING = SQL_STRING + " " + predponaStolpcev+i+" " + tipStolpcev + ",";
		}
		SQL_STRING = SQL_STRING + " " + predponaStolpcev+i+" " + tipStolpcev + ");";

		if(baza_dela){
			database.connect(process.env.DATABASE_URL, function(err, client) {
					  client.query(SQL_STRING)
					  .on('end', () => {
						  tabele[imeTabele] = true; 
						  callback( SQL_STRING, tabele)
						})
			});
				
		};
	},
	/*
		Pridobi vrstico in stolpec iz id-ja
	*/
	vrsticaStolpec: function(id, stStolpcev){ 
		var VrSt = {};
		VrSt.stolpec = id%stStolpcev
		VrSt.vrstica = Math.floor(id/stStolpcev);
		return VrSt
	}
                           
}


/*Kkao se konektat:


database.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Connected to postgres! Getting schemas...');

  client
    .query('SELECT table_schema,table_name FROM information_schema.tables;')
    .on('row', function(row) {
      console.log(JSON.stringify(row));
    });
});
*/