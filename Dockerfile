FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN rm -rf test tests docs .git


EXPOSE 3000

CMD ["npm", "start"]