import { useState, useRef, useEffect } from 'react'
import { useUIStore } from '../../store/useUIStore'
import { Filter } from 'iconsax-react'

export function TreeFilterBar({ people = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  
  const filters = useUIStore(s => s.filters)
  const setFilter = useUIStore(s => s.setFilter)
  const resetFilters = useUIStore(s => s.resetFilters)

  // Extract unique clans/locations
  const clanLocationOptions = Array.from(
    new Set(
      people
        .flatMap(p => [p.clan, p.location])
        .filter(Boolean)
    )
  )

  // Calculate active filter count
  let activeCount = 0
  if (filters.clan && filters.clan !== 'all') activeCount++
  if (filters.living && filters.living !== 'all') activeCount++
  if (filters.gender && filters.gender !== 'all') activeCount++

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-sm"
        style={{
          background: activeCount > 0 ? 'var(--accent-faint)' : '#fff',
          border: '1px solid var(--border)',
          borderRadius: 20,
          fontSize: 13,
          padding: '6px 14px',
          color: activeCount > 0 ? 'var(--accent)' : 'var(--foreground)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer'
        }}
      >
        <Filter size={15} color="currentColor" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span style={{
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: '50%',
            width: 18,
            height: 18,
            fontSize: 11,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 2
          }}>
            {activeCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 42,
          left: 0,
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          padding: 16,
          width: 240,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', color: 'var(--muted-foreground)', letterSpacing: '0.04em' }}>
            Filter Tree Nodes
          </div>

          {/* Clan / Location Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>Clan or Location</label>
            <select
              value={filters.clan || 'all'}
              onChange={e => setFilter('clan', e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 13,
                outline: 'none',
                background: '#f8fafc'
              }}
            >
              <option value="all">All Clans / Locations</option>
              {clanLocationOptions.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {/* Living Status Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>Living Status</label>
            <select
              value={filters.living || 'all'}
              onChange={e => setFilter('living', e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 13,
                outline: 'none',
                background: '#f8fafc'
              }}
            >
              <option value="all">Status: All</option>
              <option value="living">💚 Living Only</option>
              <option value="deceased">🕊️ Deceased Only</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>Gender</label>
            <select
              value={filters.gender || 'all'}
              onChange={e => setFilter('gender', e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 13,
                outline: 'none',
                background: '#f8fafc'
              }}
            >
              <option value="all">Gender: All</option>
              <option value="male">👨 Male</option>
              <option value="female">👩 Female</option>
            </select>
          </div>

          {/* Action Row */}
          {activeCount > 0 && (
            <div style={{ paddingTop: 8, borderTop: '1px solid var(--muted)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={resetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


