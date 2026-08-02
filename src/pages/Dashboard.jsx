import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useTrees, useCreateTree, useDeleteTree } from '../hooks/useTree.js'
import { createSeedFamily } from '../lib/seedData.js'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '../store/useUIStore'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const addToast = useUIStore(s => s.addToast)
  const { data: trees = [], isLoading } = useTrees()
  const createTree = useCreateTree()
  const deleteTree = useDeleteTree()

  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null) // tree id
  const [isCreatingSeed, setIsCreatingSeed] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    setCreateError('')
    try {
      const tree = await createTree.mutateAsync({ name: newName.trim() || 'My Family Tree' })
      setShowNewModal(false)
      setNewName('')
      navigate(`/tree/${tree.id}`)
    } catch (err) {
      setCreateError(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTree.mutateAsync(id)
      setDeleteConfirm(null)
      addToast('Tree deleted', 'success')
    } catch (err) {
      console.error('Delete error:', err)
      addToast('Delete error: ' + err.message, 'error')
    }
  }

  async function handleSeed() {
    if (!user) return
    setIsCreatingSeed(true)
    try {
      await createSeedFamily(user.id)
      queryClient.invalidateQueries(['trees'])
      addToast('Sample tree loaded!', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to seed family: ' + err.message, 'error')
    } finally {
      setIsCreatingSeed(false)
    }
  }

  return (
    <>
      <div className="clay-blobs">
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      </div>

      {/* Header */}
      <header className="dash-header">
        <div className="brand">
          <span style={{ fontSize: 28 }}>🌳</span>
          Family Tree Builder
        </div>
        <div className="flex gap-12" style={{ alignItems: 'center' }}>
          <span className="text-muted text-sm">{user?.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign Out</button>
        </div>
      </header>

      <main className="dash-main">
        {/* Hero */}
        <div className="dash-hero">
          <h1>Your Family Trees 🌿</h1>
          <p>Build beautiful, interactive family trees. Add people, relationships, photos, and share your history with the people who matter.</p>
          <p>Create a new family tree from scratch or load our demo to see how it works.</p>
          <div className="dash-actions">
            <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
              + New Tree
            </button>
            <button className="btn btn-ghost" onClick={handleSeed} disabled={isCreatingSeed}>
              {isCreatingSeed ? 'Seeding...' : 'Load Sample Tree'}
            </button>
          </div>
        </div>

        {/* Tree Grid */}
        <div className="section-title">
          <span>🗂️</span> All Trees
        </div>

        {isLoading ? (
          <div className="tree-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : trees.length === 0 ? (
          <div className="empty-note">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>No trees yet</p>
            <p>Click <strong>New Tree</strong> above to get started.</p>
          </div>
        ) : (
          <div className="tree-grid">
            {trees.map((tree) => (
              <div key={tree.id} className="tree-card" onClick={() => navigate(`/tree/${tree.id}`)}>
                <div className="tc-icon">🌳</div>
                <h3>{tree.name}</h3>
                <div className="tc-meta">
                  <span>Created {formatDate(tree.created_at)}</span>
                </div>
                <div className="tc-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-sm btn-primary" onClick={() => navigate(`/tree/${tree.id}`)}>
                    Open
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => setDeleteConfirm(tree.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Tree Modal */}
      {showNewModal && (
        <div className="modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Family Tree</h2>
            <p className="sub">Give your tree a name to get started.</p>
            <form onSubmit={handleCreate}>
              {createError && <div className="modal-error">{createError}</div>}
              <div className="field">
                <label htmlFor="tree-name">Tree Name</label>
                <input
                  id="tree-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. The Johnson Family"
                  autoFocus
                />
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setShowNewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createTree.isPending}>
                  {createTree.isPending ? 'Creating…' : 'Create Tree'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Tree?</h2>
            <p className="sub">
              This will permanently delete the tree and all people and relationships inside it.
              This cannot be undone.
            </p>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                disabled={deleteTree.isPending}
                onClick={() => handleDelete(deleteConfirm)}
              >
                {deleteTree.isPending ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
