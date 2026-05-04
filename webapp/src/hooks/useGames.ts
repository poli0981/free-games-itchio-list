import { useQuery } from '@tanstack/react-query'
import { loadAllGames, loadIndex, loadDeletedLog } from '@/lib/github/data-store'

export function useIndex() {
  return useQuery({
    queryKey: ['db', 'index'],
    queryFn: loadIndex,
  })
}

export function useAllGames() {
  return useQuery({
    queryKey: ['db', 'all'],
    queryFn: loadAllGames,
  })
}

export function useDeletedGames() {
  return useQuery({
    queryKey: ['deleted'],
    queryFn: loadDeletedLog,
  })
}
