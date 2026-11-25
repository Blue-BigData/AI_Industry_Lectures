// /api/graph 응답을 가정한 목업 (백엔드 응답 형태가 정해지면 맞춰서 수정)
export const mockGraph = {
  nodes: [
    { id: 'p1', label: '바다', type: 'photo' },
    { id: 'p2', label: '노을', type: 'photo' },
    { id: 'p3', label: '해변 산책', type: 'photo' },
    { id: 'p4', label: '카페', type: 'photo' },
    { id: 'p5', label: '커피', type: 'photo' },
    { id: 'p6', label: '골목길', type: 'photo' },
    { id: 'p7', label: '고양이', type: 'photo' },
    { id: 'p8', label: '여름', type: 'photo' },
  ],
  links: [
    { source: 'p1', target: 'p2' },
    { source: 'p1', target: 'p3' },
    { source: 'p2', target: 'p3' },
    { source: 'p3', target: 'p8' },
    { source: 'p4', target: 'p5' },
    { source: 'p4', target: 'p6' },
    { source: 'p6', target: 'p7' },
    { source: 'p1', target: 'p8' },
  ],
}