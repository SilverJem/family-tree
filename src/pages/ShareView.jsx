import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ReactFlow, Background, Controls, MiniMap, ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { PersonNode } from '../components/canvas/PersonNode'
import { getLayoutedElements } from '../lib/layout'

const nodeTypes = { person: PersonNode }

const REL_COLORS = {
  parent_child: '#475569',
  spouse: '#0891B2',
  step_parent_child: '#F59E0B',
  adoptive_parent_child: '#10B981',
  divorced_spouse: '#CBD5E1',
  godparent_godchild: '#8B5CF6',
  partner: '#0284C7',
  ex_partner: '#94A3B8',
  sibling: '#059669',
  half_sibling: '#10B981'
}

export default function ShareView() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tree, setTree] = useState(null)
  
  // React Flow state
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [people, setPeople] = useState([])

  useEffect(() => {
    async function fetchSharedTree() {
      try {
        setLoading(true)
        
        // 1. Hash the token to find the share link
        const encoder = new TextEncoder()
        const data = encoder.encode(token)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        
        const { data: shareLink, error: shareError } = await supabase
          .from('share_links')
          .select('tree_id')
          .eq('token_hash', tokenHash)
          .single()
          
        if (shareError || !shareLink) {
          throw new Error('Link not found or expired')
        }
        
        const treeId = shareLink.tree_id
        
        // 2. Fetch the tree
        const { data: treeData, error: treeError } = await supabase
          .from('trees')
          .select('*')
          .eq('id', treeId)
          .single()
          
        if (treeError) throw treeError
        setTree(treeData)
        
        // 3. Fetch people and relationships
        const { data: peopleData, error: peopleError } = await supabase
          .from('people')
          .select('*')
          .eq('tree_id', treeId)
          
        if (peopleError) throw peopleError
        setPeople(peopleData || [])
        
        const { data: relData, error: relError } = await supabase
          .from('relationships')
          .select('*')
          .eq('tree_id', treeId)
          
        if (relError) throw relError
        
        // 4. Transform to React Flow
        const rfNodes = (peopleData || []).map(p => ({
          id: p.id,
          type: 'person',
          position: { x: p.canvas_x || 0, y: p.canvas_y || 0 },
          data: { person: p }
        }))
        
        const getEdgeStyle = (type) => {
          switch (type) {
            case 'parent_child': return { dash: 'none', w: 2.5 }
            case 'step_parent_child': return { dash: '7 5', w: 2.5 }
            case 'adoptive_parent_child': return { dash: '2 4', w: 2.5 }
            case 'foster_parent_child': return { dash: '7 5', w: 2.5 }
            case 'spouse':
            case 'partner': return { dash: 'none', w: 3 }
            case 'divorced_spouse':
            case 'ex_partner': return { dash: '5 5', w: 2.5 }
            case 'godparent_godchild': return { dash: '1 5', w: 2.5 }
            case 'sibling':
            case 'half_sibling': return { dash: 'none', w: 2.5 }
            default: return { dash: 'none', w: 2.5 }
          }
        }

        const rfEdges = (relData || []).map(r => {
          const st = getEdgeStyle(r.type)
          const isHorizontal = ['spouse', 'partner', 'divorced_spouse', 'ex_partner', 'sibling', 'half_sibling'].includes(r.type)
          return {
            id: r.id,
            source: r.person_a_id,
            target: r.person_b_id,
            sourceHandle: isHorizontal ? 'right' : 'bottom',
            targetHandle: isHorizontal ? 'left' : 'top',
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: REL_COLORS[r.type] || '#475569',
              strokeWidth: st.w,
              strokeDasharray: st.dash
            },
            data: { rel: r }
          }
        })
        
        // Use layout engine if nodes have no positions
        const needsLayout = rfNodes.some(n => n.position.x === 0 && n.position.y === 0)
        if (needsLayout && rfNodes.length > 0) {
          const layouted = getLayoutedElements(rfNodes, rfEdges)
          setNodes(layouted.nodes)
          setEdges(layouted.edges)
        } else {
          setNodes(rfNodes)
          setEdges(rfEdges)
        }
        
      } catch (err) {
        console.error('Error loading shared tree:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSharedTree()
  }, [token])

  if (loading) {
    return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>
  }
  
  if (error || !tree) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
        <div className="empty-card" style={{ pointerEvents: 'all' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔗</div>
          <h2>{error || 'Tree not found'}</h2>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>
            Go to App
          </Link>
        </div>
      </div>
    )
  }

  const selectedPerson = people.find(p => p.id === selectedPersonId)

  return (
    <div className="layout-container">
      {/* Topbar (Read Only) */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand" style={{ fontSize: 18 }}>🌲 {tree.name} (Shared View)</div>
        </div>
        <div className="topbar-right">
          <Link to="/" className="btn btn-secondary">Create your own</Link>
        </div>
      </header>

      <main className="main-content">
        <div className="canvas-container">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedPersonId(node.id)}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              minZoom={0.1}
            >
              <Background color="var(--border)" gap={20} size={1} />
              <Controls showInteractive={false} />
              <MiniMap 
                nodeColor={n => n.data?.person?.gender === 'female' ? '#FCE7F3' : '#E0F2FE'}
                maskColor="rgba(255, 255, 255, 0.6)"
              />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* Read-Only Detail Panel */}
        {selectedPersonId && selectedPerson ? (
          <div className="side-panel detail-panel" style={{ right: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div className="panel-header">
              <h2>Person Details</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPersonId(null)}>Close</button>
            </div>
            
            <div className="profile-header">
              <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: 88, 
                  height: 88, 
                  borderRadius: '50%', 
                  background: 'var(--accent)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: 88 * 0.4, 
                  overflow: 'hidden',
                  color: 'var(--text)'
                }}>
                  {selectedPerson.photo_url ? (
                    <img src={selectedPerson.photo_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{((selectedPerson.first_name?.[0] || '') + (selectedPerson.last_name?.[0] || '')).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <h3 className="profile-name">
                {selectedPerson.first_name} {selectedPerson.last_name}
              </h3>
              {selectedPerson.birth_name && selectedPerson.birth_name !== selectedPerson.last_name && (
                <p style={{ fontStyle: 'italic', color: 'var(--muted-foreground)', fontSize: 14, margin: '-2px 0 8px 0' }}>
                  (née {selectedPerson.birth_name})
                </p>
              )}
              <p className="profile-meta">
                {selectedPerson.birth_date ? new Date(selectedPerson.birth_date).getFullYear() : '?'} - 
                {!selectedPerson.is_living ? (selectedPerson.death_date ? new Date(selectedPerson.death_date).getFullYear() : '?') : 'Present'}
              </p>
              {selectedPerson.location && (
                <p className="profile-meta" style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  📍 {selectedPerson.location}
                </p>
              )}
            </div>
            
            <div className="profile-body" style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
              <div style={{ marginBottom: 24, fontSize: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px 12px', marginBottom: 16 }}>
                  <div style={{ color: 'var(--muted-foreground)' }}>Gender</div>
                  <div style={{ textTransform: 'capitalize' }}>{selectedPerson.gender?.replace('_', ' ') || '-'}</div>
                  
                  <div style={{ color: 'var(--muted-foreground)' }}>Birth Date</div>
                  <div>{selectedPerson.birth_date ? new Date(selectedPerson.birth_date).toLocaleDateString() : '-'}</div>
                  
                  <div style={{ color: 'var(--muted-foreground)' }}>Death Date</div>
                  <div>{!selectedPerson.is_living ? (selectedPerson.death_date ? new Date(selectedPerson.death_date).toLocaleDateString() : 'Unknown') : 'Alive'}</div>
                </div>
              </div>

              {selectedPerson.notes && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: 8, letterSpacing: '0.05em' }}>Notes</h4>
                  <p style={{ fontSize: 14 }}>{selectedPerson.notes}</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
