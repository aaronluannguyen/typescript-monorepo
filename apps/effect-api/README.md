# Effect API

A modern REST API built entirely with [EffectTS](https://effect.website/) - a powerful TypeScript framework for building robust, type-safe applications with functional programming patterns.

## Features

- **Pure EffectTS Implementation**: Built using `@effect/platform` for HTTP server capabilities
- **Type-Safe**: Full TypeScript support with Effect's type system
- **Schema Validation**: Request/response validation using `@effect/schema`
- **Functional Programming**: Leverages Effect's functional patterns for composability and error handling
- **Service Layer**: Demonstrates Effect's Context and Layer system for dependency injection
- **In-Memory Storage**: Uses Effect's `Ref` for managed state

## Tech Stack

- **Runtime**: Bun
- **Framework**: EffectTS (`effect`, `@effect/platform`, `@effect/platform-bun`)
- **Validation**: `@effect/schema`
- **Language**: TypeScript

## API Endpoints

### Health & Status

- `GET /` - API info and version
- `GET /health` - Health check endpoint

### Users

- `GET /users` - List all users
- `GET /users/:id` - Get a specific user
- `POST /users` - Create a new user
- `PUT /users/:id` - Update a user
- `DELETE /users/:id` - Delete a user

## Getting Started

### Development

```bash
# Install dependencies (from monorepo root)
bun install

# Run in development mode with hot reload
bun dev

# Or run from monorepo root
turbo run dev --filter=@repo/effect-api
```

### Build

```bash
# Build for production
bun run build

# Run production build
bun run start
```

### Type Checking

```bash
bun run type-check
```

## Project Structure

```
src/
├── index.ts              # Main entry point and server setup
├── routes/
│   ├── index.ts         # Route composition and 404 handling
│   └── users.ts         # User CRUD endpoints
├── services/
│   └── userService.ts   # User service with Effect Context
└── utils/               # Utility functions
```

## Effect Patterns Used

### HTTP Router

Uses `@effect/platform`'s `HttpRouter` for declarative routing:

```typescript
const route = HttpRouter.get(
  "/users",
  Effect.gen(function* () {
    const userService = yield* UserService
    const users = yield* userService.listUsers()
    return yield* HttpServerResponse.json({ data: users })
  })
)
```

### Service Layer with Context

Services are defined using Effect's Context system:

```typescript
export interface UserService {
  listUsers: () => Effect.Effect<User[]>
  getUserById: (id: string) => Effect.Effect<User | null>
  // ... other methods
}

export const UserService = Context.GenericTag<UserService>("@services/UserService")
```

### Schema Validation

Request validation using `@effect/schema`:

```typescript
const CreateUserRequest = Schema.Struct({
  name: Schema.String,
  email: Schema.String,
})

const validatedBody = yield* Schema.decodeUnknown(CreateUserRequest)(body)
```

### Error Handling

Type-safe error handling with Effect's error system:

```typescript
Effect.catchTag("ValidationError", (error) =>
  HttpServerResponse.json(
    { success: false, error: error.message },
    { status: 400 }
  )
)
```

## Configuration

Environment variables (see `.env.example`):

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Why EffectTS?

EffectTS provides:

1. **Type Safety**: Comprehensive type inference and type-safe errors
2. **Composability**: Build complex applications from simple, composable pieces
3. **Resource Management**: Automatic resource cleanup and lifecycle management
4. **Testing**: Built-in support for testing with dependency injection
5. **Performance**: Efficient runtime with minimal overhead
6. **Observability**: Built-in logging, metrics, and tracing support

## Learn More

- [Effect Documentation](https://effect.website/docs/introduction)
- [Effect Platform](https://effect.website/docs/platform/introduction)
- [Effect Schema](https://effect.website/docs/schema/introduction)
