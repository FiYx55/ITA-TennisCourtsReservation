import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import logger from 'jet-logger';
import morgan from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import Paths from '@src/common/constants/Paths';
import { RouteError } from '@src/common/utils/route-errors';
import BaseRouter from '@src/routes/apiRouter';

import EnvVars, { NodeEnvs } from './common/constants/env';

const app = express();

// **** Middleware **** //

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (EnvVars.NodeEnv === NodeEnvs.DEV) {
  app.use(morgan('dev'));
}

if (EnvVars.NodeEnv === NodeEnvs.PRODUCTION) {
  app.use(helmet());
}

// **** Swagger **** //

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tennis Courts - Web API Gateway',
      description: 'Web API gateway with full admin and user features for the Tennis Court Reservation system.',
      version: '1.0.0',
    },
  },
  apis: [], // We use programmatic routes, not JSDoc annotations
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// **** Health **** //

app.get(Paths.Health, (_: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// **** API routes **** //

app.use(Paths._, BaseRouter);

// **** Error handler **** //

app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
  if (EnvVars.NodeEnv !== NodeEnvs.TEST.valueOf()) {
    logger.err(err, true);
  }
  if (err instanceof RouteError) {
    res.status(err.status).json({ error: err.message });
  }
  return next(err);
});

export default app;
