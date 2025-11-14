import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import { Schema } from "@effect/schema"
import { UserService } from "../services/userService.js"

// Schema definitions using @effect/schema
const CreateUserRequest = Schema.Struct({
  name: Schema.String,
  email: Schema.String,
})

const UpdateUserRequest = Schema.Struct({
  name: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
})

// Combine all user routes
export const usersRouter = HttpRouter.empty.pipe(
  // GET /users - List all users
  HttpRouter.get(
    "/users",
    Effect.gen(function* () {
      const userService = yield* UserService
      const users = yield* userService.listUsers()

      return yield* HttpServerResponse.json({
        success: true,
        data: users,
      })
    })
  ),
  // GET /users/:id - Get a specific user
  HttpRouter.get(
    "/users/:id",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const { id } = request.params as { id: string }

      const userService = yield* UserService
      const user = yield* userService.getUserById(id)

      if (!user) {
        return yield* HttpServerResponse.json(
          {
            success: false,
            error: "User not found",
          },
          { status: 404 }
        )
      }

      return yield* HttpServerResponse.json({
        success: true,
        data: user,
      })
    })
  ),
  // POST /users - Create a new user
  HttpRouter.post(
    "/users",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const body = yield* request.json

      // Validate request body
      const validatedBody = yield* Schema.decodeUnknown(CreateUserRequest)(body).pipe(
        Effect.mapError((error) => ({
          _tag: "ValidationError" as const,
          message: "Invalid request body",
          details: error,
        }))
      )

      const userService = yield* UserService
      const user = yield* userService.createUser(validatedBody)

      return yield* HttpServerResponse.json(
        {
          success: true,
          data: user,
        },
        { status: 201 }
      )
    }).pipe(
      Effect.catchTag("ValidationError", (error) =>
        HttpServerResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 }
        )
      )
    )
  ),
  // PUT /users/:id - Update a user
  HttpRouter.put(
    "/users/:id",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const { id } = request.params as { id: string }
      const body = yield* request.json

      // Validate request body
      const validatedBody = yield* Schema.decodeUnknown(UpdateUserRequest)(body).pipe(
        Effect.mapError((error) => ({
          _tag: "ValidationError" as const,
          message: "Invalid request body",
          details: error,
        }))
      )

      const userService = yield* UserService
      const user = yield* userService.updateUser(id, validatedBody)

      if (!user) {
        return yield* HttpServerResponse.json(
          {
            success: false,
            error: "User not found",
          },
          { status: 404 }
        )
      }

      return yield* HttpServerResponse.json({
        success: true,
        data: user,
      })
    }).pipe(
      Effect.catchTag("ValidationError", (error) =>
        HttpServerResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 }
        )
      )
    )
  ),
  // DELETE /users/:id - Delete a user
  HttpRouter.del(
    "/users/:id",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const { id } = request.params as { id: string }

      const userService = yield* UserService
      const success = yield* userService.deleteUser(id)

      if (!success) {
        return yield* HttpServerResponse.json(
          {
            success: false,
            error: "User not found",
          },
          { status: 404 }
        )
      }

      return yield* HttpServerResponse.json({
        success: true,
        message: "User deleted successfully",
      })
    })
  )
)
