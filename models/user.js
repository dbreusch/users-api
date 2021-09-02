// auth-api: database schema
const mongoose = require('mongoose');
// const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: String,
  password: String,
  type: String,
  active: Boolean
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
