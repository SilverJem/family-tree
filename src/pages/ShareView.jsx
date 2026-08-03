import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ReactFlowProvider } from '@xyflow/react'
import { TreeCanvas } from '../components/canvas/TreeCanvas'
import { Avatar } from '../components/ui/Avatar'
import { PersonSearch } from '../components/ui/PersonSearch'
import { TreeFilterBar } from '../components/ui/TreeFilterBar'
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
        <div style={{ fontSize: 48 }} className="animate-pulse">🌲</div>
        <p>Loading shared tree…</p>
      </div>
    )
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <ReactFlowProvider>
        {/* Read-Only Topbar */}
        <div className="topbar" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            🌲 {tree.name} <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 400 }}>(Read-Only)</span>
          </div>
          <PersonSearch people={people} />
          <TreeFilterBar people={people} relationships={relationships} />
          <div className="topbar-spacer" />
          <Link to="/login" className="btn btn-primary btn-sm">
            Create Your Own Tree
          </Link>
        </div>

        {/* Main Shared Canvas */}
        <div style={{ flex: 1, width: '100%', height: '100%', background: 'var(--background)' }}>
          <TreeCanvas 
            treeId={tree.id} 
            people={people} 
            relationships={relationships} 
            readOnly={true} 
          />
        </div>
      </ReactFlowProvider>
      
      {/* Read-Only Detail Panel Drawer */}
      <div 
        className="detail-panel" 
        style={{ 
          position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 20,
          transform: isDetailPanelOpen && selectedPerson ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)'
        }}
      >
        {selectedPerson && (
          <>
            <div className="profile-hero">
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={closeDetailPanel} 
                style={{ position: 'absolute', top: 12, left: 12, width: 32, height: 32, padding: 0, borderRadius: '50%' }}
              >
                ✕
              </button>
              
              <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
                <Avatar person={selectedPerson} size={88} />
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
            </div>
            
            <div className="profile-body" style={{ padding: 24 }}>
              <div style={{ marginBottom: 24, fontSize: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px 12px' }}>
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
          </>
        )}
      </div>
    </div>
  )
}
