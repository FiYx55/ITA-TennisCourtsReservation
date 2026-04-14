FROM node:20-alpine

WORKDIR /app

# Copy proto file (needed for gRPC client)
COPY proto/user.proto proto/user.proto

# Copy dependency manifests
COPY api-gateway-mobile/package*.json ./api-gateway-mobile/

# Install dependencies
WORKDIR /app/api-gateway-mobile
RUN npm ci

# Copy source code
COPY api-gateway-mobile/ .

# Build TypeScript
RUN npm run build:ts

EXPOSE 2007

CMD ["npm", "run", "start:prod"]
