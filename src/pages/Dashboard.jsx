import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useTrees, useCreateTree, useDeleteTree, useImportTree, useUpdateTreeName } from '../hooks/useTree.js'
import { createSeedFamily } from '../lib/seedData.js'
import { parseFamilyTreeFile } from '../lib/importer.js'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '../store/useUIStore'
import { Hierarchy, Edit2, DocumentDownload, FolderCloud, Add, Trash } from 'iconsax-react'

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
  const updateTreeName = useUpdateTreeName()
  const importTree = useImportTree()

  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null) // tree id
  const [renameModal, setRenameModal] = useState(null) // { id, name }
  const [renameInput, setRenameInput] = useState('')
  const [isCreatingSeed, setIsCreatingSeed] = useState(false)

  // Import Popup state
  const [pendingImport, setPendingImport] = useState(null) // { people, relationships }
  const [importTreeNameInput, setImportTreeNameInput] = useState('')
  const [isImporting, setIsImporting] = useState(false)

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

  async function handleRenameTree(e) {
    e.preventDefault()
    if (!renameModal || !renameInput.trim()) return
    try {
      await updateTreeName.mutateAsync({ id: renameModal.id, name: renameInput.trim() })
      addToast('Tree renamed!', 'success')
      setRenameModal(null)
    } catch (err) {
      addToast('Error renaming tree: ' + err.message, 'error')
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

  async function handleFileImport(e) {
    const file = e.target.files[0]
    if (!file) return
    setIsImporting(true)
    try {
      const text = await file.text()
      const { people, relationships } = await parseFamilyTreeFile(file, text)
      
      const suggestedName = file.name.split('.').slice(0, -1).join('.') || 'Imported Tree'
      setImportTreeNameInput(suggestedName)
      setPendingImport({ people, relationships })
    } catch (err) {
      console.error(err)
      addToast('Import failed: ' + err.message, 'error')
    } finally {
      setIsImporting(false)
      e.target.value = null
    }
  }

  async function handleConfirmImport(e) {
    e.preventDefault()
    if (!pendingImport) return
    const finalName = importTreeNameInput.trim() || 'Imported Family Tree'
    setIsImporting(true)
    try {
      const tree = await createTree.mutateAsync({ name: finalName })
      await importTree.mutateAsync({ treeId: tree.id, people: pendingImport.people, relationships: pendingImport.relationships })
      
      addToast(`Imported ${pendingImport.people.length} people into "${finalName}"!`, 'success')
      setPendingImport(null)
      navigate(`/tree/${tree.id}`)
    } catch (err) {
      console.error(err)
      addToast('Import failed: ' + err.message, 'error')
    } finally {
      setIsImporting(false)
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
              <Add size={16} /> New Tree
            </button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <DocumentDownload size={16} color="#06C8D5" />
              {isImporting ? 'Importing...' : 'Import Tree'}
              <input 
                type="file" 
                accept=".csv,.ged,.json,.html,.htm" 
                style={{ display: 'none' }} 
                onChange={handleFileImport}
                disabled={isImporting}
              />
            </label>
            <button className="btn btn-ghost" onClick={handleSeed} disabled={isCreatingSeed}>
              {isCreatingSeed ? 'Seeding...' : 'Load Sample Tree'}
            </button>
          </div>
        </div>

        {/* Tree Grid */}
        <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderCloud size={20} color="#06C8D5" /> All Trees
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
                    className="btn btn-sm btn-ghost"
                    onClick={() => { setRenameModal(tree); setRenameInput(tree.name); }}
                  >
                    Rename
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
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Hierarchy size={22} color="#06C8D5" /> New Family Tree
            </h2>
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

      {/* Rename Tree Modal */}
      {renameModal && (
        <div className="modal-backdrop" onClick={() => setRenameModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Edit2 size={22} color="#06C8D5" /> Rename Tree
            </h2>
            <p className="sub">Enter a new name for your family tree.</p>
            <form onSubmit={handleRenameTree}>
              <div className="field">
                <label htmlFor="rename-tree-input">Tree Name</label>
                <input
                  id="rename-tree-input"
                  type="text"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  placeholder="e.g. Smith Family Tree"
                  autoFocus
                />
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setRenameModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updateTreeName.isPending}>
                  {updateTreeName.isPending ? 'Saving…' : 'Save Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Tree Popup Modal */}
      {pendingImport && (
        <div className="modal-backdrop" onClick={() => setPendingImport(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DocumentDownload size={22} color="#06C8D5" /> Import Family Tree
            </h2>
            <p className="sub">
              Found {pendingImport.people.length} people and {pendingImport.relationships.length} relationships in your file.
              Enter a name for this new tree.
            </p>
            <form onSubmit={handleConfirmImport}>
              <div className="field">
                <label htmlFor="import-tree-name">Tree Name</label>
                <input
                  id="import-tree-name"
                  type="text"
                  value={importTreeNameInput}
                  onChange={(e) => setImportTreeNameInput(e.target.value)}
                  placeholder="e.g. Adeyemi Family Tree"
                  autoFocus
                />
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setPendingImport(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isImporting}>
                  {isImporting ? 'Importing…' : 'Confirm & Import'}
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
