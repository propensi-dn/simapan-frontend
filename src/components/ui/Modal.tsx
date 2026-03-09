'use client'

import { ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  icon?: ReactNode
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  confirmVariant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  onConfirm,
  confirmVariant = 'primary',
  loading = false,
  size = 'md',
}: ModalProps) {

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Prevent body scroll when modal open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className={cn(
        'relative bg-bg-card rounded-3xl shadow-modal w-full p-8 animate-modal-in',
        sizeClasses[size]
      )}>
        {/* Icon */}
        {icon && (
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-bg-sections flex items-center justify-center text-text-secondary">
              {icon}
            </div>
          </div>
        )}

        {/* Title */}
        {title && (
          <h3 className="text-center font-heading font-bold text-h5 text-text-primary mb-2">
            {title}
          </h3>
        )}

        {/* Description */}
        {description && (
          <p className="text-center font-body text-sm text-text-secondary leading-relaxed mb-6">
            {description}
          </p>
        )}

        {/* Custom children */}
        {children}

        {/* Action buttons */}
        {(onConfirm || cancelLabel) && (
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            {onConfirm && (
              <Button
                variant={confirmVariant}
                fullWidth
                onClick={onConfirm}
                loading={loading}
              >
                {confirmLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
