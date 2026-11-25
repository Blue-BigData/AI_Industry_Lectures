import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPhotos, uploadPhoto, updateKeywords } from './api'

export const usePhotos = () =>
  useQuery({
    queryKey: ['photos'],
    queryFn: getPhotos,
    refetchOnMount: 'always', // 홈에 돌아올 때마다 새로 불러오기
  })

function refresh(qc) {
  qc.invalidateQueries({ queryKey: ['graph'] })
  qc.invalidateQueries({ queryKey: ['photos'] })
}

export function useUploadPhoto() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: uploadPhoto, onSuccess: () => refresh(qc) })
}

export function useUpdateKeywords() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ photoId, keywords }) => updateKeywords(photoId, keywords),
    onSuccess: () => refresh(qc),
  })
}