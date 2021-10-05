// users-api: main app
const express = require("express");
const mongoose = require('mongoose');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const dotenv = require('dotenv');
// const passport = require("passport");
// const passportLocalMongoose = require("passport-local-mongoose");

const HttpError = require('./models/http-error');
const userRoutes = require('./routes/users-routes');
const getEnvVar = require('./helpers/getEnvVar');

dotenv.config();

// define port from environment or default to 3001
const port = process.env.PORT || 3001;

// initialize express
const app = express();

// convert POST/PUT requests to JSON
app.use(express.json());

// setup session configuration (cookie)
const userSessionKey = getEnvVar('USER_SESSIONKEY');
app.use(session({
  cookie: { maxAge: 86400000 },
  secret: userSessionKey,
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
}));

// // initialize passport authentication and session handling
// app.use(passport.initialize());
// app.use(passport.session());

// handle CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

// define routes
app.use(userRoutes);

// this function only runs if nothing else responded first
app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

// generic error handler (because there are FOUR args)
app.use((err, req, res, next) => {
  // console.log(err);

  if (res.headerSent) { // just return/goto next if a response already exists
    return next(err);
  }

  res.status(err.code || 500);
  res.json({ message: err.message || 'users-app: Something went wrong.' });
});

// connect to database, then start listening!

// first, try to get variables values from environment.
// if any are missing, getEnvVar will throw an error 500.
const mongoUser = getEnvVar('MONGODB_USERNAME');
const mongoPassword = getEnvVar('MONGODB_PASSWORD');
const mongoURL = getEnvVar('MONGODB_URL');
const mongoName = getEnvVar('MONGODB_NAME');

mongoose.connect(
  `mongodb+srv://${mongoUser}:${mongoPassword}@${mongoURL}/${mongoName}?retryWrites=true&w=majority`,
  // {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true
  // },
  (err) => {
    if (err) {
      console.log('Connection to MongoDB failed!');
      console.log(err);
    } else {
      console.log('Successfully connected to MongoDB');
      console.log(`Listening on port ${port}`);
      app.listen(port);
    }
  }
);
