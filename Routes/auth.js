const express = require("express");
const router = express.Router();
const db = require("../Models/database");

// Handle login form submission
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = `
    SELECT users.StuID, users.username, users.name, users.age, users.phone_number, users.email_address, users.RoleID, roles.RoleName AS role_name
    FROM users
    JOIN roles ON users.RoleID = roles.RoleID
    WHERE users.username = ? AND users.password = ?
  `;

  db.connection.query(query, [username, password], (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }

    if (results.length > 0) {
      // User authenticated successfully
      const user = results[0];
      req.session.StuID = user.StuID; // Store StuID in session
      req.session.username = user.username; // Store username in session
      req.session.name = user.name; // Store name in session
      req.session.age = user.age; // Store age in session
      req.session.phone_number = user.phone_number; // Store phone number in session
      req.session.email_address = user.email_address; // Store email address in session
      req.session.roleID = user.RoleID; // Store roleID in session
      req.session.roleName = user.role_name; // Store roleName in session

      

      // Log the RoleID for debugging
      console.log("User RoleID:", user.RoleID);
      const roleID = results[0].RoleID;
      console.log("RoleID:", roleID); // Log the RoleID for debugging

      // Redirect based on RoleID
switch (roleID) {
  case 1: // Student
    return res.redirect("/student_dashboard");

  case 2: // Staff
    return res.redirect("/staff_dashboard");

  case 3: // Admin
    return res.redirect("/admin_dashboard");

  default:
    return res.status(500).render("form", { error: "An internal error occurred. Please try again." });
      }
    } else {
      // Invalid username or password
      res.status(401).send("Invalid username or password");
    }
  });
});

// Route to handle logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.redirect("/login"); // Redirect to the login page after logout
  });
});

// Route to render the profile page
router.get("/profile", (req, res) => {
  if (!req.session || !req.session.username) {
    return res.redirect("/login"); // Redirect to login if not authenticated
  }

  const { username, name, age, phone_number, email_address, roleID, roleName } = req.session;

  res.render("profile", {
    username,
    name,
    age,
    phone_number,
    email_address,
    roleID,
    roleName,
  });
});

module.exports = router;