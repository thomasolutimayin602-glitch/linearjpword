import { useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { useStudyStore } from './stores/study-store'
import Layout from './components/Layout'
import Home from './pages/Home'
import Study from './pages/Study'
import WrongWords from './pages/WrongWords'
import Stats from './pages/Stats'
import Settings from './pages/Settings'
import Reading, { ReadingTest, ReadingShelf, ReadingBook, Listening } from './pages/Reading'
import Community from './pages/Community'
import Profile from './pages/Profile'
import Search, { WordDetail, Favorites } from './pages/Search'
import Welcome from './pages/Welcome'
import Policy from './pages/Policy'
import Onboarding from './pages/Onboarding'

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

function AppRoutes() {
  const location = useLocation()
  const bootstrap = useStudyStore(s => s.bootstrap)
  const bootstrapped = useStudyStore(s => s.bootstrapped)
  const policyAccepted = useStudyStore(s => s.policyAccepted)

  useEffect(() => { void bootstrap() }, [bootstrap])

  if (!bootstrapped) {
    return (
      <div className="min-h-dvh bg-[#F5F6F7] flex items-center justify-center text-[13px] text-gray-400">
        正在载入学习数据…
      </div>
    )
  }

  const isPublic = location.pathname === '/welcome' || location.pathname.startsWith('/policy/')
  if (!policyAccepted && !isPublic) return <Navigate to="/welcome" replace />

  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/policy/:kind" element={<Policy />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/study" element={<Study />} />
          <Route path="/wrong" element={<WrongWords />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reading" element={<Reading />} />
          <Route path="/reading/test" element={<ReadingTest />} />
          <Route path="/reading/shelf" element={<ReadingShelf />} />
          <Route path="/reading/book/:bookId" element={<ReadingBook />} />
          <Route path="/reading/listen" element={<Listening />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/word/:wordId" element={<WordDetail />} />
          <Route path="/favorites" element={<Favorites />} />
      </Route>
    </Routes>
  )
}
