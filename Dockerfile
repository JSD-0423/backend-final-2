FROM node:alpine
WORKDIR /e-commerce-app
COPY package*.json .
RUN npm install
COPY . .
