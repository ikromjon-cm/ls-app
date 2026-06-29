import { useMemo } from 'react'
import { useApp } from '../context/AppContext'

export default function Dashboard() {
  const { state, actions } = useApp()
  const { groups, stats } = state

  const cards = [
    {
      label: "Jami O'quvchilar",
      value: stats.totalStudents,
      icon: '\u{1F393}',
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      textColor: 'text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Faol Guruhlar',
      value: stats.activeGroups,
      icon: '\u{1F4DA}',
      bg: 'bg-purple-50 dark:bg-purple-950/50',
      textColor: 'text-purple-700 dark:text-purple-300',
    },
    {
      label: "Oylik Tushum",
      value: new Intl.NumberFormat('uz-UZ').format(stats.totalRevenue) + " so'm",
      icon: '\u{1F4B0}',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      textColor: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Qarzdorlar',
      value: stats.debtors,
      icon: '\u{26A0}\u{FE0F}',
      bg: 'bg-red-50 dark:bg-red-950/50',
      textColor: 'text-red-700 dark:text-red-300',
    },
  ]

  const allStudents = useMemo(
    () => groups.flatMap((g) => g.students.map((s) => ({ ...s, groupName: g.name, groupId: g.id, groupPrice: g.price }))),
    [groups]
  )

  const pendingPayments = allStudents.filter((s) => s.paymentStatus === 'debt')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section_title">Dashboard</h1>
        <p className="section_subtitle">O'quv markazingizning umumiy ko'rinishi</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow duration-200`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm font-bold opacity-80">
                {typeof card.value === 'number' ? (card.value > 99 ? '99+' : card.value) : ''}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Qarzdor Talabalar</h2>
          {pendingPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <span className="text-4xl block mb-2">🎉</span>
              <p>Barcha talabalar to'lovni amalga oshirgan!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingPayments.slice(0, 5).map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{student.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{student.groupName}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await actions.markPayment(student.id, { amount: student.groupPrice, method: 'Naqd' })
                    }}
                    className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    To'lov qabul qilish
                  </button>
                </div>
              ))}
              {pendingPayments.length > 5 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                  Yana {pendingPayments.length - 5} ta qarzdor...
                </p>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Davomat (Bugun)</h2>
          {stats.totalToday > 0 ? (
            <div className="text-center py-6">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-200 dark:text-gray-700" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeDasharray={`${stats.attendancePercent}, 100`}
                    className="text-emerald-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.attendancePercent}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.presentToday} / {stats.totalToday} talaba qatnashdi
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <span className="text-4xl block mb-2">📋</span>
              <p>Bugun dars kuni emas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
