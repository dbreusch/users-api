// users-api: main app
const fs = require('fs');
const path = require('path');
const https = require('https');

const express = require("express");
const mongoose = require('mongoose');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const dotenv = require('dotenv');
// const passport = require("passport");
// const passportLocalMongoose = require("passport-local-mongoose");

const HttpError = require('./models/http-error');
const userRoutes = require('./routes/users-routes');
const { getEnvVar } = require('./helpers/getEnvVar');

dotenv.config();

// define port from environment or default to 3001
const port = process.env.PORT || 3001;

// initialize express
const app = express();

// parse incoming POST requests with JSON payloads (default type application/json)
app.use(express.json());

// parse incoming POST requests with urlencoded payloads (default type application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

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

// handle image file requests
app.use('/uploads/images', express.static(path.join('uploads', 'images')));

// handle CORS
app.use((req, res, next) => {
  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST'
  );
  next();
});

// define routes
app.use(userRoutes);

// this function only runs if nothing else responded first
app.use((req, res, next) => {
  const error = new HttpError('users-app: Could not find this route.', 404);
  throw error;
});

// generic error handler (because there are FOUR args)
app.use((err, req, res, next) => {
  // console.log(err);

  // if a file path is included in request, remove it
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }

  if (res.headerSent) { // just return/goto next if a response already exists
    return next(err);
  }

  res.status(err.code || 500);
  res.json({ message: err.message || 'users-app/generic error handler: Something went wrong.' });
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
  (err) => {
    if (err) {
      console.log('Connection to MongoDB failed!');
      console.log(err);
    } else {
      console.log('Successfully connected to MongoDB');
      // console.log(`Listening on port ${port}`);
      // app.listen(port);

      // Create an HTTPS listener that points to the express app
      // Use a callback fn to tell when the server is created
      https
        .createServer(
          // Provide the private and public key to the server by reading each
          // file's content using readFileSync
          {
            key: fs.readFileSync('ssl/key.pem'),
            cert: fs.readFileSync('ssl/cert.pem')
          },
          app
        )
        .listen(port, () => {
          console.log(`HTTPS server is running at port ${port}`);
        });
    }
  }
);
