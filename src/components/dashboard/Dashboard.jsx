import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import {
  Users, BookOpen, GraduationCap, Shield,
  TrendingUp, TrendingDown, Banknote, AlertTriangle,
  Plus, UserPlus, Wallet, CalendarCheck,
} from 'lucide-react'
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import PageHeader from '../layout/PageHeader'
import StatCard from './StatCard'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4897', '#14b8a6']

const fmt = (v) => v != null ? new Intl.NumberFormat('uz-UZ').format(v) + " so'm" : '—'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-2xl shadow-soft-lg p-3 text-sm">
      <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-medium text-[#18181B] dark:text-[#FAFAFA]">
          {p.name}: {p.name === 'Daromad' || p.name === 'Xarajat' ? new Intl.NumberFormat('uz-UZ').format(p.value) + " so'm" : p.value}
        </p>
      ))}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="skeleton h-7 w-48" />
        <div className="skeleton h-4 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-[132px] rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-[320px] rounded-3xl" />
        <div className="skeleton h-[320px] rounded-3xl" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { state, dispatch } = useApp()
  const { stats } = state

  if (!stats) return <Skeleton />

  const cards = [
    { title: 'Jami talabalar', value: stats.totalStudents, icon: Users, trend: 12, trendLabel: 'o\'tgan oyga nisbatan' },
    { title: 'Jami guruhlar', value: stats.totalGroups, icon: BookOpen, trend: 8, trendLabel: 'o\'tgan oyga nisbatan' },
    { title: "O'qituvchilar", value: stats.totalTeachers, icon: GraduationCap, trend: 0, trendLabel: 'o\'tgan oyga nisbatan' },
    { title: 'Adminlar', value: stats.totalAdmins || 0, icon: Shield, trend: 0, trendLabel: 'o\'tgan oyga nisbatan' },
    { title: 'Oylik tushum', value: fmt(stats.totalRevenue), icon: TrendingUp, trend: stats.totalRevenue > 0 ? 5 : 0 },
    { title: 'Oylik xarajat', value: fmt(stats.totalExpense), icon: TrendingDown, trend: stats.totalExpense > 0 ? -3 : 0 },
    { title: 'Sof foyda', value: fmt(stats.netProfit), icon: Banknote, trend: stats.netProfit > 0 ? 8 : 0 },
    { title: 'Qarzdorlar', value: stats.debtors || 0, icon: AlertTriangle, trend: stats.debtors > 0 ? 15 : 0 },
  ]

  const attendanceData = [
    { name: 'Keldi', value: stats.presentToday || 0, color: '#10b981' },
    { name: 'Kelmadi', value: stats.absentToday || 0, color: '#ef4444' },
    { name: 'Kechikdi', value: stats.lateToday || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const groupBarData = stats.groupStats || []
  const monthlyRevenue = stats.monthlyRevenue || []
  const revenueData = monthlyRevenue.map(m => ({
    name: `${m.month}-oy`,
    Daromad: m.revenue,
    Xarajat: m.expense,
  }))

  const totalAll = attendanceData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Bugungi statistika va umumiy ma'lumotlar"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn_secondary text-sm flex items-center gap-2 py-2 px-4">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Talaba qo'shish</span>
            </button>
            <button className="btn_primary text-sm flex items-center gap-2 py-2 px-4">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Yangi guruh</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <StatCard key={card.title} {...card} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-[#E4E4E7] dark:border-[#27272A] p-6">
          <h2 className="text-base font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-1">Oylik daromad va xarajat</h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-6">2026 yil bo'yicha</p>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Daromad" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" />
                <Area type="monotone" dataKey="Xarajat" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-[#71717A] dark:text-[#A1A1AA]">
              <span className="text-3xl mb-2 opacity-50">📊</span>
              <p className="text-sm">Ma'lumot mavjud emas</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-[#E4E4E7] dark:border-[#27272A] p-6">
          <h2 className="text-base font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-1">Davomat (Bugun)</h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-6">Jami: {totalAll} ta</p>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {attendanceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-[#71717A] dark:text-[#A1A1AA]">
              <span className="text-3xl mb-2 opacity-50">📋</span>
              <p className="text-sm">Bugun dars kuni emas</p>
            </div>
          )}
          {attendanceData.length > 0 && (
            <div className="flex items-center justify-center gap-6 mt-2">
              {attendanceData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-[#E4E4E7] dark:border-[#27272A] p-6">
          <h2 className="text-base font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-1">Guruhlar bo'yicha statistika</h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-6">To'lov holati</p>
          {groupBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={groupBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="paid" name="To'lagan" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="debt" name="Qarzdor" stackId="a" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-[#71717A] dark:text-[#A1A1AA]">
              <span className="text-3xl mb-2 opacity-50">📊</span>
              <p className="text-sm">Ma'lumot mavjud emas</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-[#E4E4E7] dark:border-[#27272A] p-6">
          <h2 className="text-base font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-1">Tezkor amallar</h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-4">Eng ko'p ishlatiladigan amallar</p>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#F4F4F5] dark:bg-[#27272A] hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 text-[#71717A] dark:text-[#A1A1AA]">
              <UserPlus className="w-5 h-5" />
              <span className="text-xs font-medium">Talaba qo'shish</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#F4F4F5] dark:bg-[#27272A] hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 text-[#71717A] dark:text-[#A1A1AA]">
              <Wallet className="w-5 h-5" />
              <span className="text-xs font-medium">To'lov qo'shish</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#F4F4F5] dark:bg-[#27272A] hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 text-[#71717A] dark:text-[#A1A1AA]">
              <BookOpen className="w-5 h-5" />
              <span className="text-xs font-medium">Guruh yaratish</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#F4F4F5] dark:bg-[#27272A] hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 text-[#71717A] dark:text-[#A1A1AA]">
              <CalendarCheck className="w-5 h-5" />
              <span className="text-xs font-medium">Davomat olish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
