import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUploadPhoto, useUpdateKeywords } from '@/features/photos/hooks'

export default function UploadPage() {
  const nav = useNavigate()
  const upload = useUploadPhoto()
  const update = useUpdateKeywords()
  const [photo, setPhoto] = useState(null)
  const [text, setText] = useState('')

  // 응답에 keywords가 없어도 죽지 않게 항상 배열로 취급
  const keywords = photo?.keywords ?? []
  const mine = keywords.find((k) => k.source === 'user')

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    upload.mutate(file, { onSuccess: (data) => setPhoto(data) })
    e.target.value = ''
  }

  // 수정 응답에 사진 전체가 없으면 기존 사진 정보에 키워드만 덮어써요
  const save = (next) =>
    update.mutate(
      { photoId: photo.id, keywords: next },
      {
        onSuccess: (data) =>
          setPhoto((prev) => ({
            ...prev,
            ...(data ?? {}),
            keywords: data?.keywords ?? next,
          })),
      },
    )

  const removeKeyword = (t) => {
    if (keywords.length <= 1) return // 키워드는 최소 1개 유지
    save(keywords.filter((k) => k.text !== t))
  }

  const addMine = () => {
    const value = text.trim().replace(/^#/, '')
    if (!value) return
    save([
      ...keywords.filter((k) => k.source !== 'user'),
      { text: value, score: 100, source: 'user' },
    ])
    setText('')
  }

  const uploadErrorMessage =
    upload.error?.response?.data?.message ??
    (upload.error?.response
      ? `업로드에 실패했어요. (${upload.error.response.status})`
      : '서버에 연결하지 못했어요. 목업이 꺼져 있을 수 있어요.')

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">사진 올리기</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="flex min-h-80 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neutral-600 hover:bg-neutral-800/50">
          {photo?.url ? (
            <img src={photo.url} alt="" className="h-full max-h-96 w-full object-cover" />
          ) : (
            <span className="text-sm text-neutral-400">
              {upload.isPending ? 'AI가 분석하고 유해성을 검사하는 중...' : '공유하고 싶은 사진 1장 선택'}
            </span>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={upload.isPending} />
        </label>

        <div className="space-y-5 rounded-xl bg-neutral-800 p-5">
          {upload.isError && <p className="text-sm text-red-400">{uploadErrorMessage}</p>}
          {update.isError && <p className="text-sm text-red-400">키워드 수정에 실패했어요.</p>}

          {!photo && !upload.isError && (
            <p className="text-sm text-neutral-400">사진을 올리면 AI가 키워드를 붙여줘요.</p>
          )}

          {photo && (
            <>
              <div>
                <p className="mb-2 font-semibold">
                  AI 키워드 <span className="text-xs font-normal text-neutral-400">× 를 누르면 삭제돼요</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((k) => (
                    <span
                      key={k.text}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-neutral-900 ${
                        k.source === 'user' ? 'bg-sky-300' : 'bg-amber-200'
                      }`}
                    >
                      #{k.text}
                      <button
                        onClick={() => removeKeyword(k.text)}
                        aria-label={`${k.text} 삭제`}
                        className="font-bold opacity-60 hover:opacity-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 font-semibold">
                  내 키워드 {mine ? '수정' : '추가'}{' '}
                  <span className="text-xs font-normal text-neutral-400">(선택, 1개)</span>
                </p>
                <div className="flex gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addMine()}
                    maxLength={10}
                    placeholder={mine ? `현재: #${mine.text}` : '예: 하와이 (건너뛰어도 돼요)'}
                    className="min-w-0 flex-1 rounded bg-neutral-900 px-3 py-2 text-sm outline-none"
                  />
                  <button onClick={addMine} className="rounded bg-amber-300 px-4 text-sm font-semibold text-neutral-900">
                    {mine ? '수정' : '추가'}
                  </button>
                </div>
              </div>

              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  photo.moderation === 'rejected' ? 'bg-red-900/60 text-red-200' : 'bg-green-900/60 text-green-200'
                }`}
              >
                {photo.moderation === 'rejected' ? '유해성 검사 실패: 다른 사진을 올려주세요' : '유해성 검사 통과'}
              </div>

              <button
                onClick={() => nav('/', { state: { focusId: photo.id } })}
                disabled={photo.moderation === 'rejected' || update.isPending}
                className="w-full rounded-lg bg-amber-300 py-3 font-semibold text-neutral-900 disabled:opacity-30"
              >
                업로드 완료
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}