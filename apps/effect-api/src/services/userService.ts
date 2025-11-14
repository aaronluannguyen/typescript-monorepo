import { Context, Effect, Layer, Ref } from "effect"

// User type
export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface CreateUserData {
  name: string
  email: string
}

export interface UpdateUserData {
  name?: string
  email?: string
}

// UserService interface
export interface UserService {
  listUsers: () => Effect.Effect<User[]>
  getUserById: (id: string) => Effect.Effect<User | null>
  createUser: (data: CreateUserData) => Effect.Effect<User>
  updateUser: (id: string, data: UpdateUserData) => Effect.Effect<User | null>
  deleteUser: (id: string) => Effect.Effect<boolean>
}

// Tag for the UserService
export const UserService = Context.GenericTag<UserService>("@services/UserService")

// In-memory implementation
const makeUserService = Effect.gen(function* () {
  // In-memory storage using Effect Ref
  const usersRef = yield* Ref.make<Map<string, User>>(new Map())

  // Seed with some initial data
  yield* Ref.update(usersRef, (users) => {
    const initialUsers = new Map<string, User>([
      [
        "1",
        {
          id: "1",
          name: "Alice Johnson",
          email: "alice@example.com",
          createdAt: new Date().toISOString(),
        },
      ],
      [
        "2",
        {
          id: "2",
          name: "Bob Smith",
          email: "bob@example.com",
          createdAt: new Date().toISOString(),
        },
      ],
      [
        "3",
        {
          id: "3",
          name: "Charlie Brown",
          email: "charlie@example.com",
          createdAt: new Date().toISOString(),
        },
      ],
    ])
    return initialUsers
  })

  const listUsers = (): Effect.Effect<User[]> =>
    Effect.gen(function* () {
      const users = yield* Ref.get(usersRef)
      return Array.from(users.values())
    })

  const getUserById = (id: string): Effect.Effect<User | null> =>
    Effect.gen(function* () {
      const users = yield* Ref.get(usersRef)
      return users.get(id) ?? null
    })

  const createUser = (data: CreateUserData): Effect.Effect<User> =>
    Effect.gen(function* () {
      const users = yield* Ref.get(usersRef)
      const id = (users.size + 1).toString()

      const newUser: User = {
        id,
        name: data.name,
        email: data.email,
        createdAt: new Date().toISOString(),
      }

      yield* Ref.update(usersRef, (users) => {
        const updated = new Map(users)
        updated.set(id, newUser)
        return updated
      })

      yield* Effect.log(`User created: ${newUser.name} (${newUser.email})`)

      return newUser
    })

  const updateUser = (id: string, data: UpdateUserData): Effect.Effect<User | null> =>
    Effect.gen(function* () {
      const users = yield* Ref.get(usersRef)
      const existingUser = users.get(id)

      if (!existingUser) {
        return null
      }

      const updatedUser: User = {
        ...existingUser,
        name: data.name ?? existingUser.name,
        email: data.email ?? existingUser.email,
      }

      yield* Ref.update(usersRef, (users) => {
        const updated = new Map(users)
        updated.set(id, updatedUser)
        return updated
      })

      yield* Effect.log(`User updated: ${updatedUser.name} (${updatedUser.email})`)

      return updatedUser
    })

  const deleteUser = (id: string): Effect.Effect<boolean> =>
    Effect.gen(function* () {
      const users = yield* Ref.get(usersRef)
      const existingUser = users.get(id)

      if (!existingUser) {
        return false
      }

      yield* Ref.update(usersRef, (users) => {
        const updated = new Map(users)
        updated.delete(id)
        return updated
      })

      yield* Effect.log(`User deleted: ${existingUser.name} (${existingUser.email})`)

      return true
    })

  return UserService.of({
    listUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
  })
})

// Layer for the UserService
export const UserServiceLive = Layer.effect(UserService, makeUserService)
