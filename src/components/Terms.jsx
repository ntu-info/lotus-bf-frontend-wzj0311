import { API_BASE } from '../api'
import { useEffect, useMemo, useState, useRef } from 'react'
import './Terms.css'

export function Terms ({ onPickTerm }) {
  const [terms, setTerms] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [searchHistory, setSearchHistory] = useState([])
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const searchInputRef = useRef(null)
  const searchHistoryRef = useRef(null)

  // 載入搜尋歷史記錄
  useEffect(() => {
    const saved = localStorage.getItem('termsSearchHistory')
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse terms search history:', e)
      }
    }
  }, [])

  // 點擊外部關閉歷史記錄
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchInputRef.current && !searchInputRef.current.contains(e.target) &&
        searchHistoryRef.current && !searchHistoryRef.current.contains(e.target)
      ) {
        setShowSearchHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const saveSearchToHistory = (value) => {
    if (!value.trim()) return
    const newHistory = [value, ...searchHistory.filter(h => h !== value)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('termsSearchHistory', JSON.stringify(newHistory))
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearch(value)
    if (value) {
      saveSearchToHistory(value)
    }
  }

  const handleSearchFocus = () => {
    if (searchHistory.length > 0) {
      setShowSearchHistory(true)
    }
  }

  const selectSearchHistory = (value) => {
    setSearch(value)
    setShowSearchHistory(false)
    searchInputRef.current?.focus()
  }

  useEffect(() => {
    let alive = true
    const ac = new AbortController()
    const load = async () => {
      setLoading(true)
      setErr('')
      try {
        const res = await fetch(`${API_BASE}/terms`, { signal: ac.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!alive) return
        setTerms(Array.isArray(data?.terms) ? data.terms : [])
      } catch (e) {
        if (!alive) return
        setErr(`Failed to fetch terms: ${e?.message || e}`)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false; ac.abort() }
  }, [])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return terms
    
    // 如果只輸入一個字母，優先顯示該字母開頭的 terms
    if (s.length === 1 && /^[a-z]$/.test(s)) {
      const startsWithLetter = terms.filter(t => t.toLowerCase().startsWith(s))
      const containsLetter = terms.filter(t => !t.toLowerCase().startsWith(s) && t.toLowerCase().includes(s))
      return [...startsWithLetter, ...containsLetter]
    }
    
    // 一般搜尋：優先顯示開頭匹配的，然後是包含的
    const startsWith = terms.filter(t => t.toLowerCase().startsWith(s))
    const contains = terms.filter(t => !t.toLowerCase().startsWith(s) && t.toLowerCase().includes(s))
    return [...startsWith, ...contains]
  }, [terms, search])


  return (
    <div className='terms'>
      {/* 左側控制面板 (1/2 寬度) */}
      <div className='terms__sidebar'>
        {/* 搜尋框和統計信息 - 同一行 */}
        <div className='terms__top-row'>
          <div className='terms__search-wrapper'>
            <input
              ref={searchInputRef}
              value={search}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              placeholder='Search terms...'
              className='terms__search-input'
            />
            {showSearchHistory && searchHistory.length > 0 && (
              <div ref={searchHistoryRef} className='terms__search-history'>
                {searchHistory.map((item, i) => (
                  <div
                    key={i}
                    className='terms__search-history-item'
                    onClick={() => selectSearchHistory(item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className='terms__stats-compact'>
            {search ? (
              <><strong>{filtered.length}</strong> / {terms.length}</>
            ) : (
              <strong>{terms.length}</strong>
            )}
          </div>
        </div>
      </div>

      {/* 右側列表區域 (1/2 寬度) */}
      <div className='terms__content'>
        {loading && (
          <div className='terms__skeleton'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='terms__skeleton-row' />
            ))}
          </div>
        )}

        {err && (
          <div className='alert alert--error'>
            {err}
          </div>
        )}

        {!loading && !err && (
          <div className='terms__list'>
            {filtered.length === 0 ? (
              <div className='terms__empty'>
                {search ? 'No matching terms found' : 'No terms available'}
              </div>
            ) : (
              <ul className='terms__ul'>
                {filtered.slice(0, 500).map((t, idx) => (
                  <li key={`${t}-${idx}`} className='terms__li'>
                    <a
                      href="#"
                      className='terms__name'
                      title={t}
                      aria-label={`Add term ${t}`}
                      onClick={(e) => { e.preventDefault(); onPickTerm?.(t); }}
                    >
                      {t}
                    </a>
                  </li>
                ))}
                {filtered.length > 500 && (
                  <li className='terms__more'>
                    + {filtered.length - 500} more terms (refine your search)
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
