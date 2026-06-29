import { Loader2 } from 'lucide-react'

export default function Loading({ fullScreen, text }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">{text || 'Yuklanmoqda...'}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
        <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">{text || 'Yuklanmoqda...'}</p>
      </div>
    </div>
  )
}
