import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

import EnvVars from '@src/common/constants/env';

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
  EnvVars.UserServiceGrpcUrl,
  grpc.credentials.createInsecure(),
);

export interface UserResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  isActive: boolean;
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
export const getUsers = promisify<Record<string, never>, { users: UserResult[] }>(client.GetUsers);
export const createUser = promisify<{ email: string; firstName: string; lastName: string; password: string }, UserResult>(client.CreateUser);
export const updateUser = promisify<{ id: string; email: string; firstName: string; lastName: string }, UserResult>(client.UpdateUser);
export const deleteUser = promisify<{ id: string }, { success: boolean }>(client.DeleteUser);
export const verifyUser = promisify<{ email: string; password: string }, VerifyUserResult>(client.VerifyUser);
