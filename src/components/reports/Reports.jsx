import { useState, useMemo, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import {
  BarChart3, TrendingUp, Download, FileText, ChevronDown,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from 'recharts'
import PageHeader from '../layout/PageHeader'

const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('uz-UZ').format(amount || 0) + " so'm"
}

function formatShortCurrency(amount) {
  if (!amount) return "0 so'm"
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + " mln"
  if (amount >= 1000) return (amount / 1000).toFixed(0) + " ming"
  return formatCurrency(amount)
}

export default function Reports() {
  const { state, refreshReports } = useApp()
  const { reports } = state

  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  useEffect(() => {
    refreshReports({ year })
  }, [year, refreshReports])

  const chartData = useMemo(() => {
    if (!Array.isArray(reports) || reports.length === 0) return []
    const months = []
    for (let i = 0; i < 12; i++) {
      const m = reports.find(r => r.month === i + 1)
      months.push({
        name: MONTHS[i],
        revenue: m?.revenue || 0,
        expense: m?.expense || 0,
        profit: (m?.revenue || 0) - (m?.expense || 0),
        paymentsCount: m?.paymentsCount || 0,
        expensesCount: m?.expensesCount || 0,
      })
    }
    return months
  }, [reports])

  const summary = useMemo(() => {
    if (!Array.isArray(reports) || reports.length === 0) return { totalRevenue: 0, totalExpense: 0, totalProfit: 0 }
    const totalRevenue = reports.reduce((s, r) => s + (r.revenue || 0), 0)
    const totalExpense = reports.reduce((s, r) => s + (r.expense || 0), 0)
    return { totalRevenue, totalExpense, totalProfit: totalRevenue - totalExpense }
  }, [reports])

  function exportCSV() {
    const headers = ['Oy', 'Tushum', 'Xarajat', 'Foyda', "To'lovlar soni", 'Xarajatlar soni']
    const rows = chartData.map(r => [
      r.name, r.revenue, r.expense, r.profit, r.paymentsCount, r.expensesCount,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `hisobot-${year}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  function exportPDF() {
    window.print()
  }

  const yearOptions = useMemo(() => {
    const years = []
    for (let y = currentYear - 5; y <= currentYear + 1; y++) years.push(y)
    return years
  }, [currentYear])

  const isEmpty = chartData.every(r => r.revenue === 0 && r.expense === 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hisobotlar"
        subtitle={`${year}-yil hisoboti`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="input_field pr-8 text-sm appearance-none cursor-pointer"
              >
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button onClick={exportCSV} className="btn_secondary flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button onClick={exportPDF} className="btn_secondary flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-900">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">Yillik tushum</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(summary.totalRevenue)}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Yillik xarajat</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(summary.totalExpense)}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-900">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Yillik foyda</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(summary.totalProfit)}</p>
        </div>
      </div>

      {isEmpty ? (
        <div className="card text-center py-16">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ma'lumot mavjud emas</h3>
          <p className="text-gray-500 dark:text-gray-400">{year}-yil uchun hisobot ma'lumotlari topilmadi</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary-500" />
                Oylik tushum va xarajat
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={formatShortCurrency} />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#e5e7eb' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" name="Tushum" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expense" name="Xarajat" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                Oylik foyda
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={formatShortCurrency} />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#e5e7eb' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="profit" name="Foyda" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Oy</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Tushum</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Xarajat</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Foyda</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">To'lovlar</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Xarajatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.name}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(row.revenue)}</td>
                      <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">{formatCurrency(row.expense)}</td>
                      <td className={`py-3 px-4 text-right font-medium ${row.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(row.profit)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{row.paymentsCount} ta</td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{row.expensesCount} ta</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
