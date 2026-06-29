import { motion } from 'framer-motion'

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
    >
      <div>
        <h1 className="section_title">{title}</h1>
        {subtitle && <p className="section_subtitle">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  )
}
