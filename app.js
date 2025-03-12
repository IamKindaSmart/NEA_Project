const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const fs = require('fs');
const authRoutes = require('./Routes/auth');
const menuRoutes = require('./Routes/menu');
const menuUpdateRoutes = require('./Routes/menu_update');
const orderRoutes = require('./Routes/orders');
const { connection } = require('./Models/database');
const app = express();

// Set view engine to EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'Public')));

app.use(session({
  secret: 'hIQra3pNkW', // Secret key for session
  resave: false,
  saveUninitialized: true
}));

// External Routes to make connections
app.use("/", authRoutes);
app.use("/", menuRoutes);
app.use("/", menuUpdateRoutes);
app.use("/", orderRoutes);

// Public Routes
app.get("/", (req, res) => {
  res.render("form"); // Default route renders the login form
});

app.get("/login", (req, res) => {
  res.render("form", { error: req.query.error });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
});

app.get("/profile", (req, res) => {
  const username = req.session.username;
  const name = req.session.name;
  const age = req.session.age;
  const phone_number = req.session.phone_number;
  const email_address = req.session.email_address;
  const roleName = req.session.roleName;
  const money = req.session.money;
  if (username && roleName) {
    res.render("profile", { username, name, age, phone_number, email_address, roleName, money });
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.redirect("/form"); // Redirect to the login webpage
  });
});

app.get('/staff_dashboard', (req, res) => {
  res.render('staff_dashboard');
});

// Start the Server to view project
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;