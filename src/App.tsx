import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
    </BrowserRouter>
  )
}
