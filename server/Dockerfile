# Use Node.js LTS version as the base image
FROM node:22-slim

# Set working directory
WORKDIR /src

# Define build arguments
ARG MONGODB_URI
ARG JWT_SECRET
ARG NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=${NODE_ENV}
ENV PORT=5000
ENV MONGODB_URI=${MONGODB_URI}
ENV JWT_SECRET=${JWT_SECRET}

# Command to run the application
CMD ["npm", "start"]
