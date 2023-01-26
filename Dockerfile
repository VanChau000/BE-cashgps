FROM node:14

EXPOSE 8081

ARG BUILD_NUMBER
ENV BUILD_NUMBER=$BUILD_NUMBER

WORKDIR /app
COPY . .
RUN npm install && npm run build

CMD ["npm","run","prod"]

