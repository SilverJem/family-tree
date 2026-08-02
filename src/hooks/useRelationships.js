import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'

// ---- Add a relationship ----
export function useAddRelationship(treeId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ type, person_a_id, person_b_id, start_date, end_date }) => {
      const { data, error } = await supabase
        .from('relationships')
        .insert({ tree_id: treeId, type, person_a_id, person_b_id, start_date, end_date })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships', treeId] })
    },
  })
}

// ---- Delete a relationship ----
export function useDeleteRelationship(treeId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (relationshipId) => {
      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', relationshipId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships', treeId] })
    },
  })
}

// ---- Relationship type labels for display ----
export const REL_LABELS = {
  parent_child: 'Parent / Child',
  step_parent_child: 'Step Parent / Child',
  adoptive_parent_child: 'Adoptive Parent / Child',
  foster_parent_child: 'Foster Parent / Child',
  spouse: 'Spouse',
  partner: 'Partner',
  divorced_spouse: 'Ex-Spouse',
  ex_partner: 'Ex-Partner',
  sibling: 'Sibling',
  half_sibling: 'Half Sibling',
}

// ---- Relationship edge colours matching design tokens ----
export const REL_COLORS = {
  parent_child: '#475569',
  step_parent_child: '#F59E0B',
  adoptive_parent_child: '#10B981',
  foster_parent_child: '#0EA5E9',
  spouse: '#0891B2',
  partner: '#0891B2',
  divorced_spouse: '#CBD5E1',
  ex_partner: '#CBD5E1',
  sibling: '#8B5CF6',
  half_sibling: '#C4B5FD',
}

// ---- Infer the human-readable relationship between two people ----
// Given a relationship row and which person you're viewing from,
// returns a label like "Parent", "Child", "Spouse" etc.
export function describeRelationship(rel, viewingPersonId) {
  const isA = rel.person_a_id === viewingPersonId
  switch (rel.type) {
    case 'parent_child':
      return isA ? 'Parent' : 'Child'
    case 'step_parent_child':
      return isA ? 'Step Parent' : 'Step Child'
    case 'adoptive_parent_child':
      return isA ? 'Adoptive Parent' : 'Adopted Child'
    case 'foster_parent_child':
      return isA ? 'Foster Parent' : 'Foster Child'
    case 'spouse':
      return 'Spouse'
    case 'partner':
      return 'Partner'
    case 'divorced_spouse':
      return 'Ex-Spouse'
    case 'ex_partner':
      return 'Ex-Partner'
    case 'sibling':
      return 'Sibling'
    case 'half_sibling':
      return 'Half Sibling'
    default:
      return rel.type
  }
}
