// auth-api: action functions
const { validationResult } = require('express-validator');
const axios = require('axios');
const passport = require("passport");

// const { createAndThrowError, createError } = require('../helpers/error');
const HttpError = require('../models/http-error');
const User = require('../models/user');

// add passport authentication middleware and sessions
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// utility functions start here
const getHashedPassword = async (password) => {
  try {
    const response = await axios.get(
      `http://${process.env.AUTH_API_ADDRESS}/hashed-pw/${password}`
    );
    return response.data.hashed;
  } catch (err) {
    const code = (err.response && err.response.status) || 500;
    createAndThrowError(err.message || 'Failed to create user.', code);
  }
};

const getTokenForUser = async (password, hashedPassword, uid) => {
  try {
    const response = await axios.post(
      `http://${process.env.AUTH_API_ADDRESS}/token`,
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
  // validate inputs
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(HttpError('Invalid inputs passed, please check your data.', 422));
  }

  // check for an existing user
  const { name, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError('Signing up failed, please try again later.', 500));
  }

  if (existingUser) {
    return next(new HttpError('User exists already, please login instead.', 422));
  }

  // hash the user's password
  let hashedPassword;
  try {
    hashedPassword = await getHashedPassword(password);
  } catch (err) {
    return next(err);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    type: "standard",
    active: true
  });

  try {
    await createdUser.save();
  } catch (err) {
    console.log(err);
    return next(new HttpError('Signing up user failed, please try again.', 500));
  }

  // let token;
  // try {
  //   token = jwt.sign(
  //     { userId: createdUser.id, email: createdUser.email },
  //     'supersecret_dont_share',
  //     { expiresIn: '1h' }
  //   );
  // } catch (err) {
  //   return next(new HttpError('Signing up user failed, please try again.', 500));
  // }
  let token;
  try {
    // console.log(password, createdUser);
    const token = await getTokenForUser(
      password,
      createdUser.password,
      createdUser.name
    );
    res.status(200).json({ token: token, userId: createdUser.id });
  } catch (err) {
    next(err);
  }

  res.status(201).json({
    userId: createdUser.name,
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

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError('Logging in failed, please try again later.', 500));
  }

  if (!existingUser) {
    return next(new HttpError('Invalid credentials, could not log you in.', 403));
  }

  // *** Following password checking is now part of getTokenForUser
  // let isValidPassword = false;
  // try {
  //   isValidPassword = await bcrypt.compare(password, existingUser.password);
  // } catch (err) {
  //   return next(new HttpError('Could not log you in, please check your credentials and try again.', 500));
  // }

  // if (!isValidPassword) {
  //   return next(new HttpError('Invalid credentials, could not log you in.', 403));
  // }

  let token;
  // try {
  //   token = jwt.sign(
  //     { userId: existingUser.id, email: existingUser.email },
  //     'supersecret_dont_share',
  //     { expiresIn: '1h' }
  //   );
  // } catch (err) {
  //   return next(new HttpError('Logging in failed, please try again.', 500));
  // }
  try {
    // console.log(password, createdUser);
    const token = await getTokenForUser(
      password,
      existingUser.password,
      existingUser.name
    );
    res.status(200).json({ token: token, userId: existingUser.id });
  } catch (err) {
    next(err);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token
  });
};
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.getUsers = getUsers;
