import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'

// ---- Add a person ----
export function useAddPerson(treeId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (personData) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('people')
        .insert({ ...personData, tree_id: treeId, created_by: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people', treeId] })
    },
  })
}

// ---- Update a person ----
export function useUpdatePerson(treeId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('people')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people', treeId] })
    },
  })
}

// ---- Delete a person ----
export function useDeletePerson(treeId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (personId) => {
      // Remove photo from storage if exists
      const { data: person } = await supabase
        .from('people')
        .select('photo_url')
        .eq('id', personId)
        .single()
      if (person?.photo_url) {
        await supabase.storage.from('photos').remove([person.photo_url])
      }
      const { error } = await supabase.from('people').delete().eq('id', personId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people', treeId] })
      queryClient.invalidateQueries({ queryKey: ['relationships', treeId] })
    },
  })
}

// ---- Save canvas position for a node (drag-end) ----
export function useSaveNodePosition(treeId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, x, y }) => {
      const { error } = await supabase
        .from('people')
        .update({ canvas_x: x, canvas_y: y })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      // Silently update — don't flash reload for position saves
      queryClient.invalidateQueries({ queryKey: ['people', treeId] })
    },
  })
}

// ---- Upload a photo for a person ----
export function useUploadPhoto(treeId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ personId, file }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${personId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('people')
        .update({ photo_url: path })
        .eq('id', personId)
      if (updateError) throw updateError

      return path
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people', treeId] })
    },
  })
}

// ---- Get a signed URL for a photo ----
export async function getPhotoUrl(path) {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(path, 3600) // 1 hour
  if (error) return null
  return data.signedUrl
}
