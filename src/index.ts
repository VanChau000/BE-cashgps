import http from 'http';
import fs from 'fs';
import path from 'path';
import { ApolloServer } from 'apollo-server-express';
import dotenv from 'dotenv';
import app from './app';
import resolvers from './resolvers';
import routes from './routes';
import { context } from './utils/contextApollo';
import clients from './clients';
import knex from './clients/knex';

// Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env.
dotenv.config();
//
const typeDefs = fs.readFileSync(
  path.join(__dirname, '../graphql/typeDefs.graphql'),
  'utf8'
);

const PORT = process.env.PORT;

async function startApolloServer(typeDefs: any, resolvers: any) {
  // init express server
  const httpServer = http.createServer(app);
  // init apollo server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context,
    csrfPrevention: true,
    cache: 'bounded'
  });

  //init database
  clients.knex.getInstance();
  //make router for server
  routes(app);

  //starting server with graphql
  await server.start();
  // server grahpqh with middllewares express (app)
  server.applyMiddleware({ app });

  //run express nodejs
  await httpServer.listen(PORT);

  // test conect database
  const trx = await knex.getInstance();
  try {
    await trx.raw('SELECT 1');
    console.log('PostgreSQL connected');
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
    );
  } catch (e) {
    console.log(e);
    console.log('PostgreSQL not connected');
    console.log('Server crashed');
  }
}

(async () => {
  await startApolloServer(typeDefs, resolvers);
})();
