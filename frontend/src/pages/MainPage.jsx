import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import KeywordGraph from '@/features/graph/components/KeywordGraph'
import RelatedPanel from '@/features/graph/components/RelatedPanel'
import { usePhotos } from '@/features/photos/hooks'

export default function MainPage() {
  const navigate = useNavigate()
  const { data: photos = [], isLoading, isError } = usePhotos()
  const [center, setCenter] = useState(null)

  const graphData = useMemo(() => {
    const nodes = []
    const links = []
    const keywordMap = new Map()

    photos.forEach((photo) => {
      const photoNodeId = `p:${photo.id}`
      nodes.push({ id: photoNodeId, type: 'photo', url: photo.url, photoId: photo.id })

      ;(photo.keywords || []).forEach((k) => {
        const text = k.text?.trim()
        if (!text) return
        const keywordNodeId = `k:${text}`
        if (!keywordMap.has(keywordNodeId)) {
          const node = { id: keywordNodeId, type: 'keyword', label: text, count: 0 }
          keywordMap.set(keywordNodeId, node)
          nodes.push(node)
        }
        keywordMap.get(keywordNodeId).count += 1
        links.push({ source: photoNodeId, target: keywordNodeId, score: Number(k.score) || 50 })
      })
    })
    return { nodes, links }
  }, [photos])

  return (
    <div className="relative h-full min-h-[500px] overflow-hidden bg-neutral-900">
      {isLoading && <p className="p-4 text-white">불러오는 중...</p>}
      {isError && <p className="p-4 text-red-400">사진을 불러오지 못했어요.</p>}

      {!isLoading && !isError && photos.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-300">
          <p>아직 사진이 없어요. 첫 사진을 올려보세요.</p>
          <Link to="/upload" className="rounded-lg bg-amber-300 px-4 py-2 font-semibold text-neutral-900">
            사진 올리기
          </Link>
        </div>
      )}

      {!isLoading && !isError && photos.length > 0 && (
        <KeywordGraph
          data={graphData}
          onNodeClick={(node) => node.type === 'keyword' && setCenter(node.label)}
        />
      )}

      {!center && photos.length > 0 && (
        <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-neutral-800/90 px-4 py-2 text-sm text-neutral-200">
          노란 키워드를 누르면 연결된 키워드를 볼 수 있어요
        </p>
      )}

      {center && (
        <RelatedPanel
          key={center}
          center={center}
          photos={photos}
          onClose={() => setCenter(null)}
          onStart={(keywords) => navigate('/exhibitions/new', { state: { keywords } })}
        />
      )}
    </div>
  )
}