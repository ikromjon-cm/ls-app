import { motion } from 'framer-motion'

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, index = 0 }) {
  const isPositive = trend > 0
  const isNegative = trend < 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
      className="bg-white dark:bg-[#18181B] rounded-3xl border border-[#E4E4E7] dark:border-[#27272A] p-5 hover:shadow-soft-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Icon className="w-[18px] h-[18px]" />
        </div>
        {trend !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                : isNegative
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                : 'text-[#71717A] dark:text-[#A1A1AA] bg-[#F4F4F5] dark:bg-[#27272A]'
            }`}
          >
            {isPositive ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-[11px] font-medium text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-0.5">
        {title}
      </p>
      <p className="text-2xl font-semibold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
        {value}
      </p>
      {trendLabel && (
        <p className="text-[11px] text-[#A1A1AA] dark:text-[#52525B] mt-1">{trendLabel}</p>
      )}
    </motion.div>
  )
}
