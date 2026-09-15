FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma generate && node index.js"]
