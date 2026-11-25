import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'

const link = ({ isActive }) =>
  `rounded px-3 py-1 text-sm ${isActive ? 'bg-amber-300 text-neutral-900' : 'text-neutral-300 hover:bg-neutral-800'}`

export default function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  return (
    <div className="flex h-screen flex-col bg-neutral-900 text-white">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-neutral-800 px-4">
        <span className="mr-4 font-bold text-amber-300">Photo Graph</span>
        <NavLink to="/" end className={link}>홈</NavLink>
        <NavLink to="/upload" className={link}>사진 올리기</NavLink>
        <NavLink to="/exhibitions" className={link}>전시장 모아보기</NavLink>
        <div className="ml-auto flex items-center gap-3 text-sm text-neutral-300">
          <span>{user?.nickname}</span>
          <button
            onClick={() => { logout(); nav('/login') }}
            className="rounded px-2 py-1 hover:bg-neutral-800"
          >
            로그아웃
          </button>
        </div>
      </header>
      <main className="relative min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}