
import { useCallback, useState, useEffect } from 'react'
import { Terms } from './components/Terms'
import { QueryBuilder } from './components/QueryBuilder'
import { Studies } from './components/Studies'
import { NiiViewer } from './components/NiiViewer'
import { useUrlQueryState } from './hooks/useUrlQueryState'
import './App.css'

export default function App () {
  const [query, setQuery] = useUrlQueryState('q')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }, [darkMode])

  const handlePickTerm = useCallback((t) => {
    setQuery((q) => (q ? `${q} ${t}` : t))
  }, [setQuery])

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">LoTUS-BF</h1>
        <div className="app__subtitle">Location-or-Term Unified Search for Brain Functions</div>
        <div className="app__theme-toggle">
          <input 
            type="checkbox" 
            id="theme-toggle-checkbox" 
            className="app__theme-toggle-checkbox"
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
          />
          <label 
            htmlFor="theme-toggle-checkbox" 
            className="app__theme-toggle-label"
            title={darkMode ? '切換到淺色模式' : '切換到深色模式'}
          >
            <span className="app__theme-toggle-icon app__theme-toggle-icon--sun">☀️</span>
            <span className="app__theme-toggle-icon app__theme-toggle-icon--moon">🌙</span>
            <span className="app__theme-toggle-slider"></span>
          </label>
        </div>
      </header>

      <main className="app__layout">
        {/* First Row: Terms */}
        <section className="app__row">
          <div className="card">
            <div className="card__title">Terms</div>
            <Terms onPickTerm={handlePickTerm} />
          </div>
        </section>

        {/* Second Row: Query Builder */}
        <section className="app__row">
          <div className="card">
            <div className="card__title">Query Builder</div>
            <QueryBuilder query={query} setQuery={setQuery} />
          </div>
        </section>

        {/* Bottom Row: Two Columns (Studies + NIfTI Viewer) */}
        <section className="app__row app__row--columns">
          <div className="card">
            <div className="card__title">Studies</div>
            <Studies query={query} />
          </div>

          <div className="card">
            <div className="card__title">NIfTI Viewer</div>
            <NiiViewer query={query} />
          </div>
        </section>
      </main>

      <footer className="app__footer">
        <div className="app__footer-content">
          &copy; 2025 LoTUS-BF. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
