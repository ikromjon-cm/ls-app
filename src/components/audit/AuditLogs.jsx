import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { api } from '../../api'
import { motion } from 'framer-motion'
import {
  ScrollText, Search, X, RefreshCw, Shield, User,
} from 'lucide-react'
import PageHeader from '../layout/PageHeader'

const ACTION_TYPES = [
  { value: '', label: 'Barcha harakatlar' },
  { value: 'create', label: 'Yaratish' },
  { value: 'update', label: 'Tahrirlash' },
  { value: 'delete', label: "O'chirish" },
  { value: 'login', label: 'Kirish' },
  { value: 'logout', label: 'Chiqish' },
  { value: 'payment', label: "To'lov" },
  { value: 'expense', label: 'Xarajat' },
  { value: 'attendance', label: 'Davomat' },
]

const ACTION_COLORS = {
  create: 'text-emerald-600 dark:text-emerald-400',
  update: 'text-blue-600 dark:text-blue-400',
  delete: 'text-red-600 dark:text-red-400',
  login: 'text-green-600 dark:text-green-400',
  logout: 'text-gray-600 dark:text-gray-400',
  payment: 'text-purple-600 dark:text-purple-400',
  expense: 'text-orange-600 dark:text-orange-400',
  attendance: 'text-yellow-600 dark:text-yellow-400',
}

const ACTION_BADGE = {
  create: 'badge_green',
  update: 'badge_blue',
  delete: 'badge_red',
  login: 'badge_green',
  logout: 'badge',
  payment: 'badge_purple',
  expense: 'badge_yellow',
  attendance: 'badge_yellow',
}

const ROLE_BADGE = {
  superadmin: 'badge_red',
  admin: 'badge_blue',
  teacher: 'badge_green',
}

const ROW_BG = {
  create: 'bg-emerald-50/30 dark:bg-emerald-950/10',
  delete: 'bg-red-50/30 dark:bg-red-950/10',
  payment: 'bg-purple-50/30 dark:bg-purple-950/10',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getRelativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hozir'
  if (mins < 60) return `${mins} daqiqa oldin`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} soat oldin`
  const days = Math.floor(hours / 24)
  return `${days} kun oldin`
}

export default function AuditLogs() {
  const { state, refreshAuditLogs } = useApp()
  const { auditLogs, users } = state

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [userId, setUserId] = useState('')
  const [actionType, setActionType] = useState('')
  const [search, setSearch] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const intervalRef = useRef(null)

  useEffect(() => {
    const filters = {}
    if (dateFrom) filters.startDate = dateFrom
    if (dateTo) filters.endDate = dateTo
    if (userId) filters.userId = userId
    if (actionType) filters.type = actionType
    if (search.trim()) filters.search = search.trim()
    refreshAuditLogs(filters)
  }, [dateFrom, dateTo, userId, actionType, search, refreshAuditLogs])

  useEffect(() => {
    if (!autoRefresh) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    const filters = {}
    if (dateFrom) filters.startDate = dateFrom
    if (dateTo) filters.endDate = dateTo
    if (userId) filters.userId = userId
    if (actionType) filters.type = actionType
    intervalRef.current = setInterval(() => {
      refreshAuditLogs(filters)
    }, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, dateFrom, dateTo, userId, actionType, refreshAuditLogs])

  const filtered = useMemo(() => {
    let list = auditLogs || []
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(l =>
        l.userName?.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q) ||
        l.ip?.includes(q)
      )
    }
    return list
  }, [auditLogs, search])

  const userList = useMemo(() => {
    if (!users) return []
    return users.filter(u => u.role === 'superadmin' || u.role === 'admin' || u.role === 'teacher')
  }, [users])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Loglar"
        subtitle="Tizimdagi barcha o'zgarishlar kuzatuvi"
        actions={
          <button
            onClick={() => setAutoRefresh(p => !p)}
            className={`btn_secondary flex items-center gap-2 text-sm ${autoRefresh ? 'ring-2 ring-primary-500' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Avtomatik' : 'Qo\'lda'}
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Boshlang'ich sana</label>
          <input type="date" className="input_field text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tugash sanasi</label>
          <input type="date" className="input_field text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Foydalanuvchi</label>
          <select className="input_field text-sm" value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="">Barchasi</option>
            {userList.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Harakat turi</label>
          <select className="input_field text-sm" value={actionType} onChange={e => setActionType(e.target.value)}>
            {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input_field pl-9 text-sm"
            placeholder="Qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {(dateFrom || dateTo || userId || actionType || search) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setUserId(''); setActionType(''); setSearch('') }}
            className="btn_ghost text-sm flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Tozalash
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Vaqt</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Foydalanuvchi</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Rol</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Harakat</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Tafsilotlar</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">IP manzil</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <ScrollText className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>Audit loglar mavjud emas</p>
                  </td>
                </tr>
              ) : (
                filtered.map((log, idx) => (
                  <tr
                    key={log.id || idx}
                    className={`border-b border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${ROW_BG[log.action] || ''}`}
                  >
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs" title={formatDate(log.createdAt)}>
                      {getRelativeTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{log.userName || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={ROLE_BADGE[log.userRole] || 'badge'}>
                        {log.userRole === 'superadmin' ? 'Super Admin' : log.userRole === 'admin' ? 'Admin' : log.userRole === 'teacher' ? "O'qituvchi" : log.userRole || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium capitalize ${ACTION_COLORS[log.action] || 'text-gray-600 dark:text-gray-400'}`}>
                        {ACTION_TYPES.find(a => a.value === log.action)?.label || log.action || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">{log.details || '—'}</td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{log.ip || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
