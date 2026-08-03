import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useUIStore } from '../../store/useUIStore'

export const PersonNode = memo(({ data, selected }) => {
  const { person } = data
  const isDeceased = !person.is_living || person.death_date
  
  const selectedPersonId = useUIStore(s => s.selectedPersonId)
  const isSelected = selected || selectedPersonId === person.id
  
  const collapsedParentIds = useUIStore(s => s.collapsedParentIds)
  const toggleCollapseParent = useUIStore(s => s.toggleCollapseParent)
  
  const childCount = data.childCount || 0
  const isCollapsed = collapsedParentIds.includes(person.id)

  const avatarSrc = person.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.first_name || '')}+${encodeURIComponent(person.last_name || '')}&background=e2e8f0&color=64748b&bold=true`

  return (
    <div className={`person-node ${isSelected ? 'selected' : ''} ${isDeceased ? 'deceased' : ''}`}>
      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top" className="handle handle-top" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="handle handle-bottom" />
      <Handle type="target" position={Position.Left} id="left" className="handle handle-left" />
      <Handle type="source" position={Position.Right} id="right" className="handle handle-right" />
      
      {data.kinship && data.kinship !== 'Reference' && (
        <span className="pn-rel-badge" style={{ position: 'absolute', top: -8, zIndex: 10 }}>{data.kinship}</span>
      )}
      {data.kinship === 'Reference' && (
        <span className="pn-root-flag" style={{ position: 'absolute', top: -8, zIndex: 10 }}>REFERENCE</span>
      )}

      <div className="person-node-inner">
        {/* Avatar */}
        <div className="pn-avatar">
          <img src={avatarSrc} alt={`${person.first_name || ''} ${person.last_name || ''}`} />
        </div>
        
        {/* Name */}
        <div className="pn-info">
          <div className="pn-name">
            {person.first_name}
            <span>{person.last_name}</span>
          </div>

          {/* Location tag */}
          {person.location && (
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 999,
                padding: '2px 8px',
                maxWidth: '100%',
              }}
            >
              <svg width="7" height="9" viewBox="0 0 7 9" fill="none" style={{ flexShrink: 0 }}>
                <path d="M3.5 0C1.567 0 0 1.567 0 3.5 0 5.906 3.5 9 3.5 9S7 5.906 7 3.5C7 1.567 5.433 0 3.5 0zm0 4.813A1.313 1.313 0 1 1 3.5 2.187a1.313 1.313 0 0 1 0 2.626z" fill="#94A3B8" />
              </svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#64748B', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {person.location}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Branch Collapse/Expand Toggle Badge */}
      {childCount > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleCollapseParent(person.id)
          }}
          className="nodrag nopan"
          style={{
            position: 'absolute',
            bottom: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: '#06C8D5',
            border: '2px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(6,200,213,0.4)',
            transition: 'background-color 0.15s ease, transform 0.15s ease',
            zIndex: 30,
          }}
          title={isCollapsed ? "Expand branch" : "Collapse branch"}
        >
          {isCollapsed ? '+' : '−'}
        </button>
      )}
    </div>
  )
})

