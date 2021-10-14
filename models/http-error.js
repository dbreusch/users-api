// custom class to add code field to the Error class
// more info on Error can be found at:
// https://airbrake.io/blog/nodejs-error-handling/nodejs-error-class-hierarchy
//
// Note: I'm not sure why this is in the models folder (10/14/21)
class HttpError extends Error {
  constructor(message, errorCode) {
    super(message);         // set message property
    this.code = errorCode;  // add a code property
  }
}

module.exports = HttpError;
