import apiClient from '@/lib/apiClient'

export const signup = (body) =>
  apiClient.post('/api/auth/signup', body).then((r) => r.data)

export const login = (body) =>
  apiClient.post('/api/auth/login', body).then((r) => r.data) // { token, user }