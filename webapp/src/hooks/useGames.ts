import { useQuery } from '@tanstack/react-query'
import {
  loadAllGames,
  loadDeletedLog,
  loadCountHistory,
} from '@/lib/github/data-store'

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

export function useCountHistory() {
  return useQuery({
    queryKey: ['count-history'],
    queryFn: loadCountHistory,
  })
}
