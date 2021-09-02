// users-api: define app routes
const express = require('express');

const userActions = require('../controllers/user-actions');

// initialize router
const router = express.Router();

// add routes
router.post('/register', userActions.createUser);

router.post('/login', userActions.verifyUser);

router.post('/logout', userActions.logoutUser);

module.exports = router;
