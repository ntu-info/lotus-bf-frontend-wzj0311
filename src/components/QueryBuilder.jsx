import { useState, useEffect, useRef } from 'react'
import './QueryBuilder.css'

export function QueryBuilder({ query, setQuery }) {
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const inputRef = useRef(null)
  const historyRef = useRef(null)

  // 載入歷史記錄
  useEffect(() => {
    const saved = localStorage.getItem('queryHistory')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse query history:', e)
      }
    }
  }, [])

  // 點擊外部關閉歷史記錄
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        historyRef.current && !historyRef.current.contains(e.target)
      ) {
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const saveToHistory = (value) => {
    if (!value.trim()) return
    const newHistory = [value, ...history.filter(h => h !== value)].slice(0, 10)
    setHistory(newHistory)
    localStorage.setItem('queryHistory', JSON.stringify(newHistory))
  }

  const append = (token) => setQuery((q) => (q ? `${q} ${token}` : token));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.currentTarget.value
      setQuery(value);
      saveToHistory(value)
      setShowHistory(false)
    }
  };

  const handleFocus = () => {
    if (history.length > 0) {
      setShowHistory(true)
    }
  }

  const selectHistory = (value) => {
    setQuery(value)
    setShowHistory(false)
    inputRef.current?.focus()
  }

  return (
    <div className="query-builder">
      {/* Input */}
      <div className="query-builder__input-wrapper">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder="Create a query here, e.g.: [-22,-4,18] NOT emotion"
          className="query-builder__input"
        />
        {showHistory && history.length > 0 && (
          <div ref={historyRef} className="query-builder__history">
            {history.map((item, i) => (
              <div
                key={i}
                className="query-builder__history-item"
                onClick={() => selectHistory(item)}
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Operators + Reset */}
      <div className="query-builder__operators">
        {[
          { label: 'AND', onClick: () => append('AND') },
          { label: 'OR', onClick: () => append('OR') },
          { label: 'NOT', onClick: () => append('NOT') },
          { label: '(', onClick: () => append('(') },
          { label: ')', onClick: () => append(')') },
        ].map((b) => (
          <button
            key={b.label}
            onClick={b.onClick}
            className="query-builder__btn"
          >
            {b.label}
          </button>
        ))}
        <button
          onClick={() => setQuery('')}
          className="query-builder__btn query-builder__btn--reset"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
