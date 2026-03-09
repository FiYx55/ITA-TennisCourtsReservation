# Proto — Shared gRPC Definitions

Contains Protocol Buffer (`.proto`) files that define the gRPC contracts shared between services.

## Usage

These `.proto` files are the **single source of truth** for gRPC communication in the system. Each service that acts as a gRPC server or client must generate code from these definitions in its own language.

### Services using these contracts

| Service               | Role        | Language |
|-----------------------|-------------|----------|
| **user-service**      | gRPC Server | C#       |
| **api-gateway**       | gRPC Client | TypeScript (Node.js) |
| **reservation-service** | gRPC Client | TypeScript (Bun) |

## File Structure

```
proto/
└── user.proto        # User service gRPC contract
```

## Notes

- Do not place generated code in this directory — each service generates its own stubs.
- When modifying a `.proto` file, remember to regenerate code in all consuming services.
