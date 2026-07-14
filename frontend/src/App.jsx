import React from 'react'
import {Routes, Route} from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './utils/ProtectedRoute'
import SignUp from './pages/SignUp'
import Login from './pages/Login'

const App = () => {
  return (
    <>
      <Toaster position='top-right' reverseOrder={false} />
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/dashboard' element={<ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>}/>
        <Route path='/register' element={<SignUp/>} />
        <Route path='/login' element={<Login />} />
      </Routes>
    </>
  )
}

export default App
