// users-api: define app routes
const express = require('express');
const { check } = require('express-validator');

const usersControllers = require('../controllers/users-controllers');

// initialize router
const router = express.Router();

// return a list of users
router.get('/', usersControllers.getUsers);

// /register: handle user signup requests
router.post(
  '/register',
  [
    check('name')
      .not()
      .isEmpty(),
    check('email')
      .isEmail()
      .normalizeEmail(),
    check('password')
      .isLength({ min: 6 })
  ],
  usersControllers.registerUser
);

// /login: handle user login requests
router.post(
  '/login',
  // Validation will normally be handled by frontend but still having it here is
  // useful for other clients.
  [
    check('email')
      .isEmail()
      .normalizeEmail(),
    check('password')
      .not()
      .isEmpty()
  ],
  usersControllers.loginUser
);

module.exports = router;
