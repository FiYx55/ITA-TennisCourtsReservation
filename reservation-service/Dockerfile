FROM oven/bun:1-alpine

WORKDIR /app

# Copy proto file (needed for gRPC client)
COPY proto/user.proto proto/user.proto

# Copy dependency manifests
COPY reservation-service/package.json reservation-service/bun.lock* ./reservation-service/

# Install dependencies
WORKDIR /app/reservation-service
RUN bun install

# Copy source code
COPY reservation-service/ .

# Run migration then start
EXPOSE 2004

CMD ["sh", "-c", "bun run migrate && bun run start"]
