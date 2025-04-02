const express = require('express');
const router = express.Router();
const db = require('../Models/database'); // Ensure correct path
const multer = require('multer');
const path = require('path');

// Multer setup (Optional file uploads)
const storage = multer.diskStorage({
    destination: path.join(__dirname, './public/uploads'), // Ensure this directory exists
    filename: (req, file, cb) => {
        const itemName = req.body.name;
        const fileExtension = path.extname(file.originalname);
        cb(null, itemName+fileExtension); // Save file with item name as filename
    }
});
const upload = multer({ storage });

// Route to render update menu page
router.get('/menu_update', (req, res) => {
    const sort = req.query.sort === 'desc' ? 'desc' : 'asc';
    const query = `SELECT item_id, item_name, price, ingredients, allergy_info, description, category, image, time FROM menu ORDER BY price ${sort}`;
    db.connection.query(query, (error, results) => {
        if (error) {
            console.log('Error fetching menu:', error);
            return res.status(500).send('Error fetching menu');
        }
        res.render('menu_update', { items: results, sort });
    });
});

// Route to add or update menu items
router.post('/add-item', upload.single('image'), (req, res) => {
    const { itemId, itemName, price, ingredients, allergyInfo, description, category, time } = req.body;
    const image = req.file ? req.file.filename : null;

    if (itemId) {
        // Update existing item
        const query = `
            UPDATE menu
            SET item_name = ?, price = ?, ingredients = ?, allergy_info = ?, description = ?, category = ?, image = ?, time = ?
            WHERE item_id = ?
        `;
        const values = [itemName, price, ingredients, allergyInfo, description, category, image, time, itemId];

        db.connection.query(query, values, (error, results) => {
            if (error) {
                console.error('Error updating data:', error);
                return res.status(500).send('Failed to update item');
            }
            console.log('Item updated:', results);
            res.redirect('/menu_update'); // Redirect back to the menu update page
        });
    } else {
        // Add new item
        const query = `
            INSERT INTO menu (item_name, price, ingredients, allergy_info, description, category, image, time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [itemName, price, ingredients, allergyInfo, description, category, image, time];

        db.connection.query(query, values, (error, results) => {
            if (error) {
                console.error('Error inserting data:', error);
                return res.status(500).send('Failed to add item');
            }
            console.log('Item added:', results);
            res.redirect('/menu_update'); // Redirect back to the menu update page
        });
    }
});

// Route to handle the buy action
router.post('/buy', (req, res) => {
    const username = req.session.username;
    const totalAmount = req.body.totalAmount;

    if (!username) {
        return res.redirect('/login');
    }

    const query = "UPDATE users SET money = money - ? WHERE username = ?";
    db.connection.query(query, [totalAmount, username], (error, results) => {
        if (error) {
            console.error('Error updating money:', error);
            return res.status(500).send('Internal Server Error');
        }
        res.redirect('/menu'); // Redirect back to the menu after purchase
    });
});

// Define a POST route for deleting a menu item
router.post("/delete-item", (req, res) => {
    // Extract the 'id' from the request body
    const { item_id } = req.body;

    // Define the SQL query to delete the menu item with the given 'id'
    const deleteQuery = 'DELETE FROM menu WHERE item_id = ?';
    // Execute the delete query
    db.connection.query(deleteQuery, [item_id], (deleteError, deleteResults) => {
        // Handle any errors during the deletion process
        if (deleteError) {
            console.error('Error deleting item:', deleteError);
            return res.status(500).send("Internal deleting Server Error");
        }

        // Define the SQL query to reorder the IDs in the menu table
        const reorderQuery = 'CALL reorder_ids()';
        // Execute the reorder query
        db.connection.query(reorderQuery, (reorderError, reorderResults) => {
            // Handle any errors during the reordering process
            if (reorderError) {
                console.error('Error reordering IDs:', reorderError);
                return res.status(500).send("Internal Server Error");
            }
            // Redirect to the /menu_update page after successful deletion and reordering
            res.redirect("/menu_update");
        });
    });
});

module.exports = router;