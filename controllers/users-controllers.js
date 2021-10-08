// auth-api: action functions
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
  try {
    const response = await axios.get(
      `http://${authApiAddress}/hashed-pw/${password}`
    );
    return response.data.hashed;
  } catch (err) {
    const code = (err.response && err.response.status) || 500;
    createAndThrowError(err.message || 'Failed to create user.', code);
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
    const code = (err.response && err.response.status) || 500;
    createAndThrowError(err.message || 'Failed to verify user.', code);
  }
};

// exported functions start here!

// return all users
const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    return next(new HttpError('Fetching users failed, please try again later.', 500));
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

  // console.log('Print req.file.path');
  // console.log(req.file.path);

  // console.log('Print req.body');
  // console.log(req.body);
  // console.log(req.body.email);

  // const obj = Object.assign({}, req.body);
  // console.log('Print obj');
  // console.log(obj);
  // console.log(obj.email);

  // validate inputs
  // console.log('Validating data in req.body');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation of req.body failed');
    console.log(errors);
    return next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  // check for an existing user
  console.log('Getting data from req.body');
  try {
    // const { name, email, password } = req.body;  // DOES NOT WORK!! (10/8/21)
    name = req.body.name;
    email = req.body.email;
    password = req.body.password;
 } catch (err) {
    console.log('Error in req.body');
    console.log(err);
    return next(new HttpError('Signing up user failed, please try again.', 500));
  }
  // console.log(`name: ${name} email: ${email} password: ${password}`);

  let existingUser;
  try {
    // console.log('Checking for existing user');
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    console.log('Error checking for existing user');
    console.log(err);
    return next(new HttpError('Signing up failed, please try again later.', 500));
  }
  if (existingUser) {
    console.log('Existing user found');
    return next(new HttpError('User exists already, please login instead.', 422));
  }

  // hash the user's password
  let hashedPassword;
  try {
    // console.log('Hashing password');
    hashedPassword = await getHashedPassword(password);
  } catch (err) {
    console.log('Password hashing failed');
    console.log(err);
    return next(err);
  }

  // create a new User object
  // console.log('Create new User object');
  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    type: "standard",
    active: true
  });

  // save User to the db
  try {
    // console.log('Trying to save new User object');
    await createdUser.save();
  } catch (err) {
    console.log('Error saving new User object');
    console.log(err);
    return next(new HttpError('Signing up user failed, please try again.', 500));
  }

  // console.log("Created new user!");

  // get a new JWT token for the new user's session
  let token;
  try {
    // console.log('Get token for user');
    token = await getTokenForUser(
      password,
      createdUser.password,
      createdUser.name
    );
  } catch (err) {
    console.log("Create token error");
    console.log(err);
    return next(err);
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
    return next(new HttpError('Logging in failed, please try again later.', 500));
  }

  // error if user does not exist
  if (!existingUser) {
    return next(new HttpError('Invalid credentials, could not log you in.', 403));
  }

  // get new session token for user
  let token;
  try {
    token = await getTokenForUser(
      password,
      existingUser.password,
      existingUser.name
    );
  } catch (err) {
    return next(err);
  }

  res.status(201).json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token
  });
};

exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.getUsers = getUsers;
