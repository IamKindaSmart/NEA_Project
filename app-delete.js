const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const authRoutes = require('./Routes/auth-delete');
const connection = require('./Models/database');
const app = express();

// Set view engine to EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: 'hIQra3pNkW', // Secret key for session
  resave: false,
  saveUninitialized: true
}));

// External Routes to make connections
app.use("/", authRoutes);


// Public Routes
app.get("/", (req, res) => {
  res.render("form"); // Default route renders the login form
});

app.get("/login", (req, res) => {
  res.render("form", { error: req.query.error }); // Render login form with error message if any
});

// app.post("/login", (req, res) => {
//   const { username, password } = req.body;
//   console.log(username, password)

// });

// Start the Server to view project
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;