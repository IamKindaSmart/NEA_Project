const express = require('express');
const router = express.Router();
const { connection } = require('../Models/database'); // Ensure the database connection is imported

// Middleware to check if the user is logged in
function isAuthenticated(req, res, next) {
  if (!req.session.StuID) {
    console.error('User not logged in. Redirecting to login page.');
    return res.redirect('/login'); // Redirect to the login page
  }
  next(); // Proceed to the next middleware or route handler
}

// Route to render order status
router.get('/order_status', isAuthenticated, (req, res) => {
  const username = req.session.username;

  const query = "SELECT order_id, total_amount, order_date, status FROM orders WHERE username = ?";
  connection.query(query, [username], (error, results) => {
    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).send('Internal Server Error');
    }

    res.render('order_status', {
      orders: results
    });
  });
});

// Route to fetch and display orders
router.get("/view-orders", isAuthenticated, (req, res, next) => {
  const query = "SELECT * FROM orders";
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query:', error);
      return next(error);
    }
    res.render("OrderStaffView", { orders: results });
  });
});

// Route to update order status
router.post('/update-order-status', isAuthenticated, (req, res) => {
  const { order_id, status } = req.body;

  const updateQuery = 'UPDATE orders SET status = ? WHERE order_id = ?';
  const values = [status, order_id];

  connection.query(updateQuery, values, (error, results) => {
    if (error) {
      console.error('Error updating order status:', error);
      return res.status(500).send('Failed to update order status');
    }
    // Fetch updated orders and render the OrderStaffView page
    const fetchOrdersQuery = "SELECT * FROM orders";
    connection.query(fetchOrdersQuery, (fetchError, fetchResults) => {
      if (fetchError) {
        console.error('Error fetching updated orders:', fetchError);
        return res.status(500).send('Failed to fetch updated orders');
      }
      res.render("OrderStaffView", { orders: fetchResults });
    });
  });
});

// Route to fetch order details
router.get('/order-details/:orderId', isAuthenticated, (req, res) => {
  const orderId = req.params.orderId;
  const query = `
    SELECT COALESCE(orders.message, 'None') AS message, order_items.quantity, menu.item_name
    FROM orders
    JOIN order_items ON orders.order_id = order_items.id
    JOIN menu ON order_items.item_id = menu.item_id
    WHERE orders.order_id = ?
  `;
  connection.query(query, [orderId], (error, results) => {
    if (error) {
      console.error('Error fetching order details:', error);
      return res.status(500).send('Failed to fetch order details');
    }
    if (results.length === 0) {
      return res.status(404).send('Order not found');
    }
    res.json(results);
  });
});

// Route to fetch order items and return them as HTML
router.get("/order-items/:orderId", isAuthenticated, (req, res) => {
  const orderId = req.params.orderId;
  const query = "SELECT * FROM order_items INNER JOIN orders ON order_items.id = orders.order_id INNER JOIN menu ON order_items.item_id = menu.item_id WHERE order_id = ?";
  connection.query(query, [orderId], (error, results) => {
    if (error) {
      console.error('Error fetching order items:', error);
      return res.status(500).send("Error fetching order items");
    }
    if (results.length === 0) {
      return res.status(404).send("No order items found");
    }
    let html = '<h2>Order Items</h2><ul>';
    results.forEach(item => {
      html += `<li>${item.item_name} - ${item.quantity} x ${item.price}</li>`;
    });
    html += `</ul><h3>Total Amount: ${results[0].total_amount}</h3>`;
    res.send(html);
  });
});

// Route to delete an order
router.delete('/delete-order/:orderId', isAuthenticated, (req, res) => {
  const orderId = req.params.orderId;

  // Delete related rows in order_items table first
  const deleteOrderItemsQuery = 'DELETE FROM order_items WHERE id = ?';
  connection.query(deleteOrderItemsQuery, [orderId], (error, results) => {
    if (error) {
      console.error('Error deleting order items:', error);
      return res.status(500).send('Error deleting order items');
    }

    // Delete the order after deleting related rows in order_items table
    const deleteOrderQuery = 'DELETE FROM orders WHERE order_id = ?';
    connection.query(deleteOrderQuery, [orderId], (error, results) => {
      if (error) {
        console.error('Error deleting order:', error);
        return res.status(500).send('Error deleting order');
      }
      res.status(200).send('Order deleted');
    });
  });
});

// Route to fetch collection times and render the order1.ejs template
router.get('/order1', isAuthenticated, (req, res) => {
  const query = 'SELECT time FROM collection_times';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching collection times:', err);
      return res.status(500).send('Error fetching collection times');
    }
    res.render('order1', { collectionTimes: results });
  });
});

// Route to submit an order
router.post('/submit-order-summary', isAuthenticated, (req, res) => {
  const { items, totalAmount, collectionTime, message } = req.body;
  console.log(items, totalAmount, collectionTime, message); // Debugging statement

  // Fetch the username from the database
  connection.query('SELECT Username FROM users WHERE StuID = ?', [req.session.StuID], (error, results) => {
    if (error) {
      console.error('Error fetching username:', error);
      return res.status(500).send('Error fetching username');
    }

    if (results.length === 0) {
      console.error('No user found with the provided StuID');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const username = results[0].Username;
    console.log('Fetched Username:', username);

    const date = new Date();

    if (!items || !totalAmount || !collectionTime) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    const parsedItems = JSON.parse(items);

    // Insert the order into the database
    const insertOrderQuery = 'INSERT INTO orders (username, total_amount, order_date, message, collection_time) VALUES (?, ?, ?, ?, ?)';
    connection.query(insertOrderQuery, [username, totalAmount, date, message, collectionTime], (err, results) => {
      if (err) {
        console.error('Error inserting order:', err);
        return res.status(500).json({ success: false, message: 'Error submitting order' });
      }

      const orderId = results.insertId;

      // Insert the order items into the database
      const insertOrderItemsQuery = 'INSERT INTO order_items (id, item_id, quantity, price) VALUES ?';
      const orderItems = parsedItems.map(item => [orderId, item.item_id, item.quantity, item.price]);

      connection.query(insertOrderItemsQuery, [orderItems], (err, results) => {
        if (err) {
          console.error('Error inserting order items:', err);
          return res.status(500).json({ success: false, message: 'Error submitting order items' });
        }

        res.status(200).json({ success: true, message: 'Order submitted successfully' });
      });
    });
  });
});

module.exports = router;