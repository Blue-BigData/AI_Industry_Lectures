import { Link } from 'react-router-dom'

export default function DoorCard({ exhibition, visited }) {
  const { id, title, owner, centerKeyword, photoCount, cover } = exhibition

  return (
    <Link
      to={`/exhibitions/${id}`}
      className="group relative flex w-52 flex-col items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
    >
      {/* 명패 */}
      <div className="mb-5 w-full rounded border border-amber-200/30 bg-gradient-to-b from-stone-700 to-stone-800 px-3 py-2 text-center shadow-md">
        <p className="truncate font-ko text-sm font-semibold tracking-wide text-[#f4efe6]">{title}</p>
        <p className="font-display text-xs italic text-stone-400">curated by {owner}</p>
      </div>

      <div className="relative">
        {/* 호버 시 새어 나오는 빛 */}
        <div className="pointer-events-none absolute -inset-6 rounded-full bg-amber-300/0 blur-2xl transition duration-500 group-hover:bg-amber-300/25" />

        {/* 문틀 */}
        <div className="relative h-72 w-48 rounded-t-[6rem] border-[10px] border-stone-900 bg-stone-950 shadow-[0_24px_40px_-14px_rgba(0,0,0,0.9)]">
          {/* 문 안쪽의 빛 */}
          <div className="absolute inset-0 rounded-t-[5rem] bg-gradient-to-b from-amber-100/80 via-amber-300/50 to-amber-600/30" />

          {/* 문짝: 호버하면 열려요 */}
          <div className="absolute inset-0 origin-left rounded-t-[5rem] bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 shadow-inner transition-transform duration-500 [transform:perspective(700px)_rotateY(0deg)] group-hover:[transform:perspective(700px)_rotateY(-32deg)]">
            {/* 아치 창: 전시장 대표 사진 */}
            <div className="absolute left-1/2 top-6 h-20 w-20 -translate-x-1/2 overflow-hidden rounded-full border-4 border-amber-950 bg-stone-800 shadow-inner">
              {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
            </div>

            {/* 문 패널 */}
            <div className="absolute inset-x-5 bottom-6 top-32 grid grid-rows-2 gap-3">
              <div className="flex items-center justify-center rounded-sm border border-amber-950/70 bg-black/10 shadow-inner">
                <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950">
                  #{centerKeyword}
                </span>
              </div>
              <div className="flex items-center justify-center rounded-sm border border-amber-950/70 bg-black/10 shadow-inner">
                <span className="text-[11px] text-amber-200/70">사진 {photoCount}장</span>
              </div>
            </div>

            {/* 손잡이 */}
            <div className="absolute right-3 top-1/2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-600 shadow-md" />
          </div>
        </div>

        {/* 방문 깃발 */}
        {visited && (
            <div className="absolute -right-3 -top-8 z-10 flex">
                <span className="h-14 w-0.5 bg-[#c9ad73]" />
                <span className="mt-0.5 h-5 rounded-r-sm bg-gradient-to-r from-[#7a1f2b] to-[#4f1420] px-2 font-display text-[11px] font-semibold uppercase leading-5 tracking-wider text-[#f1e2b8] shadow">
                Visited
                </span>
            </div>
            )}
      </div>

      {/* 바닥 그림자 */}
      <div className="mt-1 h-3 w-56 rounded-[50%] bg-black/60 blur-md" />
    </Link>
  )
}