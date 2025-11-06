import { API_BASE } from '../api'
import { useEffect, useMemo, useState, useRef } from 'react'
import './Studies.css'

function classNames (...xs) { return xs.filter(Boolean).join(' ') }

export function Studies ({ query }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [sortKey, setSortKey] = useState('year')
  const [sortDir, setSortDir] = useState('desc') // 'asc' | 'desc'
  const [page, setPage] = useState(1)
  const pageSize = 20
  const tableWrapperRef = useRef(null)
  const [bookmarks, setBookmarks] = useState([])
  const [viewMode, setViewMode] = useState('search') // 'search' | 'bookmarks'

  // 載入書籤
  useEffect(() => {
    const saved = localStorage.getItem('studiesBookmarks')
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse bookmarks:', e)
      }
    }
  }, [])

  // 切換書籤
  const toggleBookmark = (study) => {
    const isBookmarked = bookmarks.some(b => b.id === study.id)
    let newBookmarks
    if (isBookmarked) {
      newBookmarks = bookmarks.filter(b => b.id !== study.id)
    } else {
      newBookmarks = [...bookmarks, study]
    }
    setBookmarks(newBookmarks)
    localStorage.setItem('studiesBookmarks', JSON.stringify(newBookmarks))
  }

  const isBookmarked = (studyId) => {
    return bookmarks.some(b => b.id === studyId)
  }

  // 匯出書籤為 CSV
  const exportBookmarksAsCSV = () => {
    if (bookmarks.length === 0) {
      alert('No bookmarks to export')
      return
    }

    const headers = ['ID', 'Year', 'Journal', 'Title', 'Authors']
    const csvContent = [
      headers.join(','),
      ...bookmarks.map(b => [
        b.id || '',
        b.year || '',
        `"${(b.journal || '').replace(/"/g, '""')}"`,
        `"${(b.title || '').replace(/"/g, '""')}"`,
        `"${(b.authors || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `lotus-bf-bookmarks-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 切換查看模式時重置頁碼
  useEffect(() => { setPage(1) }, [viewMode])

  useEffect(() => { setPage(1) }, [query])

  // 換頁時滾動到頂端
  useEffect(() => {
    if (tableWrapperRef.current) {
      tableWrapperRef.current.scrollTop = 0
    }
  }, [page])

  useEffect(() => {
    if (!query) return
    let alive = true
    const ac = new AbortController()
    ;(async () => {
      setLoading(true)
      setErr('')
      try {
        const url = `${API_BASE}/query/${encodeURIComponent(query)}/studies`
        const res = await fetch(url, { signal: ac.signal })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
        if (!alive) return
        const list = Array.isArray(data?.results) ? data.results : []
        setRows(list)
      } catch (e) {
        if (!alive) return
        setErr(`Unable to fetch studies: ${e?.message || e}`)
        setRows([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false; ac.abort() }
  }, [query])

  const changeSort = (key) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    // 根據查看模式選擇資料來源
    const arr = viewMode === 'bookmarks' ? [...bookmarks] : [...rows]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const A = a?.[sortKey]
      const B = b?.[sortKey]
      // Numeric comparison for year; string comparison for other fields
      if (sortKey === 'year') return (Number(A || 0) - Number(B || 0)) * dir
      return String(A || '').localeCompare(String(B || ''), 'en') * dir
    })
    return arr
  }, [rows, bookmarks, viewMode, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="studies">
      {!query && (
        <div className="studies__table-wrapper">
          <table className="studies__table">
            <thead>
              <tr>
                <th className="studies__table-bookmark-col">
                  <span className="studies__table-sort">★</span>
                </th>
                {[
                  { key: 'year', label: 'Year' },
                  { key: 'journal', label: 'Journal' },
                  { key: 'title', label: 'Title' },
                  { key: 'authors', label: 'Authors' }
                ].map(({ key, label }) => (
                  <th key={key}>
                    <span className="studies__table-sort">
                      {label}
                      <span className="studies__table-sort-icon"></span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="studies__table-empty">No data</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {query && loading && (
        <div className="studies__loading">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="studies__skeleton-row" />
          ))}
        </div>
      )}

      {query && err && (
        <div className="studies__error">
          {err}
        </div>
      )}

      {query && !loading && !err && (
        <>
          <div className="studies__controls">
            <div className="studies__view-toggle">
              <button
                className={`studies__view-btn ${viewMode === 'search' ? 'studies__view-btn--active' : ''}`}
                onClick={() => setViewMode('search')}
                title="Search Results"
              >
                🔍
              </button>
              <button
                className={`studies__view-btn ${viewMode === 'bookmarks' ? 'studies__view-btn--active' : ''}`}
                onClick={() => setViewMode('bookmarks')}
                title={`Bookmarks (${bookmarks.length})`}
              >
                ⭐
              </button>
              {viewMode === 'bookmarks' && bookmarks.length > 0 && (
                <button
                  className="studies__export-btn"
                  onClick={exportBookmarksAsCSV}
                  title="Export bookmarks as CSV"
                >
                  ⬇️
                </button>
              )}
            </div>
            <div className="studies__pagination-section">
              <div className="studies__pagination-info-text">
                <span className="studies__pagination-info studies__pagination-info--highlight">{sorted.length}</span> results | {page}/{totalPages}
              </div>
              <div className="studies__pagination">
                <button 
                  disabled={page <= 1} 
                  onClick={() => setPage(1)} 
                  className="studies__pagination-btn"
                  title="First page"
                >
                  &lt;&lt;
                </button>
                <button 
                  disabled={page <= 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  className="studies__pagination-btn"
                  title="Previous"
                >
                  &lt;
                </button>
                <button 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  className="studies__pagination-btn"
                  title="Next"
                >
                  &gt;
                </button>
                <button 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(totalPages)} 
                  className="studies__pagination-btn"
                  title="Last page"
                >
                  &gt;&gt;
                </button>
              </div>
            </div>
          </div>
          <div className="studies__table-wrapper" ref={tableWrapperRef}>
          <table className="studies__table">
            <thead>
              <tr>
                <th className="studies__table-bookmark-col">
                  <span className="studies__table-sort">★</span>
                </th>
                {[
                  { key: 'year', label: 'Year' },
                  { key: 'journal', label: 'Journal' },
                  { key: 'title', label: 'Title' },
                  { key: 'authors', label: 'Authors' }
                ].map(({ key, label }) => (
                  <th key={key} onClick={() => changeSort(key)}>
                    <span className="studies__table-sort">
                      {label}
                      <span className="studies__table-sort-icon">
                        {sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="studies__table-empty">
                    {viewMode === 'bookmarks' ? 'No bookmarks' : 'No data'}
                  </td>
                </tr>
              ) : (
                pageRows.map((r, i) => (
                  <tr key={i}>
                    <td className="studies__table-bookmark-col">
                      <button
                        className={`studies__bookmark-btn ${isBookmarked(r.id) ? 'studies__bookmark-btn--active' : ''}`}
                        onClick={() => toggleBookmark(r)}
                        title={isBookmarked(r.id) ? 'Remove bookmark' : 'Add bookmark'}
                      >
                        {isBookmarked(r.id) ? '★' : '☆'}
                      </button>
                    </td>
                    <td>{r.year ?? ''}</td>
                    <td>
                      <div className="studies__table-journal" title={r.journal}>
                        {r.journal || ''}
                      </div>
                    </td>
                    <td className="studies__table-title">
                      {r.id ? (
                        <a 
                          href={`https://pubmed.ncbi.nlm.nih.gov/${r.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="studies__table-title-link"
                          title={r.title}
                        >
                          {r.title || ''}
                        </a>
                      ) : (
                        <div className="studies__table-title-text" title={r.title}>
                          {r.title || ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="studies__table-authors" title={r.authors}>
                        {r.authors || ''}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}

