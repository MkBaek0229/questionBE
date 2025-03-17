FROM node:18-alpine

# 작업 디렉토리를 설정합니다.
WORKDIR /app

# 의존성을 설치합니다.
COPY package*.json ./
RUN npm install

# 소스 코드를 복사합니다.
COPY . .

# 애플리케이션을 빌드합니다.
RUN npm run build

# 애플리케이션을 시작합니다.
CMD ["npm", "start"]

EXPOSE 3000