FROM node:20-alpine

WORKDIR /app

# Copy proto file (needed for gRPC client)
COPY proto/user.proto proto/user.proto

# Copy dependency manifests
COPY api-gateway/package*.json ./api-gateway/

# Install dependencies
WORKDIR /app/api-gateway
RUN npm ci

# Copy source code and config
COPY api-gateway/ .

# Build TypeScript
RUN npm run build

EXPOSE 2001

CMD ["npm", "run", "start:docker"]
