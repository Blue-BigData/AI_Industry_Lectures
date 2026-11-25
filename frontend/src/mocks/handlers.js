import { http, HttpResponse } from 'msw'

const API = import.meta.env.VITE_API_URL ?? ''

// ---------- 브라우저 저장 (새로고침해도 유지) ----------
const load = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}
const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.warn('[mock] 저장 공간이 가득 찼어요. 오래된 업로드를 지워주세요.')
  }
}

// 사진 파일을 긴 변 600px 이하 JPEG(data URL)로 줄여서 저장



// AI 키워드 후보 (팀원 모델이 연결되기 전까지 임시)
const KEYWORD_POOL = [
  '여행', '바다', '휴가', '노을', '카페', '커피', '여름',
  '친구', '음식', '도시', '산', '하늘', '고양이', '가족',
]

// ---------- 사용자 (테스트 계정: test@test.com / 1234) ----------
let users = load('mock-users', [
  { id: 1, email: 'test@test.com', password: '1234', nickname: '테스터' },
])

// ---------- 사진: 내가 올린 것만 ----------
let photos = load('mock-uploads', [])
let nextPhotoId = Math.max(0, ...photos.map((p) => p.id)) + 1
const savePhotos = () => save('mock-uploads', photos)

function buildGraph() {
  const count = new Map()
  photos.forEach((p) =>
    p.keywords.forEach((k) => count.set(k.text, (count.get(k.text) ?? 0) + 1)),
  )
  const nodes = [...count].map(([text, c]) => ({
    id: `k:${text}`,
    type: 'keyword',
    label: text,
    count: c,
  }))
  photos.forEach((p) =>
    nodes.push({ id: `p:${p.id}`, type: 'photo', photoId: p.id, url: p.url }),
  )
  const links = photos.flatMap((p) =>
    p.keywords.map((k) => ({
      source: `p:${p.id}`,
      target: `k:${k.text}`,
      score: k.score,
    })),
  )
  return { nodes, links }
}

// ---------- 전시장 / 방명록 ----------
let exhibitions = load('mock-exhibitions', [])
let nextExhibitionId = Math.max(0, ...exhibitions.map((e) => e.id)) + 1
let nextRoomId = Math.max(0, ...exhibitions.flatMap((e) => e.rooms.map((r) => r.id))) + 1
let guestbooks = load('mock-guestbooks', {})

const urlOf = (photoId) => photos.find((p) => p.id === photoId)?.url

export const handlers = [
  // ----- 인증 -----
  http.post(`${API}/api/auth/signup`, async ({ request }) => {
    const b = await request.json()
    if (users.some((u) => u.email === b.email)) {
      return HttpResponse.json({ message: '이미 가입된 이메일이에요.' }, { status: 409 })
    }
    const user = { id: Date.now(), ...b }
    users.push(user)
    save('mock-users', users)
    return HttpResponse.json({ id: user.id, email: user.email, nickname: user.nickname })
  }),

  http.post(`${API}/api/auth/login`, async ({ request }) => {
    const b = await request.json()
    const u = users.find((x) => x.email === b.email && x.password === b.password)
    if (!u) {
      return HttpResponse.json({ message: '이메일 또는 비밀번호가 맞지 않아요.' }, { status: 401 })
    }
    return HttpResponse.json({
      token: `mock-token-${u.id}`,
      user: { id: u.id, email: u.email, nickname: u.nickname },
    })
  }),

  // ----- 그래프 / 사진 -----
  http.get(`${API}/api/graph`, () => HttpResponse.json(buildGraph())),
  http.get(`${API}/api/photos`, () => HttpResponse.json(photos)),

  // 업로드: 1.5초 뒤 AI가 키워드 3개를 붙이고 유해성 검사를 통과했다고 가정
  http.post(`${API}/api/photos`, async ({ request }) => {
    try {
      const { image } = await request.json()
      if (typeof image !== 'string' || !image.startsWith('data:image')) {
        return HttpResponse.json({ message: '사진을 받지 못했어요.' }, { status: 400 })
      }

      await new Promise((r) => setTimeout(r, 1500))

      const picked = [...KEYWORD_POOL].sort(() => Math.random() - 0.5).slice(0, 3)
      const scores = picked.map(() => Math.round(55 + Math.random() * 40)).sort((a, b) => b - a)

      const photo = {
        id: nextPhotoId++,
        url: image,
        moderation: 'passed', // 'passed' | 'rejected'
        keywords: picked.map((text, i) => ({ text, score: scores[i], source: 'ai' })),
      }
      photos.push(photo)
      savePhotos()
      return HttpResponse.json(photo)
    } catch (err) {
      console.error('[mock] 업로드 처리 실패:', err)
      return HttpResponse.json({ message: '사진 처리 중 오류가 났어요.' }, { status: 500 })
    }
  }),

  http.patch(`${API}/api/photos/:id/keywords`, async ({ params, request }) => {
    const { keywords } = await request.json()
    const photo = photos.find((p) => p.id === Number(params.id))
    if (!photo) return HttpResponse.json({ message: '사진을 찾을 수 없어요.' }, { status: 404 })
    photo.keywords = keywords
    savePhotos()
    return HttpResponse.json(photo)
  }),

  // ----- 전시장 -----
  http.get(`${API}/api/exhibitions`, () =>
    HttpResponse.json(
      exhibitions.map((e) => {
        const items = e.rooms.flatMap((r) => r.items)
        return {
          id: e.id,
          title: e.title,
          owner: e.owner,
          centerKeyword: e.centerKeyword,
          roomCount: e.rooms.length,
          photoCount: items.length,
          cover: urlOf(items[0]?.photoId),
        }
      }),
    ),
  ),

  http.get(`${API}/api/exhibitions/:id`, ({ params }) => {
    const e = exhibitions.find((x) => x.id === Number(params.id))
    if (!e) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({
      ...e,
      rooms: e.rooms.map((r) => ({
        ...r,
        items: r.items.map((it) => ({ ...it, url: urlOf(it.photoId) })),
      })),
    })
  }),

  http.post(`${API}/api/exhibitions`, async ({ request }) => {
    const body = await request.json()
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const userId = Number(token.replace('mock-token-', ''))
    const owner = users.find((u) => u.id === userId)?.nickname ?? '나'

    const exhibition = {
      id: nextExhibitionId++,
      title: body.title,
      owner,
      centerKeyword: body.centerKeyword,
      keywords: body.keywords,
      rooms: body.rooms.map((r) => ({ id: nextRoomId++, name: r.name, items: r.items })),
    }
    exhibitions.push(exhibition)
    save('mock-exhibitions', exhibitions)
    return HttpResponse.json(exhibition)
  }),

  // ----- 방명록 -----
  http.get(`${API}/api/exhibitions/:id/guestbook`, ({ params }) =>
    HttpResponse.json(guestbooks[Number(params.id)] ?? []),
  ),

  http.post(`${API}/api/exhibitions/:id/guestbook`, async ({ params, request }) => {
    const body = await request.json()
    const id = Number(params.id)
    const entry = { id: Date.now(), ...body, createdAt: new Date().toISOString() }
    guestbooks[id] = [entry, ...(guestbooks[id] ?? [])]
    save('mock-guestbooks', guestbooks)
    return HttpResponse.json(entry)
  }),
]