import { useUIStore } from '../../store/useUIStore'
import { Filter, ArrowUp2, ArrowDown2 } from 'iconsax-react'

export function TreeFilterBar({ people = [], relationships = [] }) {
  const filters = useUIStore(s => s.filters)
  const setFilter = useUIStore(s => s.setFilter)
  const resetFilters = useUIStore(s => s.resetFilters)
  const collapsedParentIds = useUIStore(s => s.collapsedParentIds)
  const collapseAllParents = useUIStore(s => s.collapseAllParents)
  const expandAllParents = useUIStore(s => s.expandAllParents)

  // Find all parent IDs in relationships
  const allParentIds = new Set()
  relationships.forEach(r => {
    if (r.type.includes('parent_child')) {
      allParentIds.add(r.person_a_id)
    }
  })

  const isAllCollapsed = allParentIds.size > 0 && collapsedParentIds.length >= allParentIds.size

  function handleToggleCollapseAll() {
    if (isAllCollapsed) {
      expandAllParents()
    } else {
      collapseAllParents(allParentIds)
    }
  }

  const hasActiveFilters = filters.role !== 'all' || filters.living !== 'all' || filters.gender !== 'all' || collapsedParentIds.length > 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 8px' }}>
      {/* Role Filter */}
      <select
        value={filters.role}
        onChange={e => setFilter('role', e.target.value)}
        className="btn btn-ghost btn-sm"
        style={{
          background: filters.role !== 'all' ? 'var(--accent-faint)' : 'var(--muted)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          fontSize: 12,
          padding: '4px 10px',
          color: filters.role !== 'all' ? 'var(--accent)' : 'var(--foreground)',
          fontWeight: filters.role !== 'all' ? 700 : 500,
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        <option value="all">Role: All</option>
        <option value="parents_only">👨‍👩‍👧 Parents Only</option>
        <option value="children_only">👶 Children Only</option>
      </select>

      {/* Living Filter */}
      <select
        value={filters.living}
        onChange={e => setFilter('living', e.target.value)}
        className="btn btn-ghost btn-sm"
        style={{
          background: filters.living !== 'all' ? 'var(--accent-faint)' : 'var(--muted)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          fontSize: 12,
          padding: '4px 10px',
          color: filters.living !== 'all' ? 'var(--accent)' : 'var(--foreground)',
          fontWeight: filters.living !== 'all' ? 700 : 500,
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        <option value="all">Status: All</option>
        <option value="living">💚 Living</option>
        <option value="deceased">🕊️ Deceased</option>
      </select>

      {/* Gender Filter */}
      <select
        value={filters.gender}
        onChange={e => setFilter('gender', e.target.value)}
        className="btn btn-ghost btn-sm"
        style={{
          background: filters.gender !== 'all' ? 'var(--accent-faint)' : 'var(--muted)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          fontSize: 12,
          padding: '4px 10px',
          color: filters.gender !== 'all' ? 'var(--accent)' : 'var(--foreground)',
          fontWeight: filters.gender !== 'all' ? 700 : 500,
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        <option value="all">Gender: All</option>
        <option value="male">👨 Male</option>
        <option value="female">👩 Female</option>
      </select>

      {/* Branch Collapse All Toggle */}
      {allParentIds.size > 0 && (
        <button
          onClick={handleToggleCollapseAll}
          className="btn btn-ghost btn-sm"
          style={{
            background: collapsedParentIds.length > 0 ? 'var(--accent-faint)' : 'var(--muted)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            fontSize: 12,
            padding: '4px 12px',
            color: collapsedParentIds.length > 0 ? 'var(--accent)' : 'var(--foreground)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
          title={isAllCollapsed ? "Expand all children" : "Collapse all children branches"}
        >
          {isAllCollapsed ? (
            <> <ArrowDown2 size={13} /> Expand All </>
          ) : (
            <> <ArrowUp2 size={13} /> Minimize Children </>
          )}
        </button>
      )}

      {/* Reset Filters */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="btn btn-ghost btn-sm text-muted"
          style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12 }}
          title="Reset all filters"
        >
          ✕ Reset
        </button>
      )}
    </div>
  )
}
