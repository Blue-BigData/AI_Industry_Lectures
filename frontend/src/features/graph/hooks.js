
import { useQuery } from '@tanstack/react-query'
import { mockGraph } from './mockGraph'

export function useGraph() {
  return useQuery({
    queryKey: ['graph'],
    queryFn: async () => mockGraph,
    initialData: mockGraph,
  })
}
