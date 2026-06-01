import { useCallback, useState } from 'react'

export function usePreview() {
  const [url, setUrl] = useState<string | null>(null)
  const openPreview = useCallback((u: string) => setUrl(u), [])
  const closePreview = useCallback(() => setUrl(null), [])
  return { url, openPreview, closePreview }
}
