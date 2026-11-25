import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { useGuestbook, useAddGuestbook } from '../hooks'

const COLORS = ['bg-yellow-200', 'bg-pink-200', 'bg-sky-200', 'bg-green-200', 'bg-purple-200', 'bg-orange-200']

export default function GuestbookBoard({ exhibitionId }) {
  const { user } = useAuth()
  const { data: entries = [] } = useGuestbook(exhibitionId)
  const add = useAddGuestbook(exhibitionId)
  const [content, setContent] = useState('')
  const [color, setColor] = useState(0)

  const submit = () => {
    if (!content.trim()) return
    add.mutate(
      { author: user.nickname, content: content.trim(), color },
      { onSuccess: () => setContent('') },
    )
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">방명록</h2>

      <div className="mb-6 rounded-xl bg-neutral-800 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm">
          <span className="text-neutral-400">{user.nickname}</span>
          <div className="ml-2 flex items-center gap-1">
            {COLORS.map((c, i) => (
              <button
                key={c}
                onClick={() => setColor(i)}
                aria-label={`색 ${i + 1}`}
                className={`h-5 w-5 rounded-full ${c} ${color === i ? 'ring-2 ring-white' : ''}`}
              />
            ))}
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="전시를 보고 남기고 싶은 말을 적어주세요"
          className="w-full resize-none rounded bg-neutral-700 p-2 text-sm outline-none"
        />
        <button onClick={submit} className="mt-2 rounded bg-amber-300 px-4 py-1 text-sm font-semibold text-neutral-900">
          붙이기
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {entries.map((e) => (
          <div
            key={e.id}
            className={`${COLORS[e.color ?? 0]} min-h-28 rounded-sm p-3 text-neutral-900 shadow-md`}
            style={{ transform: `rotate(${((e.id % 5) - 2) * 1.2}deg)` }}
          >
            <p className="whitespace-pre-wrap break-words text-sm">{e.content}</p>
            <p className="mt-3 text-right text-xs font-semibold opacity-70">- {e.author}</p>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-neutral-400">첫 방명록을 남겨보세요.</p>}
      </div>
    </section>
  )
}