# API Documentation

## Base URL
```
http://localhost:3000
```

## Endpoints

### Health Check

#### GET /
Returns basic API information.

**Response:**
```json
{
  "message": "API is running",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Users Resource

### GET /users
Retrieve all users.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "john@example.com",
      "name": "John Doe",
      "bio": "Software developer",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET /users/:id
Retrieve a specific user by ID.

**Parameters:**
- `id` (string, required) - User UUID

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john@example.com",
    "name": "John Doe",
    "bio": "Software developer",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "error": "User with ID 123... not found"
}
```
Status Code: 404

---

### POST /users
Create a new user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "name": "John Doe",
  "bio": "Software developer" // optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john@example.com",
    "name": "John Doe",
    "bio": "Software developer",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```
Status Code: 201

**Response (Validation Error):**
```json
{
  "success": false,
  "error": "Validation error message"
}
```
Status Code: 400

**Response (Duplicate Email):**
```json
{
  "success": false,
  "error": "User with email john@example.com already exists"
}
```
Status Code: 409

---

### PATCH /users/:id
Update an existing user.

**Parameters:**
- `id` (string, required) - User UUID

**Request Body:**
```json
{
  "name": "Jane Doe", // optional
  "bio": "Updated bio" // optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john@example.com",
    "name": "Jane Doe",
    "bio": "Updated bio",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "error": "User with ID 123... not found"
}
```
Status Code: 404

---

### DELETE /users/:id
Delete a user.

**Parameters:**
- `id` (string, required) - User UUID

**Response (Success):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "error": "User with ID 123... not found"
}
```
Status Code: 404

---

## Testing with cURL

### Create a user
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "bio": "Software developer"
  }'
```

### Get all users
```bash
curl http://localhost:3000/users
```

### Get a specific user
```bash
curl http://localhost:3000/users/{user-id}
```

### Update a user
```bash
curl -X PATCH http://localhost:3000/users/{user-id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "bio": "Updated bio"
  }'
```

### Delete a user
```bash
curl -X DELETE http://localhost:3000/users/{user-id}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error
