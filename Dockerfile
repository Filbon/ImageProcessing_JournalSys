# Use the Node.js base image
FROM node:18-slim

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if it exists)
COPY package*.json ./

# Install build tools for compiling native add-ons like sharp
RUN apt-get update && apt-get install -y \
    build-essential \
    libvips-dev

# Install the npm dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your service runs on (adjust if necessary)
EXPOSE 5000

# Run the app
CMD ["npm", "start"]
