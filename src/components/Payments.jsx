import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Payments() {
  const { state, actions } = useApp()
  const { groups, payments, stats } = state
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(null)

  const allStudents = useMemo(
    () => groups.flatMap((g) => g.students.map((s) => ({ ...s, groupName: g.name, groupPrice: g.price, groupId: g.id }))),
    [groups]
  )

  const debtors = useMemo(() => allStudents.filter((s) => s.paymentStatus === 'debt'), [allStudents])
  const paidStudents = useMemo(() => allStudents.filter((s) => s.paymentStatus === 'paid'), [allStudents])

  const filteredDebtors = useMemo(() => {
    let result = debtors
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((s) => s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.groupName.toLowerCase().includes(q))
    }
    return result
  }, [debtors, search])

  const formatCurrency = (amount) => new Intl.NumberFormat('uz-UZ').format(amount) + " so'm"

  const exportCSV = (rows, headers, filename) => {
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    actions.showToast({ message: 'CSV yuklandi!', type: 'success' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section_title">To'lovlar va Moliya</h1>
          <p className="section_subtitle">Talabalar to'lovlarini boshqaring</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(
            payments.map((p) => [p.date, p.studentName, p.groupName, p.amount, p.method]),
            ['Sana', 'Talaba', 'Guruh', 'Summa', 'Usul'], 'tolovlar'
          )} disabled={payments.length === 0} className="btn_secondary text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV eksport
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-900">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">Jami tushum</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-900">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">To'lov qilganlar</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{paidStudents.length} ta</p>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Qarzdorlar</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{debtors.length} ta</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Qarzdor Talabalar</h2>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <input className="input_field text-sm pl-9 pr-3 py-2 w-full sm:w-64" placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button onClick={() => exportCSV(
              debtors.map((s) => [s.name, s.groupName, s.phone, s.groupPrice]),
              ['Talaba', 'Guruh', 'Telefon', 'Summa'], 'qarzdorlar'
            )} disabled={debtors.length === 0} className="btn_secondary text-sm px-3 py-2">CSV</button>
          </div>
        </div>

        {filteredDebtors.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            {search ? (
              <><span className="text-4xl block mb-2">🔍</span><p>Qidiruv bo'yicha natija topilmadi</p></>
            ) : (
              <><span className="text-4xl block mb-2">🎉</span><p>Barcha talabalar to'lovni amalga oshirgan!</p></>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Talaba</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Guruh</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Telefon</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500 dark:text-gray-400">To'lov</th>
                </tr>
              </thead>
              <tbody>
                {filteredDebtors.map((student) => (
                  <tr key={student.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{student.name}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{student.groupName}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{student.phone}</td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={async () => {
                          setProcessing(student.id)
                          try { await actions.markPayment(student.id, { amount: student.groupPrice, method: 'Naqd' }) }
                          finally { setProcessing(null) }
                        }}
                        disabled={processing === student.id}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        {processing === student.id ? '...' : "To'lov qabul qilish"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">To'lov Tarixi</h2>
        {payments.length === 0 ? (
          <p className="text-center py-6 text-gray-400 dark:text-gray-500">Hali hech qanday to'lov amalga oshirilmagan</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Sana</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Talaba</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Guruh</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Summa</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Usul</th>
                </tr>
              </thead>
              <tbody>
                {[...payments].reverse().map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{p.date}</td>
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{p.studentName}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{p.groupName}</td>
                    <td className="py-3 px-2 text-right font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{p.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
