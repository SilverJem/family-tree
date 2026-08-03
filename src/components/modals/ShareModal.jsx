import { useState, useEffect } from 'react'
import { useUIStore } from '../../store/useUIStore'
import { supabase } from '../../lib/supabase'
import { Link as LinkIcon } from 'iconsax-react'

export function ShareModal({ treeId }) {
  const closeModal = useUIStore(s => s.closeModal)
  const addToast = useUIStore(s => s.addToast)

  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState(null)
  
  useEffect(() => {
    async function checkShareStatus() {
      const { data: tree } = await supabase
        .from('trees')
        .select('visibility')
        .eq('id', treeId)
        .single()
        
      if (tree?.visibility === 'shared_link') {
        setShareLink('Active link available. Generate a new link below to overwrite.')
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
      
      // 3. Clear existing links for this tree
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
      
      // 6. Show URL to user (using window.location.origin for live domain)
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
    if (!shareLink || shareLink.startsWith('Active')) return
    await navigator.clipboard.writeText(shareLink)
    addToast('Copied to clipboard!', 'success')
  }

  return (
    <div 
      className="modal-overlay" 
      onClick={closeModal}
      style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'stretch',
        background: 'rgba(0, 0, 0, 0.4)',
        zIndex: 50
      }}
    >
      <div 
        className="detail-panel" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          width: 400, 
          maxWidth: '100vw', 
          height: '100%', 
          position: 'relative',
          display: 'flex', 
          flexDirection: 'column', 
          background: 'var(--card)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.15)',
          borderLeft: '1px solid var(--border)'
        }}
      >
        {/* Drawer Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 800 }}>
            <LinkIcon size={20} color="var(--primary)" /> Export & Share
          </div>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={closeModal}
            style={{ width: 32, height: 32, padding: 0, borderRadius: '50%' }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Public Share Link</h4>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              Generate a secure, read-only link to share your family tree with family members or friends. Anyone with the link can view the tree on any device.
            </p>

            {shareLink && !shareLink.startsWith('Active') ? (
              <div style={{ background: 'var(--muted)', padding: 12, borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <input 
                  type="text" 
                  readOnly 
                  value={shareLink} 
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: 12, outline: 'none' }} 
                />
                <button className="btn btn-sm btn-primary" onClick={copyToClipboard}>
                  Copy
                </button>
              </div>
            ) : (
              <div style={{ padding: 14, background: 'var(--muted)', borderRadius: 8, color: 'var(--muted-foreground)', fontSize: 13, marginBottom: 12 }}>
                {shareLink || 'No active share link created yet.'}
              </div>
            )}

            <button 
              className="btn btn-primary btn-block" 
              onClick={generateLink}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? 'Generating Link...' : 'Generate Share Link'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--danger, #ef4444)' }}>Danger Zone</h4>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 12, marginBottom: 12 }}>
              Revoking the share link will immediately stop anyone with the existing link from viewing this tree.
            </p>
            <button 
              className="btn btn-ghost text-danger btn-block" 
              onClick={revokeLink}
              disabled={loading}
              style={{ border: '1px solid currentColor' }}
            >
              Revoke Share Access
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
