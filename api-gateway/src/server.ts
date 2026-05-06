import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import logger from 'jet-logger';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import Paths from '@src/common/constants/Paths';
import { swaggerSpec } from '@src/common/swagger';
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
