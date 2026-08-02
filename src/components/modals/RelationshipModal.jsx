import { useState } from 'react'
import { useUIStore } from '../../store/useUIStore'
import { useAddRelationship, REL_LABELS } from '../../hooks/useRelationships'

export function RelationshipModal({ treeId, people = [] }) {
  const { data: initialData } = useUIStore(s => s.activeModal) || {}
  const closeModal = useUIStore(s => s.closeModal)
  const addToast = useUIStore(s => s.addToast)
  const addRelationship = useAddRelationship(treeId)

  // Default to the currently selected person or the drag-and-drop source/target
  const [personAId, setPersonAId] = useState(initialData?.defaultSourceId || initialData?.personId || '')
  const [personBId, setPersonBId] = useState(initialData?.defaultTargetId || '')
  const [type, setType] = useState('parent_child')
  
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!personAId || !personBId) return
    if (personAId === personBId) {
      addToast('Cannot link a person to themselves', 'error')
      return
    }

    setLoading(true)
    try {
      await addRelationship.mutateAsync({
        person_a_id: personAId,
        person_b_id: personBId,
        type,
      })
      addToast('Relationship added')
      closeModal()
    } catch (err) {
      console.error(err)
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Add Relationship</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Person 1</label>
            <select value={personAId} onChange={e => setPersonAId(e.target.value)} required disabled={!!initialData?.defaultSourceId}>
              <option value="" disabled>Select a person...</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Relationship Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              {Object.entries(REL_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            {type === 'parent_child' && (
              <div className="text-muted text-sm mt-1">Person 1 is the Parent, Person 2 is the Child.</div>
            )}
          </div>

          <div className="field">
            <label>Person 2</label>
            <select value={personBId} onChange={e => setPersonBId(e.target.value)} required disabled={!!initialData?.defaultTargetId}>
              <option value="" disabled>Select a person...</option>
              {people.map(p => (
                <option key={p.id} value={p.id} disabled={p.id === personAId}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Add Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
