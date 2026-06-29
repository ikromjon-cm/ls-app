import { motion } from 'framer-motion'

export default function StatCard({ title, value, icon: Icon, gradient, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl p-5 md:p-6 ${gradient} text-white shadow-lg hover:shadow-xl transition-shadow duration-300`}
    >
      <div className="absolute top-3 right-3 opacity-15">
        <Icon className="w-14 h-14 md:w-16 md:h-16" />
      </div>
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-80 mb-0.5">{title}</p>
        <p className="text-2xl md:text-3xl font-bold tracking-tight">{value}</p>
      </div>
      <div className="absolute inset-0 bg-white/5 pointer-events-none" />
    </motion.div>
  )
}
