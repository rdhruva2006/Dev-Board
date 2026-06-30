'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Project, ProjectStatus } from '@/types/project'

/**
 * Creates a new project in Supabase for the authenticated user.
 */
export async function createProject(payload: {
  name: string
  description: string | null
  status: ProjectStatus
  github_repo_url: string | null
  tech_stack: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: payload.name.trim(),
      description: payload.description || null,
      status: payload.status,
      github_repo_url: payload.github_repo_url || null,
      tech_stack: payload.tech_stack,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/projects')
  revalidatePath('/dashboard')
  return data as Project
}

/**
 * Updates an existing project.
 */
export async function updateProject(
  id: string,
  payload: {
    name: string
    description: string | null
    status: ProjectStatus
    github_repo_url: string | null
    tech_stack: string[]
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('projects')
    .update({
      name: payload.name.trim(),
      description: payload.description || null,
      status: payload.status,
      github_repo_url: payload.github_repo_url || null,
      tech_stack: payload.tech_stack,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/projects')
  revalidatePath('/dashboard')
  return data as Project
}

/**
 * Deletes a project.
 */
export async function deleteProject(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/projects')
  revalidatePath('/dashboard')
  return { success: true }
}
