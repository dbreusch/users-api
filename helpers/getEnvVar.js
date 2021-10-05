// try to get a variable from the environment.  throw error 500 if not found.
const getEnvVar = (envVarName) => {
  let envVar;
  try {
    envVar = `process.env.${envVarName}`;
    return envVar;
  } catch (err) {
    createAndThrowError(`Environment variable ${envVarName} not found.`, 500);
  }
}

exports.getEnvVar = getEnvVar;
