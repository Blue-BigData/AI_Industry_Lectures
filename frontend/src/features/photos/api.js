import apiClient from '@/lib/apiClient'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// 사진을 긴 변 600px 이하 JPEG(data URL)로 줄이기 (목업 전용)
const resizeToDataUrl = (file, max = 600) =>
  new Promise((resolve, reject) => {
    const fail = () =>
      reject(
        Object.assign(new Error('unsupported image'), {
          response: {
            status: 415,
            data: { message: '지원하지 않는 사진 형식이에요. JPG나 PNG로 올려주세요.' },
          },
        }),
      )
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * s)
        c.height = Math.round(img.height * s)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = fail
      img.src = reader.result
    }
    reader.onerror = fail
    reader.readAsDataURL(file)
  })

export const uploadPhoto = async (file) => {
  if (MOCK) {
    // 목업: 파일 대신 줄인 이미지를 JSON으로 전송
    const image = await resizeToDataUrl(file)
    return apiClient.post('/api/photos', { image }).then((r) => r.data)
  }
  // 실제 서버: multipart/form-data (필드명은 백엔드와 확인 필요)
  const formData = new FormData()
  formData.append('file', file)
  return apiClient.post('/api/photos', formData).then((r) => r.data)
}

export const getPhotos = () =>
  apiClient.get('/api/photos').then((r) => r.data)

export const getPhoto = (photoId) =>
  apiClient.get(`/api/photos/${photoId}`).then((r) => r.data)

export const deletePhoto = (photoId) =>
  apiClient.delete(`/api/photos/${photoId}`)

export const updateKeywords = (photoId, keywords) =>
  apiClient.patch(`/api/photos/${photoId}/keywords`, { keywords }).then((r) => r.data)

export const getRelatedPhotos = (photoId) =>
  apiClient.get(`/api/photos/${photoId}/related`).then((r) => r.data)