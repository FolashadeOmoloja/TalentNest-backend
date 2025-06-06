# Use Node.js v18 as base image
FROM node:18

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the codebase into the container
COPY . .

# Expose the port your app runs on
EXPOSE 8000

# Command to run the app
CMD ["node", "index.js"]
