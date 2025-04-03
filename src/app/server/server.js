const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const mysql = require ('mysql2');
const app = express();

const db_pass = process.env.DATABASE_PASSWORD;
const db = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: '2003',
  database: "CarMaintanceChecker",
});
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.stack);
    return;
  }
  console.log("Connected to the database.");
});

// Middleware
app.use(express.json());
app.use(cors());

// Helper functions
const readData = (file) => {
    try {
        const data = fs.readFileSync(file, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading file ${file}:`, err.message);
        return [];
    }
};

const writeData = (file, data) => {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error(`Error writing to file ${file}:`, err.message);
    }
};

// Endpoints

// Register a user
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if the username already exists in the database
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Error checking user:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length > 0) {
            return res.status(40).json({ message: 'Username already exists' });
        }

        // If the username is unique, insert the new user
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            res.status(201).json({ message: 'Registration successful' });
        });
    });
});

// Log in a user
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if the username and password match a record in the database
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            console.error('Error checking user credentials:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login successful' });
    });
});


// Add a car for a user
app.post('/add-car', (req, res) => {
    const { username, make, model, year, vin } = req.body;

    if (!username || !make || !model || !year || !vin) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const query = 'INSERT INTO cars (username, make, model, year, vin) VALUES (?, ?, ?, ?, ?)';

    db.query(query, [username, make, model, year, vin], (err, result) => {
        if (err) {
            console.error('Error adding car:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Car with this VIN already exists' });
            }
            return res.status(500).json({ message: 'Database error' });
        }

        res.status(201).json({ message: 'Car added successfully' });
    });
});


// Get all cars for a user
app.get('/get-cars', (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    const query = 'SELECT * FROM cars WHERE username = ?';

    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error fetching cars:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        res.json(results);
    });
});


// Remove a car
app.delete('/remove-car', (req, res) => {
    const { vin, username } = req.body;

    if (!vin || !username) {
        return res.status(400).json({ message: 'VIN or username is missing' });
    }

    const query = 'DELETE FROM cars WHERE vin = ? AND username = ?';

    db.query(query, [vin, username], (err, result) => {
        if (err) {
            console.error('Error removing car:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Car not found' });
        }

        res.status(200).json({ message: 'Car removed successfully' });
    });
});


// Log a maintenance task
app.post('/log-maintenance', (req, res) => {
    const { username, vin, service, date, cost, notes } = req.body;

    if (!username || !vin || !service || !date || !cost) {
        return res.status(400).json({ message: 'All fields except notes are required' });
    }

    const query = 'INSERT INTO maintenance_records (username, vin, service, date, cost, notes) VALUES (?, ?, ?, ?, ?, ?)';

    db.query(query, [username, vin, service, date, cost, notes], (err, result) => {
        if (err) {
            console.error('Error logging maintenance task:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        res.status(201).json({ message: 'Maintenance task logged successfully' });
    });
});


// Retrieve maintenance tasks for a user
app.get('/get-maintenance', (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    // Query to retrieve maintenance records for the user's cars
    const query = `
        SELECT m.id, m.vin, m.service, m.date, m.cost, m.notes, m.created_at
        FROM maintenance_records m
        INNER JOIN cars c ON m.vin = c.vin
        WHERE c.username = ?
        ORDER BY m.date DESC
    `;

    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error retrieving maintenance tasks:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        res.json(results);
    });
});


// Add or update a notification for a car
app.post('/set-notification', (req, res) => {
    const { username, vin, notificationDate, message } = req.body;

    if (!username || !vin || !notificationDate || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if a notification for the same user and VIN already exists
    const checkQuery = 'SELECT id FROM notifications WHERE username = ? AND vin = ?';
    
    db.query(checkQuery, [username, vin], (err, results) => {
        if (err) {
            console.error('Error checking notification:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length > 0) {
            // Update existing notification
            const updateQuery = `
                UPDATE notifications 
                SET notification_date = ?, message = ? 
                WHERE username = ? AND vin = ?
            `;
            db.query(updateQuery, [notificationDate, message, username, vin], (err, result) => {
                if (err) {
                    console.error('Error updating notification:', err);
                    return res.status(500).json({ message: 'Database error' });
                }

                res.status(200).json({ message: 'Notification updated successfully' });
            });
        } else {
            // Insert new notification
            const insertQuery = `
                INSERT INTO notifications (username, vin, notification_date, message) 
                VALUES (?, ?, ?, ?)
            `;
            db.query(insertQuery, [username, vin, notificationDate, message], (err, result) => {
                if (err) {
                    console.error('Error inserting notification:', err);
                    return res.status(500).json({ message: 'Database error' });
                }

                res.status(201).json({ message: 'Notification set successfully' });
            });
        }
    });
});


// Get notifications for a user
app.get('/get-notifications', (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    const query = 'SELECT * FROM notifications WHERE username = ? ORDER BY notification_date ASC';

    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error retrieving notifications:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        res.json(results);
    });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
