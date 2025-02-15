# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for caching layers)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend files
COPY . .

# Build the frontend (no SSL needed during build)
RUN npm run build

# Install a lightweight static file server
RUN npm install -g serve

# Create cert directory
RUN mkdir -p /cert

# Expose the port to serve built files
EXPOSE 3000

# Serve the built frontend with SSL
CMD ["sh", "-c", "serve -s dist -l 3000 --ssl-cert /cert/cert.pem --ssl-key /cert/key.pem"]