
import { useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

const PHOTO_R = 9

// 키워드 노드 크기 계산
const keywordR = (node) => {
  const count = Number(node.count)

  if (!Number.isFinite(count) || count < 1) {
    return 9
  }

  return 6 + Math.sqrt(count) * 3
}

export default function KeywordGraph({ data, selectedId, onNodeClick }) {
  const wrapRef = useRef(null)
  const fgRef = useRef(null)
  const imgs = useRef(new Map())
  const fitted = useRef(false)

  const [size, setSize] = useState({
    width: 800,
    height: 600,
  })

  const [, setTick] = useState(0)

  // 컨테이너 크기 추적
  useEffect(() => {
    const el = wrapRef.current

    if (!el) return

    const resize = () => {
      setSize({
        width: el.clientWidth || 800,
        height: el.clientHeight || 600,
      })
    }

    const ro = new ResizeObserver(resize)

    ro.observe(el)
    resize()

    return () => ro.disconnect()
  }, [])

  // 그래프 데이터 복사
  const graphData = useMemo(() => {
    return {
      nodes: (data?.nodes || []).map((node) => ({
        ...node,
        count: Number(node.count) || 1,
      })),

      links: (data?.links || []).map((link) => ({
        ...link,
        score: Number(link.score) || 50,
      })),
    }
  }, [data])

  // 그래프 물리 설정
  useEffect(() => {
    const fg = fgRef.current

    if (!fg) return

    const linkForce = fg.d3Force('link')

    if (linkForce) {
      linkForce
        .distance((link) => {
          const score = Number(link.score)
          const safeScore = Number.isFinite(score) ? score : 50

          return 25 + (100 - safeScore) * 1.1
        })
        .strength(0.9)
    }

    const chargeForce = fg.d3Force('charge')

    if (chargeForce) {
      chargeForce.strength(-60)
    }

    fitted.current = false
    fg.d3ReheatSimulation()
  }, [graphData])

  // 사진 이미지 가져오기
  const getImage = (url) => {
    if (!url) return null

    let img = imgs.current.get(url)

    if (!img) {
      img = new Image()

      img.onload = () => {
        setTick((tick) => tick + 1)
      }

      img.onerror = () => {
        console.log('사진을 불러오지 못했습니다:', url)
      }

      img.src = url
      imgs.current.set(url, img)
    }

    return img
  }

  // 노드 그리기
  const drawNode = (node, ctx, scale) => {
    // 좌표 검사
    if (
      !Number.isFinite(node.x) ||
      !Number.isFinite(node.y)
    ) {
      return
    }

    // 배율 검사
    if (!Number.isFinite(scale) || scale <= 0) {
      scale = 1
    }

    // 키워드 노드
    if (node.type === 'keyword') {
      const r = keywordR(node)

      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        0,
        node.x,
        node.y,
        r * 2.4
      )

      gradient.addColorStop(0, 'rgba(253,230,138,0.85)')
      gradient.addColorStop(1, 'rgba(253,230,138,0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(node.x, node.y, r * 2.4, 0, 2 * Math.PI)
      ctx.fill()

      // 키워드 원
      ctx.fillStyle = '#fde68a'
      ctx.beginPath()
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
      ctx.fill()

      // 키워드 이름
      ctx.font = `${13 / scale}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgba(255,255,255,0.9)'

      ctx.fillText(
        node.label || '',
        node.x,
        node.y + r + 2 / scale
      )

      return
    }

    // 사진 노드
    const img = getImage(node.url)

    ctx.save()

    ctx.beginPath()
    ctx.arc(node.x, node.y, PHOTO_R, 0, 2 * Math.PI)
    ctx.clip()

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(
        img,
        node.x - PHOTO_R,
        node.y - PHOTO_R,
        PHOTO_R * 2,
        PHOTO_R * 2
      )
    } else {
      ctx.fillStyle = '#525252'
      ctx.fill()
    }

    ctx.restore()

    // 사진 테두리
    ctx.beginPath()
    ctx.arc(node.x, node.y, PHOTO_R, 0, 2 * Math.PI)

    ctx.lineWidth =
      (node.id === selectedId ? 2.5 : 1) / scale

    ctx.strokeStyle =
      node.id === selectedId
        ? '#fcd34d'
        : 'rgba(255,255,255,0.5)'

    ctx.stroke()
  }

  return (
    <div ref={wrapRef} className="h-full w-full">
      <ForceGraph2D
        ref={fgRef}
        width={size.width}
        height={size.height}
        graphData={graphData}
        backgroundColor="#171717"

        // 노드 그리기
        nodeCanvasObject={drawNode}

        // 노드 클릭 영역
        nodePointerAreaPaint={(node, color, ctx) => {
          if (
            !Number.isFinite(node.x) ||
            !Number.isFinite(node.y)
          ) {
            return
          }

          ctx.fillStyle = color
          ctx.beginPath()

          ctx.arc(
            node.x,
            node.y,
            node.type === 'keyword'
              ? keywordR(node)
              : PHOTO_R,
            0,
            2 * Math.PI
          )

          ctx.fill()
        }}

        // 연결선 색상
        linkColor={(link) => {
          const score = Number(link.score)
          const safeScore = Number.isFinite(score) ? score : 50

          return `rgba(253,230,138,${0.08 + (safeScore / 100) * 0.45})`
        }}

        linkWidth={(link) => {
          return Number(link.score) >= 80 ? 1.5 : 0.8
        }}

        linkLabel={(link) => `${link.score}%`}

        // 마우스 올렸을 때 표시되는 설명
        nodeLabel={(node) => {
          if (node.type === 'keyword') {
            return `${node.label} (${node.count}장)`
          }

          return ''
        }}

        // 노드 클릭
        onNodeClick={onNodeClick}

        // 그래프 배치 완료 후 화면에 맞추기
        onEngineStop={() => {
          if (!fitted.current) {
            fitted.current = true
            fgRef.current?.zoomToFit(400, 80)
          }
        }}
      />
    </div>
  )
}
