FROM mcr.microsoft.com/playwright:v1.47.2-noble as base

WORKDIR /app

RUN git clone https://github.com/zjmiller/screenshot-service-1

WORKDIR /app/screenshot-service-1

COPY .env .env

RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]