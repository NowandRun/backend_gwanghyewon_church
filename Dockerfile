# Stage 1: Build
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-slim
WORKDIR /app

# 빌드 결과물 및 package.json 복사
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --omit=dev

# 포트 노출
EXPOSE 4000

# 백엔드 직접 실행 (마이그레이션 단계 제거)
CMD ["node", "dist/main.js"]