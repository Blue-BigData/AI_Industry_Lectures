import { Link } from 'react-router-dom'
import DoorCard from '@/features/exhibitions/components/DoorCard'
import { useExhibitions } from '@/features/exhibitions/hooks'
import { getVisited } from '@/lib/visited'

export default function ExhibitionListPage() {
  const { data = [], isLoading, isError } = useExhibitions()
  const visited = getVisited().filter((id) => data.some((e) => e.id === id))
  const percent = data.length ? Math.round((visited.length / data.length) * 100) : 0

  return (
    <div className="min-h-full bg-gradient-to-b from-stone-900 via-stone-800 to-stone-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-display text-sm uppercase tracking-[0.4em] text-[#c9ad73]">Gallery Hall</p>
            <h1 className="font-ko text-4xl font-semibold tracking-wide text-[#f4efe6]">전시장 모아보기</h1>
            <p className="mt-3 text-sm text-stone-400">
              문을 열고 들어가 친구들의 전시를 구경해요. 다녀온 전시장에는 깃발이 꽂혀요.
            </p>
          </div>

          <div className="w-52">
            <div className="mb-1 flex justify-between text-xs text-stone-400">
              <span>방문한 전시장</span>
              <span>{visited.length}/{data.length}</span>
            </div>
            <div className="h-1.5 rounded-full bg-stone-700">
              <div className="h-1.5 rounded-full bg-amber-300 transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </header>

        {isLoading && <p className="text-stone-300">불러오는 중...</p>}
        {isError && <p className="text-red-400">전시장을 불러오지 못했어요.</p>}

        {!isLoading && !isError && data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-600 py-20 text-center">
            <p className="mb-4 text-stone-300">아직 열린 전시장이 없어요.</p>
            <Link to="/" className="rounded-lg bg-amber-300 px-5 py-2.5 font-semibold text-neutral-900">
              홈에서 첫 전시장 만들기
            </Link>
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] justify-items-center gap-x-8 gap-y-16">
          {data.map((e) => (
            <DoorCard key={e.id} exhibition={e} visited={visited.includes(e.id)} />
          ))}
        </div>
      </div>

      {/* 바닥 */}
      <div className="h-16 bg-[repeating-linear-gradient(90deg,#451a03_0,#451a03_72px,#341301_72px,#341301_74px)] shadow-[inset_0_12px_20px_-8px_rgba(0,0,0,0.8)]" />
    </div>
  )
}