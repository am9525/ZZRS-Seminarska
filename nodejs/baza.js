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
//hrani se, katere tabele že imajo vse vrstice
var rows={}; 
//hranimo stevilo prebranih in posodobljenih senzorjev
var senzorji={};
 senzorji["lastUpdate"] = -1;
 senzorji["lastRead"] = -1;

//Hramba za clienta, ki v postgres kliče UPDATE
var HerokuClient = new database.Client(process.env.DATABASE_URL);
HerokuClient.connect();
//Tale client naj bi bil za metodo prberiSenzorje; ampak iz nekega razloga vedno naredi novo povezavo.
//mogoče produkt SQL ukaza SELECT ??
var HerokuSelectClient = new database.Client(process.env.DATABASE_URL);
HerokuSelectClient.connect();
//

var databaseOK = false;
var lastDBCheck = 0;
/*
	Definicije funkcij za export v druge skripte.
	Urejene so po abecednem vrstnem redu
*/
module.exports = {

	/*
		Na hitro se preveri če podatkovna baza obstaja
	*/
	dela: function(callback){
	 	if(lastDBCheck === 0 || (new Date().getTime() - lastDBCheck) > 60000 ){
	 		database.connect(process.env.DATABASE_URL, function(err, client) {
				//console.log("from dela");
		        var rows = 0;
		        client.query("select table_name from information_schema.tables where table_schema= 'public';")
		        .on('row',()=> {rows++})
		        .on('end', ()=> {

		        	if(rows > 0){
		        		databaseOK = true;
		        	} else {
		        		databaseOK = false;
		        	}
		        	if(callback)callback(err, databaseOK );
		        })
		        .on('error',(err2)=>{
		        	databaseOK = false;
		        	if(callback)callback(err2, databaseOK );
		        });


		        lastDBCheck = new Date().getTime();
			    if(callback) callback(err, databaseOK);
			});

	 	}else {
	 		
	 		return databaseOK;
	 	}
		
	},
	delaOld: function(callback){
		database.connect(process.env.DATABASE_URL, function(err, client) {
			//console.log("from dela");
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
						client.end();
						delete tabele[imeTabele];
						delete rows[imeTabele];
						callback(false,imeTabele);
					})
					.on('error',(err2) => {client.end(); callback(err2 , imeTabele);});
			}else{
				callback(err2, imeTabele);
			}
	         
		});
	},
	/*
		Ta funkcija zgenerira vrstice in jih vstavi v tabelo. 
	*/
	generateRows: function(imeTabele, steviloVrstic, imeKljuca, predponaStolpcev, stStolpcev, callback){
		 
		if(rows[imeTabele] != true ){
			rows[imeTabele] = false;
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
			//SQL ukaz je oblike UPDATE imeTabele SET predponaStolpcev<indexStolpca> = 0
			//To je zato, da se skozi vse vrstice postavi vrednost stolpca na 0

			var stolpci = "";
			for(var i = 0; i < stStolpcev-1; i++){
				stolpci=stolpci.concat(" " + predponaStolpcev+i+" = 0,");
			}
			 stolpci= stolpci.concat(" " + predponaStolpcev+i +"= 0");

			//Aktivacija ukaza SQL
			database.connect(process.env.DATABASE_URL, function(err, client) {
	 			//Izvedemo INSERT SQL ukaz ki smo ga prej generirali
				 client.query(SQL_STRING).on('end', () => {
				 	client.end();
					console.log("Done! Created "+steviloVrstic+" rows from ID:0 to ID:",steviloVrstic); 
					setTimeout(function(){
						//Izvedemo UDPATE SQL ukaz za 1000 stolpcev naenkrat, ki smo ga prej generirali
				 		SQL_UPDATE = "UPDATE "+imeTabele+" SET " + stolpci; 
				 		database.connect(process.env.DATABASE_URL, function(err, client) {
							client.query(SQL_UPDATE)
							.on('end', () => {
								client.end();
								console.log("Done! Filled all entries with value 0"); 
								rows[imeTabele] = true;
								callback(false);
							}) 
							.on('error', (err2)=>{callback(err2)});
				 		});
				 	}, 1000);
	 			}).on('error', (err33) => {callback(err33)});
	 		});
		 	
 		
	}else{
		console.log
		callback("Vrstice so ze prisotne");
	}
 
	},
	/*WIP
		prebere podatke iz baze. Samo za Debugging!!!
	*/
	preberiSenzorje: function(imeTabele,stStolpcev, predponaStolpcev,callback){
		if((senzorji["lastUpdate"] > senzorji["lastRead"]) || senzorji["lastRead"] < 0 ){
		 	/*
		 		HerokuSelectClient je že instanciiran, tukaj izvedemo samo SQL ukaz
		 	*/
			var query = HerokuSelectClient.query('SELECT * FROM ' + imeTabele);
			query
				.on('row', (row) => {
					/*
						Za vsako vrstico izračunamo za vsak stolpec index senzorja (v 1 dimenziji)
						in prebrano vrednost shranimo v 1D slovar senzorji
					*/
					var dodatek = (row.id) *stStolpcev; 
					for(var st = 0; st < stStolpcev; st++){
						senzorji[(st)+dodatek] = row[predponaStolpcev+st];
					}

				})
				.on('end', () => {
					 //HerokuSelectClient.end();
					 /*
					 	Ko je konec izvajanja SQL ukaza,
					 	se v senzorji["lastRead"] shrai čas konca branja 
						
					 */
					senzorji["lastRead"] =  new Date().getTime();
					if( senzorji["lastUpdate"] < 0){
						/*
							v primeru, da senzorji["lastUpdate"] še ni bil posodobljen od zagona aplikacije,
							se mu nastavi isti čas.
						*/
						 senzorji["lastUpdate"] = senzorji["lastRead"] ;
					}
					callback(false, senzorji);
				})
				.on('error',(err2) => {
					 // HerokuSelectClient.end();
					 /*
					 	V primeru SQL napake se podatke o napaki (err2) pošlje v callback
					 */
					 callback(err2,senzorji);
				});

		}else{
			/*
				Če po zadnjem branju ni bilo pisanja v bazo,
				se SQL stavek ne bo izvedel, podal pa se bo
				stari slovar senzorji 
			*/
			console.log("data already present");
			callback(false, senzorji);
		}
	},
	/*
		nastavi senzorji["lastUpdate"] na čas, ki je shranjen v argumentu time
	*/
	setUpdateTime: function(time){
		senzorji["lastUpdate"] = time;
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
		 
		var query = HerokuClient.query(SQLSTAVEK);
		query.on('end', () => { okCallback(vrsticaId, stolpecId, senzorId,data);})
			 .on('error',(err2) => { console.log("updateOne error");errorCallback(err2);});
	},
	/*
		Ta funkcija ustvari tabelo, če tabela z istim imenom še ne obstaja obstaja
	*/
	ustvariTabelo: function (imeTabele, imeKljuca, tipKljuca, predponaStolpcev,tipStolpcev, stStolpcev, callback) {
	    //zgeneriramo SQL stavek ki ustvari tabelo z 1000 + 1 stolpci, ker je 1 stolpec id
		var SQL_STRING = "CREATE TABLE IF NOT EXISTS " + imeTabele +"("+imeKljuca+" "+ tipKljuca +" PRIMARY KEY,";
		for(var i = 0; i < stStolpcev-1; i++){
		  SQL_STRING = SQL_STRING + " " + predponaStolpcev+i+" " + tipStolpcev + ",";
		}
		SQL_STRING = SQL_STRING + " " + predponaStolpcev+i+" " + tipStolpcev + ");";
		console.log("Ali obstaja: tabele[ "+ imeTabele + " ] : "+ tabele[imeTabele] );
		if(baza_dela ){
			database.connect(process.env.DATABASE_URL, function(err, client) {
					  client.query(SQL_STRING)
					  .on('end', () => {
					  	  client.end();
						  tabele[imeTabele] = {};
					   	  tabele[imeTabele].hasRows = false;
						  callback(false, SQL_STRING, tabele)
						})
					  .on('error', (err2) => {client.end(); callback(err, SQL_STRING, tabele)});
			});
				
		}else{
			callback(true, SQL_STRING,tabele);
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
 