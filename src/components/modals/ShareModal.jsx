import { useState, useEffect } from 'react'
import { useUIStore } from '../../store/useUIStore'
import { supabase } from '../../lib/supabase'

export function ShareModal({ treeId }) {
  const closeModal = useUIStore(s => s.closeModal)
  const addToast = useUIStore(s => s.addToast)

  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState(null)
  
  useEffect(() => {
    async function checkShareStatus() {
      // First check if the tree is currently shared
      const { data: tree } = await supabase
        .from('trees')
        .select('visibility')
        .eq('id', treeId)
        .single()
        
      if (tree?.visibility === 'shared_link') {
        // Need to find the existing share link token.. wait, token is hashed!
        // We can't recover the original token from the hash.
        // We either need to store the raw token in local storage, or just generate a new one,
        // or store the raw token in the database (which defeats the point of hashing it).
        // Let's just create a new one if they click "Generate".
        setShareLink('Already shared. Generate a new link below to overwrite.')
      }
    }
    checkShareStatus()
  }, [treeId])

  async function generateLink() {
    try {
      setLoading(true)
      
      // 1. Generate token
      const array = new Uint8Array(24)
      crypto.getRandomValues(array)
      const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
      
      // 2. Hash token
      const encoder = new TextEncoder()
      const data = encoder.encode(token)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      // 3. Clear existing links for this tree (optional, but good for simplicity)
      await supabase.from('share_links').delete().eq('tree_id', treeId)
      
      // 4. Save hash to DB
      const { error: shareError } = await supabase
        .from('share_links')
        .insert({
          tree_id: treeId,
          token_hash: tokenHash
        })
        
      if (shareError) throw shareError
      
      // 5. Update tree visibility
      const { error: treeError } = await supabase
        .from('trees')
        .update({ visibility: 'shared_link' })
        .eq('id', treeId)
        
      if (treeError) throw treeError
      
      // 6. Show URL to user
      const url = `${window.location.origin}/share/${token}`
      setShareLink(url)
      
      addToast('Share link generated successfully.', 'success')
    } catch (err) {
      console.error(err)
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function revokeLink() {
    try {
      setLoading(true)
      await supabase.from('share_links').delete().eq('tree_id', treeId)
      await supabase.from('trees').update({ visibility: 'private' }).eq('id', treeId)
      setShareLink(null)
      addToast('Share link revoked. Tree is now private.', 'success')
    } catch (err) {
      console.error(err)
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard() {
    if (!shareLink || shareLink.startsWith('Already')) return
    await navigator.clipboard.writeText(shareLink)
    addToast('Copied to clipboard!', 'success')
  }

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <button className="modal-close" onClick={closeModal}>×</button>
        <h2>Share Your Tree</h2>
        
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: 16 }}>
            Generate a secure, read-only link to share your family tree with others. Anyone with the link can view it without needing an account.
          </p>
          
          {shareLink && !shareLink.startsWith('Already') ? (
            <div style={{ background: 'var(--muted)', padding: 12, borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
              <input 
                type="text" 
                readOnly 
                value={shareLink} 
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none' }} 
              />
              <button className="btn btn-sm btn-primary" onClick={copyToClipboard}>Copy</button>
            </div>
          ) : (
            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted-foreground)' }}>
              {shareLink || 'No active share link.'}
            </div>
          )}
        </div>
        
        <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
          <button 
            className="btn btn-ghost text-danger" 
            onClick={revokeLink}
            disabled={loading}
          >
            Revoke Access
          </button>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={closeModal}>Close</button>
            <button 
              className="btn btn-primary" 
              onClick={generateLink}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate New Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
