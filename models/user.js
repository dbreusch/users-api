// auth-api: database schema
const mongoose = require('mongoose');
// const passport = require("passport");
// const passportLocalMongoose = require("passport-local-mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  type: String,
  active: Boolean
});

// userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
