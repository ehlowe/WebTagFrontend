import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import App from './App_Working_Periodic.jsx'
// import App from './App.jsx'
import App from './app_psuedo.jsx'


import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
