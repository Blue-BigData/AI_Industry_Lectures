
import apiClient from '@/lib/apiClient'

export const getGraph = () =>
  apiClient.get('/api/graph').then((r) => r.data)
