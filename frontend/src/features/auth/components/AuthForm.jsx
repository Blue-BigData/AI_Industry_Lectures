import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { login as loginApi, signup as signupApi } from '../api'
import { useAuth } from '../AuthContext'

export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup'
  const nav = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', nickname: '' })

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const mutation = useMutation({
    mutationFn: async () => {
      if (isSignup) {
        await signupApi(form)
        return loginApi({ email: form.email, password: form.password })
      }
      return loginApi({ email: form.email, password: form.password })
    },
    onSuccess: ({ token, user }) => {
      login(token, user)
      nav('/')
    },
  })

  const valid =
    form.email.trim() && form.password.length >= 4 && (!isSignup || form.nickname.trim())

  const submit = (e) => {
    e.preventDefault()
    if (valid) mutation.mutate()
  }

  const input = 'w-full rounded-lg bg-neutral-800 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300'

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 p-4 text-white">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-neutral-800/60 p-8">
        <h1 className="text-2xl font-bold">
          <span className="text-amber-300">Photo Graph</span>
        </h1>
        <p className="text-sm text-neutral-400">
          {isSignup ? '계정을 만들고 내 사진 그래프를 시작해요' : '로그인하고 내 사진 그래프를 이어가요'}
        </p>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm">이메일</label>
          <input id="email" type="email" value={form.email} onChange={set('email')} className={input} />
        </div>

        {isSignup && (
          <div>
            <label htmlFor="nickname" className="mb-1 block text-sm">닉네임</label>
            <input id="nickname" maxLength={10} value={form.nickname} onChange={set('nickname')} className={input} />
          </div>
        )}

        <div>
          <label htmlFor="pw" className="mb-1 block text-sm">비밀번호 (4자 이상)</label>
          <input id="pw" type="password" value={form.password} onChange={set('password')} className={input} />
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-400">
            {mutation.error?.response?.data?.message ?? '요청에 실패했어요. 다시 시도해주세요.'}
          </p>
        )}

        <button
          type="submit"
          disabled={!valid || mutation.isPending}
          className="w-full rounded-lg bg-amber-300 py-3 font-semibold text-neutral-900 disabled:opacity-30"
        >
          {mutation.isPending ? '처리 중...' : isSignup ? '회원가입' : '로그인'}
        </button>

        <p className="text-center text-sm text-neutral-400">
          {isSignup ? (
            <>이미 계정이 있나요? <Link to="/login" className="text-amber-300">로그인</Link></>
          ) : (
            <>처음이세요? <Link to="/signup" className="text-amber-300">회원가입</Link></>
          )}
        </p>
      </form>
    </div>
  )
}