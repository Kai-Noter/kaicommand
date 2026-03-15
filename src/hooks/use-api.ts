'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query'

const API_BASE = ''

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? 'Request failed')
  return data as T
}

// Query keys
export const apiKeys = {
  apps: ['apps'] as const,
  emails: ['emails'] as const,
  tasks: ['tasks'] as const,
  finance: ['finance'] as const,
  analysis: ['analysis'] as const,
  chat: ['chat'] as const,
  professional: ['professional'] as const,
  passwords: ['passwords'] as const,
  digest: ['digest'] as const,
  audit: ['audit'] as const,
}

// Apps
export function useApps() {
  return useQuery({
    queryKey: apiKeys.apps,
    queryFn: () => fetcher<{ apps: unknown[]; success: boolean }>('/api/apps').then((d) => d.apps),
  })
}

export function useAddApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; description: string; category: string }) =>
      fetcher<{ app: unknown; success: boolean }>('/api/apps', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.apps }),
  })
}

export function useDeleteApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetcher<{ success: boolean }>(`/api/apps?id=${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.apps }),
  })
}

// Emails
export function useEmails() {
  return useQuery({
    queryKey: apiKeys.emails,
    queryFn: () =>
      fetcher<{ emails: unknown[]; stats: unknown; success: boolean }>('/api/emails').then(
        (d) => ({ emails: d.emails, stats: d.stats })
      ),
  })
}

export function useMarkEmailRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { id: string; isRead: boolean }) =>
      fetcher<{ success: boolean }>('/api/emails', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.emails }),
  })
}

// Tasks
export function useTasks() {
  return useQuery({
    queryKey: apiKeys.tasks,
    queryFn: () => fetcher<{ tasks: unknown[]; success: boolean }>('/api/tasks').then((d) => d.tasks),
  })
}

export function useAddTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetcher<{ task: unknown; success: boolean }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.tasks }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetcher<{ task: unknown; success: boolean }>('/api/tasks', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.tasks }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetcher<{ success: boolean }>(`/api/tasks?id=${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.tasks }),
  })
}

// Finance
export function useFinance() {
  return useQuery({
    queryKey: apiKeys.finance,
    queryFn: () =>
      fetcher<{
        transactions: unknown[]
        summary: unknown
        success: boolean
      }>('/api/finance').then((d) => ({ transactions: d.transactions, summary: d.summary })),
  })
}

// Analysis
export function useAnalysis() {
  return useQuery({
    queryKey: apiKeys.analysis,
    queryFn: () =>
      fetcher<{ analytics: unknown; success: boolean }>('/api/analysis').then((d) => d.analytics),
  })
}

// Chat
export function useChatHistory() {
  return useQuery({
    queryKey: apiKeys.chat,
    queryFn: () =>
      fetcher<{ messages: unknown[]; success: boolean }>('/api/chat').then((d) => d.messages),
  })
}

export function useSendChatMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      message: string
      history: Array<{ role: string; content: string }>
      context?: string
      voiceMode?: boolean
    }) =>
      fetcher<{ message: string; action: unknown; success: boolean }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.chat }),
  })
}

export function useClearChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => fetcher<{ success: boolean }>('/api/chat', { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.chat }),
  })
}

// Professional (contexts, voice notes, inventory, certs, protocols, snippets)
export function useProfessional() {
  return useQuery({
    queryKey: apiKeys.professional,
    queryFn: () =>
      fetcher<{
        contexts: unknown[]
        voiceNotes: unknown[]
        inventory: unknown[]
        certifications: unknown[]
        protocols: unknown[]
        snippets: unknown[]
        success: boolean
      }>('/api/professional').then((d) => ({
        contexts: d.contexts ?? [],
        voiceNotes: d.voiceNotes ?? [],
        inventory: d.inventory ?? [],
        certifications: d.certifications ?? [],
        protocols: d.protocols ?? [],
        snippets: d.snippets ?? [],
      })),
  })
}

export function useProfessionalMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetcher<{ success: boolean; [k: string]: unknown }>('/api/professional', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.professional }),
  })
}

export function useProfessionalPut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetcher<{ success: boolean; [k: string]: unknown }>('/api/professional', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.professional }),
  })
}

// Passwords
export function usePasswords() {
  return useQuery({
    queryKey: apiKeys.passwords,
    queryFn: () =>
      fetcher<{ passwords: unknown[]; success: boolean }>('/api/passwords').then((d) => d.passwords),
  })
}

export function useAddPassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      website: string
      username: string
      password: string
      url?: string
      notes?: string
      category?: string
    }) =>
      fetcher<{ password: unknown; success: boolean }>('/api/passwords', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.passwords }),
  })
}

export function useUpdatePassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      id: string
      website?: string
      username?: string
      password?: string
      url?: string
      notes?: string
      category?: string
    }) =>
      fetcher<{ password: unknown; success: boolean }>('/api/passwords', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.passwords }),
  })
}

export function useDeletePassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetcher<{ success: boolean }>(`/api/passwords?id=${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.passwords }),
  })
}

// Digest (while you were away + suggestions)
export function useDigest(enabled: boolean = true) {
  return useQuery({
    queryKey: apiKeys.digest,
    queryFn: () =>
      fetcher<{
        whileYouWereAway: string
        suggestions: Array<{ label: string; tabId: string; count?: number; urgency?: string }>
        recentActivity: Array<{ action: string; details: string | null; time: string }>
      }>('/api/digest'),
    enabled,
    staleTime: 2 * 60 * 1000,
  })
}

// Audit log (for optional display)
export function useAuditLog(limit: number = 20) {
  return useQuery({
    queryKey: [...apiKeys.audit, limit],
    queryFn: () =>
      fetcher<{ logs: Array<{ id: string; action: string; details: string | null; createdAt: string }> }>(
        `/api/audit?limit=${limit}`
      ).then((d) => d.logs),
  })
}
