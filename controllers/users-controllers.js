// users-api: action functions
const { validationResult } = require('express-validator');
const axios = require('axios');
const dotenv = require('dotenv');
// const passport = require("passport");

const { createAndThrowError, createError } = require('../helpers/error');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const { getEnvVar } = require('../helpers/getEnvVar');

dotenv.config();

// // add passport authentication middleware and sessions
// passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// utility functions start here

// get a hashed password from auth-api
const getHashedPassword = async (password) => {
  const authApiAddress = getEnvVar('AUTH_API_ADDRESS');
  // console.log(`AUTH_API_ADDRESS = ${authApiAddress}`);
  try {
    const response = await axios.get(
      `http://${authApiAddress}/hashed-pw/${password}`
    );
    return response.data.hashed;
  } catch (err) {
    const message = (err.response && err.response.data && err.response.data.message)
      || 'users-api: Failed to hash user password';
    const code = (err.response && err.response.status) || 500;
    createAndThrowError(message, code);
  }
};

// get a JWT token from auth-api
const getTokenForUser = async (password, hashedPassword, uid) => {
  const authApiAddress = getEnvVar('AUTH_API_ADDRESS');
  try {
    const response = await axios.post(
      `http://${authApiAddress}/token`,
      {
        password: password,
        hashedPassword: hashedPassword,
        userId: uid
      }
    );
    return response.data.token;
  } catch (err) {
    const message = (err.response && err.response.data && err.response.data.message)
      || 'users-api: Failed to create user token.';
    const code = (err.response && err.response.status) || 500;
    createAndThrowError(message, code);
  }
};

// exported functions start here!

// return all users
const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    console.log('users-api: Fetching users failed');
    return next(new HttpError('users-api: Fetching users failed, please try again later.', 500));
  }

  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};

// create/register a new user
const registerUser = async (req, res, next) => {
  // // completely unnecessary use of session cookie data to demonstrate how it works!
  // if (!req.session.views) {
  //   req.session.views = 1;
  // } else {
  //   req.session.views++;
  // }
  // console.log(`${req.session.views} registration(s)`);

  // -------  Debugging
  // console.log('Print req.file.path');
  // console.log(req.file.path);

  // console.log('Print req.body');
  // console.log(req.body);
  // console.log(req.body.email);

  // const obj = Object.assign({}, req.body);
  // console.log('Print obj');
  // console.log(obj);
  // console.log(obj.email);
  // -------- End debugging

  // validate inputs
  const formErrors = validationResult(req);
  if (!formErrors.isEmpty()) {
    console.log('users-api: Validation of req.body failed');
    console.log(formErrors);
    return next(new HttpError('users-api: Invalid inputs passed, please check your data.', 422));
  }

  // get inputs from validated form
  try {
    // const { name, email, password } = req.body;  // DOES NOT WORK!! (10/8/21)
    name = req.body.name;
    email = req.body.email;
    password = req.body.password;
  } catch (err) {
    console.log('users-api: Error in input data (req.body)');
    console.log(err);
    return next(new HttpError('users-api: Error in input data.', 500));
  }

  // check for an existing user
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    console.log('users-api: Error checking for existing user');
    console.log(err);
    return next(new HttpError('users-api: Signing up failed, please try again later.', 500));
  }
  if (existingUser) {
    console.log('users-api: Existing user found');
    return next(new HttpError('users-api: User exists already, please login instead.', 422));
  }

  // hash the user's password
  let hashedPassword;
  try {
    // console.log('Hashing password');
    hashedPassword = await getHashedPassword(password);
  } catch (err) {
    console.log('users-api: Password hashing failed');
    console.log(err);
    return next(HttpError('users-api: User password hashing failed, please try again.', 500));
  }

  // for debugging
  const image = "uploads/images/172c72ad-36c9-46d3-85c2-639f1b5a6e16.jpeg";
  // for production
  // const image = req.file.path;

  // create a new User object
  const currDate = new Date();
  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: image,
    type: "standard",
    active: true,
    dateAdded: currDate,
    lastLogin: currDate,
    courses: []
  });

  // save User to the db
  try {
    await createdUser.save();
  } catch (err) {
    console.log('users-api: Error saving new User object');
    return next(new HttpError('users-api: Signing up user failed, please try again.', 500));
  }

  // get a new JWT token for the new user's session
  let token;
  try {
    token = await getTokenForUser(
      password,
      createdUser.password,
      createdUser.id
    );
  } catch (err) {
    console.log("users-api: Create token error");
    console.log(err);
    return next(HttpError('users-api: Create token error, please try again.', 500));
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    token: token
  });
};

// login a user
const loginUser = async (req, res, next) => {
  // // Validation is NOT really required for login since it fails anyway on bad inputs
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //     console.log(errors)
  //     throw new HttpError('Invalid inputs passed, please check your data.', 422);
  // }

  const { email, password } = req.body;

  // check for existing user
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    console.log('users-api: Logging in failed');
    return next(new HttpError('users-api: Logging in failed, please try again later.', 500));
  }

  // error if user does not exist
  if (!existingUser) {
    console.log('users-api: User not found');
    return next(new HttpError('users-api: User not found, could not log you in.', 403));
  }

  // get (new) session token for user
  let token;
  try {
    token = await getTokenForUser(
      password,
      existingUser.password,
      existingUser.id
    );
  } catch (err) {
    console.log('users-api: Get token for user failed');
    return next(HttpError('users-api: Get token for user failed, please try again.', 500));
  }

  // update last login data
  const currDate = new Date();
  existingUser.lastLogin = currDate;
  try {
    await existingUser.save();
  } catch (err) {
    console.log('users-api: Error updating user lastLogin');
    return next(new HttpError('users-api: Error updating user lastLogin.', 500));
  }

  // return userid, email and login token
  res.status(201).json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token
  });
};

exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.getUsers = getUsers;
