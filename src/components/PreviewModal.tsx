import React from 'react'

type Props = {
  url: string | null
  onClose: () => void
}

export default function PreviewModal({ url, onClose }: Props) {
  if (!url) return null

  const isImage = (() => {
    try {
      const p = new URL(url).pathname
      return /\.(jpe?g|png|webp|gif|svg)$/i.test(p)
    } catch {
      return /\.(jpe?g|png|webp|gif|svg)$/i.test(url)
    }
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" style={{ border: '1px solid #E5E7EB' }} onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>Pratinjau Dokumen</h3>
          <button type="button" onClick={onClose} style={{ color: '#8E99A8' }}>x</button>
        </div>
        <div className="p-4">
          {url.toLowerCase().endsWith('.pdf') ? (
            <div style={{ width: '100%', height: '70vh' }}>
              <object data={url} type="application/pdf" width="100%" height="100%">
                <iframe src={url} width="100%" height="100%" title="pdf-preview" />
                <div className="p-4 text-sm" style={{ color: '#374151' }}>
                  Tidak dapat menampilkan PDF. <a href={url} target="_blank" rel="noreferrer" style={{ color: '#11447D' }}>Buka di tab baru</a>
                </div>
              </object>
            </div>
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="preview" style={{ display: 'block', maxWidth: '100%', maxHeight: '75vh', margin: '0 auto' }} />
          ) : (
            <div className="p-4 text-sm" style={{ color: '#374151' }}>
              Pratinjau tidak tersedia untuk jenis file ini. <a href={url} target="_blank" rel="noreferrer" style={{ color: '#11447D' }}>Unduh / Buka</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
