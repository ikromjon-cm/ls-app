import { useApp } from '../context/AppContext'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '\u{1F4CA}' },
  { id: 'groups', label: 'Guruhlar', icon: '\u{1F465}' },
  { id: 'payments', label: "To'lovlar", icon: '\u{1F4B3}' },
  { id: 'attendance', label: 'Davomat', icon: '\u{1F4CB}' },
  { id: 'billing', label: 'Tariflar', icon: '\u{2B50}' },
]

export default function Sidebar() {
  const { state, dispatch } = useApp()
  const { currentPage, sidebarOpen } = state

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        />
      )}
      <aside
        className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  dispatch({ type: 'SET_PAGE', payload: item.id })
                  if (window.innerWidth < 768) dispatch({ type: 'TOGGLE_SIDEBAR' })
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <span className={`text-sm font-medium truncate ${!sidebarOpen && 'md:hidden'}`}>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-6 rounded-full bg-primary-500 hidden md:block" />
                )}
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
