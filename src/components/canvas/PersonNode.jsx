import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Avatar } from '../ui/Avatar'
import { calculateAge } from '../../lib/utils'

export const PersonNode = memo(({ data }) => {
  const { person } = data
  const isDeceased = !person.is_living || person.death_date

  // Fallback initials if no photo
  const initials = (person.first_name?.[0] || '') + (person.last_name?.[0] || '')

  return (
    <div className={`person-node ${isDeceased ? 'deceased' : ''}`}>
      {/* 4 Cardinal Handles */}
      <Handle type="target" position={Position.Top} id="top" className="handle handle-top" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="handle handle-bottom" />
      <Handle type="target" position={Position.Left} id="left" className="handle handle-left" />
      <Handle type="source" position={Position.Right} id="right" className="handle handle-right" />
      
      {data.kinship && data.kinship !== 'Reference' && (
        <span className="pn-rel">{data.kinship}</span>
      )}
      {data.kinship === 'Reference' && (
        <span className="pn-root-flag">REFERENCE</span>
      )}

      <div className="person-node-inner" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="avatar">
          <Avatar person={person} size={56} style={{ margin: '0 auto' }} />
        </div>
        
        <div className="info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="name" style={{ textAlign: 'center' }}>
            {person.first_name} {person.last_name}
          </div>
          {person.birth_name && person.birth_name !== person.last_name && (
            <div className="pn-sub" style={{ fontSize: '10px', fontStyle: 'italic', marginBottom: '2px' }}>
              (née {person.birth_name})
            </div>
          )}
          <div className="pn-sub" style={{ textAlign: 'center' }}>
            {person.birth_date ? new Date(person.birth_date).getFullYear() : '?'} - 
            {!person.is_living ? (person.death_date ? new Date(person.death_date).getFullYear() : '?') : 'Present'}
            {calculateAge(person) !== null && ` (${calculateAge(person)} yrs)`}
          </div>
          {person.location && (
            <div className="pn-sub" style={{ textAlign: 'center', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              📍 {person.location}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
