import { useState } from 'react'
import { useApp } from '../context/AppContext'

const plans = [
  {
    id: 'basic', name: 'Basic', monthlyPrice: 299000, yearlyPrice: 239200,
    description: "Kichik o'quv markazlari uchun ideal",
    features: ["50 tagacha o'quvchi", '5 tagacha guruh', 'Asosiy hisobotlar', 'Email qo\'llab-quvvatlash'],
    popular: false,
  },
  {
    id: 'professional', name: 'Professional', monthlyPrice: 599000, yearlyPrice: 479200,
    description: "O'rta va yirik markazlar uchun eng yaxshi tanlov",
    features: ["Cheksiz o'quvchilar", "Cheksiz guruhlar", "To'liq hisobotlar va analitika", "Avtomatik davomat tizimi", "SMS xabarnomalar", "Prioretet qo'llab-quvvatlash"],
    popular: true,
  },
  {
    id: 'enterprise', name: 'Enterprise', monthlyPrice: 999000, yearlyPrice: 799200,
    description: "Ko'p filialli yirik ta'lim tashkilotlari uchun",
    features: ["Cheksiz o'quvchilar va guruhlar", "Ko'p filiallarni boshqarish", "Maxsus integratsiyalar", "Shaxsiy menejer", "24/7 telefon qo'llab-quvvatlash", "Maxsus sozlashlar"],
    popular: false,
  },
]

export default function Billing() {
  const { actions } = useApp()
  const [isYearly, setIsYearly] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const handlePurchase = (plan) => {
    setSelectedPlan(plan)
    setShowModal(true)
  }

  const confirmPurchase = () => {
    if (!selectedPlan) return
    const price = isYearly ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice
    const period = isYearly ? 'yillik' : 'oylik'
    actions.showToast({
      message: `${selectedPlan.name} (${period}) - ${new Intl.NumberFormat('uz-UZ').format(price)} so'm to'lov muvaffaqiyatli amalga oshirildi!`,
      type: 'success',
    })
    setShowModal(false)
    setSelectedPlan(null)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="section_title">Narxlar va Tariflar</h1>
        <p className="section_subtitle">O'quv markingiz uchun eng mos rejani tanlang</p>

        <div className="inline-flex items-center gap-3 mt-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button onClick={() => setIsYearly(false)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${!isYearly ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            Oylik
          </button>
          <button onClick={() => setIsYearly(true)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isYearly ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            Yillik <span className="ml-1.5 text-xs text-emerald-500 font-bold">-20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
          return (
            <div key={plan.id} className={`card relative flex flex-col ${plan.popular ? 'ring-2 ring-primary-500 shadow-xl shadow-primary-500/10 scale-105 md:scale-105' : 'hover:shadow-md'} transition-all duration-200`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">OMMABOP</div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat('uz-UZ').format(price)}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">so'm/{isYearly ? 'yil' : 'oy'}</span>
                </div>
                {isYearly && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    <span className="line-through text-gray-400 dark:text-gray-500">{new Intl.NumberFormat('uz-UZ').format(plan.monthlyPrice * 12)} so'm</span> 20% tejash
                  </p>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handlePurchase(plan)}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-all duration-200 ${plan.popular ? 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-lg shadow-primary-500/25' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'}`}>
                Sotib olish
              </button>
            </div>
          )
        })}
      </div>

      {showModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPlan.name} rejasi</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{isYearly ? 'Yillik' : 'Oylik'} to'lovni tasdiqlang</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Reja</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Davr</span>
                <span className="font-medium text-gray-900 dark:text-white">{isYearly ? 'Yillik' : 'Oylik'}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Jami</span>
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {new Intl.NumberFormat('uz-UZ').format(isYearly ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice)} so'm
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn_secondary flex-1">Bekor qilish</button>
              <button onClick={confirmPurchase} className="btn_primary flex-1">To'lovni tasdiqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
