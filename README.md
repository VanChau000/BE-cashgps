# cashgps
## Install environment
- install nodejs (https://nodejs.org/en/download/)
- install VSCode (https://code.visualstudio.com/download)
- install Docker (https://docs.docker.com/engine/install)
## Install dependencies
- npm i
## Build
- npm run build (without docker)
- docker-compose up --build
## Test
- npm run test
## Migrate data tables
- docker-compose up --build flyway
## Run server on Development mode
- npm run dev (without docker)
- docker-compose up
## Run server on Production mode
- npm run prod
## Environment variables
```
MYSQL_HOST=mysql(docker) | localhost
MYSQL_USER=root
MYSQL_PWD=root
MYSQL_DBNAME=cashGps
MYSQL_PORT=3306
JWT_SECRET=xxxxxx
WEB_URL=http://localhost:4000
PORT=4000
CLIENT_URL=http://localhost:3000
AWS_SES_ACCESS_KEY_ID=AKIA
AWS_SES_SECRET_ACCESS_KEY=1ft
AWS_SES_REGION=us-west-1
AWS_SES_SENDER_EMAIL=example@gmail.com
STRIPE_SK=sk_test_12345
WEBHOOK_SC=whsec_12345
MONTHLY_PRICE_ID=price_12345
YEARLY_PRICE_ID=price_abcde
```