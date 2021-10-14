// Utility functions to create then throw an error using
// a specific message and code.
const createError =  (message, code) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const createAndThrowError = (message, code) => {
  const err = createError(message, code);
  throw err;
}

exports.createAndThrowError = createAndThrowError;
exports.createError = createError;
