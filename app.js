const express = require('express');
require('dotenv').config();
const { connectToDb, getDb } = require('./db');
const { ObjectId } = require('mongodb');
const verifyApiKey = require('./middleware'); // Import the middleware

// Initialize app & middleware
const app = express();
app.use(express.json());

// DB connection
let db;
connectToDb((err) => {
    if (!err) {
        app.listen(3000, () => {
            console.log("Listening on port 3000");
        });
        db = getDb();
    }
});

// Routes
app.get('/', (req, res) => {
    // Current page (pagination)
    const page = req.query.p || 0;
    const usersPerPage = 3; // Current page size (pagination)

    let users = [];

    db.collection('users')
        .find() // cursor toArray forEach
        .sort({ author: 1 })
        .skip(page * usersPerPage) // Skipping a certain amount of pages
        .limit(usersPerPage) // Limiting the amount of pages
        .forEach(book => users.push(book))
        .then(() => {
            res.status(200).json(users);
        })
        .catch(() => {
            res.status(500).json({ error: 'Could not fetch the documents' });
        });
});

app.get('/users/:id', verifyApiKey, (req, res) => {
    if (ObjectId.isValid(req.params.id)) {
        db.collection('users')
            .findOne({ _id: new ObjectId(req.params.id) })
            .then(doc => {
                res.status(200).json(doc);
            })
            .catch(err => {
                res.status(500).json({ error: 'Could not find request' });
            });
    } else {
        res.status(500).json({ error: 'Not valid doc id' });
    }
});

// Setting up POST request handler
app.post('/users', verifyApiKey, (req, res) => {
    const user = req.body;

    db.collection('users')
        .insertOne(user)
        .then(result => {
            res.status(201).json(result);
        })
        .catch(err => {
            res.status(500).json({ err: 'Could not create the document' });
        });
});

// Setting up DELETE request handler
app.delete('/users/:id', verifyApiKey, (req, res) => {
    if (ObjectId.isValid(req.params.id)) {
        db.collection('users')
            .deleteOne({ _id: new ObjectId(req.params.id) })
            .then(result => {
            res.status(200).json(result);
        }).catch(err => {
            res.status(500).json((err) => { err: 'could not delete the document' });
        });
    } else {
        res.status(500).json({ error: 'Not valid doc id' });
    }
});

// Setting up PATCH request handler
app.patch('/users/:id', verifyApiKey, (req, res) => {
    const updates = req.body;
    if (ObjectId.isValid(req.params.id)) {
        db.collection('users')
            .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates })
            .then(result => {
                res.status(200).json(result);
            }).catch(err => {
                res.status(500).json((err) => { err: 'could not update the document' });
            });
    } else {
        res.status(500).json({ error: 'Not valid doc id' });
    }
});

// Route to multiply a number by the rating of a selected product and return the total rate
app.post('/multiply-rate/:id', verifyApiKey, (req, res) => {
    const { number } = req.body;
    const productId = req.params.id;

    // Retrieve the rating of the selected product from MongoDB
    db.collection('users')
        .findOne({ _id: new ObjectId(productId) })
        .then(doc => {
            if (doc) {
                const rating = doc.rating;
                const totalRate = number * rating;
                res.status(200).json({ totalRate });
            } else {
                res.status(404).json({ error: 'Product not found' });
            }
        })
        .catch(err => {
            res.status(500).json({ error: 'Could not fetch the document' });
        });
});
