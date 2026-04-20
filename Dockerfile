# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm run install-all

# Copy source code
COPY . .

# Build the application
ENV VITE_API_URL=""
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]