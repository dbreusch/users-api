// users-api: main app
const express = require("express");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
// const passportLocalMongoose = require("passport-local-mongoose");

const userRoutes = require('./routes/user-routes');

// define port from environment or default to 3000
const port = process.env.PORT || 3000

// initialize express
const app = express();

// convert POST/PUT requests to JSON
app.use(express.json());

// setup session configuration
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

// initialize authentication and session handling
app.use(passport.initialize());
app.use(passport.session());

// handle CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// define routes
app.use(userRoutes);

// generic error handler
app.use((err, req, res, next) => {
  console.log(err);
  let code = 500;
  let message = 'users-app: Something went wrong.';
  if (err.code) {
    code = err.code;
  }

  if (err.message) {
    message = err.message;
  }
  res.status(code).json({ message: message });
});

// connect to database, then start listening!
mongoose.connect(
  `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URL}/${process.env.MONGODB_NAME}?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  (err) => {
    if (err) {
      console.log('COULD NOT CONNECT TO MONGODB!');
    } else {
      console.log('Successfully connected to MongoDB')
      console.log(`Listening on port ${port}`)
      app.listen(port);
    }
  }
);
