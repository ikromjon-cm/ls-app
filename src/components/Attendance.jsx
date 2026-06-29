import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../context/AppContext'

export default function Attendance() {
  const { state, actions } = useApp()
  const { groups } = state
  const today = new Date().toLocaleDateString('en-CA')
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || '')
  const [selectedDate, setSelectedDate] = useState(today)
  const [processing, setProcessing] = useState(null)

  useEffect(() => {
    if (groups.length > 0 && !selectedGroup) {
      setSelectedGroup(groups[0].id)
    }
  }, [groups, selectedGroup])

  const group = groups.find((g) => g.id === selectedGroup)

  const attendanceStats = useMemo(() => {
    if (!group) return { present: 0, absent: 0, total: 0, percentage: 0, unmarked: 0 }
    const present = group.students.filter((s) => s.attendance[selectedDate] === 'present').length
    const absent = group.students.filter((s) => s.attendance[selectedDate] === 'absent').length
    const total = group.students.length
    const unmarked = total - present - absent
    const percentage = (present + absent) > 0 ? Math.round((present / (present + absent)) * 100) : 0
    return { present, absent, total, percentage, unmarked }
  }, [group, selectedDate])

  const markAttendance = async (studentId, status) => {
    setProcessing(studentId)
    try {
      await actions.markAttendance(studentId, { date: selectedDate, status })
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section_title">Jurnal va Davomat</h1>
        <p className="section_subtitle">Talabalar davomatini kuzating va belgilang</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Guruhni tanlang</label>
          <select className="input_field" value={selectedGroup} onChange={(e) => setSelectedGroup(Number(e.target.value))}>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="sm:w-48">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sanani tanlang</label>
          <input type="date" className="input_field" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
      </div>

      {group && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card py-3 px-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Jami</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{attendanceStats.total}</p>
            </div>
            <div className="card py-3 px-4 text-center bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-0.5">Keldi</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{attendanceStats.present}</p>
            </div>
            <div className="card py-3 px-4 text-center bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
              <p className="text-xs text-red-600 dark:text-red-400 mb-0.5">Kelmadi</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">{attendanceStats.absent}</p>
            </div>
            <div className="card py-3 px-4 text-center bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Davomat %</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {attendanceStats.present + attendanceStats.absent > 0 ? attendanceStats.percentage + '%' : '-'}
              </p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{group.name} - {selectedDate}</h2>
              {attendanceStats.unmarked > 0 && (
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2.5 py-1 rounded-full font-medium">
                  {attendanceStats.unmarked} ta belgilanmagan
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">#</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Talaba</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Telefon</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">To'lov</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Davomat</th>
                  </tr>
                </thead>
                <tbody>
                  {group.students.map((student, idx) => {
                    const status = student.attendance[selectedDate]
                    return (
                      <tr key={student.id} className={`border-b border-gray-100 dark:border-gray-800 transition-all duration-300 ${
                        status === 'present' ? 'bg-emerald-50/50 dark:bg-emerald-950/20' :
                        status === 'absent' ? 'bg-red-50/50 dark:bg-red-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                      }`}>
                        <td className="py-3 px-2 text-gray-500 dark:text-gray-500">{idx + 1}</td>
                        <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{student.name}</td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{student.phone}</td>
                        <td className="py-3 px-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            student.paymentStatus === 'paid'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {student.paymentStatus === 'paid' ? "To'lagan" : 'Qarzdor'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => markAttendance(student.id, 'present')}
                              disabled={processing === student.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 ${
                                status === 'present'
                                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400'
                              }`}
                            >
                              {processing === student.id ? '...' : 'Keldi'}
                            </button>
                            <button
                              onClick={() => markAttendance(student.id, 'absent')}
                              disabled={processing === student.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 ${
                                status === 'absent'
                                  ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400'
                              }`}
                            >
                              {processing === student.id ? '...' : 'Kelmadi'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
