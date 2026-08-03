import { Handle, Position } from '@xyflow/react'

// A tiny dot to serve as the anchor for child lines coming from a marriage
export function UnionNode() {
  return (
    <div style={{
      width: 8,
      height: 8,
      background: 'var(--primary)',
      borderRadius: '50%',
      border: '1px solid var(--card)',
      boxShadow: '0 0 4px rgba(0,0,0,0.2)'
    }}>
      <Handle type="target" id="top" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" id="bottom" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" id="left" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" id="right" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}
