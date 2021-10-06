// try to get a variable from the environment.  throw error 500 if not found.
const { createAndThrowError } = require('./error');

const getEnvVar = (envVarName) => {
  let envVar;
  try {
    envVar = process.env[envVarName];
    // console.log(`${envVarName} ${envVar}`);
    if (envVar !== undefined) {
      return envVar;
    } else {
      createAndThrowError(`Environment variable ${envVarName} not found.`, 500);
    }
  } catch (err) {
    createAndThrowError(`Error accessing environment variable ${envVarName}.`, 500);
  }
};

exports.getEnvVar = getEnvVar;
