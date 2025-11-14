# Effect API Documentation

## Base URL

```
http://localhost:3001
```

## Endpoints

### Health & Status

#### GET /

Get API information and status.

**Response:**
```json
{
  "message": "Effect API is running",
  "version": "1.0.0",
  "timestamp": "2025-11-14T04:33:54.307Z",
  "framework": "EffectTS"
}
```

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T04:34:03.461Z"
}
```

### Users

#### GET /users

List all users.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "createdAt": "2025-11-14T04:33:46.160Z"
    },
    {
      "id": "2",
      "name": "Bob Smith",
      "email": "bob@example.com",
      "createdAt": "2025-11-14T04:33:46.160Z"
    }
  ]
}
```

#### GET /users/:id

Get a specific user by ID.

**Parameters:**
- `id` (path): User ID

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "createdAt": "2025-11-14T04:33:46.160Z"
  }
}
```

**Not Found Response (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

#### POST /users

Create a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "4",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-11-14T04:34:25.191Z"
  }
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Invalid request body"
}
```

#### PUT /users/:id

Update an existing user.

**Parameters:**
- `id` (path): User ID

**Request Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Updated Name",
    "email": "updated@example.com",
    "createdAt": "2025-11-14T04:33:46.160Z"
  }
}
```

**Not Found Response (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

#### DELETE /users/:id

Delete a user.

**Parameters:**
- `id` (path): User ID

**Success Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Not Found Response (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

## Example Usage

### Using cURL

```bash
# Get all users
curl http://localhost:3001/users

# Get a specific user
curl http://localhost:3001/users/1

# Create a new user
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Update a user
curl -X PUT http://localhost:3001/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# Delete a user
curl -X DELETE http://localhost:3001/users/1
```

### Using JavaScript (fetch)

```javascript
// Get all users
const users = await fetch('http://localhost:3001/users').then(r => r.json())

// Create a new user
const newUser = await fetch('http://localhost:3001/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John Doe', email: 'john@example.com' })
}).then(r => r.json())

// Update a user
const updated = await fetch('http://localhost:3001/users/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Updated Name' })
}).then(r => r.json())

// Delete a user
await fetch('http://localhost:3001/users/1', { method: 'DELETE' })
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## Effect Features Used

This API demonstrates the following EffectTS features:

1. **HttpRouter** - Declarative routing with type-safe handlers
2. **Effect Generators** - Using `Effect.gen` for readable async code
3. **Schema Validation** - Request validation using `@effect/schema`
4. **Service Layer** - Dependency injection with Effect Context
5. **Error Handling** - Type-safe error handling with `Effect.catchTag`
6. **State Management** - Using `Ref` for managed mutable state
7. **Logging** - Built-in logging with `Effect.log`
