import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/app/App'

const pageLoaded = () =>
  document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((r) => window.addEventListener('load', r, { once: true }))

async function startMock() {
  const { worker } = await import('@/mocks/browser')
  await pageLoaded()
  try {
    await worker.start({ onUnhandledRequest: 'bypass' })
  } catch {
    // 한 번 재시도
    await new Promise((r) => setTimeout(r, 500))
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}

async function start() {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    try {
      await startMock()
    } catch (err) {
      console.error('MSW 시작 실패 (브라우저가 서비스 워커를 막고 있어요):', err)
    }
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

start()