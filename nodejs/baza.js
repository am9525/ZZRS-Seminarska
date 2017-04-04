/*

Tu notri bom na koncu zbasal vso kodo za dostop do postgres baze
in njen management

-Anže

*/


//povezava za postgres
var database = require('pg');
database.defaults.ssl = true;



module.exports = {
	ustvariTabelo: function (imeTabele, imeKljuca, tipKljuca, predponaStolpcev,tipStolpcev, stStolpcev, callback) {
	    // whatever
		var SQL_STRING = "CREATE TABLE " + imeTabele + "("+imeKljuca+" "+ tipKljuca +",";
		for(var i = 0; i < stStolpcev-1; i++){
		  SQL_STRING = SQL_STRING + " " + predponaStolpcev+i+" " + tipStolpcev + ",";
		}

		SQL_STRING = SQL_STRING + " " + predponaStolpcev+i+" " + tipStolpcev + ");";

			if(baza_dela){
			database.connect(process.env.DATABASE_URL, function(err, client) {
			  client.query(SQL_STRING).on('end', () => {callback(err, SQL_STRING)});
			});

		};
	},

	dela: function(callback){
		database.connect(process.env.DATABASE_URL, function(err, client) {
	        if(!err && process.env.DATABASE_URL) baza_dela = true;
	        else baza_dela = false;

		    if(callback) callback(err, baza_dela);
		});

	}



}

 