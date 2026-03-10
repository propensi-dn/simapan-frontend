interface StatCardProps {
  label: string
  value: string
  subtitle?: string
  badge?: string
  badgePositive?: boolean   // true = green, false = red, undefined = neutral
  icon?: React.ReactNode
  accent?: string           // bottom accent color
}

export default function StatCard({
  label,
  value,
  subtitle,
  badge,
  badgePositive,
  icon,
  accent,
}: StatCardProps) {
  const badgeColor =
    badgePositive === true
      ? { bg: '#D1FAE5', text: '#065F46' }
      : badgePositive === false
      ? { bg: '#FEE2E2', text: '#991B1B' }
      : { bg: '#F3F4F6', text: '#525E71' }

  return (
    <div
      className="bg-white rounded-2xl p-6 relative overflow-hidden"
      style={{ border: '1px solid #F1F5F9' }}
    >
      {/* Icon + badge row */}
      <div className="flex items-start justify-between mb-3">
        {icon ? (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#F1F5F9', color: '#525E71' }}
          >
            {icon}
          </div>
        ) : <div />}

        {badge && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: badgeColor.bg,
              color: badgeColor.text,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Label */}
      <p
        className="text-xs font-medium mb-1"
        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}
      >
        {label.toUpperCase()}
      </p>

      {/* Value */}
      <p
        className="font-bold text-xl"
        style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
      >
        {value}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs mt-1" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
          {subtitle}
        </p>
      )}

      {/* Bottom accent bar */}
      {accent && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl"
          style={{ backgroundColor: accent }}
        />
      )}
    </div>
  )
}