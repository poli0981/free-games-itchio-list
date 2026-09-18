import { useQuery } from '@tanstack/react-query'

interface BuildInfo {
  builtAt: string
  commit: string
}

// version.json is emitted at build time (vite-plugins/catalog-data.ts) and read at
// runtime so the JS bundle stays identical across data-only rebuilds.
export function useBuildInfo() {
  return useQuery({
    queryKey: ['build-info'],
    queryFn: async (): Promise<BuildInfo> => {
      const res = await fetch(`${import.meta.env.BASE_URL}version.json`, { cache: 'no-cache' })
      if (!res.ok) throw new Error(`version.json: ${res.status}`)
      return res.json()
    },
    staleTime: Infinity,
    retry: false,
  })
}
