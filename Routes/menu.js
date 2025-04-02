const express = require('express');
const router = express.Router();
const db = require('../Models/database'); // Ensure correct path to database.js

// Route to get menu items from the database
router.get('/menu', (req, res) => {
  const query = "SELECT item_id, item_name, price, ingredients, allergy_info, description, category, image FROM menu"; // Fetch all necessary columns
  db.connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching menu:', error);
      return res.status(500).send('Internal Server Error');
    }
    // Pass results to the EJS view
    res.render('menu', { items: results }); // items is the key to pass the data
  });
});

// Route to submit an order
router.post('/submit-order', (req, res) => {
  console.log('Form submitted:', req.body); // Debugging statement
  const items = [];
  let totalAmount = 0;

  for (const key in req.body) {
    if (key.startsWith('quantity_')) {
      const itemId = key.split('_')[1];
      const quantity = parseInt(req.body[key]);
      if (quantity > 0) {
        items.push({ item_id: itemId, quantity });
      }
    }
  }
  console.log('Items:', items); // Debugging statement
  if (items.length > 0) {
    const query = "SELECT item_id, item_name, price FROM menu WHERE item_id IN (?)";
    const itemIds = items.map(item => item.item_id);

    db.connection.query(query, [itemIds], (error, results) => {
      if (error) {
        console.error('Error fetching order details:', error);
        return res.status(500).send('Internal Server Error');
      }
      const orderDetails = items.map(item => {
        const menuItem = results.find(result => result.item_id == item.item_id);
        return {
          item_id: menuItem.item_id, // Ensure item_id is included
          item_name: menuItem.item_name,
          quantity: item.quantity,
          price: parseFloat(menuItem.price), // Ensure price is a number
          total_price: parseFloat(menuItem.price) * item.quantity // Ensure total_price is a number
        };
      });

      totalAmount = orderDetails.reduce((sum, item) => sum + item.total_price, 0);
      console.log('Order details:', orderDetails); // Debugging statement
      console.log('Total amount:', totalAmount); // Debugging statement

      // Store order details in session for the buy action
      req.session.orderDetails = orderDetails;
      req.session.totalAmount = totalAmount;
      const query = 'SELECT time FROM collection_times';
      db.connection.query(query, (err, results) => {
        if (err) {
          console.error('Error fetching collection times:', err);
          return res.status(500).send('Error fetching collection times');
        }
        res.render('order1', { collectionTimes: results, items: orderDetails, totalAmount: totalAmount });
      });
    });
  } else {
    res.redirect('/menu'); // Redirect back to the menu if no items were ordered
  }
});

// Route to handle the buy action
router.post('/buy', (req, res) => {
  const username = req.session.username;
  const totalAmount = req.session.totalAmount; // Retrieve totalAmount from session
  const items = req.session.orderDetails; // Retrieve orderDetails from session
  const collectionTime = req.body.collectionTime; // Retrieve collection time from form
  const message = req.body.message; // Retrieve message from form

  if (!username) {
    return res.redirect('/login');
  }

  const checkBalanceQuery = "SELECT money FROM users WHERE username = ?";
  db.connection.query(checkBalanceQuery, [username], (error, results) => {
    if (error) {
      console.error('Error checking balance:', error);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length === 0) {
      console.log('User not found');
      return res.status(400).send('User not found');
    }

    const userMoney = parseFloat(results[0].money); // Ensure userMoney is a number
    console.log(`User Money: ${userMoney}, Total Amount: ${totalAmount}`); // Debugging statement

    if (userMoney >= totalAmount) {
      const updateMoneyQuery = "UPDATE users SET money = money - ? WHERE username = ?";
      db.connection.query(updateMoneyQuery, [totalAmount, username], (error, results) => {
        if (error) {
          console.error('Error updating money:', error);
          return res.status(500).send('Internal Server Error');
        }

        // Insert order into orders table
        const insertOrderQuery = "INSERT INTO orders (username, total_amount, order_date, collection_time, message) VALUES (?, ?, NOW(), ?, ?)";
        db.connection.query(insertOrderQuery, [username, totalAmount, collectionTime, message], (error, results) => {
          if (error) {
            console.error('Error inserting order:', error);
            return res.status(500).send('Internal Server Error');
          }

          const orderId = results.insertId;
          const orderItems = items.map(item => [orderId, item.item_id, item.quantity, item.price]);
          console.log('Order Items:', orderItems); // Debugging statement

          const insertOrderItemsQuery = "INSERT INTO order_items (id, item_id, quantity, price) VALUES ?";
          db.connection.query(insertOrderItemsQuery, [orderItems], (error, results) => {
            if (error) {
              console.error('Error inserting order items:', error);
              return res.status(500).send('Internal Server Error');
            }

            res.render('order1', {
              items: req.session.orderDetails,
              totalAmount: req.session.totalAmount,
              successMessage: 'Your order has been placed successfully!'
            });
          });
        });
      });
    } else {
      console.log(`Insufficient funds: User Money: ${userMoney}, Total Amount: ${totalAmount}`); // Debugging statement
      res.render('order1', {
        items: req.session.orderDetails,
        totalAmount: req.session.totalAmount,
        errorMessage: 'Insufficient funds'
      });
    }
  });
});

// Route to render the student dashboard
router.get('/student_dashboard', (req, res) => {
  res.render('student_dashboard', {
    username: req.session.username,
  });
});

// Route to get menu items and categories from the database
router.get('/menu', (req, res) => {
  const itemsQuery = 'SELECT * FROM menu';
  const categoriesQuery = 'SELECT DISTINCT category FROM menu';

  db.connection.query(itemsQuery, (err, items) => {
    if (err) {
      console.error('Error fetching menu items:', err);
      return res.status(500).send('Error fetching menu items');
    }

    db.connection.query(categoriesQuery, (err, categoriesResults) => {
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).send('Error fetching categories');
      }

      const categories = categoriesResults.map(row => row.category);
      res.render('menu', { items, categories });
    });
  });
});

module.exports = router;