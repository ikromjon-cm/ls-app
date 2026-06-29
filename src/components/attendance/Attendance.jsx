import { useState, useMemo, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { api } from '../../api'
import { motion } from 'framer-motion'
import {
  CalendarCheck, Users, CheckCircle, XCircle, Clock, AlertTriangle, Percent,
} from 'lucide-react'
import PageHeader from '../layout/PageHeader'

const ATTENDANCE_STATUS = [
  { key: 'present', label: "Keldi", className: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' },
  { key: 'absent', label: "Kelmadi", className: 'bg-red-500 text-white shadow-md shadow-red-500/30' },
  { key: 'late', label: 'Kechikdi', className: 'bg-yellow-500 text-white shadow-md shadow-yellow-500/30' },
  { key: 'excused', label: 'Sababli', className: 'bg-blue-500 text-white shadow-md shadow-blue-500/30' },
]

const STATUS_INACTIVE = 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-opacity-80'

function formatCurrency(amount) {
  return new Intl.NumberFormat('uz-UZ').format(amount || 0) + " so'm"
}

function Toast({ show, message, type, onClose }) {
  useEffect(() => {
    if (show) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }
  }, [show, onClose])
  if (!show) return null
  const bg = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  return (
    <div className="fixed top-20 right-4 z-[60] animate-bounce-in">
      <div className={`${bg} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-white/50`}>
        <span className="font-medium text-sm sm:text-base">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70 font-bold text-lg leading-none">&times;</button>
      </div>
    </div>
  )
}

export default function Attendance() {
  const { state, dispatch } = useApp()
  const { groups, students: rawStudents } = state

  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [attendanceMap, setAttendanceMap] = useState({})
  const [processing, setProcessing] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const showToast = useCallback((message, type = 'success') => setToast({ show: true, message, type }), [])
  const hideToast = useCallback(() => setToast(s => ({ ...s, show: false })), [])

  const groupStudents = useMemo(() => {
    if (!selectedGroup) return []
    return (rawStudents || [])
      .filter(s => String(s.groupId) === String(selectedGroup))
      .map(s => {
        const group = groups.find(g => String(g.id) === String(selectedGroup))
        return { ...s, groupName: group?.name || s.groupName || '' }
      })
  }, [rawStudents, selectedGroup, groups])

  useEffect(() => {
    if (groups.length > 0 && !selectedGroup) {
      setSelectedGroup(String(groups[0].id))
    }
  }, [groups, selectedGroup])

  useEffect(() => {
    if (!selectedGroup || !selectedDate) return
    api.getAttendance({ groupId: selectedGroup, date: selectedDate })
      .then(list => {
        const map = {}
        ;(list || []).forEach(a => { map[a.studentId] = a.status })
        setAttendanceMap(map)
      })
      .catch(() => setAttendanceMap({}))
  }, [selectedGroup, selectedDate])

  const stats = useMemo(() => {
    const total = groupStudents.length
    let present = 0, absent = 0, late = 0, excused = 0
    groupStudents.forEach(s => {
      const st = attendanceMap[s.id]
      if (st === 'present') present++
      else if (st === 'absent') absent++
      else if (st === 'late') late++
      else if (st === 'excused') excused++
    })
    const marked = present + absent + late + excused
    const percentage = marked > 0 ? Math.round((present / marked) * 100) : 0
    return { total, present, absent, late, excused, percentage }
  }, [groupStudents, attendanceMap])

  function getStudentAbsenceCount(studentId) {
    return (state.attendance || []).filter(
      a => a.studentId === studentId && a.status === 'absent'
    ).length
  }

  async function toggleStatus(studentId, currentStatus, newStatus) {
    if (processing === studentId) return
    setProcessing(studentId)
    const nextStatus = currentStatus === newStatus ? null : newStatus
    try {
      const result = await api.markAttendance({
        studentId,
        groupId: Number(selectedGroup),
        date: selectedDate,
        status: nextStatus,
      })
      if (result.id) {
        setAttendanceMap(prev => ({
          ...prev,
          [studentId]: nextStatus,
        }))
        dispatch({ type: 'SET_INITIAL', data: { attendance: [...(state.attendance || []), result] } })
      }
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />

      <PageHeader title="Davomat" subtitle="Talabalar davomatini kuzating" />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Guruh</label>
          <select className="input_field" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
            <option value="">Guruhni tanlang</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="sm:w-48">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sana</label>
          <input type="date" className="input_field" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        </div>
      </div>

      {selectedGroup && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="card py-3 px-4 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Jami</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="card py-3 px-4 text-center bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
              <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Keldi</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.present}</p>
            </div>
            <div className="card py-3 px-4 text-center bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
              <XCircle className="w-5 h-5 mx-auto mb-1 text-red-500" />
              <p className="text-xs text-red-600 dark:text-red-400">Kelmadi</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">{stats.absent}</p>
            </div>
            <div className="card py-3 px-4 text-center bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900">
              <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Kechikdi</p>
              <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{stats.late}</p>
            </div>
            <div className="card py-3 px-4 text-center bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
              <Percent className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-xs text-blue-600 dark:text-blue-400">Foiz</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats.percentage}%</p>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Talaba</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Telefon</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">To'lov</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Guruh</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      <CalendarCheck className="w-4 h-4 inline mr-1" />
                      Davomat
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 dark:text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p>Talabalar mavjud emas</p>
                      </td>
                    </tr>
                  ) : (
                    groupStudents.map(student => {
                      const currentStatus = attendanceMap[student.id]
                      const absenceCount = getStudentAbsenceCount(student.id)
                      const isRisk = absenceCount >= 3
                      return (
                        <tr
                          key={student.id}
                          className={`border-b border-gray-100 dark:border-gray-800 transition-colors ${
                            currentStatus === 'present' ? 'bg-emerald-50/40 dark:bg-emerald-950/15' :
                            currentStatus === 'absent' ? 'bg-red-50/40 dark:bg-red-950/15' :
                            currentStatus === 'late' ? 'bg-yellow-50/40 dark:bg-yellow-950/15' :
                            currentStatus === 'excused' ? 'bg-blue-50/40 dark:bg-blue-950/15' :
                            'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{student.name}</span>
                              {isRisk && (
                                <span className="inline-flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3" />
                                  Risk guruh
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{student.phone || '—'}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              student.paymentStatus === 'paid'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {student.paymentStatus === 'paid' ? "To'lagan" : 'Qarzdor'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{student.groupName || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {ATTENDANCE_STATUS.map(status => {
                                const isActive = currentStatus === status.key
                                return (
                                  <button
                                    key={status.key}
                                    onClick={() => toggleStatus(student.id, currentStatus, status.key)}
                                    disabled={processing === student.id}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 ${
                                      isActive ? status.className : STATUS_INACTIVE
                                    }`}
                                  >
                                    {processing === student.id ? '...' : status.label}
                                  </button>
                                )
                              })}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
