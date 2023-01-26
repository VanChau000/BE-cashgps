import { ApolloError } from 'apollo-server-express';
import nodemailer from 'nodemailer';

const {
  SMTP_USERNAME,
  SMTP_PASSWORD,
  SMTP_ENDPOINT,
  START_TLS_PORT,
  AWS_SENDER_EMAIL
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_ENDPOINT as any,
  port: START_TLS_PORT as any,
  auth: {
    user: SMTP_USERNAME as any,
    pass: SMTP_PASSWORD as any
  }
});

const sendEmail = async (recipient: string, subject: string, body: string) => {
  try {
    await transporter.sendMail({
      from: AWS_SENDER_EMAIL as any,
      to: recipient,
      subject,
      html: body
    });
  } catch (error) {
    throw new ApolloError('Something was wrong, try later!');
  }
};

export default sendEmail;
