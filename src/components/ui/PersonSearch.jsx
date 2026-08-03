import { useState, useRef, useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import { SearchNormal1 } from 'iconsax-react'
import { useUIStore } from '../../store/useUIStore'
import { Avatar } from './Avatar'

export function PersonSearch({ people = [] }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const setSelectedPerson = useUIStore(s => s.setSelectedPerson)
  const { fitView } = useReactFlow()
  const containerRef = useRef(null)

  // Filter people matching search query
  const filtered = query.trim() === '' ? [] : people.filter(p => {
    const fullName = `${p.first_name || ''} ${p.last_name || ''} ${p.birth_name || ''}`.toLowerCase()
    return fullName.includes(query.toLowerCase().trim())
  }).slice(0, 8)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(person) {
    setSelectedPerson(person.id)
    fitView({ nodes: [{ id: person.id }], duration: 500, maxZoom: 1.2 })
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', margin: '0 16px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--muted)', padding: '6px 14px', borderRadius: 20,
        border: '1px solid var(--border)', width: 220, transition: 'all 0.2s ease',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <SearchNormal1 size={15} color="var(--muted-foreground)" />
        <input 
          type="text" 
          placeholder="Search person..."
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontSize: 13, color: 'var(--foreground)', width: '100%'
          }}
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          overflow: 'hidden', zIndex: 100, minWidth: 260
        }}>
          {filtered.map(person => (
            <div 
              key={person.id}
              onClick={() => handleSelect(person)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                cursor: 'pointer', borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s ease'
              }}
              className="hover:bg-muted"
            >
              <Avatar person={person} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {person.first_name} {person.last_name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                  {person.birth_date ? new Date(person.birth_date).getFullYear() : '?'} - 
                  {!person.is_living ? (person.death_date ? new Date(person.death_date).getFullYear() : '?') : 'Present'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
