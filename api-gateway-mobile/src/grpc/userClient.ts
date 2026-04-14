import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'node:path';
import { config } from '../config/index';

const PROTO_PATH = path.resolve(__dirname, '../../../proto/user.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef) as any;

const client = new proto.user.UserGrpc(
  config.userServiceGrpcUrl,
  grpc.credentials.createInsecure(),
);

export interface UserResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  isActive: boolean;
  role: string;
}

export interface VerifyUserResult {
  valid: boolean;
  userId: string;
}

function promisify<TReq, TRes>(method: Function): (req: TReq) => Promise<TRes> {
  return (req: TReq) =>
    new Promise((resolve, reject) => {
      method.call(client, req, (err: any, res: TRes) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
}

export const getUser = promisify<{ id: string }, UserResult>(client.GetUser);
export const verifyUser = promisify<{ email: string; password: string }, VerifyUserResult>(client.VerifyUser);
export const createUser = promisify<{ email: string; firstName: string; lastName: string; password: string }, UserResult>(client.CreateUser);
