FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY server/package*.json ./server/
RUN cd server && npm install

COPY . .

RUN npm run build

EXPOSE 3081

CMD ["npm", "start"]