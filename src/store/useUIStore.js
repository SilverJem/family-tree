import { create } from 'zustand'

/**
 * useUIStore — client-only UI state.
 * Keeps track of which person is selected, which panels are open,
 * tree filters, branch collapsing, and modal state.
 */
export const useUIStore = create((set) => ({
  // ---- Panel state ----
  isSideMenuOpen: true,
  isDetailPanelOpen: false,

  toggleSideMenu: () => set((s) => ({ isSideMenuOpen: !s.isSideMenuOpen })),
  openDetailPanel: () => set({ isDetailPanelOpen: true }),
  closeDetailPanel: () => set({ isDetailPanelOpen: false, selectedPersonId: null }),

  // ---- Selected person ----
  selectedPersonId: null,
  setSelectedPerson: (id) => set({ selectedPersonId: id }),

  // ---- Branch Collapsing ----
  collapsedParentIds: [],
  toggleCollapseParent: (id) => set((s) => {
    const isCollapsed = s.collapsedParentIds.includes(id)
    return {
      collapsedParentIds: isCollapsed
        ? s.collapsedParentIds.filter(pid => pid !== id)
        : [...s.collapsedParentIds, id]
    }
  }),
  collapseAllParents: (parentIds) => set({ collapsedParentIds: Array.from(parentIds) }),
  expandAllParents: () => set({ collapsedParentIds: [] }),

  // ---- Filters ----
  // role: 'all' | 'parents_only' | 'children_only'
  // living: 'all' | 'living' | 'deceased'
  // gender: 'all' | 'male' | 'female'
  filters: {
    role: 'all',
    living: 'all',
    gender: 'all'
  },
  setFilter: (key, value) => set((s) => ({
    filters: { ...s.filters, [key]: value }
  })),
  resetFilters: () => set({
    filters: { role: 'all', living: 'all', gender: 'all' },
    collapsedParentIds: []
  }),

  // ---- Active modal ----
  activeModal: null,
  openModal: (name, data = {}) => set({ activeModal: { name, data } }),
  closeModal: () => set({ activeModal: null }),

  // ---- Toast notifications ----
  toasts: [],
  addToast: (message, type = 'default') =>
    set((s) => ({
      toasts: [...s.toasts, { id: Date.now(), message, type }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
