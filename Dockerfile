FROM node:22
RUN mkdir -p /app
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/main.js"]
