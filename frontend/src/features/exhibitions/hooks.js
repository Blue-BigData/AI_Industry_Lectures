import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getExhibitions, getExhibition, createExhibition } from './api'
import { getGuestbook, addGuestbook } from './guestbook.api'

export const useExhibitions = () =>
  useQuery({ queryKey: ['exhibitions'], queryFn: getExhibitions })

export const useExhibition = (id) =>
  useQuery({ queryKey: ['exhibitions', id], queryFn: () => getExhibition(id) })

export function useCreateExhibition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createExhibition,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exhibitions'] }),
  })
}

export const useGuestbook = (id) =>
  useQuery({ queryKey: ['guestbook', id], queryFn: () => getGuestbook(id) })

export function useAddGuestbook(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => addGuestbook(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guestbook', id] }),
  })
}