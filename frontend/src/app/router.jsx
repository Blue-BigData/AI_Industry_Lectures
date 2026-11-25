import { createBrowserRouter } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import MainPage from '@/pages/MainPage'
import UploadPage from '@/pages/UploadPage'
import ExhibitionListPage from '@/pages/ExhibitionListPage'
import ExhibitionBuilderPage from '@/pages/ExhibitionBuilderPage'
import ExhibitionDetailPage from '@/pages/ExhibitionDetailPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <MainPage /> },
          { path: '/upload', element: <UploadPage /> },
          { path: '/exhibitions', element: <ExhibitionListPage /> },
          { path: '/exhibitions/new', element: <ExhibitionBuilderPage /> },
          { path: '/exhibitions/:id', element: <ExhibitionDetailPage /> },
        ],
      },
    ],
  },
])