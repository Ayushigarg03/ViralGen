FROM node:20-slim

WORKDIR /app

# Install dependencies first (for layer caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy application source code
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Start Vite development server
CMD ["npm", "run", "dev"]
