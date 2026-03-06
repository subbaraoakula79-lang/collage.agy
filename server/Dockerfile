# Use node 20 image
FROM node:20-slim

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Start the application
CMD [ "npm", "start" ]
