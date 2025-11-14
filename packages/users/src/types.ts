import type { User, NewUser, InsertUser } from "@repo/db/schema";

export type { User, NewUser, InsertUser };

export interface UserFilters {
  email?: string;
  name?: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  bio?: string;
}

export interface UpdateUserInput {
  name?: string;
  bio?: string;
}
