// auth-api: action functions
// const axios = require('axios');
const passport = require("passport");

// const { createAndThrowError, createError } = require('../helpers/error');
const User = require('../models/user');

// add passport authentication middleware and sessions
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// exported functions start here!
const createUser = async (req, res, next) => {
  res
    .status(201)
    .json({ message: 'User created.', user: 'Username' });
}

const verifyUser = async (req, res, next) => {
  res
    .status(201)
    .json({ message: 'User verified.', user: 'Username' });
}

const logoutUser = async (req, res, next) => {
  res
    .status(201)
    .json({ message: 'User logged out.', user: 'Username' });
}

exports.createUser = createUser;
exports.verifyUser = verifyUser;
exports.logoutUser = logoutUser;
