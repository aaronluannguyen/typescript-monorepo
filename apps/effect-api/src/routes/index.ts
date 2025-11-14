import { HttpRouter, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import { usersRouter } from "./users.js"

// Combine all routes
export const router = HttpRouter.empty.pipe(
  // Root endpoint
  HttpRouter.get(
    "/",
    Effect.gen(function* () {
      return yield* HttpServerResponse.json({
        message: "Effect API is running",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        framework: "EffectTS",
      })
    })
  ),
  // Health check endpoint
  HttpRouter.get(
    "/health",
    Effect.gen(function* () {
      return yield* HttpServerResponse.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
      })
    })
  ),
  // Mount users router
  HttpRouter.concat(usersRouter),
  // 404 handler
  HttpRouter.catchAll(() =>
    Effect.gen(function* () {
      return yield* HttpServerResponse.json(
        {
          success: false,
          error: "Route not found",
        },
        { status: 404 }
      )
    })
  )
)
