import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import SearchPage from './pages/SearchPage'
import FlyerPage from './pages/FlyerPage'
import DetailPage from './pages/DetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/flyer/:id" element={<FlyerPage />} />
        <Route path="/missing/:id" element={<DetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}
