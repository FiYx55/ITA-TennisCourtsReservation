import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { config } from "../config";

const PROTO_PATH = path.resolve(__dirname, "../../../proto/user.proto");

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
  grpc.credentials.createInsecure()
);

export interface VerifyUserResult {
  valid: boolean;
  userId: string;
}

export interface UserResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  isActive: boolean;
}

export function verifyUser(email: string, password: string): Promise<VerifyUserResult> {
  return new Promise((resolve, reject) => {
    client.VerifyUser({ email, password }, (err: any, response: VerifyUserResult) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

export function getUser(id: string): Promise<UserResult> {
  return new Promise((resolve, reject) => {
    client.GetUser({ id }, (err: any, response: UserResult) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}
