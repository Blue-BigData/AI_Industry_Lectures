import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { usePhotos } from '@/features/photos/hooks'
import { useCreateExhibition } from '@/features/exhibitions/hooks'

const MAX_PHOTOS = 6

export default function ExhibitionBuilderPage() {
  const { state } = useLocation()
  const nav = useNavigate()
  const { data: photos = [] } = usePhotos()
  const create = useCreateExhibition()

  const keywords = state?.keywords
  const [items, setItems] = useState([]) // [{ photoId, description }]
  const [title, setTitle] = useState(keywords ? `${keywords[0]} 전시` : '')

  // 키워드 일치 개수 → 퍼센트 합 순으로 추천
  const candidates = useMemo(() => {
    if (!keywords) return []
    return photos
      .map((p) => {
        const hits = p.keywords.filter((k) => keywords.includes(k.text))
        return { ...p, match: hits.length, sum: hits.reduce((s, k) => s + k.score, 0) }
      })
      .filter((p) => p.match > 0)
      .sort((a, b) => b.match - a.match || b.sum - a.sum)
  }, [photos, keywords])

  if (!keywords) return <Navigate to="/" replace />

  const toggle = (photoId) =>
    setItems((its) =>
      its.some((it) => it.photoId === photoId)
        ? its.filter((it) => it.photoId !== photoId)
        : its.length >= MAX_PHOTOS
          ? its
          : [...its, { photoId, description: '' }],
    )

  const setDescription = (photoId, description) =>
    setItems((its) => its.map((it) => (it.photoId === photoId ? { ...it, description } : it)))

  const submit = () =>
    create.mutate(
      {
        title: title.trim(),
        centerKeyword: keywords[0],
        keywords,
        rooms: [{ name: '전시실', items }],
      },
      { onSuccess: (e) => nav(`/exhibitions/${e.id}`) },
    )

  const urlOf = (id) => photos.find((p) => p.id === id)?.url

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">전시장 만들기</h1>

      <div className="flex flex-wrap gap-2">
        {keywords.map((k) => (
          <span key={k} className="rounded-full bg-amber-200 px-3 py-1 text-sm text-neutral-900">#{k}</span>
        ))}
      </div>

      <section>
        <label htmlFor="title" className="mb-1 block text-sm font-semibold">전시장 이름</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={30}
          className="w-full rounded bg-neutral-800 px-3 py-2 outline-none"
        />
      </section>

      <section>
        <p className="mb-1 font-semibold">AI 추천 사진</p>
        <p className="mb-3 text-sm text-neutral-400">
          키워드와 잘 맞는 순서예요. 최대 {MAX_PHOTOS}장까지 고를 수 있어요. ({items.length}/{MAX_PHOTOS})
        </p>
        {candidates.length === 0 && <p className="text-sm text-neutral-400">맞는 사진이 없어요.</p>}
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
          {candidates.map((p) => {
            const idx = items.findIndex((it) => it.photoId === p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`relative aspect-square overflow-hidden rounded-lg ${idx >= 0 ? 'ring-4 ring-amber-300' : ''}`}
              >
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px]">
                  {p.match}/{keywords.length} 일치
                </span>
                {idx >= 0 && (
                  <span className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-neutral-900">
                    {idx + 1}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {items.length > 0 && (
        <section className="space-y-2">
          <p className="font-semibold">사진 설명 (선택)</p>
          {items.map((it, i) => (
            <div key={it.photoId} className="flex items-center gap-3">
              <span className="w-5 text-center text-sm text-neutral-400">{i + 1}</span>
              <img src={urlOf(it.photoId)} alt="" className="h-10 w-10 rounded object-cover" />
              <input
                value={it.description}
                onChange={(e) => setDescription(it.photoId, e.target.value)}
                maxLength={60}
                placeholder="설명을 적어보세요"
                className="min-w-0 flex-1 rounded bg-neutral-800 px-2 py-1 text-sm outline-none"
              />
            </div>
          ))}
        </section>
      )}

      {create.isError && <p className="text-sm text-red-400">저장에 실패했어요.</p>}

      <button
        onClick={submit}
        disabled={items.length === 0 || !title.trim() || create.isPending}
        className="rounded-lg bg-amber-300 px-6 py-3 font-semibold text-neutral-900 disabled:opacity-30"
      >
        {create.isPending ? '생성 중...' : `전시장 생성 (${items.length}/${MAX_PHOTOS})`}
      </button>
    </div>
  )
}