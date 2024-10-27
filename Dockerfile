# Use the official Node.js image as a base
FROM node:18-slim

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Environment variable to indicate production environment
ENV NODE_ENV=production

# Run the application
CMD ["node", "index.js"]
