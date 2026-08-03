import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ReactFlowProvider } from '@xyflow/react'
import { supabase } from '../lib/supabase'
import { useTreeById, usePeople, useRelationships, useUpdateTreeName } from '../hooks/useTree.js'
import { useDeletePerson } from '../hooks/usePeople.js'
import { TreeCanvas } from '../components/canvas/TreeCanvas.jsx'
import { useUIStore } from '../store/useUIStore.js'
import { PersonModal } from '../components/modals/PersonModal.jsx'
import { RelationshipModal } from '../components/modals/RelationshipModal.jsx'
import { ShareModal } from '../components/modals/ShareModal.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { calculateAge } from '../lib/utils'
import { Link as LinkIcon, Edit2, Hierarchy, Tree, Add, Trash } from 'iconsax-react'
import { PersonSearch } from '../components/ui/PersonSearch.jsx'
import { TreeFilterBar } from '../components/ui/TreeFilterBar.jsx'

export default function Canvas() {
  const { id } = useParams()
  
  // Data fetching
  const { data: tree, isLoading: treeLoading } = useTreeById(id)
  const { data: people = [], isLoading: peopleLoading } = usePeople(id)
  const { data: relationships = [], isLoading: relsLoading } = useRelationships(id)
  const updateTreeName = useUpdateTreeName()

  const [isEditingName, setIsEditingName] = useState(false)
  const [treeNameInput, setTreeNameInput] = useState('')
  
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
  
  // Compute immediate relatives
  const relatives = { parents: [], children: [], partners: [], siblings: [] }
  if (selectedPerson) {
    const parentIds = new Set()
    
    // Parents & Children & Partners
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

    // Siblings (share at least one parent)
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
  
  const isLoading = treeLoading || peopleLoading || relsLoading

  async function handleSaveName() {
    setIsEditingName(false)
    const trimmed = treeNameInput.trim()
    if (!trimmed || trimmed === tree?.name) return
    try {
      await updateTreeName.mutateAsync({ id: tree.id, name: trimmed })
      addToast('Tree renamed!', 'success')
    } catch (err) {
      addToast('Error renaming tree: ' + err.message, 'error')
    }
  }

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
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#64748B' }}>Loading tree…</p>
      </div>
    )
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
            display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px',
            overflow: 'visible'
          }}
        >
          <Link to="/" style={{ color: '#64748B', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>←</Link>
          
          {/* Brand Logo & Editable Tree Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#E0F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🌳
            </div>
            
            {isEditingName ? (
              <input
                type="text"
                value={treeNameInput}
                onChange={(e) => setTreeNameInput(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') setIsEditingName(false)
                }}
                autoFocus
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 15,
                  color: '#0A1628',
                  border: '1.5px solid #06C8D5',
                  borderRadius: 6,
                  padding: '2px 8px',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
            ) : (
              <div 
                onClick={() => { setTreeNameInput(tree?.name || ''); setIsEditingName(true); }}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  padding: '4px 8px', borderRadius: 6, transition: 'background 0.15s ease'
                }}
                title="Click to edit tree name"
              >
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 15, color: '#0A1628', letterSpacing: '-0.01em' }}>
                  {tree?.name || 'Family Tree Builder'}
                </span>
                <Edit2 size={13} color="#94A3B8" />
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 20, backgroundColor: '#E2E8F0', flexShrink: 0 }} />

          <PersonSearch people={people} />
          
          <div className="topbar-spacer" style={{ flex: 1 }} />

          {/* Member Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#94A3B8' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#06C8D5' }}>{people.length}</span>
            <span>members</span>
          </div>

          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => openModal('share')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <LinkIcon size={16} /> Export
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
            style={{ backgroundColor: '#06C8D5', borderColor: '#06C8D5', color: '#ffffff' }}
          >
            + Add Person
          </button>
        </div>

        {/* Main Canvas Area */}
        <div style={{ flex: 1, width: '100%', height: '100%', background: 'var(--background)' }}>
          <TreeCanvas treeId={id} people={people} relationships={relationships} />
        </div>
      </ReactFlowProvider>
      
      {/* Detail Panel */}
      <div 
        className="detail-panel" 
        style={{ 
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
          width: 384, backgroundColor: '#ffffff',
          boxShadow: '-4px 0 32px rgba(10,22,40,0.10)',
          borderLeft: '1px solid #E2E8F0',
          transform: isDetailPanelOpen ? 'translateX(0)' : 'translateX(100%)',
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
                  {selectedPerson.birth_name && selectedPerson.birth_name !== selectedPerson.last_name && (
                    <p style={{ fontFamily: "'Inter', sans-serif", fontStyle: 'italic', fontSize: 12, color: '#64748B', margin: '0 0 4px' }}>
                      (née {selectedPerson.birth_name})
                    </p>
                  )}
                  {selectedPerson.occupation && (
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#475569', fontWeight: 600, margin: '0 0 8px' }}>{selectedPerson.occupation}</p>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedPerson.gender && selectedPerson.gender !== 'unknown' && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 10, padding: '3px 10px', borderRadius: 999, backgroundColor: '#E0F9FA', color: '#06C8D5', textTransform: 'capitalize' }}>
                        {selectedPerson.gender}
                      </span>
                    )}
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 10, padding: '3px 10px', borderRadius: 999, backgroundColor: selectedPerson.is_living ? '#ECFDF5' : '#FEF2F2', color: selectedPerson.is_living ? '#10B981' : '#EF4444' }}>
                      {selectedPerson.is_living ? 'Living' : 'Deceased'}
                    </span>
                    {selectedPerson.location && <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 10, padding: '3px 10px', borderRadius: 999, backgroundColor: '#F1F5F9', color: '#475569' }}>📍 {selectedPerson.location}</span>}
                    {selectedPerson.clan && <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 10, padding: '3px 10px', borderRadius: 999, backgroundColor: '#0A1628', color: '#06C8D5' }}>{selectedPerson.clan} Tribe</span>}
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

              {selectedPerson.notes && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>Additional Notes</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#475569', lineHeight: 1.65, margin: 0 }}>
                    {selectedPerson.notes}
                  </p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: '8px 12px', border: '1px solid #F1F5F9' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>Born</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#0A1628', margin: 0 }}>
                    {selectedPerson.birth_date ? new Date(selectedPerson.birth_date).getFullYear() : 'Unknown'}
                  </p>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: '8px 12px', border: '1px solid #F1F5F9' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>Tribe</p>
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
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Edit Profile</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => openModal('editPerson', { personId: selectedPerson.id })}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#475569', textAlign: 'left' }}
                  >
                    <Edit2 size={15} color="#475569" /> Edit Profile / Bio
                  </button>
                  <button 
                    className="btn btn-ghost"
                    onClick={() => openModal('addRelationship', { personId: selectedPerson.id })}
                    disabled={people.length < 2}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#475569', textAlign: 'left' }}
                  >
                    <Add size={15} color="#475569" /> Add Family Link
                  </button>
                </div>
              </div>

              <div className="danger-zone" style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                <button 
                  className="btn btn-block btn-ghost text-danger"
                  onClick={handleDeletePerson}
                  disabled={deletePerson.isPending}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#EF4444', fontSize: 13, fontFamily: "'Inter', sans-serif" }}
                >
                  <Trash size={15} color="#EF4444" />
                  {deletePerson.isPending ? 'Deleting...' : 'Delete Person'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
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
