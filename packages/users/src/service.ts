import { Effect, Context } from "effect";
import { eq } from "drizzle-orm";
import { DatabaseService } from "@repo/db/client";
import { users, insertUserSchema } from "@repo/db/schema";
import type { User } from "@repo/db/schema";
import type { CreateUserInput, UpdateUserInput } from "./types";

// User service errors
export class UserNotFoundError {
  readonly _tag = "UserNotFoundError";
  constructor(readonly userId: string) {}
}

export class UserValidationError {
  readonly _tag = "UserValidationError";
  constructor(readonly message: string) {}
}

export class UserAlreadyExistsError {
  readonly _tag = "UserAlreadyExistsError";
  constructor(readonly email: string) {}
}

// User Service Interface
export class UserService extends Context.Tag("UserService")<
  UserService,
  {
    getAll: () => Effect.Effect<User[], never, DatabaseService>;
    getById: (
      id: string
    ) => Effect.Effect<User, UserNotFoundError, DatabaseService>;
    getByEmail: (
      email: string
    ) => Effect.Effect<User, UserNotFoundError, DatabaseService>;
    create: (
      data: CreateUserInput
    ) => Effect.Effect<
      User,
      UserValidationError | UserAlreadyExistsError,
      DatabaseService
    >;
    update: (
      id: string,
      data: UpdateUserInput
    ) => Effect.Effect<
      User,
      UserNotFoundError | UserValidationError,
      DatabaseService
    >;
    delete: (
      id: string
    ) => Effect.Effect<void, UserNotFoundError, DatabaseService>;
  }
>() {}

// User Service Implementation
export const UserServiceLive = UserService.of({
  getAll: () =>
    Effect.gen(function* () {
      const db = yield* DatabaseService;
      const allUsers = yield* Effect.tryPromise(() => db.select().from(users));
      return allUsers;
    }),

  getById: (id: string) =>
    Effect.gen(function* () {
      const db = yield* DatabaseService;
      const user = yield* Effect.tryPromise(() =>
        db.select().from(users).where(eq(users.id, id)).limit(1)
      );

      if (user.length === 0) {
        return yield* Effect.fail(new UserNotFoundError(id));
      }

      return user[0];
    }),

  getByEmail: (email: string) =>
    Effect.gen(function* () {
      const db = yield* DatabaseService;
      const user = yield* Effect.tryPromise(() =>
        db.select().from(users).where(eq(users.email, email)).limit(1)
      );

      if (user.length === 0) {
        return yield* Effect.fail(new UserNotFoundError(email));
      }

      return user[0];
    }),

  create: (data: CreateUserInput) =>
    Effect.gen(function* () {
      const db = yield* DatabaseService;

      // Validate input
      const validationResult = insertUserSchema.safeParse(data);
      if (!validationResult.success) {
        return yield* Effect.fail(
          new UserValidationError(validationResult.error.message)
        );
      }

      // Check if user already exists
      const existingUser = yield* Effect.tryPromise(() =>
        db.select().from(users).where(eq(users.email, data.email)).limit(1)
      );

      if (existingUser.length > 0) {
        return yield* Effect.fail(new UserAlreadyExistsError(data.email));
      }

      // Create user
      const newUser = yield* Effect.tryPromise(() =>
        db
          .insert(users)
          .values({
            ...data,
            updatedAt: new Date(),
          })
          .returning()
      );

      return newUser[0];
    }),

  update: (id: string, data: UpdateUserInput) =>
    Effect.gen(function* () {
      const db = yield* DatabaseService;

      // Check if user exists
      const existingUser = yield* Effect.tryPromise(() =>
        db.select().from(users).where(eq(users.id, id)).limit(1)
      );

      if (existingUser.length === 0) {
        return yield* Effect.fail(new UserNotFoundError(id));
      }

      // Update user
      const updatedUser = yield* Effect.tryPromise(() =>
        db
          .update(users)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(users.id, id))
          .returning()
      );

      return updatedUser[0];
    }),

  delete: (id: string) =>
    Effect.gen(function* () {
      const db = yield* DatabaseService;

      // Check if user exists
      const existingUser = yield* Effect.tryPromise(() =>
        db.select().from(users).where(eq(users.id, id)).limit(1)
      );

      if (existingUser.length === 0) {
        return yield* Effect.fail(new UserNotFoundError(id));
      }

      // Delete user
      yield* Effect.tryPromise(() =>
        db.delete(users).where(eq(users.id, id))
      );
    }),
});
