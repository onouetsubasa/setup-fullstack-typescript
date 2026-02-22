export type ApiResponse<T> = {
  data: T
  message?: string
}

export type User = {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export type CreateUserInput = Pick<User, 'email' | 'name'>