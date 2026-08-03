import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ReactFlowProvider } from '@xyflow/react'
import { TreeCanvas } from '../components/canvas/TreeCanvas'
import { Avatar } from '../components/ui/Avatar'
import { PersonSearch } from '../components/ui/PersonSearch'
import { useUIStore } from '../store/useUIStore'

export default function ShareView() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tree, setTree] = useState(null)
  const [people, setPeople] = useState([])
  const [relationships, setRelationships] = useState([])
  
  const selectedPersonId = useUIStore(s => s.selectedPersonId)
  const isDetailPanelOpen = useUIStore(s => s.isDetailPanelOpen)
  const closeDetailPanel = useUIStore(s => s.closeDetailPanel)

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
        
        // 2. Fetch tree, people, relationships concurrently
        const [
          { data: treeData, error: treeError },
          { data: peopleData, error: peopleError },
          { data: relData, error: relError }
        ] = await Promise.all([
          supabase.from('trees').select('*').eq('id', treeId).single(),
          supabase.from('people').select('*').eq('tree_id', treeId),
          supabase.from('relationships').select('*').eq('tree_id', treeId)
        ])
          
        if (treeError) throw treeError
        if (peopleError) throw peopleError
        if (relError) throw relError

        setTree(treeData)
        setPeople(peopleData || [])
        setRelationships(relData || [])
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
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }} className="animate-pulse">🌳</div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#64748B' }}>Loading shared tree…</p>
      </div>
    )
  }
  
  if (error || !tree) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
        <div className="empty-card" style={{ pointerEvents: 'all', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔗</div>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800 }}>{error || 'Tree not found'}</h2>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>
            Go to App
          </Link>
        </div>
      </div>
    )
  }

  const selectedPerson = people.find(p => p.id === selectedPersonId)

  // Compute immediate relatives for detail panel
  const relatives = { parents: [], children: [], partners: [], siblings: [] }
  if (selectedPerson) {
    const parentIds = new Set()
    
    relationships.forEach(rel => {
      if (rel.type.includes('parent_child')) {
        if (rel.person_b_id === selectedPerson.id) {
          const parent = people.find(p => p.id === rel.person_a_id)
          if (parent) {
            relatives.parents.push({ ...parent, relType: rel.type })
            parentIds.add(parent.id)
          }
        } else if (rel.person_a_id === selectedPerson.id) {
          const child = people.find(p => p.id === rel.person_b_id)
          if (child) relatives.children.push({ ...child, relType: rel.type })
        }
      } else if (['spouse', 'partner', 'divorced_spouse', 'ex_partner'].includes(rel.type)) {
        if (rel.person_a_id === selectedPerson.id) {
          const partner = people.find(p => p.id === rel.person_b_id)
          if (partner) relatives.partners.push({ ...partner, relType: rel.type })
        } else if (rel.person_b_id === selectedPerson.id) {
          const partner = people.find(p => p.id === rel.person_a_id)
          if (partner) relatives.partners.push({ ...partner, relType: rel.type })
        }
      }
    })

    if (parentIds.size > 0) {
      const siblingIds = new Set()
      relationships.forEach(rel => {
        if (rel.type.includes('parent_child') && parentIds.has(rel.person_a_id) && rel.person_b_id !== selectedPerson.id) {
          siblingIds.add(rel.person_b_id)
        }
      })
      siblingIds.forEach(id => {
        const sibling = people.find(p => p.id === id)
        if (sibling) relatives.siblings.push(sibling)
      })
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <ReactFlowProvider>
        {/* Topbar */}
        <div 
          className="topbar" 
          style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40, height: 56, 
            backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', 
            display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px' 
          }}
        >
          {/* Brand Logo & Tree Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#E0F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🌳
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 15, color: '#0A1628', letterSpacing: '-0.01em' }}>
              {tree.name}
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 11, backgroundColor: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: 999 }}>
              Read Only
            </span>
          </div>

          <div style={{ width: 1, height: 20, backgroundColor: '#E2E8F0', flexShrink: 0 }} />

          <PersonSearch people={people} />

          <div className="topbar-spacer" style={{ flex: 1 }} />

          {/* Member Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#94A3B8' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#06C8D5' }}>{people.length}</span>
            <span>members</span>
          </div>

          <Link to="/login" className="btn btn-primary btn-sm" style={{ backgroundColor: '#06C8D5', borderColor: '#06C8D5', color: '#ffffff' }}>
            Build Your Tree
          </Link>
        </div>

        {/* Main Canvas Area */}
        <div style={{ flex: 1, width: '100%', height: '100%', background: 'var(--background)' }}>
          <TreeCanvas 
            treeId={tree.id} 
            people={people} 
            relationships={relationships} 
            readOnly={true} 
          />
        </div>
      </ReactFlowProvider>
      
      {/* 384px Slide-in Detail Panel Drawer */}
      <div 
        className="detail-panel" 
        style={{ 
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
          width: 384, backgroundColor: '#ffffff',
          boxShadow: '-4px 0 32px rgba(10,22,40,0.10)',
          borderLeft: '1px solid #E2E8F0',
          transform: isDetailPanelOpen && selectedPerson ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {selectedPerson ? (
          <>
            <div className="profile-hero" style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: '#0A1628', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: '#06C8D5' }} />
                  Family Profile
                </h2>
                <button 
                  onClick={closeDetailPanel} 
                  style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #E2E8F0', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <Avatar person={selectedPerson} size={76} style={{ borderRadius: 16, border: '3px solid #E0F9FA', flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 className="profile-name" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#0A1628', margin: '0 0 2px', lineHeight: 1.2 }}>
                    {selectedPerson.first_name} {selectedPerson.last_name}
                  </h3>
                  {selectedPerson.occupation && (
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#64748B', margin: '0 0 10px' }}>{selectedPerson.occupation}</p>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 10, padding: '3px 10px', borderRadius: 999, backgroundColor: '#E0F9FA', color: '#06C8D5' }}>Generation 1</span>
                    {selectedPerson.location && <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 10, padding: '3px 10px', borderRadius: 999, backgroundColor: '#F1F5F9', color: '#475569' }}>{selectedPerson.location}</span>}
                    {selectedPerson.clan && <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 10, padding: '3px 10px', borderRadius: 999, backgroundColor: '#0A1628', color: '#06C8D5' }}>{selectedPerson.clan} Clan</span>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="profile-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>Biography</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#475569', lineHeight: 1.65, margin: 0 }}>
                  {selectedPerson.biography || `${selectedPerson.first_name} is a member of the family.`}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: '8px 12px', border: '1px solid #F1F5F9' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>Born</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#0A1628', margin: 0 }}>
                    {selectedPerson.birth_date ? new Date(selectedPerson.birth_date).getFullYear() : 'Unknown'}
                  </p>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: '8px 12px', border: '1px solid #F1F5F9' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>Clan</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#0A1628', margin: 0 }}>
                    {selectedPerson.clan || '-'}
                  </p>
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Established Family Links</p>
                
                {/* Relatives Renderer */}
                {(() => {
                  const hasRelatives = relatives.parents.length > 0 || relatives.partners.length > 0 || relatives.siblings.length > 0 || relatives.children.length > 0
                  if (!hasRelatives) return <div style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>No immediate family linked yet.</div>
                  
                  const getBadgeColors = (label) => {
                    if (label === 'Spouse') return { bg: '#E0F9FA', color: '#06C8D5' }
                    if (label === 'Parent') return { bg: '#FEF3C7', color: '#D97706' }
                    return { bg: '#F1F5F9', color: '#64748B' }
                  }

                  const renderRelativeGroup = (list, typeLabel) => {
                    if (list.length === 0) return null
                    const badgeStyle = getBadgeColors(typeLabel)
                    return list.map(rel => (
                      <div 
                        key={`${rel.id}-${typeLabel}`}
                        onClick={() => useUIStore.getState().setSelectedPerson(rel.id)}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', 
                          backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9',
                          marginBottom: 6, cursor: 'pointer'
                        }}
                      >
                        <Avatar person={rel} size={34} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12, color: '#0A1628', margin: 0, lineHeight: 1.3 }}>
                            {rel.first_name} {rel.last_name}
                          </p>
                          {rel.location && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#94A3B8', margin: 0 }}>{rel.location}</p>}
                        </div>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, backgroundColor: badgeStyle.bg, color: badgeStyle.color, flexShrink: 0 }}>
                          {typeLabel}
                        </span>
                      </div>
                    ))
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {renderRelativeGroup(relatives.partners, 'Spouse')}
                      {renderRelativeGroup(relatives.parents, 'Parent')}
                      {renderRelativeGroup(relatives.children, 'Child')}
                      {renderRelativeGroup(relatives.siblings, 'Sibling')}
                    </div>
                  )
                })()}
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
            Click any family member on the canvas to view their profile.
          </div>
        )}
      </div>
    </div>
  )
}
