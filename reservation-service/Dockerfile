FROM oven/bun:1-alpine

WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

EXPOSE 3001

CMD ["bun", "run", "src/index.ts"]
