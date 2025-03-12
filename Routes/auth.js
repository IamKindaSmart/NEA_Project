const express = require("express");
const router = express.Router();
const db = require("../Models/database");

// Handle login form submission
router.post("/login", (req, res, next) => {
    console.log("Login form submitted");
    const { username, password } = req.body;

    const query = `
        SELECT users.username, users.name, users.age, users.phone_number, users.email_address, users.RoleID, roles.RoleName AS role_name
        FROM users
        JOIN roles ON users.RoleID = roles.RoleID
        WHERE users.username = ? AND users.password = ?
    `;
    console.log(query);
    db.connection.query(query, [username, password], (error, results) => {
        console.log(res.status);
        if (error) {
            console.error('Error executing query:', error);
            return next(Error);
            // return res.status(500).send("Internal Server Error");
        }

        console.log(results);
        if (results.length > 0) {
            console.log(username,password);
            req.session.username = results[0].username; // Store username in session
            req.session.name = results[0].name; // Store name in session
            req.session.age = results[0].age; // Store age in session
            req.session.phone_number = results[0].phone_number; // Store phone number in session
            req.session.email_address = results[0].email_address; // Store email address in session
            req.session.roleID = results[0].RoleID; // Store roleID in session
            req.session.roleName = results[0].role_name; // Store roleName in session
            const roleID = results[0].RoleID;
            //Connect corresponding to roleID
            switch (roleID) {
                case 1:
                    res.render('student_dashboard', { user: results[0] }); 
                    break;
                case 2:
                    res.render('staff_dashboard', { user: results[0] });
                    break;
                case 3:
                    res.render("admin_dashboard", { user: results[0] });
                    break;
                case 4:
                    res.render("ultimate_dashboard", { user: results[0] });
                    break;
                default:
                    res.redirect('/login');
            }
        } else {
            res.render('form', { errorMessage: 'Invalid username or password' });
        }
    });
});

router.get('/student_dashboard', (req, res) => {
    res.render('student_dashboard');
    username: req.session.username;
});

// Route to handle logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.redirect('/login'); // Redirect to the login page after logout
    });
});

module.exports = router;