# users-api
A simple API to register and login users.

## Environment variables:
Copy env-example to .env and update with your local settings.

### AUTH_API_ADDRESS
Address for the auth_api service.  Value depends on whether you are running the app directly (with node, nodemon use localhost:8080) or via docker/docker-compose (use auth:8080).

### MONGODB_USERNAME
MongoDB login username.

### MONGODB_PASSWORD
MongoDB login password.

### MONGODB_URL
MongoDB cluster URL (e.g., cluster0.ggsdv.mongodb.net).

### MONGODB_NAME
MongoDB database name for this application (e.g., gpstracks-dev)

### USER_SESSIONKEY
User session key for express-session (string).

### PORT
Listening port for this service (3001).
