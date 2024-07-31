FROM node:18
RUN mkdir -p /svr/app
WORKDIR /svr/app
COPY . .
RUN npm install
RUN npm run build
RUN npm i -g @nestjs/cli --silent
EXPOSE 4000
CMD ["node", "dist/main.js"]
ENV DB_HOST=172.26.186.243 \
	DB_PORT=5432 \
	DB_USERNAME=dev \
	DB_PASSWORD=123 \
	DB_NAME=account-qna-notice \
	REFRESHTOKEN_PRIVATE_KEY=JEKlico14O92PEa \
	ACCESSTOKEN_PRIVATE_KEY=m1RjJLWObf4QALi \
	ACCESSTOKEN_EXPIRESIN=1h \
	REFRESHTOKEN_EXPIRESIN=7d \
	BCRYPT_SALT_ROUNDS=13 \
	ACCESSTOKEN_HTTP_ONLY=true \
	ACCESSTOKEN_SAMESITE=none \
	ACCESSTOKEN_SECURE=true \
	ACCESSTOKEN_MAX_AGE=3600000 \ 
	REFRESHTOKEN_HTTP_ONLY=true \
	REFRESHTOKEN_SAMESITE=none \
	REFRESHTOKEN_SECURE=true \
	REFRESHTOKEN_MAX_AGE=604800000 \
	ACCESSTOKEN_LOGOUT_MAX_AGE=0 \
	REFRESHTOKEN_LOGOUT_MAX_AGE=0 \
	NODE_ENV=production
