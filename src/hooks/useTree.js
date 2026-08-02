import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'

// ---- Fetch all trees for the logged-in user ----
export function useTrees() {
  return useQuery({
    queryKey: ['trees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trees')
        .select('id, name, created_at, updated_at')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

// ---- Fetch a single tree by id ----
export function useTreeById(id) {
  return useQuery({
    queryKey: ['tree', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trees')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// ---- Fetch all people in a tree ----
export function usePeople(treeId) {
  return useQuery({
    queryKey: ['people', treeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('tree_id', treeId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!treeId,
  })
}

// ---- Fetch all relationships in a tree ----
export function useRelationships(treeId) {
  return useQuery({
    queryKey: ['relationships', treeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('tree_id', treeId)
      if (error) throw error
      return data
    },
    enabled: !!treeId,
  })
}

// ---- Create a new tree ----
export function useCreateTree() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ name }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('trees')
        .insert({ name, owner_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trees'] })
    },
  })
}

// ---- Update tree name ----
export function useUpdateTreeName() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }) => {
      const { error } = await supabase
        .from('trees')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['trees'] })
      queryClient.invalidateQueries({ queryKey: ['tree', id] })
    },
  })
}

// ---- Delete a tree ----
export function useDeleteTree() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('trees').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trees'] })
    },
  })
}
