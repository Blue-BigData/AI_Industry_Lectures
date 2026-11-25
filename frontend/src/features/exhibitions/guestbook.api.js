import apiClient from '@/lib/apiClient'

export const getGuestbook = (id) =>
  apiClient.get(`/api/exhibitions/${id}/guestbook`).then((r) => r.data)

export const addGuestbook = (id, body) =>
  apiClient.post(`/api/exhibitions/${id}/guestbook`, body).then((r) => r.data)