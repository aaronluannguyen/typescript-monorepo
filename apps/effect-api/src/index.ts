import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { HttpServer } from "@effect/platform"
import { Effect, Layer } from "effect"
import { router } from "./routes/index.js"
import { UserServiceLive } from "./services/userService.js"

// Server configuration
const port = process.env.PORT ? parseInt(process.env.PORT) : 3001
const ServerLive = BunHttpServer.layer({ port })

// Combine all layers
const AppLayer = Layer.merge(ServerLive, UserServiceLive)

// Main program
const program = HttpServer.serve(router)

const runnable = Layer.launch(program.pipe(Layer.provide(AppLayer)))

BunRuntime.runMain(runnable)
