import apiClient from '@/lib/apiClient'

export const getExhibitions = () =>
  apiClient.get('/api/exhibitions').then((r) => r.data)

export const getExhibition = (id) =>
  apiClient.get(`/api/exhibitions/${id}`).then((r) => r.data)

export const createExhibition = (body) =>
  apiClient.post('/api/exhibitions', body).then((r) => r.data)