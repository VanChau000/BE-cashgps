import express, { Express } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';

dotenv.config();

const app: Express = express();

// logs
app.use(morgan('dev'));

// CORS options
const corsOptions = {
  origin: '*',
  credentials: true //access-control-allow-credentials:true
};

// middlewares
app.use(cors(corsOptions));
app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use('/webhooks', express.raw({ type: '*/*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

export default app;
