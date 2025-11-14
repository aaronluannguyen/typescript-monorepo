import { Hono } from "hono";
import { Effect, Layer } from "effect";
import { DatabaseLive } from "@repo/db/client";
import {
  UserService,
  UserServiceLive,
  UserNotFoundError,
  UserValidationError,
  UserAlreadyExistsError,
} from "@repo/users/service";
import type { CreateUserInput, UpdateUserInput } from "@repo/users/types";

const users = new Hono();

// Dependency injection layer
const AppLayer = Layer.provide(
  Layer.succeed(UserService, UserServiceLive),
  DatabaseLive
);

// Helper function to run Effect programs
const runEffect = <A, E>(
  effect: Effect.Effect<A, E, UserService>
): Promise<A> => {
  return Effect.runPromise(Effect.provide(effect, AppLayer));
};

// GET /users - Get all users
users.get("/", async (c) => {
  try {
    const allUsers = await runEffect(
      Effect.flatMap(UserService, (service) => service.getAll())
    );

    return c.json({
      success: true,
      data: allUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch users",
      },
      500
    );
  }
});

// GET /users/:id - Get user by ID
users.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const user = await runEffect(
      Effect.flatMap(UserService, (service) => service.getById(id))
    );

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return c.json(
        {
          success: false,
          error: `User with ID ${id} not found`,
        },
        404
      );
    }

    console.error("Error fetching user:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch user",
      },
      500
    );
  }
});

// POST /users - Create a new user
users.post("/", async (c) => {
  try {
    const body = await c.req.json<CreateUserInput>();

    const newUser = await runEffect(
      Effect.flatMap(UserService, (service) => service.create(body))
    );

    return c.json(
      {
        success: true,
        data: newUser,
      },
      201
    );
  } catch (error) {
    if (error instanceof UserValidationError) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }

    if (error instanceof UserAlreadyExistsError) {
      return c.json(
        {
          success: false,
          error: `User with email ${error.email} already exists`,
        },
        409
      );
    }

    console.error("Error creating user:", error);
    return c.json(
      {
        success: false,
        error: "Failed to create user",
      },
      500
    );
  }
});

// PATCH /users/:id - Update a user
users.patch("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const body = await c.req.json<UpdateUserInput>();

    const updatedUser = await runEffect(
      Effect.flatMap(UserService, (service) => service.update(id, body))
    );

    return c.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return c.json(
        {
          success: false,
          error: `User with ID ${id} not found`,
        },
        404
      );
    }

    if (error instanceof UserValidationError) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }

    console.error("Error updating user:", error);
    return c.json(
      {
        success: false,
        error: "Failed to update user",
      },
      500
    );
  }
});

// DELETE /users/:id - Delete a user
users.delete("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await runEffect(
      Effect.flatMap(UserService, (service) => service.delete(id))
    );

    return c.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return c.json(
        {
          success: false,
          error: `User with ID ${id} not found`,
        },
        404
      );
    }

    console.error("Error deleting user:", error);
    return c.json(
      {
        success: false,
        error: "Failed to delete user",
      },
      500
    );
  }
});

export default users;
