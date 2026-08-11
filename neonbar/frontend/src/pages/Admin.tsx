import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  RefreshCw,
  Box,
  CheckCircle,
  FileText,
  Grid3x3,
  Images,
  Link,
  Pencil,
  Plus,
  Search,
  Trash,
  UserPlus,
  Users,
  X,
  XCircle,
  Printer,
  Send,
  Wifi,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTelemetry } from '../hooks/useTelemetry';
import ProductThumbnail from '../components/ProductThumbnail';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';
import { produtoLotesService, fichasTecnicasService, pdvService, adminService, funcionariosService, authService, mesasService, uploadService } from '../services/api';
import type { ProdutoLote, ProdutoLoteCreate, Produto, Funcionario, FuncionarioCreate, Usuario, Mesa, MesaCreate, PrinterConfig, PrinterType, PrinterStatus, FilaImpressaoItem } from '../types';

const CARGO_LABELS: Record<string, string> = {
  bartender: 'Bartender',
  garcom: 'Garçom',
  caixa: 'Caixa',
  estoquista: 'Estoquista',
  cozinheiro: 'Cozinheiro',
  auxiliar_cozinha: 'Auxiliar de Cozinha',
  gerente_operacional: 'Gerente Operacional',
  outro: 'Outro',
};

const TURNO_LABELS: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  misto: 'Misto',
};

const DIAS_SEMANA = [
  { v: 1, l: 'Dom' },
  { v: 2, l: 'Seg' },
  { v: 3, l: 'Ter' },
  { v: 4, l: 'Qua' },
  { v: 5, l: 'Qui' },
  { v: 6, l: 'Sex' },
  { v: 7, l: 'Sáb' },
];

type AdminTab = 'monitoramento' | 'lotes' | 'fichas' | 'imagens' | 'funcionarios' | 'mesas' | 'impressoras';

const Admin: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('monitoramento');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // Monitoramento state
  const [lotesVencendo, setLotesVencendo] = useState<ProdutoLote[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const telemetry = useTelemetry();

  // Gestão de Lotes state
  const [lotes, setLotes] = useState<ProdutoLote[]>([]);
  const [showLoteModal, setShowLoteModal] = useState(false);
  const [editingLote, setEditingLote] = useState<ProdutoLote | null>(null);
  const [loteForm, setLoteForm] = useState<ProdutoLoteCreate>({
    produto_id: 0,
    codigo_lote: '',
    data_fabricacao: '',
    data_validade: '',
    quantidade: 0,
  });

  // Fichas Técnicas state
  const [fichas, setFichas] = useState<any[]>([]);
  const [selectedFicha, setSelectedFicha] = useState<any | null>(null);
  const [showFichaModal, setShowFichaModal] = useState(false);

  // Imagens state
  const [images, setImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [assigningFilename, setAssigningFilename] = useState<string | null>(null);
  const [imageFilter, setImageFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [selectedProdutos, setSelectedProdutos] = useState<Record<string, number>>({});
  const [fichaForm, setFichaForm] = useState({
    dificuldade: '',
    teor_alcoolico: '',
    modo_preparo: '',
    tipo_copo: '',
    guarnicao: '',
    tempo_preparo: '',
  });

  // Funcionários state
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcionariosLoading, setFuncionariosLoading] = useState(false);
  const [showFuncionarioModal, setShowFuncionarioModal] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [funcionarioTab, setFuncionarioTab] = useState<'dados' | 'contrato' | 'escala' | 'vinculo'>('dados');
  const [funcionarioForm, setFuncionarioForm] = useState<FuncionarioCreate>({
    nome: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    telefone: '',
    email: '',
    endereco: '',
    foto_url: '',
    cargo: 'bartender',
    data_admissao: new Date().toISOString().split('T')[0],
    salario_hora: 0,
    tipo_contrato: 'CLT',
    turno: 'noite',
    dias_semana: [2, 3, 4, 5, 6],
    carga_horaria_semanal: 44,
    observacoes: '',
  });
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [funcFiltroCargo, setFuncFiltroCargo] = useState('');
  const [funcFiltroAtivo, setFuncFiltroAtivo] = useState('');
  const [funcBusca, setFuncBusca] = useState('');
  const [vincularUsuarioModal, setVincularUsuarioModal] = useState<Funcionario | null>(null);
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<Usuario[]>([]);
  const [vincularUsuarioId, setVincularUsuarioId] = useState<number | null>(null);

  // Mesas state
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesasLoading, setMesasLoading] = useState(false);
  const [showMesaModal, setShowMesaModal] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [mesaForm, setMesaForm] = useState<MesaCreate>({ nome: '', local: '' });

  // Impressoras state (TC-042) + Fila de impressão (TC-040)
  const [printerConfigs, setPrinterConfigs] = useState<PrinterConfig[]>([]);
  const [printerSetor, setPrinterSetor] = useState('CAIXA');
  const [printerForm, setPrinterForm] = useState<PrinterConfig>({
    id: 0, setor: 'CAIXA', tipo: 'network', host: '', porta: 9100, baud_rate: 9600, timeout: 5.0, ativo: true,
  });
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus | null>(null);
  const [printerStatusLoading, setPrinterStatusLoading] = useState(false);
  const [printerTestMsg, setPrinterTestMsg] = useState<string | null>(null);
  const [printerSaving, setPrinterSaving] = useState(false);
  const [filaImpressao, setFilaImpressao] = useState<FilaImpressaoItem[]>([]);
  const [filaStatus, setFilaStatus] = useState('PENDENTE');
  const [filaLoading, setFilaLoading] = useState(false);
  const [printerLoading, setPrinterLoading] = useState(false);

  const hasRole = (roles: string[]) => usuario ? roles.includes(usuario.role) : false;
  const isAdminOrGerente = hasRole(['admin', 'gerente']);

  const confirm = (message: string, onConfirm: () => void) => setConfirmState({ message, onConfirm });

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    if (!isAdminOrGerente) {
      navigate('/pdv');
      return;
    }
    loadMonitoramento();
    loadProdutos();
  }, [usuario, isAdminOrGerente, navigate]);

  useEffect(() => {
    if (activeTab === 'lotes') loadLotes();
    if (activeTab === 'fichas') loadFichas();
    if (activeTab === 'imagens') loadImages();
    if (activeTab === 'funcionarios') loadFuncionarios();
    if (activeTab === 'impressoras') loadImpressoras();
  }, [activeTab]);

  const loadImpressoras = async () => {
    try {
      setPrinterLoading(true);
      const res = await adminService.getPrinterConfigs();
      setPrinterConfigs(Array.isArray(res.data) ? res.data : []);
      if (res.data?.length > 0 && !res.data.some((c: PrinterConfig) => c.setor === printerSetor)) {
        setPrinterSetor(res.data[0].setor);
      }
    } catch {
      setError('Erro ao carregar configurações de impressora');
    } finally {
      setPrinterLoading(false);
    }
    await carregarFila(filaStatus);
  };

  const carregarFila = async (status: string) => {
    try {
      setFilaLoading(true);
      const res = await adminService.getPrinterFila(status);
      setFilaImpressao(Array.isArray(res.data) ? res.data : []);
    } catch {
      setFilaImpressao([]);
    } finally {
      setFilaLoading(false);
    }
  };

  const carregarConfigSetor = async (setor: string) => {
    try {
      const res = await adminService.getPrinterConfig(setor);
      const cfg = res.data as PrinterConfig;
      if (cfg) {
        setPrinterForm({ id: cfg.id, setor: cfg.setor || setor, tipo: cfg.tipo || 'network', host: cfg.host || '', porta: cfg.porta || 9100, baud_rate: cfg.baud_rate || 9600, timeout: cfg.timeout ?? 5.0, ativo: cfg.ativo });
      } else {
        setPrinterForm({ id: 0, setor, tipo: 'network', host: '', porta: 9100, baud_rate: 9600, timeout: 5.0, ativo: true });
      }
      setPrinterStatus(null);
      setPrinterTestMsg(null);
    } catch {
      setPrinterForm({ id: 0, setor, tipo: 'network', host: '', porta: 9100, baud_rate: 9600, timeout: 5.0, ativo: true });
      setPrinterStatus(null);
    }
  };

  const checarStatus = async () => {
    setPrinterStatusLoading(true);
    setPrinterTestMsg(null);
    try {
      const res = await adminService.getPrinterStatus(printerSetor);
      setPrinterStatus(res.data as PrinterStatus);
    } catch {
      setPrinterTestMsg('Falha ao consultar o status da impressora');
    } finally {
      setPrinterStatusLoading(false);
    }
  };

  const salvarPrinter = async () => {
    setPrinterSaving(true);
    setPrinterTestMsg(null);
    try {
      if (printerForm.id) {
        await adminService.updatePrinterConfig({
          setor: printerSetor,
          tipo: printerForm.tipo,
          host: printerForm.host || undefined,
          porta: printerForm.porta || undefined,
          baud_rate: printerForm.baud_rate || undefined,
          timeout: printerForm.timeout || undefined,
          ativo: printerForm.ativo,
        });
      } else {
        await adminService.createPrinterConfig(printerForm);
      }
      setPrinterTestMsg('Configuração salva com sucesso');
      await loadImpressoras();
    } catch {
      setPrinterTestMsg('Erro ao salvar a configuração');
    } finally {
      setPrinterSaving(false);
    }
  };

  const testarPrinter = async () => {
    setPrinterTestMsg(null);
    try {
      const res = await adminService.testPrinter(printerForm);
      setPrinterTestMsg(res.data.mensagem);
    } catch {
      setPrinterTestMsg('Falha no teste de impressão');
    }
  };

  const reenviarFila = async (id: number) => {
    try {
      await adminService.reenviarPrinterFila(id);
      await carregarFila(filaStatus);
    } catch {
      setError('Erro ao reenviar trabalho de impressão');
    }
  };

  const loadMonitoramento = async () => {
    try {
      setLoading(true);
      const [vencendo, prods, healthRes, metricsRes] = await Promise.all([
        produtoLotesService.vencendo(30),
        pdvService.listarProdutos(),
        adminService.healthEnhanced().catch(() => ({ data: null })),
        adminService.metrics().catch(() => ({ data: null })),
      ]);
      setLotesVencendo(vencendo.data.filter((l: ProdutoLote) => l.quantidade > 0));
      setProdutos(prods.data.filter((p: Produto) => p.ativo));
      setHealth(healthRes?.data || null);
      setMetrics(metricsRes?.data || null);
    } catch (err: any) {
      setError('Erro ao carregar monitoramento: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadProdutos = async () => {
    try {
      const data = await pdvService.listarProdutos();
      setProdutos(data.data.filter((p: Produto) => p.ativo));
    } catch (err: any) {
      setError('Erro ao carregar produtos: ' + (err.response?.data?.detail || err.message));
    }
  };

  const loadLotes = async () => {
    try {
      setLoading(true);
      const data = await produtoLotesService.listar();
      setLotes(data.data);
    } catch (err: any) {
      setError('Erro ao carregar lotes: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    try {
      setImagesLoading(true);
      const res = await adminService.listImages();
      setImages(res.data.images || []);
    } catch (err: any) {
      setError('Erro ao carregar imagens: ' + (err.response?.data?.detail || err.message));
    } finally {
      setImagesLoading(false);
    }
  };

  const loadFichas = async () => {
    try {
      setLoading(true);
      const data = await fichasTecnicasService.listar();
      setFichas(data.data);
    } catch (err: any) {
      setError('Erro ao carregar fichas técnicas: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadFuncionarios = async () => {
    try {
      setFuncionariosLoading(true);
      const data = await funcionariosService.listar();
      setFuncionarios(data.data || []);
    } catch (err: any) {
      setError('Erro ao carregar funcionários: ' + (err.response?.data?.detail || err.message));
    } finally {
      setFuncionariosLoading(false);
    }
  };

  const handleLoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingLote) {
        await produtoLotesService.atualizar(editingLote.id, loteForm);
      } else {
        await produtoLotesService.criar(loteForm);
      }
      setShowLoteModal(false);
      setEditingLote(null);
      resetLoteForm();
      loadLotes();
    } catch (err: any) {
      setError('Erro ao salvar lote: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLote = async (id: number) => {
    confirm('Tem certeza que deseja excluir este lote?', async () => {
      try {
        await produtoLotesService.excluir(id);
        loadLotes();
      } catch (err: any) {
        setError('Erro ao excluir lote: ' + (err.response?.data?.detail || err.message));
      }
    });
  };

  const openLoteModal = (lote?: ProdutoLote) => {
    if (lote) {
      setEditingLote(lote);
      setLoteForm({
        produto_id: lote.produto_id,
        codigo_lote: lote.codigo_lote,
        data_fabricacao: lote.data_fabricacao ? lote.data_fabricacao.split('T')[0] : '',
        data_validade: lote.data_validade ? lote.data_validade.split('T')[0] : '',
        quantidade: lote.quantidade,
      });
    } else {
      setEditingLote(null);
      resetLoteForm();
    }
    setShowLoteModal(true);
  };

  const resetLoteForm = () => {
    setLoteForm({
      produto_id: 0,
      codigo_lote: '',
      data_fabricacao: '',
      data_validade: '',
      quantidade: 0,
    });
  };

  const resetFuncionarioForm = () => {
    setFuncionarioForm({
      nome: '',
      cpf: '',
      rg: '',
      data_nascimento: '',
      telefone: '',
      email: '',
      endereco: '',
      foto_url: '',
      cargo: 'bartender',
      data_admissao: new Date().toISOString().split('T')[0],
      salario_hora: 0,
      tipo_contrato: 'CLT',
      turno: 'noite',
      dias_semana: [2, 3, 4, 5, 6],
      carga_horaria_semanal: 44,
      observacoes: '',
    });
    setFuncionarioTab('dados');
  };

  const handleFotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    setError('');
    try {
      const res = await uploadService.uploadImagem(file);
      setFuncionarioForm((f) => ({ ...f, foto_url: res.data.url }));
    } catch (err: any) {
      setError('Falha no upload da foto: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setUploadingFoto(false);
      e.target.value = '';
    }
  };

  const openFuncionarioModal = async (funcionario?: Funcionario) => {
    try {
      const data = await authService.listarUsuarios();
      setUsuariosDisponiveis(data.data.filter((u: Usuario) => ['bartender', 'garcom', 'caixa', 'estoquista'].includes(u.role)));
    } catch {
      setUsuariosDisponiveis([]);
    }
    if (funcionario) {
      setEditingFuncionario(funcionario);
      setFuncionarioForm({
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        rg: funcionario.rg || '',
        data_nascimento: funcionario.data_nascimento ? funcionario.data_nascimento.split('T')[0] : '',
        telefone: funcionario.telefone || '',
        email: funcionario.email || '',
        endereco: funcionario.endereco || '',
        foto_url: funcionario.foto_url || '',
        cargo: funcionario.cargo,
        data_admissao: funcionario.data_admissao ? funcionario.data_admissao.split('T')[0] : '',
        salario_hora: funcionario.salario_hora || 0,
        tipo_contrato: funcionario.tipo_contrato || 'CLT',
        turno: funcionario.turno || 'noite',
        dias_semana: funcionario.dias_semana || [2, 3, 4, 5, 6],
        carga_horaria_semanal: funcionario.carga_horaria_semanal || 44,
        observacoes: funcionario.observacoes || '',
      });
    } else {
      setEditingFuncionario(null);
      resetFuncionarioForm();
    }
    setShowFuncionarioModal(true);
  };

  const handleFuncionarioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionarioForm.nome.trim()) { setError('Informe o nome do funcionário.'); return; }
    try {
      setLoading(true);
      const payload = { ...funcionarioForm };
      const nullableFields = ['rg', 'data_nascimento', 'telefone', 'email', 'endereco', 'foto_url', 'observacoes'] as const;
      for (const k of nullableFields) {
        if (payload[k] === '') (payload as Record<string, unknown>)[k] = null;
      }
      if (editingFuncionario) {
        await funcionariosService.atualizar(editingFuncionario.id, payload);
      } else {
        await funcionariosService.criar(payload);
      }
      setShowFuncionarioModal(false);
      setEditingFuncionario(null);
      resetFuncionarioForm();
      loadFuncionarios();
    } catch (err: any) {
      setError('Erro ao salvar funcionário: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleVincularUsuario = async () => {
    if (!vincularUsuarioModal || !vincularUsuarioId) return;
    try {
      await funcionariosService.vincularUsuario(vincularUsuarioModal.id, { usuario_id: vincularUsuarioId });
      loadFuncionarios();
      setVincularUsuarioModal(null);
      setVincularUsuarioId(null);
    } catch (err: any) {
      setError('Erro ao vincular usuário: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDesligarFuncionario = async (id: number) => {
    confirm('Tem certeza que deseja desligar este funcionário?', async () => {
      try {
        await funcionariosService.desligar(id);
        loadFuncionarios();
      } catch (err: any) {
        setError('Erro ao desligar funcionário: ' + (err.response?.data?.detail || err.message));
      }
    });
  };

  const handleReativarFuncionario = async (id: number) => {
    try {
      await funcionariosService.atualizar(id, { ativo: 1 });
      loadFuncionarios();
    } catch (err: any) {
      setError('Erro ao reativar funcionário: ' + (err.response?.data?.detail || err.message));
    }
  };

  const openVincularModal = async (funcionario: Funcionario) => {
    setVincularUsuarioModal(funcionario);
    setVincularUsuarioId(null);
    try {
      const data = await authService.listarUsuarios();
      setUsuariosDisponiveis(data.data.filter((u: Usuario) => ['bartender', 'garcom', 'caixa', 'estoquista'].includes(u.role)));
    } catch (err: any) {
      setError('Erro ao carregar usuários: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDesvincularFuncionario = async (id: number) => {
    confirm('Tem certeza que deseja desvincular o usuário deste funcionário?', async () => {
      try {
        await funcionariosService.desvincularUsuario(id);
        loadFuncionarios();
      } catch (err: any) {
        setError('Erro ao desvincular usuário: ' + (err.response?.data?.detail || err.message));
      }
    });
  };

  const loadMesas = async () => {
    try {
      setMesasLoading(true);
      const data = await mesasService.listar();
      setMesas(data.data || []);
    } catch (err: any) {
      setError('Erro ao carregar mesas: ' + (err.response?.data?.detail || err.message));
    } finally {
      setMesasLoading(false);
    }
  };

  const resetMesaForm = () => {
    setMesaForm({ nome: '', local: '' });
  };

  const openMesaModal = (mesa?: Mesa) => {
    if (mesa) {
      setEditingMesa(mesa);
      setMesaForm({ nome: mesa.nome, local: mesa.local || '' });
    } else {
      setEditingMesa(null);
      resetMesaForm();
    }
    setShowMesaModal(true);
  };

  const handleMesaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mesaForm.nome.trim()) { setError('Informe o nome da mesa.'); return; }
    try {
      setLoading(true);
      if (editingMesa) {
        await mesasService.atualizar(editingMesa.id, mesaForm);
      } else {
        await mesasService.criar(mesaForm);
      }
      setShowMesaModal(false);
      setEditingMesa(null);
      resetMesaForm();
      loadMesas();
    } catch (err: any) {
      setError('Erro ao salvar mesa: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDesativarMesa = async (id: number) => {
    confirm('Tem certeza que deseja desativar esta mesa?', async () => {
      try {
        await mesasService.desativar(id);
        loadMesas();
      } catch (err: any) {
        setError('Erro ao desativar mesa: ' + (err.response?.data?.detail || err.message));
      }
    });
  };

  const handleReativarMesa = async (id: number) => {
    try {
      await mesasService.atualizar(id, { ativo: 1 });
      loadMesas();
    } catch (err: any) {
      setError('Erro ao reativar mesa: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleFichaSelect = (ficha: any) => {
    setSelectedFicha(ficha);
    setFichaForm({
      dificuldade: ficha.dificuldade || '',
      teor_alcoolico: ficha.teor_alcoolico || '',
      modo_preparo: ficha.modo_preparo || '',
      tipo_copo: ficha.tipo_copo || '',
      guarnicao: ficha.guarnicao || '',
      tempo_preparo: ficha.tempo_preparo || '',
    });
    setShowFichaModal(true);
  };

  const handleFichaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFicha) return;
    try {
      setLoading(true);
      await fichasTecnicasService.atualizar(selectedFicha.id, {
        dificuldade: fichaForm.dificuldade || undefined,
        teor_alcoolico: fichaForm.teor_alcoolico ? parseFloat(fichaForm.teor_alcoolico) : undefined,
        modo_preparo: fichaForm.modo_preparo || undefined,
        tipo_copo: fichaForm.tipo_copo || undefined,
        guarnicao: fichaForm.guarnicao || undefined,
        tempo_preparo: fichaForm.tempo_preparo ? parseInt(fichaForm.tempo_preparo) : undefined,
      });
      setShowFichaModal(false);
      loadFichas();
    } catch (err: any) {
      setError('Erro ao atualizar ficha técnica: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getDificuldadeColor = (dificuldade?: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (dificuldade?.toLowerCase()) {
      case 'fácil': return 'success';
      case 'médio': return 'warning';
      case 'difícil': return 'error';
      default: return 'neutral';
    }
  };

  if (!usuario || !isAdminOrGerente) return null;

  const totalRequests = metrics?.endpoints
    ? Object.values(metrics.endpoints as Record<string, any>).reduce((s: number, e: any) => s + e.total, 0)
    : 0;

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'monitoramento', label: 'Monitoramento', icon: <Activity size={16} /> },
    { id: 'lotes', label: 'Gestão de Lotes', icon: <Box size={16} /> },
    { id: 'fichas', label: 'Fichas Técnicas', icon: <FileText size={16} /> },
    { id: 'imagens', label: 'Imagens', icon: <Images size={16} /> },
    { id: 'funcionarios', label: 'Funcionários', icon: <Users size={16} /> },
    { id: 'mesas', label: 'Mesas', icon: <Grid3x3 size={16} /> },
    { id: 'impressoras', label: 'Impressoras', icon: <Printer size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="text-headline-lg font-bold text-[var(--color-on-surface)]">Configurações</h1>
          <p className="text-label-md text-[var(--color-on-surface-variant)] mt-0.5">
            Administração do sistema — {usuario.nome} ({usuario.role})
          </p>
        </div>
        {activeTab === 'monitoramento' && (
          <Button variant="ghost" className="h-[44px]" onClick={loadMonitoramento}>
            <RefreshCw size={16} /> Atualizar
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-lg px-md py-sm rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-[var(--color-error)] text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[var(--color-error)] hover:opacity-70 cursor-pointer shrink-0" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-lg overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-md h-[36px] rounded-lg text-label-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
                : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
            }`}
            role="tab"
            aria-selected={activeTab === t.id}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Monitoramento */}
      {activeTab === 'monitoramento' && (
        <div className="flex flex-col gap-lg">
          {/* Health Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
            <StatsCard
              title="Sistema"
              value={health?.status || '---'}
              variant={health?.status === 'ok' ? 'success' : 'error'}
              icon={<Activity size={20} />}
            />
            <StatsCard
              title="Banco"
              value={health?.banco?.status || '---'}
              variant={health?.banco?.status === 'conectado' ? 'success' : 'error'}
              icon={<Box size={20} />}
            />
            <StatsCard
              title="Requests"
              value={totalRequests || '---'}
              variant="info"
              icon={<RefreshCw size={20} />}
            />
            <StatsCard
              title="Telemetria"
              value={telemetry.getStats() ? `${telemetry.getStats()!.total} req` : '---'}
              variant="primary"
              icon={<Activity size={20} />}
            />
          </div>

          {/* Metrics per endpoint */}
          {metrics?.endpoints && Object.keys(metrics.endpoints).length > 0 && (
            <div>
              <h2 className="text-body-md font-semibold text-[var(--color-on-surface)] mb-sm">Métricas por Endpoint</h2>
              <DataTable
                columns={[
                  { key: 'endpoint', header: 'Endpoint', render: (e) => <code className="text-xs font-mono">{e.endpoint}</code> },
                  { key: 'total', header: 'Total' },
                  {
                    key: 'erros',
                    header: 'Erros',
                    render: (e) => <Badge variant={e.erros > 0 ? 'error' : 'success'}>{e.erros}</Badge>,
                  },
                  {
                    key: 'taxa_erro_pct',
                    header: 'Taxa Erro',
                    render: (e) => (
                      <Badge variant={e.taxa_erro_pct > 5 ? 'error' : e.taxa_erro_pct > 0 ? 'warning' : 'success'}>
                        {e.taxa_erro_pct}%
                      </Badge>
                    ),
                  },
                  { key: 'duracao_media_ms', header: 'Tempo Médio', render: (e) => `${e.duracao_media_ms}ms` },
                  { key: 'duracao_total_s', header: 'Tempo Total', render: (e) => `${e.duracao_total_s}s` },
                ]}
                data={Object.entries(metrics.endpoints as Record<string, any>).map(([endpoint, data]) => ({ endpoint, ...data }))}
                emptyMessage="Nenhuma métrica registrada"
              />
            </div>
          )}

          {/* Lotes Vencendo + Produtos Ativos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            <div className="rounded-xl ghost-border bg-[var(--color-surface-container)]">
              <div className="flex items-center justify-between px-lg py-md border-b border-[rgba(var(--overlay-rgb),0.06)]">
                <h2 className="text-body-md font-semibold text-[var(--color-on-surface)]">Lotes Vencendo (30 dias)</h2>
                <Badge variant="warning">{lotesVencendo.length}</Badge>
              </div>
              <div className="p-lg">
                {loading ? (
                  <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">Carregando...</div>
                ) : lotesVencendo.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-[var(--color-outline)] text-sm gap-2">
                    <Box size={32} className="opacity-30" />
                    <span>Nenhum lote vencendo nos próximos 30 dias</span>
                  </div>
                ) : (
                  <div className="space-y-sm">
                    {lotesVencendo.map((lote) => {
                      const dias = lote.data_validade
                        ? Math.ceil((new Date(lote.data_validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        : 0;
                      return (
                        <div key={lote.id} className="flex items-center gap-md px-md py-sm rounded-lg bg-[var(--color-surface-container-low)]">
                          <ProductThumbnail foto_url={lote.produto?.nome ? undefined : undefined} imagem={undefined} size="sm" alt={lote.produto?.nome || 'Lote'} />
                          <div className="flex-1 min-w-0">
                            <div className="text-body-md text-[var(--color-on-surface)] truncate">{lote.produto?.nome || 'N/A'}</div>
                            <div className="text-[10px] text-[var(--color-on-surface-variant)] font-mono uppercase">{lote.codigo_lote}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px] text-[var(--color-on-surface-variant)] font-mono">{formatDate(lote.data_validade)}</div>
                            <Badge variant={dias <= 7 ? 'error' : dias <= 15 ? 'warning' : 'neutral'}>{dias} dias</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl ghost-border bg-[var(--color-surface-container)]">
              <div className="flex items-center justify-between px-lg py-md border-b border-[rgba(var(--overlay-rgb),0.06)]">
                <h2 className="text-body-md font-semibold text-[var(--color-on-surface)]">Produtos Ativos</h2>
                <Badge variant="primary">{produtos.length}</Badge>
              </div>
              <div className="p-lg">
                {loading ? (
                  <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">Carregando...</div>
                ) : (
                  <DataTable
                    columns={[
                      {
                        key: 'nome',
                        header: 'Produto',
                        render: (p) => (
                          <div className="flex items-center gap-3">
                            <ProductThumbnail foto_url={p.foto_url} imagem={p.imagem} size="sm" alt={p.nome} />
                            <div className="min-w-0">
                              <div className="text-body-md text-[var(--color-on-surface)] truncate">{p.nome}</div>
                              <div className="text-[10px] text-[var(--color-on-surface-variant)] font-mono uppercase">{p.categoria || '-'}</div>
                            </div>
                          </div>
                        ),
                      },
                      { key: 'preco_venda', header: 'Preço', render: (p) => <span className="font-mono">R$ {p.preco_venda.toFixed(2)}</span> },
                    ]}
                    data={produtos}
                    emptyMessage="Nenhum produto ativo"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Gestão de Lotes */}
      {activeTab === 'lotes' && (
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-lg py-md border-b border-[rgba(var(--overlay-rgb),0.06)]">
            <h2 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Lotes de Produtos</h2>
            <Button size="sm" onClick={() => openLoteModal()} disabled={!isAdminOrGerente}>
              <Plus size={16} /> Novo Lote
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">Carregando...</div>
          ) : (
            <DataTable
                columns={[
                  {
                    key: 'produto',
                    header: 'Produto',
                    render: (lote) => {
                      const prod = produtos.find((p) => p.id === lote.produto_id);
                      return (
                        <div className="flex items-center gap-3">
                          <ProductThumbnail foto_url={prod?.foto_url} imagem={prod?.imagem} size="sm" alt={lote.produto?.nome} />
                          <span>{lote.produto?.nome || 'N/A'}</span>
                        </div>
                      );
                    },
                  },
                  { key: 'codigo_lote', header: 'Código do Lote', render: (lote) => <code className="text-xs font-mono">{lote.codigo_lote}</code> },
                  { key: 'data_fabricacao', header: 'Fabricação', render: (lote) => formatDate(lote.data_fabricacao) },
                  { key: 'data_validade', header: 'Validade', render: (lote) => formatDate(lote.data_validade) },
                  { key: 'quantidade', header: 'Quantidade' },
                  {
                    key: 'acoes',
                    header: 'Ações',
                    className: 'text-right',
                    render: (lote) => (
                      <div className="flex justify-end gap-sm">
                        <button
                          onClick={() => openLoteModal(lote)}
                          disabled={!isAdminOrGerente}
                          className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-primary)] transition-colors cursor-pointer disabled:opacity-40"
                          title={`Editar lote ${lote.codigo_lote}`}
                          aria-label={`Editar lote ${lote.codigo_lote}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteLote(lote.id)}
                          disabled={!isAdminOrGerente}
                          className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-error)] transition-colors cursor-pointer disabled:opacity-40"
                          title={`Excluir lote ${lote.codigo_lote}`}
                          aria-label={`Excluir lote ${lote.codigo_lote}`}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={lotes}
                emptyMessage="Nenhum lote cadastrado"
              />
          )}
        </Card>
      )}

      {/* Tab: Fichas Técnicas */}
      {activeTab === 'fichas' && (
        <Card className="p-0 overflow-hidden">
          <div className="px-lg py-md border-b border-[rgba(var(--overlay-rgb),0.06)]">
            <h2 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Fichas Técnicas dos Produtos</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">Carregando...</div>
          ) : (
            <DataTable
                columns={[
                  {
                    key: 'nome',
                    header: 'Produto',
                    render: (ficha) => (
                      <div className="flex items-center gap-3">
                        <ProductThumbnail foto_url={ficha.foto_url} imagem={ficha.imagem} size="sm" alt={ficha.nome} />
                        <span className="font-medium">{ficha.nome}</span>
                      </div>
                    ),
                  },
                  { key: 'categoria', header: 'Categoria', render: (ficha) => ficha.categoria || '-' },
                  { key: 'dificuldade', header: 'Dificuldade', render: (ficha) => ficha.dificuldade ? <Badge variant={getDificuldadeColor(ficha.dificuldade)}>{ficha.dificuldade}</Badge> : '-' },
                  { key: 'teor_alcoolico', header: 'Teor Alcoólico', render: (ficha) => ficha.teor_alcoolico ? `${ficha.teor_alcoolico}%` : '-' },
                  { key: 'tempo_preparo', header: 'Tempo (min)', render: (ficha) => ficha.tempo_preparo ? `${ficha.tempo_preparo} min` : '-' },
                  { key: 'tipo_copo', header: 'Copo', render: (ficha) => ficha.tipo_copo || '-' },
                  {
                    key: 'acoes',
                    header: 'Ações',
                    className: 'text-right',
                    render: (ficha) => (
                      <div className="flex justify-end">
                        <Button size="sm" variant="ghost" onClick={() => handleFichaSelect(ficha)}>
                          <Pencil size={13} /> Editar
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={fichas}
                emptyMessage="Nenhuma ficha técnica cadastrada"
              />
            )}
        </Card>
      )}

      {/* Tab: Imagens */}
      {activeTab === 'imagens' && (
        <div>
          <div className="flex items-center justify-between mb-lg">
            <h2 className="text-body-md font-semibold text-[var(--color-on-surface)]">Imagens ({images.length})</h2>
            <div className="flex items-center gap-sm">
              <div className="flex gap-1">
                {([['all', 'Todas'], ['unassigned', 'Não vinculadas'], ['assigned', 'Vinculadas']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setImageFilter(val)}
                    className={`px-md h-[36px] rounded-lg text-label-sm transition-all cursor-pointer ${
                      imageFilter === val
                        ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)]'
                        : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={loadImages} disabled={imagesLoading}>
                <RefreshCw size={16} /> Atualizar
              </Button>
            </div>
          </div>

          {imagesLoading ? (
            <div className="text-center py-12 text-[var(--color-outline)] text-sm">Carregando imagens...</div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--color-outline)] text-sm gap-2 rounded-xl ghost-border bg-[var(--color-surface-container)]">
              <Images size={32} className="opacity-30" />
              <span>Nenhuma imagem encontrada. Faça upload pelo endpoint <code className="font-mono">POST /api/v1/upload/imagem</code>.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-md">
              {images
                .filter((img: any) => {
                  if (imageFilter === 'assigned') return img.assigned_to;
                  if (imageFilter === 'unassigned') return !img.assigned_to;
                  return true;
                })
                .map((img: any) => (
                  <div key={img.filename} className="rounded-xl ghost-border bg-[var(--color-surface-container)] overflow-hidden">
                    <div className="relative">
                      <div className="absolute top-2 right-2 z-10">
                        {img.assigned_to ? (
                          <Badge variant="success">
                            <CheckCircle size={12} /> {img.assigned_to.nome}
                          </Badge>
                        ) : (
                          <Badge variant="warning">Sem produto</Badge>
                        )}
                      </div>
                      <div className="h-[140px] bg-[var(--color-surface-lowest)] flex items-center justify-center">
                        <img src={img.url} alt={img.filename} className="max-h-full max-w-full object-contain" loading="lazy" />
                      </div>
                    </div>
                    <div className="p-2 text-center border-b border-[rgba(var(--overlay-rgb),0.06)]">
                      <div className="text-[10px] text-[var(--color-on-surface-variant)] truncate font-mono">{img.filename}</div>
                      <div className="text-[10px] text-[var(--color-outline)]">{img.size_kb} KB</div>
                    </div>
                    {!img.assigned_to && (
                      <div className="p-2 flex gap-1">
                        <select
                          className="flex-1 min-w-0 h-12 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] outline-none px-sm"
                          value={selectedProdutos[img.filename] || ''}
                          onChange={(e) => setSelectedProdutos((prev) => ({ ...prev, [img.filename]: parseInt(e.target.value) || 0 }))}
                        >
                          <option value="">Vincular a...</option>
                          {produtos.map((p) => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                          ))}
                        </select>
                        <button
                          className="h-12 w-[44px] shrink-0 flex items-center justify-center rounded-lg bg-[var(--color-primary-container)] text-[var(--color-on-primary)] hover:brightness-110 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={async () => {
                            const pid = selectedProdutos[img.filename];
                            if (!pid) return;
                            setAssigningFilename(img.filename);
                            try {
                              await adminService.assignProductImage(pid, img.filename);
                              await loadImages();
                              setSelectedProdutos((prev) => { const next = { ...prev }; delete next[img.filename]; return next; });
                            } catch (err: any) {
                              setError('Erro ao vincular: ' + (err.response?.data?.detail || err.message));
                            } finally {
                              setAssigningFilename(null);
                            }
                          }}
                          disabled={!selectedProdutos[img.filename] || assigningFilename === img.filename}
                          aria-label={`Vincular ${img.filename}`}
                        >
                          <Link size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Funcionários */}
      {activeTab === 'funcionarios' && (
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-lg py-md border-b border-[rgba(var(--overlay-rgb),0.06)]">
            <h2 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Funcionários</h2>
            <Button size="sm" onClick={() => openFuncionarioModal()} disabled={!isAdminOrGerente}>
              <Plus size={16} /> Novo Funcionário
            </Button>
          </div>

          {/* Filters */}
          <div className="px-lg py-md border-b border-[rgba(var(--overlay-rgb),0.06)] flex flex-wrap gap-md">
            <div className="relative flex-1 max-w-sm">
              <Search size={18} className="absolute left-sm top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
              <input
                type="text"
                placeholder="Buscar por nome ou CPF..."
                value={funcBusca}
                onChange={(e) => setFuncBusca(e.target.value)}
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg pl-xl pr-md py-xs text-body-md focus:border-[var(--color-primary)]/50 outline-none text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 transition-colors"
              />
            </div>
            <select
              className="h-12 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] outline-none px-md"
              value={funcFiltroCargo}
              onChange={(e) => setFuncFiltroCargo(e.target.value)}
            >
              <option value="">Todos os cargos</option>
              {Object.entries(CARGO_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              className="h-12 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] outline-none px-md"
              value={funcFiltroAtivo}
              onChange={(e) => setFuncFiltroAtivo(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="1">Ativos</option>
              <option value="0">Inativos</option>
            </select>
          </div>

          {funcionariosLoading ? (
            <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">Carregando...</div>
          ) : (
            <DataTable
                columns={[
                  {
                    key: 'foto',
                    header: 'Foto',
                    render: (f) => (
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.08)] shrink-0">
                        {f.foto_url ? (
                          <img src={f.foto_url} alt={f.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--color-outline)]/50">
                            <Users size={16} />
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'ativo',
                    header: 'Status',
                    render: (f) => (
                      <Badge variant={f.ativo ? 'success' : 'neutral'}>{f.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    ),
                  },
                  { key: 'nome', header: 'Nome', render: (f) => <span className="font-medium">{f.nome}</span> },
                  { key: 'cpf', header: 'CPF', render: (f) => <code className="text-xs font-mono">{f.cpf}</code> },
                  { key: 'cargo', header: 'Cargo', render: (f) => CARGO_LABELS[f.cargo] || f.cargo },
                  { key: 'turno', header: 'Turno', render: (f) => TURNO_LABELS[f.turno || ''] || f.turno || '-' },
                  { key: 'data_admissao', header: 'Admissão', render: (f) => formatDate(f.data_admissao) },
                  {
                    key: 'usuario_id',
                    header: 'Vínculo',
                    render: (f) => (f.usuario_id ? <Badge variant="info">Vinculado</Badge> : <Badge variant="warning">Sem usuário</Badge>),
                  },
                  {
                    key: 'acoes',
                    header: 'Ações',
                    className: 'text-right',
                    render: (f) => (
                      <div className="flex justify-end gap-sm">
                        <button
                          onClick={() => openFuncionarioModal(f)}
                          disabled={!isAdminOrGerente}
                          className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-primary)] transition-colors cursor-pointer disabled:opacity-40"
                          title={`Editar ${f.nome}`}
                          aria-label={`Editar ${f.nome}`}
                        >
                          <Pencil size={16} />
                        </button>
                        {f.ativo ? (
                          <button
                            onClick={() => handleDesligarFuncionario(f.id)}
                            disabled={!isAdminOrGerente}
                            className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-error)] transition-colors cursor-pointer disabled:opacity-40"
                            title={`Desligar ${f.nome}`}
                            aria-label={`Desligar ${f.nome}`}
                          >
                            <XCircle size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReativarFuncionario(f.id)}
                            disabled={!isAdminOrGerente}
                            className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-primary)] transition-colors cursor-pointer disabled:opacity-40"
                            title={`Reativar ${f.nome}`}
                            aria-label={`Reativar ${f.nome}`}
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {f.usuario_id ? (
                          <button
                            onClick={() => handleDesvincularFuncionario(f.id)}
                            disabled={!isAdminOrGerente}
                            className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-error)] transition-colors cursor-pointer disabled:opacity-40"
                            title={`Desvincular usuário de ${f.nome}`}
                            aria-label={`Desvincular usuário de ${f.nome}`}
                          >
                            <Link size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => openVincularModal(f)}
                            disabled={!isAdminOrGerente}
                            className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-primary)] transition-colors cursor-pointer disabled:opacity-40"
                            title={`Vincular usuário a ${f.nome}`}
                            aria-label={`Vincular usuário a ${f.nome}`}
                          >
                            <UserPlus size={16} />
                          </button>
                        )}
                      </div>
                    ),
                  },
                ]}
                data={funcionarios.filter((f) =>
                  (!funcFiltroCargo || f.cargo === funcFiltroCargo) &&
                  (funcFiltroAtivo === '' || String(f.ativo) === funcFiltroAtivo) &&
                  (!funcBusca || f.nome.toLowerCase().includes(funcBusca.toLowerCase()) || f.cpf.replace(/\D/g, '').includes(funcBusca.replace(/\D/g, '')))
                )}
                emptyMessage="Nenhum funcionário encontrado"
              />
          )}
        </Card>
      )}

      {/* Tab: Mesas */}
      {activeTab === 'mesas' && (
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-lg py-md border-b border-[rgba(var(--overlay-rgb),0.06)]">
            <h2 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Mesas</h2>
            <Button size="sm" onClick={() => openMesaModal()} disabled={!isAdminOrGerente}>
              <Plus size={16} /> Nova Mesa
            </Button>
          </div>
          {mesasLoading ? (
            <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">Carregando...</div>
          ) : (
            <DataTable
                columns={[
                  { key: 'nome', header: 'Mesa', render: (m) => <span className="font-semibold font-mono">{m.nome}</span> },
                  { key: 'local', header: 'Local', render: (m) => m.local || '-' },
                  { key: 'ativo', header: 'Status', render: (m) => <Badge variant={m.ativo ? 'success' : 'neutral'}>{m.ativo ? 'Ativa' : 'Inativa'}</Badge> },
                  {
                    key: 'acoes',
                    header: 'Ações',
                    className: 'text-right',
                    render: (m) => (
                      <div className="flex justify-end gap-sm">
                        <button
                          onClick={() => openMesaModal(m)}
                          disabled={!isAdminOrGerente}
                          className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-primary)] transition-colors cursor-pointer disabled:opacity-40"
                          title={`Editar mesa ${m.nome}`}
                          aria-label={`Editar mesa ${m.nome}`}
                        >
                          <Pencil size={16} />
                        </button>
                        {m.ativo ? (
                          <button
                            onClick={() => handleDesativarMesa(m.id)}
                            disabled={!isAdminOrGerente}
                            className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-error)] transition-colors cursor-pointer disabled:opacity-40"
                            title={`Desativar mesa ${m.nome}`}
                            aria-label={`Desativar mesa ${m.nome}`}
                          >
                            <XCircle size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReativarMesa(m.id)}
                            disabled={!isAdminOrGerente}
                            className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-primary)] transition-colors cursor-pointer disabled:opacity-40"
                            title={`Reativar mesa ${m.nome}`}
                            aria-label={`Reativar mesa ${m.nome}`}
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </div>
                    ),
                  },
                ]}
                data={mesas}
                emptyMessage="Nenhuma mesa cadastrada"
              />
          )}
        </Card>
      )}

      {/* Tab: Impressoras (TC-042) + Fila de Impressão (TC-040) */}
      {activeTab === 'impressoras' && (
        <div className="flex flex-col gap-lg">
          {printerLoading ? (
            <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">Carregando...</div>
          ) : (
            <>
              {/* Selector de setor + lista de configs */}
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-md px-lg py-md border-b border-[rgba(var(--overlay-rgb),0.06)]">
                  <div>
                    <h2 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Impressoras por Setor</h2>
                    {printerConfigs.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {printerConfigs.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { setPrinterSetor(c.setor); carregarConfigSetor(c.setor); }}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                              printerSetor === c.setor
                                ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
                                : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
                            }`}
                          >
                            {c.setor}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-sm">
                    <select
                      value={printerSetor}
                      onChange={(e) => { setPrinterSetor(e.target.value); carregarConfigSetor(e.target.value); }}
                      className="h-12 bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] rounded-lg px-md text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
                      aria-label="Setor da impressora"
                    >
                      {['CAIXA', 'COZINHA', 'BAR'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="p-lg grid gap-md md:grid-cols-2">
                  <div className="space-y-md">
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Tipo</label>
                      <select
                        value={printerForm.tipo}
                        onChange={(e) => setPrinterForm({ ...printerForm, tipo: e.target.value as PrinterType })}
                        className="w-full h-12 bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] rounded-lg px-md text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
                      >
                        <option value="network">Rede (Network)</option>
                        <option value="usb">USB</option>
                        <option value="serial">Serial</option>
                      </select>
                    </div>
                    <Input
                      label="Host / IP"
                      value={printerForm.host || ''}
                      onChange={(e) => setPrinterForm({ ...printerForm, host: e.target.value })}
                      placeholder="Ex: 192.168.0.100"
                      disabled={printerForm.tipo === 'usb'}
                    />
                    <div className="grid grid-cols-3 gap-md">
                      <Input label="Porta" type="number" value={printerForm.porta ?? 9100}
                        onChange={(e) => setPrinterForm({ ...printerForm, porta: Number(e.target.value) })} />
                      <Input label="Baud" type="number" value={printerForm.baud_rate ?? 9600}
                        onChange={(e) => setPrinterForm({ ...printerForm, baud_rate: Number(e.target.value) })} disabled={printerForm.tipo !== 'serial'} />
                      <Input label="Timeout (s)" type="number" value={printerForm.timeout ?? 5}
                        onChange={(e) => setPrinterForm({ ...printerForm, timeout: Number(e.target.value) })} />
                    </div>
                    <label className="flex items-center gap-2 text-label-md text-[var(--color-on-surface-variant)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printerForm.ativo}
                        onChange={(e) => setPrinterForm({ ...printerForm, ativo: e.target.checked })}
                        className="accent-[var(--color-primary)]"
                      />
                      Impressora ativa
                    </label>
                  </div>

                  {/* Status físico */}
                  <div className="space-y-md">
                    <div className="flex items-center justify-between">
                      <span className="text-label-md text-[var(--color-on-surface-variant)] uppercase">Status físico</span>
                      <Button size="sm" variant="ghost" onClick={checarStatus} disabled={printerStatusLoading}>
                        <RefreshCw size={14} /> {printerStatusLoading ? 'Checando...' : 'Checar'}
                      </Button>
                    </div>
                    {printerStatus ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Wifi size={16} className={printerStatus.online ? 'text-green-500' : 'text-red-500'} />
                          <span className="font-semibold">{printerStatus.online ? 'Online' : 'Offline'}</span>
                          {printerStatus.papel_baixo && (
                            <Badge variant="warning"><AlertTriangle size={12} /> Pouco papel</Badge>
                          )}
                        </div>
                        {printerStatus.tampa_aberta && <Badge variant="error">Tampa aberta</Badge>}
                        {printerStatus.papel_esgotado && <Badge variant="error">Papel esgotado</Badge>}
                        {printerStatus.erro_mecanico && <Badge variant="error">Guilhotina travada</Badge>}
                        <p className="text-label-sm text-[var(--color-on-surface-variant)]">{printerStatus.mensagem}</p>
                      </div>
                    ) : (
                      <div className="text-label-md text-[var(--color-outline)] py-6 text-center border border-dashed border-[rgba(var(--overlay-rgb),0.08)] rounded-lg">
                        Cheque o status físico da impressora (DLE EOT)
                      </div>
                    )}
                    {printerTestMsg && (
                      <p className="text-label-sm text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-high)] px-md py-sm rounded-lg">{printerTestMsg}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-md px-lg py-md border-t border-[rgba(var(--overlay-rgb),0.06)]">
                  <Button variant="ghost" onClick={testarPrinter}>
                    <Send size={16} /> Testar Impressora
                  </Button>
                  <Button onClick={salvarPrinter} disabled={printerSaving}>
                    <CheckCircle size={16} /> {printerSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </Card>

              {/* Fila de impressão (contingência + reenviar) */}
              <Card className="p-0 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-md px-lg py-md border-b border-[rgba(var(--overlay-rgb),0.06)]">
                  <h2 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Fila de Impressão</h2>
                  <div className="flex items-center gap-sm">
                    <select
                      value={filaStatus}
                      onChange={(e) => { setFilaStatus(e.target.value); carregarFila(e.target.value); }}
                      className="h-12 bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] rounded-lg px-md text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
                      aria-label="Status da fila"
                    >
                      {['PENDENTE', 'ERRO', 'CONCLUIDO', 'TODOS'].map((s) => (
                        <option key={s} value={s}>{s === 'TODOS' ? 'Todos' : s}</option>
                      ))}
                    </select>
                    <Button size="sm" variant="ghost" onClick={() => carregarFila(filaStatus)}>
                      <RefreshCw size={14} /> Atualizar
                    </Button>
                  </div>
                </div>
                {filaLoading ? (
                  <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">Carregando...</div>
                ) : (
                  <DataTable
                    columns={[
                      { key: 'id', header: '#', render: (f) => <span className="font-mono">#{f.id}</span> },
                      { key: 'tipo', header: 'Tipo', render: (f) => <Badge variant="primary">{f.tipo}</Badge> },
                      { key: 'status', header: 'Status', render: (f) => (
                        <Badge variant={f.status === 'ERRO' ? 'error' : f.status === 'CONCLUIDO' ? 'success' : 'warning'}>{f.status}</Badge>
                      ) },
                      { key: 'impressora_destino', header: 'Setor', render: (f) => f.impressora_destino || '-' },
                      { key: 'tentativas', header: 'Tent.' },
                      { key: 'erro_msg', header: 'Erro', render: (f) => f.erro_msg ? <span className="text-[var(--color-error)] text-xs">{f.erro_msg}</span> : '-' },
                      {
                        key: 'acoes',
                        header: 'Ações',
                        className: 'text-right',
                        render: (f) => (
                          <div className="flex justify-end gap-sm">
                            <button
                              onClick={() => reenviarFila(f.id)}
                              disabled={f.status === 'CONCLUIDO' || !isAdminOrGerente}
                              className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-primary)] transition-colors cursor-pointer disabled:opacity-40"
                              title={`Reenviar trabalho #${f.id}`}
                              aria-label={`Reenviar trabalho #${f.id}`}
                            >
                              <Send size={16} />
                            </button>
                          </div>
                        ),
                      },
                    ]}
                    data={filaImpressao}
                    emptyMessage="Nenhum trabalho na fila"
                  />
                )}
              </Card>
            </>
          )}
        </div>
      )}

      {/* Modal: Novo/Editar Lote */}
      <Modal open={showLoteModal} onClose={() => setShowLoteModal(false)} title={editingLote ? 'Editar Lote' : 'Novo Lote de Produto'} size="md">
        <form onSubmit={handleLoteSubmit} className="space-y-md">
          <div>
            <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Produto *</label>
            <select
              className="w-full h-12 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] outline-none px-md focus:border-[var(--color-primary-container)]"
              value={loteForm.produto_id}
              onChange={(e) => setLoteForm({ ...loteForm, produto_id: parseInt(e.target.value) })}
              required
            >
              <option value="">Selecione...</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          <Input
            label="Código do Lote *"
            value={loteForm.codigo_lote}
            onChange={(e) => setLoteForm({ ...loteForm, codigo_lote: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-md">
            <Input
              label="Data de Fabricação"
              type="date"
              value={loteForm.data_fabricacao || ''}
              onChange={(e) => setLoteForm({ ...loteForm, data_fabricacao: e.target.value })}
            />
            <Input
              label="Data de Validade"
              type="date"
              value={loteForm.data_validade || ''}
              onChange={(e) => setLoteForm({ ...loteForm, data_validade: e.target.value })}
            />
          </div>
          <Input
            label="Quantidade *"
            type="number"
            min="0"
            step="0.01"
            value={loteForm.quantidade}
            onChange={(e) => setLoteForm({ ...loteForm, quantidade: parseFloat(e.target.value) || 0 })}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowLoteModal(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={loading}>{editingLote ? 'Atualizar' : 'Criar'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ficha Técnica */}
      <Modal open={showFichaModal} onClose={() => setShowFichaModal(false)} title={selectedFicha ? `Ficha Técnica — ${selectedFicha.nome}` : 'Ficha Técnica'} size="lg">
        {selectedFicha && (
          <form onSubmit={handleFichaSubmit} className="space-y-md">
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Dificuldade</label>
                <select
                  className="w-full h-12 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] outline-none px-md focus:border-[var(--color-primary-container)]"
                  value={fichaForm.dificuldade}
                  onChange={(e) => setFichaForm({ ...fichaForm, dificuldade: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="Fácil">Fácil</option>
                  <option value="Médio">Médio</option>
                  <option value="Difícil">Difícil</option>
                </select>
              </div>
              <Input
                label="Teor Alcoólico (%)"
                type="number"
                value={fichaForm.teor_alcoolico}
                onChange={(e) => setFichaForm({ ...fichaForm, teor_alcoolico: e.target.value })}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <Input
                label="Tipo de Copo"
                value={fichaForm.tipo_copo}
                onChange={(e) => setFichaForm({ ...fichaForm, tipo_copo: e.target.value })}
              />
              <Input
                label="Tempo de Preparo (min)"
                type="number"
                value={fichaForm.tempo_preparo}
                onChange={(e) => setFichaForm({ ...fichaForm, tempo_preparo: e.target.value })}
                min="0"
              />
            </div>
            <Input
              label="Guarnição"
              value={fichaForm.guarnicao}
              onChange={(e) => setFichaForm({ ...fichaForm, guarnicao: e.target.value })}
            />
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Modo de Preparo</label>
              <textarea
                rows={4}
                className="w-full rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] outline-none px-md py-3 focus:border-[var(--color-primary-container)]"
                value={fichaForm.modo_preparo}
                onChange={(e) => setFichaForm({ ...fichaForm, modo_preparo: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setShowFichaModal(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1" loading={loading}>Salvar</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Novo/Editar Mesa */}
      <Modal open={showMesaModal} onClose={() => setShowMesaModal(false)} title={editingMesa ? 'Editar Mesa' : 'Nova Mesa'} size="sm">
        <form onSubmit={handleMesaSubmit} className="space-y-md">
          <Input
            label="Nome *"
            placeholder="Ex.: M11, B4"
            value={mesaForm.nome}
            onChange={(e) => setMesaForm({ ...mesaForm, nome: e.target.value.toUpperCase() })}
            required
          />
          <Input
            label="Local"
            placeholder="Ex.: Área externa, Balcão"
            value={mesaForm.local || ''}
            onChange={(e) => setMesaForm({ ...mesaForm, local: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowMesaModal(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={loading}>Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Novo/Editar Funcionário */}
      <Modal open={showFuncionarioModal} onClose={() => setShowFuncionarioModal(false)} title={editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'} size="lg">
        <div className="flex items-center gap-1 mb-md border-b border-[rgba(var(--overlay-rgb),0.06)] pb-3">
          {([
            ['dados', 'Dados Pessoais'],
            ['contrato', 'Contrato'],
            ['escala', 'Escala'],
            ['vinculo', 'Vínculo Sistema'],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFuncionarioTab(val)}
              className={`px-md h-[36px] rounded-lg text-label-sm font-medium transition-all cursor-pointer ${
                funcionarioTab === val
                  ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)]'
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <form onSubmit={handleFuncionarioSubmit} className="space-y-md">
          {funcionarioTab === 'dados' && (
            <>
              <div className="flex items-center gap-md mb-md">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[var(--color-surface-container-high)] shrink-0 border border-[rgba(var(--overlay-rgb),0.08)]">
                  {funcionarioForm.foto_url ? (
                    <img src={funcionarioForm.foto_url} alt="Foto do funcionário" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-outline)]/50">
                      <Users size={28} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 px-3 h-9 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-xs font-medium text-[var(--color-on-surface)] hover:border-[var(--color-primary)]/50 transition-colors cursor-pointer">
                    <Upload size={14} className="text-[var(--color-primary)]" />
                    <span>{uploadingFoto ? 'Enviando...' : 'Enviar foto'}</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingFoto} onChange={handleFotoSelect} />
                  </label>
                  {funcionarioForm.foto_url && (
                    <button
                      type="button"
                      onClick={() => setFuncionarioForm((f) => ({ ...f, foto_url: '' }))}
                      className="text-xs text-[var(--color-error)] hover:opacity-70 transition-opacity cursor-pointer text-left"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <Input label="Nome *" value={funcionarioForm.nome} onChange={(e) => setFuncionarioForm({ ...funcionarioForm, nome: e.target.value })} required />
                <Input label="CPF *" placeholder="Somente números" value={funcionarioForm.cpf} onChange={(e) => setFuncionarioForm({ ...funcionarioForm, cpf: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <Input label="RG" value={funcionarioForm.rg || ''} onChange={(e) => setFuncionarioForm({ ...funcionarioForm, rg: e.target.value })} />
                <Input label="Data de Nascimento" type="date" value={funcionarioForm.data_nascimento || ''} onChange={(e) => setFuncionarioForm({ ...funcionarioForm, data_nascimento: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <Input label="Telefone" value={funcionarioForm.telefone || ''} onChange={(e) => setFuncionarioForm({ ...funcionarioForm, telefone: e.target.value })} />
                <Input label="E-mail" type="email" value={funcionarioForm.email || ''} onChange={(e) => setFuncionarioForm({ ...funcionarioForm, email: e.target.value })} />
              </div>
              <Input label="Endereço" value={funcionarioForm.endereco || ''} onChange={(e) => setFuncionarioForm({ ...funcionarioForm, endereco: e.target.value })} />
            </>
          )}

          {funcionarioTab === 'contrato' && (
            <>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Cargo *</label>
                  <select
                    className="w-full h-12 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] outline-none px-md focus:border-[var(--color-primary-container)]"
                    value={funcionarioForm.cargo}
                    onChange={(e) => setFuncionarioForm({ ...funcionarioForm, cargo: e.target.value })}
                  >
                    {Object.entries(CARGO_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Tipo de Contrato *</label>
                  <select
                    className="w-full h-12 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] outline-none px-md focus:border-[var(--color-primary-container)]"
                    value={funcionarioForm.tipo_contrato}
                    onChange={(e) => setFuncionarioForm({ ...funcionarioForm, tipo_contrato: e.target.value })}
                  >
                    <option value="CLT">CLT</option>
                    <option value="PJ">PJ</option>
                    <option value="estagiario">Estagiário</option>
                    <option value="menor_aprendiz">Menor Aprendiz</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <Input label="Data de Admissão *" type="date" value={funcionarioForm.data_admissao} onChange={(e) => setFuncionarioForm({ ...funcionarioForm, data_admissao: e.target.value })} required />
                <Input label="Salário por Hora" type="number" step="0.01" min="0" value={funcionarioForm.salario_hora} onChange={(e) => setFuncionarioForm({ ...funcionarioForm, salario_hora: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Observações</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] outline-none px-md py-3 focus:border-[var(--color-primary-container)]"
                  value={funcionarioForm.observacoes || ''}
                  onChange={(e) => setFuncionarioForm({ ...funcionarioForm, observacoes: e.target.value })}
                />
              </div>
            </>
          )}

          {funcionarioTab === 'escala' && (
            <>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Turno</label>
                  <select
                    className="w-full h-12 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] outline-none px-md focus:border-[var(--color-primary-container)]"
                    value={funcionarioForm.turno || ''}
                    onChange={(e) => setFuncionarioForm({ ...funcionarioForm, turno: e.target.value })}
                  >
                    <option value="manha">Manhã</option>
                    <option value="tarde">Tarde</option>
                    <option value="noite">Noite</option>
                    <option value="misto">Misto</option>
                  </select>
                </div>
                <Input label="Carga Horária Semanal" type="number" min="0" max="80" value={funcionarioForm.carga_horaria_semanal} onChange={(e) => setFuncionarioForm({ ...funcionarioForm, carga_horaria_semanal: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Dias da Semana</label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((d) => (
                    <label key={d.v} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[var(--color-primary)]"
                        checked={(funcionarioForm.dias_semana || []).includes(d.v)}
                        onChange={(e) => {
                          const dias = new Set(funcionarioForm.dias_semana || []);
                          if (e.target.checked) dias.add(d.v); else dias.delete(d.v);
                          setFuncionarioForm({ ...funcionarioForm, dias_semana: [...dias] });
                        }}
                      />
                      <span>{d.l}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {funcionarioTab === 'vinculo' && (
            <div>
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-md">
                Vincule um usuário do sistema com perfil operacional a este funcionário. O vínculo é opcional e único.
              </p>
              <div>
                <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Usuário do Sistema</label>
                <select
                  className="w-full h-12 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] outline-none px-md focus:border-[var(--color-primary-container)]"
                  value={vincularUsuarioId || ''}
                  onChange={(e) => setVincularUsuarioId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Sem vínculo</option>
                  {usuariosDisponiveis.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowFuncionarioModal(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={loading}>Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Vincular Usuário */}
      <Modal open={!!vincularUsuarioModal} onClose={() => setVincularUsuarioModal(null)} title="Vincular Usuário" size="sm">
        <div className="space-y-md">
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Funcionário: <strong className="text-[var(--color-on-surface)]">{vincularUsuarioModal?.nome}</strong>
          </p>
          <div>
            <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Usuário do Sistema</label>
            <select
              className="w-full h-12 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] outline-none px-md focus:border-[var(--color-primary-container)]"
              value={vincularUsuarioId || ''}
              onChange={(e) => setVincularUsuarioId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Selecione um usuário...</option>
              {usuariosDisponiveis.map((u) => (
                <option key={u.id} value={u.id}>{u.nome} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setVincularUsuarioModal(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleVincularUsuario} disabled={!vincularUsuarioId} loading={loading}>
              Vincular
            </Button>
          </div>
        </div>
      </Modal>
      {/* Modal: Confirmação */}
      <Modal open={!!confirmState} onClose={() => setConfirmState(null)} title="Confirmação" size="sm">
        <div className="space-y-md">
          <p className="text-sm text-[var(--color-on-surface)]">{confirmState?.message}</p>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmState(null)}>Cancelar</Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                const fn = confirmState?.onConfirm;
                setConfirmState(null);
                if (fn) fn();
              }}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Admin;
