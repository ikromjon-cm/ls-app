import { useApp } from '../../context/AppContext'
import { LayoutDashboard, Users, BookOpen, CalendarCheck, CreditCard } from 'lucide-react'

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Talabalar', icon: Users },
  { id: 'groups', label: 'Guruhlar', icon: BookOpen },
  { id: 'attendance', label: 'Davomat', icon: CalendarCheck },
  { id: 'payments', label: "To'lovlar", icon: CreditCard },
]

export default function BottomNav() {
  const { state, dispatch } = useApp()
  const { currentPage = 'dashboard' } = state

  return (
    <nav className="md:hidden bottom-nav">
      <div className="flex items-center justify-around py-1">
        {items.map((item) => {
          const isActive = currentPage === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_PAGE', payload: item.id })}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
