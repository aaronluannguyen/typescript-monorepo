# TypeScript Monorepo

A modern TypeScript monorepo built with cutting-edge technologies for scalable full-stack development.

## Tech Stack

### Core Technologies
- **Runtime & Package Manager**: [Bun](https://bun.sh/) - Fast JavaScript runtime and package manager
- **Monorepo Management**: [Turbo](https://turbo.build/) - High-performance build system
- **Language**: TypeScript with strict mode enabled
- **Deployment**: [Vercel Fluid Compute](https://vercel.com/)

### Backend Stack
- **API Framework**: [Hono](https://hono.dev/) - Ultrafast web framework
- **Effect System**: [Effect-TS](https://effect.website/) - Powerful TypeScript framework for building robust applications
- **Database**: PostgreSQL hosted on [Planetscale](https://planetscale.com/postgres)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - Type-safe SQL toolkit

## Project Structure

```
typescript-monorepo/
├── apps/
│   ├── api/          # Hono REST API with Effect-TS
│   ├── mobile/       # Mobile app (placeholder)
│   └── web/          # Web app (placeholder)
├── packages/
│   ├── db/           # Database client, schema, and migrations
│   └── users/        # User business logic and services
├── package.json      # Root workspace configuration
├── turbo.json        # Turbo configuration
└── tsconfig.json     # Base TypeScript configuration
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.1.38
- PostgreSQL database (Planetscale account recommended)
- Node.js >= 18.0.0 (for compatibility)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd typescript-monorepo
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**

   Create `.env` files in the appropriate directories:

   **packages/db/.env**
   ```bash
   DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
   ```

   **apps/api/.env**
   ```bash
   PORT=3000
   DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
   ```

4. **Generate database migrations**
   ```bash
   bun run db:generate
   ```

5. **Run migrations**
   ```bash
   cd packages/db
   bun run db:migrate
   ```

### Development

**Start the API server in development mode:**
```bash
cd apps/api
bun run dev
```

The API will be available at `http://localhost:3000`

**Run all apps in development mode:**
```bash
bun run dev
```

### Build

**Build all packages and apps:**
```bash
bun run build
```

**Build specific app:**
```bash
cd apps/api
bun run build
```

## API Endpoints

### Users Resource

The API includes a complete REST API for managing users:

#### Get all users
```http
GET /users
```

#### Get user by ID
```http
GET /users/:id
```

#### Create a new user
```http
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "bio": "Optional bio text"
}
```

#### Update a user
```http
PATCH /users/:id
Content-Type: application/json

{
  "name": "Jane Doe",
  "bio": "Updated bio"
}
```

#### Delete a user
```http
DELETE /users/:id
```

### Health Check
```http
GET /health
```

## Database Management

### Generate new migration
```bash
bun run db:generate
```

### Run migrations
```bash
bun run db:migrate
```

### Open Drizzle Studio
```bash
bun run db:studio
```

## Deployment

### Vercel Deployment

This monorepo is configured for Vercel's Fluid Compute with Bun runtime.

1. **Install Vercel CLI**
   ```bash
   bun add -g vercel
   ```

2. **Link your project**
   ```bash
   vercel link
   ```

3. **Set environment variables**
   ```bash
   vercel env add DATABASE_URL
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables on Vercel

Make sure to set these in your Vercel project settings:
- `DATABASE_URL` - Your Planetscale Postgres connection string

## Package Details

### @repo/db
Database package containing:
- Drizzle ORM client configuration
- Database schema definitions
- Migration scripts
- Effect-TS integration for database operations

**Key exports:**
- `DatabaseService` - Effect-TS service for database access
- `DatabaseLive` - Layer for providing database service
- Schema definitions (users, etc.)

### @repo/users
User business logic package containing:
- User service with CRUD operations
- Type definitions
- Effect-TS integration
- Error handling

**Key exports:**
- `UserService` - Effect-TS service for user operations
- `UserServiceLive` - Layer for providing user service
- Type definitions and validation schemas

## Scripts

### Root Scripts
- `bun run dev` - Start all apps in development mode
- `bun run build` - Build all packages and apps
- `bun run lint` - Lint all packages and apps
- `bun run type-check` - Type check all packages and apps
- `bun run clean` - Clean all build artifacts and node_modules
- `bun run db:generate` - Generate database migrations
- `bun run db:migrate` - Run database migrations
- `bun run db:studio` - Open Drizzle Studio

## Technology Highlights

### Effect-TS Integration
This monorepo leverages Effect-TS for:
- Type-safe error handling
- Dependency injection
- Composable services
- Railway-oriented programming

Example from the user service:
```typescript
const user = await runEffect(
  Effect.flatMap(UserService, (service) => service.getById(id))
);
```

### Drizzle ORM
Type-safe database operations with Drizzle:
- Automatic TypeScript types from schema
- SQL-like query builder
- Migration management
- Zod schema integration

### Hono Framework
Ultrafast web framework with:
- Express-like API
- Built-in middleware
- Type-safe routing
- Great DX with Bun

## Contributing

1. Create a feature branch
2. Make your changes
3. Run type checking: `bun run type-check`
4. Build: `bun run build`
5. Submit a pull request

## License

MIT
