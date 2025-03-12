const mysql = require("mysql2"); //Import mysql module

// create a class to connect to database
class Database {
    query(queryString, callback) {
        this.connection.query(queryString, callback);
    }

    constructor() {
        this.connection = mysql.createConnection({
            host: "127.0.0.1",
            user: "root",
            password: "",
            database: "testdb"
        });

        this.connection.connect((error) => {
            if (error) {
                console.log("Failed to connect to database:", error);
                return;
            }
            console.log("Connected to database");
        });
    }

    // Check username and password of user when logging in from the db
    checkCredentials(username, password, callback) {
        const query = "SELECT * FROM users WHERE Username = ? AND Password = ?";
        this.connection.query(query, [username, password], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results);
            }
        });
    }

    getMenuItem(callback) {
        const query = 'SELECT id, item_name, price, ingredients, allergy_info, description, category FROM menu'; //query to get the necessary columns for the menu
        this.connection.query(query, (error, results) => {
            if (error) {
                console.error("Database query error:", error);
                return callback(error, null);
            }
            return callback(null, results);
        });
    }
}

module.exports = new Database();