import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useExhibition } from '@/features/exhibitions/hooks'
import GuestbookBoard from '@/features/exhibitions/components/GuestbookBoard'
import { markVisited } from '@/lib/visited'

// 액자 크기를 번갈아 써서 단조롭지 않게
const SIZES = ['h-56 w-44', 'h-44 w-60', 'h-52 w-52']

export default function ExhibitionDetailPage() {
  const { id } = useParams()
  const { data: ex, isLoading, isError } = useExhibition(id)
  const [open, setOpen] = useState(null) // 확대해서 보는 사진 번호

  const items = ex ? ex.rooms.flatMap((r) => r.items) : []

  // 방문하면 깃발 표시 (조기 return보다 위에 있어야 해요)
  useEffect(() => {
    markVisited(id)
  }, [id])

  // 확대 보기: 키보드 조작
  useEffect(() => {
    if (open === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % items.length)
      if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, items.length])

  if (isLoading) return <p className="p-6 text-white">불러오는 중...</p>
  if (isError || !ex) return <p className="p-6 text-red-400">전시장을 찾을 수 없어요.</p>

  const keywords = ex.keywords ?? [ex.centerKeyword]
  const current = open !== null ? items[open] : null

  return (
    <div className="bg-stone-950">
      {/* 갤러리 벽 */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#2b2724] via-[#3a3531] to-[#2b2724]">
        {/* 천장 조명 번짐 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(253,230,138,0.18),transparent_70%)]" />

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-8">
          <Link to="/exhibitions" className="text-[11px] text-stone-400 hover:text-[#c9ad73]">
            ← 전시장 모아보기
          </Link>

          <header className="mb-16 mt-8 text-center">
            <p className="mb-4 font-display text-sm uppercase tracking-[0.45em] text-[#c9ad73]">
              Now Exhibiting
            </p>
            <h1 className="font-ko text-5xl font-semibold tracking-wide text-[#f4efe6]">{ex.title}</h1>
            <div className="mx-auto my-6 h-px w-24 bg-[#c9ad73]/50" />
            <div className="mb-3 flex flex-wrap justify-center gap-2">
              {keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-full border border-[#c9ad73]/50 px-3 py-0.5 text-xs text-[#d9c9a3]"
                >
                  #{k}
                </span>
              ))}
            </div>
            <p className="font-display text-base italic text-stone-400">
              curated by {ex.owner} · {items.length} works
            </p>
          </header>

          <div className="grid grid-cols-1 items-end gap-x-12 gap-y-20 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, i) => (
              <figure key={it.photoId} className="relative flex flex-col items-center">
                {/* 액자 조명 */}
                <div className="h-1.5 w-20 rounded-full bg-stone-300 shadow" />
                <div className="pointer-events-none h-10 w-40 [clip-path:polygon(40%_0,60%_0,100%_100%,0_100%)] bg-gradient-to-b from-amber-200/40 to-transparent" />

                {/* 액자: 월넛 프레임 + 가는 금색 선 + 크림색 매트 */}
                <button
                  onClick={() => setOpen(i)}
                  aria-label={`${i + 1}번 작품 크게 보기`}
                  className="rounded-[2px] bg-gradient-to-br from-[#3b2f26] via-[#241b15] to-[#120d0a] p-3 shadow-[0_22px_32px_-10px_rgba(0,0,0,0.85)] transition duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#c9ad73]"
                >
                  <div className="p-[3px] ring-1 ring-[#c9ad73]/70">
                    <div className="bg-[#f4efe6] p-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)]">
                      <img
                        src={it.url}
                        alt={it.description || `작품 ${i + 1}`}
                        className={`${SIZES[i % 3]} object-cover`}
                      />
                    </div>
                  </div>
                </button>

                {/* 명판 */}
                <figcaption className="mt-6 w-48 rounded-[2px] border border-[#c9ad73]/60 bg-[#1b1613] px-3 py-2 text-center shadow">
                  <p className="font-display text-xs uppercase tracking-[0.3em] text-[#c9ad73]">
                    No. {i + 1}
                  </p>
                  {it.description && (
                    <p className="mt-1 font-ko text-xs text-stone-300">{it.description}</p>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* 걸레받이와 바닥 */}
        <div className="h-3 bg-stone-900/70" />
        <div className="h-14 bg-[repeating-linear-gradient(90deg,#451a03_0,#451a03_72px,#341301_72px,#341301_74px)] shadow-[inset_0_14px_20px_-8px_rgba(0,0,0,0.85)]" />
      </section>

      <div className="mx-auto max-w-4xl p-6 text-white">
        <GuestbookBoard exhibitionId={id} />
      </div>

      {/* 확대 보기 */}
      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpen((open - 1 + items.length) % items.length)
            }}
            aria-label="이전 작품"
            className="absolute left-4 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20"
          >
            ‹
          </button>

          <figure className="max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img src={current.url} alt="" className="max-h-[75vh] rounded object-contain" />
            <figcaption className="mt-3 text-center text-sm text-stone-200">
              <span className="font-display tracking-widest text-[#c9ad73]">
                No. {open + 1} / {items.length}
              </span>
              {current.description && (
                <span className="ml-3 font-ko text-stone-400">{current.description}</span>
              )}
            </figcaption>
          </figure>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpen((open + 1) % items.length)
            }}
            aria-label="다음 작품"
            className="absolute right-4 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20"
          >
            ›
          </button>
          <button
            onClick={() => setOpen(null)}
            aria-label="닫기"
            className="absolute right-4 top-4 rounded px-3 py-1 text-xl text-stone-300 hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}