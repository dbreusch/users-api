FROM node:14-alpine

WORKDIR /app

COPY package.json .

RUN npm install

# if you want to use nodemon as the CMD, needs to be installed
RUN npm i -g nodemon

COPY . .

EXPOSE 3001

# use node for "production" and nodemon for "development"
# CMD [ "node", "users-app.js" ]
CMD [ "nodemon", "users-app.js" ]
