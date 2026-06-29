import ReactDOM from 'react-dom/client'
import App from './App'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <AppProvider>
      <App />
    </AppProvider>
  </AuthProvider>
)
