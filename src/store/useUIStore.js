import { create } from 'zustand'

/**
 * useUIStore — client-only UI state.
 * Keeps track of which person is selected, which panels are open,
 * and which modal is active. Does NOT touch the server.
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
  setSelectedPerson: (id) =>
    set({ selectedPersonId: id, isDetailPanelOpen: id != null }),

  // ---- Active modal ----
  // { name: 'addPerson' | 'editPerson' | 'share' | 'addRelationship', data: {} }
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
