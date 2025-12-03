# Using the base image Node.js
FROM node:25-alpine3.21

# Setting working directory
WORKDIR /usr/src/app

# Copying package files and installing all dependencies
COPY package*.json ./
RUN npm install

# Copying the rest of the project into WORKDIR
COPY . .

# Setting intiail command when the container starts
CMD ["node", "client.js"]