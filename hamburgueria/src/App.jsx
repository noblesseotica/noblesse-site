import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import { CartProvider } from './context/CartContext.jsx'

// O painel admin é carregado sob demanda: o cliente que só quer pedir não baixa esse código.
const Admin = lazy(() => import('./pages/Admin.jsx'))

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <CartProvider>
            <Home />
          </CartProvider>
        }
      />
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="grid min-h-screen place-items-center text-white/40">Carregando…</div>}>
            <Admin />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <CartProvider>
            <Home />
          </CartProvider>
        }
      />
    </Routes>
  )
}
