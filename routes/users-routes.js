// users-api: define app routes
const express = require('express');
const { check } = require('express-validator');

const userControllers = require('../controllers/users-controllers');

// initialize router
const router = express.Router();

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
  userControllers.registerUser
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
  userControllers.loginUser
);

module.exports = router;
