const express = require('express');
const app = express();
const path = require("path")


app.set("view engine", "ejs")
app.get('/', (req,res) => {

    res.render("Trial_Login.ejs")
});






app.listen(3000)