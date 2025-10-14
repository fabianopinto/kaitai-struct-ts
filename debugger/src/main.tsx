/**
 * @fileoverview Application entry point
 * @module debugger/main
 * @author Fabiano Pinto
 * @license MIT
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
