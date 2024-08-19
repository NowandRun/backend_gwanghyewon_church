FROM node:22 AS build
RUN mkdir -p /app
WORKDIR /app
COPY package*.json /app/
RUN npm install
COPY . /app
RUN npm run build

# Stage 2: Production
FROM node:22-slim

# Create and set working directory
WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package*.json ./

# Install production dependencies
RUN npm install --only=production && npm prune --production

# Expose the port the app runs on
EXPOSE 4000

# Command to run the application
CMD ["sh", "-c", "npm run typeorm:run && node dist/main.js"]