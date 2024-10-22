import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import BasicApp from './closescreen.jsx'

import { BrowserRouter, Routes, Route } from 'react-router-dom'

import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* create router */}
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/goodbye" element={<BasicApp />} />
      </Routes>
    </BrowserRouter>    
  </StrictMode>,
)
