import { useMemo, useState } from 'react'

const RELATED_COUNT = 10
const PICK = 3

export default function RelatedPanel({ center, photos, onClose, onStart }) {
  const [picked, setPicked] = useState([])

  // 중심 키워드와 같은 사진에 자주 붙은 키워드 10개
  const related = useMemo(() => {
    const m = new Map()
    photos.forEach((p) => {
      if (!p.keywords.some((k) => k.text === center)) return
      p.keywords.forEach((k) => {
        if (k.text !== center) m.set(k.text, (m.get(k.text) ?? 0) + 1)
      })
    })
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, RELATED_COUNT)
  }, [photos, center])

  const toggle = (k) =>
    setPicked((ps) => (ps.includes(k) ? ps.filter((x) => x !== k) : ps.length >= PICK ? ps : [...ps, k]))

  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-80 flex-col border-l border-neutral-700 bg-neutral-900/95 text-white shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-neutral-800 p-4">
        <h2 className="font-bold">
          <span className="text-amber-300">#{center}</span> 연결 키워드
        </h2>
        <button onClick={onClose} aria-label="닫기" className="rounded px-2 py-1 text-neutral-400 hover:bg-neutral-800">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-sm text-neutral-300">전시에 함께 쓸 키워드를 최대 {PICK}개 골라요.</p>
        {related.length === 0 && <p className="text-sm text-neutral-400">연결된 키워드가 아직 없어요.</p>}
        <div className="flex flex-wrap gap-2">
          {related.map(([k, n]) => (
            <button
              key={k}
              onClick={() => toggle(k)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                picked.includes(k) ? 'bg-amber-300 font-semibold text-neutral-900' : 'bg-neutral-800 hover:bg-neutral-700'
              }`}
            >
              #{k} <span className="opacity-60">{n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-neutral-800 p-4">
        <p className="mb-2 text-xs text-neutral-400">
          선택: #{center}
          {picked.map((k) => ` #${k}`).join('')}
        </p>
        <button
          onClick={() => onStart([center, ...picked])}
          className="w-full rounded-lg bg-amber-300 py-3 font-semibold text-neutral-900"
        >
          전시장 만들기
        </button>
      </div>
    </aside>
  )
}