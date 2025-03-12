const express = require('express');
const router = express.Router();
const { connection } = require('../Models/database'); // Ensure the database connection is imported

// Route to render order status
router.get('/order_status', (req, res) => {
  // Fetch order status data from the database
  const query = 'SELECT order_id, total_amount, order_date, status FROM orders';
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).send("Error fetching order status");
    }
    res.render('order_status', { orders: results });
  });
});

// Route to fetch and display orders
router.get("/view-orders", (req, res, next) => {
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
router.post('/update-order-status', (req, res) => {
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
router.get('/order-details/:orderId', (req, res) => {
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
router.get("/order-items/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  const query = "SELECT * FROM order_items inner join orders on order_items.id = orders.order_id inner join menu on order_items.item_id = menu.item_id WHERE order_id = ?";
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
router.delete('/delete-order/:orderId', (req, res) => {
  const orderId = req.params.orderId;

  // Delete related rows in order_items table first
  const deleteOrderItemsQuery = 'DELETE FROM order_items WHERE id = ?'; // Use the correct column name
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

// Route to fetch collection times and render the StudentStaff template
router.get('/studentstaff', (req, res) => {
  const query = 'SELECT time FROM collection_times';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching collection times:', err);
      return res.status(500).send('Error fetching collection times');
    }
    const collectionTimes = results.map(row => row.time);
    res.render('StudentStaff', { collectionTimes });
  });
});

// Route to update collection times
router.post('/update-collection-times', (req, res) => {
  const { collectionTimes } = req.body;

  if (!Array.isArray(collectionTimes)) {
    return res.status(400).json({ success: false, message: 'Invalid input format' });
  }

  // Insert the collection times into the database
  const insertQuery = 'INSERT INTO collection_times (time) VALUES ?';
  const values = collectionTimes.map(time => [time]);

  connection.query(insertQuery, [values], (err, results) => {
    if (err) {
      console.error('Error updating collection times:', err);
      return res.status(500).json({ success: false, message: 'Failed to update collection times.' });
    }

    res.json({ success: true, message: 'Collection times updated successfully!' });
  });
});

// Route to delete a collection time
router.post('/delete-collection-time', (req, res) => {
  const { time } = req.body;

  if (!time) {
    return res.status(400).json({ success: false, message: 'Invalid input format' });
  }

  // Delete the collection time from the database
  const deleteQuery = 'DELETE FROM collection_times WHERE time = ?';

  connection.query(deleteQuery, [time], (err, results) => {
    if (err) {
      console.error('Error deleting collection time:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete collection time.' });
    }

    res.json({ success: true, message: 'Collection time deleted successfully!' });
  });
});

// Route to fetch collection times and render the order1.ejs template
router.get('/order1', (req, res) => {
  const query = 'SELECT time FROM collection_times';
  const collectionTimes = results.map(row => row.time);
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching collection times:', err);
      return res.status(500).send('Error fetching collection times');
    }
    res.render('order1', { collectionTimes: results });
  });
});

module.exports = router;