import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { useAuth } from './hooks/useAuth';
import type { UserRole } from './types';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PDV = lazy(() => import('./pages/PDV'));
const Comandas = lazy(() => import('./pages/Comandas'));
const Estoque = lazy(() => import('./pages/Estoque'));
const CMV = lazy(() => import('./pages/CMV'));
const CaixaPage = lazy(() => import('./pages/Caixa'));
const Relatorios = lazy(() => import('./pages/Relatorios'));
const Financeiro = lazy(() => import('./pages/Financeiro'));
const Admin = lazy(() => import('./pages/Admin'));
const Etiquetas = lazy(() => import('./pages/Etiquetas'));
const FichaTecnica = lazy(() => import('./pages/FichaTecnica'));
const CardapioDigital = lazy(() => import('./pages/CardapioDigital'));
const Precificacao = lazy(() => import('./pages/Precificacao'));
const AnaliseEstoque = lazy(() => import('./pages/AnaliseEstoque'));
const DRE = lazy(() => import('./pages/DRE'));
const Sala = lazy(() => import('./pages/Sala'));
const Fornecedores = lazy(() => import('./pages/Fornecedores'));
const POPs = lazy(() => import('./pages/POPs'));

function RequireRole({ roles }: { roles: UserRole[] }) {
  const { usuario, loading } = useAuth();
  if (loading) return null;
  if (usuario && !roles.includes(usuario.role)) {
    return <Navigate to="/pdv" replace />;
  }
  return <Outlet />;
}

function PageLoader() {
  return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-8 w-8 text-[var(--color-primary-container)]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-[var(--color-outline)] font-mono tracking-wider">Carregando...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cardapio" element={<CardapioDigital />} />

          {/* Protected Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pdv" element={<PDV />} />
            <Route path="/comandas" element={<Comandas />} />
            <Route path="/fichas-tecnicas" element={<FichaTecnica />} />
            <Route path="/etiquetas" element={<Etiquetas />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/precificacao" element={<Precificacao />} />
            <Route path="/pops" element={<POPs />} />

            <Route element={<RequireRole roles={['admin', 'gerente']} />}>
              <Route path="/cmv" element={<CMV />} />
              <Route path="/caixa" element={<CaixaPage />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/analise-estoque" element={<AnaliseEstoque />} />
              <Route path="/dre" element={<DRE />} />
              <Route path="/fornecedores" element={<Fornecedores />} />
              <Route path="/sala" element={<Sala />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
