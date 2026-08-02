import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useTreeById, usePeople, useRelationships } from '../hooks/useTree.js'
import { useDeletePerson } from '../hooks/usePeople.js'
import { TreeCanvas } from '../components/canvas/TreeCanvas.jsx'
import { useUIStore } from '../store/useUIStore.js'
import { PersonModal } from '../components/modals/PersonModal.jsx'
import { RelationshipModal } from '../components/modals/RelationshipModal.jsx'
import { ShareModal } from '../components/modals/ShareModal.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { calculateAge } from '../lib/utils'

export default function Canvas() {
  const { id } = useParams()
  
  // Data fetching
  const { data: tree, isLoading: treeLoading } = useTreeById(id)
  const { data: people = [], isLoading: peopleLoading } = usePeople(id)
  const { data: relationships = [], isLoading: relsLoading } = useRelationships(id)
  
  const deletePerson = useDeletePerson(id)
  const queryClient = useQueryClient()

  // Realtime Sync
  useEffect(() => {
    const channel = supabase
      .channel(`tree-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'people', filter: `tree_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['people', id] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'relationships', filter: `tree_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['relationships', id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, queryClient])

  // UI State
  const isDetailPanelOpen = useUIStore(s => s.isDetailPanelOpen)
  const closeDetailPanel = useUIStore(s => s.closeDetailPanel)
  const selectedPersonId = useUIStore(s => s.selectedPersonId)
  const activeModal = useUIStore(s => s.activeModal)
  const openModal = useUIStore(s => s.openModal)
  const addToast = useUIStore(s => s.addToast)
  
  const selectedPerson = people.find(p => p.id === selectedPersonId)
  
  const isLoading = treeLoading || peopleLoading || relsLoading

  async function handleDeletePerson() {
    if (!selectedPerson) return
    if (confirm(`Are you sure you want to delete ${selectedPerson.first_name}?`)) {
      try {
        await deletePerson.mutateAsync(selectedPerson.id)
        closeDetailPanel()
        addToast('Person deleted')
      } catch (err) {
        addToast('Error deleting person', 'error')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }} className="animate-pulse">🌳</div>
        <p>Loading tree…</p>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Topbar */}
      <div className="topbar" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <Link to="/" className="btn btn-ghost btn-sm">← Dashboard</Link>
        <span className="tree-name-input" style={{ fontWeight: 900, fontSize: 18 }}>
          {tree?.name || 'Untitled Tree'}
        </span>
        <div className="topbar-spacer" />
        <button 
          className="btn btn-ghost btn-sm"
          onClick={() => openModal('share')}
        >
          Share
        </button>
        <button 
          className="btn btn-ghost btn-sm"
          onClick={() => openModal('addRelationship')}
          disabled={people.length < 2}
          title={people.length < 2 ? "Add at least two people to create a relationship" : ""}
        >
          + Add Link
        </button>
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => openModal('addPerson')}
        >
          + Add Person
        </button>
      </div>

      {/* Main Canvas Area */}
      <div style={{ flex: 1, width: '100%', height: '100%', background: 'var(--background)' }}>
        <TreeCanvas treeId={id} people={people} relationships={relationships} />
      </div>
      
      {/* Detail Panel */}
      <div 
        className="detail-panel" 
        style={{ 
          position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 20,
          transform: isDetailPanelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)'
        }}
      >
        {selectedPerson ? (
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
                {calculateAge(selectedPerson) !== null && ` (${calculateAge(selectedPerson)} yrs)`}
              </p>
              {selectedPerson.location && (
                <p className="profile-meta" style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  📍 {selectedPerson.location}
                </p>
              )}
            </div>
            
            <div className="profile-body" style={{ padding: 24 }}>
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
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button 
                  className="btn btn-block btn-primary"
                  onClick={() => openModal('editPerson', { personId: selectedPerson.id })}
                >
                  Edit Details
                </button>
                <button 
                  className="btn btn-block btn-ghost"
                  onClick={() => openModal('addRelationship', { personId: selectedPerson.id })}
                  disabled={people.length < 2}
                >
                  Add Relationship
                </button>
                <div className="danger-zone" style={{ marginTop: 12, paddingTop: 16, borderTop: '2px solid var(--muted)' }}>
                  <button 
                    className="btn btn-block btn-ghost text-danger"
                    onClick={handleDeletePerson}
                    disabled={deletePerson.isPending}
                  >
                    {deletePerson.isPending ? 'Deleting...' : 'Delete Person'}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>
            Select a person to view details.
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal?.name === 'addPerson' && (
        <PersonModal treeId={id} people={people} />
      )}
      {activeModal?.name === 'editPerson' && (
        <PersonModal treeId={id} people={people} personIdToEdit={activeModal.data.personId} />
      )}
      {activeModal?.name === 'addRelationship' && (
        <RelationshipModal treeId={id} people={people} />
      )}
      {activeModal?.name === 'share' && (
        <ShareModal treeId={id} />
      )}
    </div>
  )
}
