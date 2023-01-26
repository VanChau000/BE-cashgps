import fs from 'fs';
import path from 'path';
import express from 'express';
import http from 'http';
import resolvers from '../../resolvers';
import { ApolloServer } from 'apollo-server-express';
import { context } from '../../utils/contextApollo';
import routes from '../../routes';
import axios from 'axios';
import app from '../../app';
import clients from '../../clients';
import knex from '../../clients/knex';

type RequestType = 'apollo' | 'express';

interface RequestInput {
  query?: string;
  payload?: any;
}

interface IRequest {
  type: RequestType;
  input: RequestInput;
}

/**
 * create apollo server
 * @param {boolean} isExpressRequired
 * @returns {Promise<ApolloServer<ExpressContext>>}
 */
const createServer = async (isExpressRequired: boolean = false) => {
  const typeDefs = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'graphql/typeDefs.graphql'),
    'utf8'
  );
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    csrfPrevention: true,
    cache: 'bounded',
    context
  });

  clients.knex.getInstance();

  await server.start();
  if (isExpressRequired) {
    routes(app);
    server.applyMiddleware({ app });
  }

  const trx = await knex.getInstance();
  try {
    await trx.raw('SELECT 1');
    console.log('PostgreSQL connected');
    console.log(`🚀 Server ready at http://localhost:80/${server.graphqlPath}`);
  } catch (e) {
    console.log(e);
    console.log('PostgreSQL not connected');
    console.log('Server crashed');
  }

  return { server, httpServer };
};

/**
 * Mock a call to the backend for integration tests
 * @param {IRequest} request
 * @param {boolean} expectErrors - If false, jest will fail the test if an error is thrown
 * @returns {Promise<any>}
 */
const makeRequest = async (
  request: IRequest,
  expectErrors: boolean = false
): Promise<any> => {
  if (request.type === 'apollo') {
    const { server } = await createServer();
    const response = await server.executeOperation(
      {
        query: request.input.query,
        variables: request.input.payload
      },
      {
        req: {
          headers: {
            authorization:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNjYiLCJlbWFpbCI6ImR1Y0BuZWxpc29mdHdhcmVzLmNvbSIsImlhdCI6MTY3MjA0NTYwOCwiZXhwIjoxNjc0NjM3NjA4fQ.V0BTszbnGZktJrp1DEHjvwJDGr8Y5PsrbT3zW8uycSI'
          }
        }
      } as any
    );
    await server.stop();
    if (!expectErrors) {
      if (response.errors !== undefined) {
        console.log(response.errors[0]);
      }
    } else {
      expect(response.errors?.length).toBeGreaterThan(0);
    }

    return response;
  }

  if (request.type === 'express') {
    const { server } = await createServer(true);
    try {
      const response = await axios.post(
        `http://localhost:80/${request.input.payload.route}`,
        {
          ...request.input.payload.body
        }
      );
      if (expectErrors) {
        console.log('Expected an error to be thrown, but the call succeeded');
      }
      await server.stop();
      return response;
    } catch (e: any) {
      await server.stop();
      if (!expectErrors) {
        console.log(e.message);
      }
    }
  }
};

export default makeRequest;
