import { Routes, Route } from 'react-router-dom'
import HomePage from './routes/index'
import LoginPage from './routes/login'
import RegisterPage from './routes/register'
import DashboardPage from './routes/dashboard'
import GardenPage from './routes/garden'
import PlantDetailPage from './routes/plants/$plantId'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/garden" element={<GardenPage />} />
      <Route path="/plants/:plantId" element={<PlantDetailPage />} />
    </Routes>
  )
}
