import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#09090B] p-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-5 rounded-3xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex items-center justify-center">
              <span className="text-2xl">!</span>
            </div>
            <h1 className="text-lg font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-1">
              Xatolik yuz berdi
            </h1>
            <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mb-6">
              Kutilmagan xatolik yuz berdi. Iltimos, sahifani qayta yuklang.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn_primary"
            >
              Sahifani qayta yuklash
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-[#A1A1AA] cursor-pointer hover:text-[#71717A]">
                  Texnik ma'lumot
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-[#F4F4F5] dark:bg-[#27272A] p-3 rounded-2xl overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
