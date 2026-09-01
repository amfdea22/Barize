import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import ToastContainer from './components/Toast';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PDV = lazy(() => import('./pages/PDV'));
const Comandas = lazy(() => import('./pages/Comandas'));
const Estoque = lazy(() => import('./pages/Estoque'));
const Sala = lazy(() => import('./pages/Sala'));
const Mais = lazy(() => import('./pages/Mais'));
const FichaTecnica = lazy(() => import('./pages/FichaTecnica'));
const Etiquetas = lazy(() => import('./pages/Etiquetas'));
const Precificacao = lazy(() => import('./pages/Precificacao'));
const Financeiro = lazy(() => import('./pages/Financeiro'));
const CMV = lazy(() => import('./pages/CMV'));
const Relatorios = lazy(() => import('./pages/Relatorios'));
const DRE = lazy(() => import('./pages/DRE'));
const Fornecedores = lazy(() => import('./pages/Fornecedores'));
const POPs = lazy(() => import('./pages/POPs'));
const Admin = lazy(() => import('./pages/Admin'));
const Equipe = lazy(() => import('./pages/Equipe'));
const Impressoras = lazy(() => import('./pages/Impressoras'));
const AnaliseEstoque = lazy(() => import('./pages/AnaliseEstoque'));
const FilaPreparo = lazy(() => import('./pages/FilaPreparo'));
const CardapioDigital = lazy(() => import('./pages/CardapioDigital'));
const PersonalizarCardapio = lazy(() => import('./pages/PersonalizarCardapio'));
const Caixa = lazy(() => import('./pages/Caixa'));
const KitchenDisplay = lazy(() => import('./pages/KitchenDisplay'));
const GarcomApp = lazy(() => import('./pages/GarcomApp'));
const MesaQR = lazy(() => import('./pages/MesaQR'));

function PageLoader() {
  return (
    <div className="h-dvh flex items-center justify-center bg-[var(--color-background)]">
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

/** Redireciona para /login se não tiver token */
function RequireAuth() {
  const token = localStorage.getItem('barize_token');
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Aplica tema salvo no localStorage ao carregar */
function ThemeInit() {
  useEffect(() => {
    const stored = localStorage.getItem('barize-theme');
    const theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);
  return null;
}

/** Layout com BottomNav para todas as páginas internas */
function AppLayout() {
  return (
    <div className="flex flex-col h-dvh bg-[var(--color-background)]">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeInit />
      <ToastContainer />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/cardapio" element={<CardapioDigital />} />
          <Route path="/kitchen" element={<KitchenDisplay />} />
          <Route path="/mesa/:mesaId" element={<MesaQR />} />
          <Route path="/garcom" element={<GarcomApp />} />

          {/* Protected routes */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pdv" element={<PDV />} />
              <Route path="/comandas" element={<Comandas />} />
              <Route path="/estoque" element={<Estoque />} />
              <Route path="/sala" element={<Sala />} />
              <Route path="/mais" element={<Mais />} />
              <Route path="/fichas-tecnicas" element={<FichaTecnica />} />
              <Route path="/etiquetas" element={<Etiquetas />} />
              <Route path="/precificacao" element={<Precificacao />} />
              <Route path="/caixa" element={<Caixa />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/cmv" element={<CMV />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/dre" element={<DRE />} />
              <Route path="/fornecedores" element={<Fornecedores />} />
              <Route path="/pops" element={<POPs />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/analise-estoque" element={<AnaliseEstoque />} />
              <Route path="/fila-preparo" element={<FilaPreparo />} />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/impressoras" element={<Impressoras />} />
              <Route path="/personalizar-cardapio" element={<PersonalizarCardapio />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
