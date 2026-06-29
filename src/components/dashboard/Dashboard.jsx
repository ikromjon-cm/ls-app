import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import {
  Users, BookOpen, GraduationCap, Shield,
  TrendingUp, TrendingDown, Banknote, AlertTriangle,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import PageHeader from '../layout/PageHeader'
import StatCard from './StatCard'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

const fmt = (v) => v != null ? new Intl.NumberFormat('uz-UZ').format(v) + " so'm" : '—'

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-36" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-80 rounded-xl" />
        <div className="skeleton h-80 rounded-xl" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { state } = useApp()
  const { stats } = state

  if (!stats) return <Skeleton />

  const cards = [
    { title: 'Jami talabalar', value: stats.totalStudents, icon: Users, gradient: 'gradient-primary' },
    { title: 'Jami guruhlar', value: stats.totalGroups, icon: BookOpen, gradient: 'gradient-success' },
    { title: "O'qituvchilar", value: stats.totalTeachers, icon: GraduationCap, gradient: 'gradient-info' },
    { title: 'Adminlar', value: stats.totalAdmins, icon: Shield, gradient: 'gradient-dark' },
    { title: 'Oylik tushum', value: fmt(stats.totalRevenue), icon: TrendingUp, gradient: 'gradient-warning' },
    { title: 'Oylik xarajat', value: fmt(stats.totalExpense), icon: TrendingDown, gradient: 'gradient-danger' },
    { title: 'Sof foyda', value: fmt(stats.netProfit), icon: Banknote, gradient: 'gradient-success' },
    { title: 'Qarzdorlar', value: stats.debtors, icon: AlertTriangle, gradient: 'gradient-danger' },
  ]

  const attendanceData = [
    { name: 'Keldi', value: stats.presentToday || 0, color: '#10b981' },
    { name: 'Kelmadi', value: stats.absentToday || 0, color: '#ef4444' },
    { name: 'Kechikdi', value: stats.lateToday || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const groupBarData = stats.groupStats || []
  const courseData = stats.courseStats || []
  const teacherData = stats.teacherRating || []

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Bugungi statistika" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <StatCard key={card.title} {...card} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Davomat (Bugun)</h2>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {attendanceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
              <span className="text-5xl mb-3">📋</span>
              <p>Bugun dars kuni emas</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Guruhlar bo'yicha statistika</h2>
          {groupBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={groupBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="paid" name="To'lagan" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="debt" name="Qarzdor" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
              <span className="text-5xl mb-3">📊</span>
              <p>Ma'lumot mavjud emas</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Eng yaxshi o'qituvchilar</h2>
          {teacherData.length > 0 ? (
            <div className="space-y-2">
              {teacherData.map((t, i) => (
                <div
                  key={t.id || i}
                  className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400 w-7">#{i + 1}</span>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const filled = i === 0 ? star <= 5 : star <= Math.ceil((5 - i) * 0.7)
                        return (
                          <span
                            key={star}
                            className={`text-sm ${filled ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                          >
                            ★
                          </span>
                        )
                      })}
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.count} ta</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
              <span className="text-5xl mb-3">👨‍🏫</span>
              <p>Bugun dars o'tilmagan</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kurslar bo'yicha taqsimot</h2>
          {courseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={courseData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {courseData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
              <span className="text-5xl mb-3">📚</span>
              <p>Ma'lumot mavjud emas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
