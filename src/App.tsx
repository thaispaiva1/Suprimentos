import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Navbar 
} from './components/Navbar.tsx';
import { 
  KpiCards 
} from './components/KpiCards.tsx';
import { 
  DashboardCharts 
} from './components/DashboardCharts.tsx';
import { 
  ComprasTable 
} from './components/ComprasTable.tsx';
import { 
  CompraModal 
} from './components/CompraModal.tsx';
import { 
  SupabaseModal 
} from './components/SupabaseModal.tsx';
import { 
  SupabaseQuickConnect 
} from './components/SupabaseQuickConnect.tsx';
import { 
  DetalhesModal 
} from './components/DetalhesModal.tsx';
import { 
  ThemeProvider 
} from './context/ThemeContext.tsx';
import { 
  Compra, 
  ResumoMetricas, 
  determinarStatusEntrega, 
  formatCurrency, 
  formatDateBR 
} from './types/procurement.ts';
import { 
  carregarCompras, 
  salvarNovaCompra, 
  atualizarCompra, 
  deletarCompra, 
  getStoredSupabaseConfig 
} from './services/supabaseService.ts';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Building2, 
  Layers, 
  Download,
  Database
} from 'lucide-react';

export function AppContent() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [isSupabase, setIsSupabase] = useState(false);
  const [tabAtiva, setTabAtiva] = useState<'dashboard' | 'compras' | 'saving' | 'prazos'>('dashboard');

  // Modais
  const [modalCompraAberto, setModalCompraAberto] = useState(false);
  const [compraEmEdicao, setCompraEmEdicao] = useState<Compra | null>(null);
  const [compraDetalhes, setCompraDetalhes] = useState<Compra | null>(null);
  const [modalSupabaseAberto, setModalSupabaseAberto] = useState(false);

  // Notificações / toast feedback
  const [toast, setToast] = useState<{ msg: string; tipo: 'sucesso' | 'info' } | null>(null);

  const exibirToast = (msg: string, tipo: 'sucesso' | 'info' = 'sucesso') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  // Carregar dados na inicialização
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await carregarCompras();
      setCompras(res.compras);
      setIsSupabase(res.isSupabase);
    } catch (e) {
      console.error('Falha ao carregar compras:', e);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Cálculos Consolidados de Indicadores (KPIs)
  const metricas: ResumoMetricas = useMemo(() => {
    let totalGasto = 0;
    let totalOrcado = 0;
    let comprasNoPrazo = 0;
    let comprasEmAtraso = 0;
    let comprasPendentes = 0;

    compras.forEach((c) => {
      totalGasto += c.valor_negociado;
      totalOrcado += c.valor_orcado;

      if (c.status_entrega === 'no_prazo') comprasNoPrazo++;
      else if (c.status_entrega === 'em_atraso') comprasEmAtraso++;
      else if (c.status_entrega === 'pendente') comprasPendentes++;
    });

    const totalEconomizado = Math.max(0, totalOrcado - totalGasto);
    const percentualSavingMedio = totalOrcado > 0 ? (totalEconomizado / totalOrcado) * 100 : 0;
    
    // Taxa de pontualidade sobre entregas concluídas ou ativas
    const entregasAvaliadas = comprasNoPrazo + comprasEmAtraso;
    const taxaPontualidade = entregasAvaliadas > 0 ? (comprasNoPrazo / entregasAvaliadas) * 100 : 100;

    return {
      totalCompras: compras.length,
      totalGasto,
      totalOrcado,
      totalEconomizado,
      percentualSavingMedio,
      comprasNoPrazo,
      comprasEmAtraso,
      comprasPendentes,
      taxaPontualidade,
    };
  }, [compras]);

  // Manipulação de Compras
  const handleSalvarCompra = async (compra: Compra) => {
    if (compraEmEdicao) {
      await atualizarCompra(compra);
      exibirToast(`Pedido ${compra.numero_pedido} atualizado com sucesso!`);
    } else {
      await salvarNovaCompra(compra);
      exibirToast(`Compra ${compra.numero_pedido} cadastrada com sucesso!`);
    }
    await carregarDados();
  };

  const handleExcluirCompra = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro de compra?')) {
      await deletarCompra(id);
      exibirToast('Pedido de compra removido.');
      await carregarDados();
      if (compraDetalhes?.id === id) setCompraDetalhes(null);
    }
  };

  const handleMarcarEntregue = async (compra: Compra) => {
    const hoje = new Date().toISOString().split('T')[0];
    const statusAtualizado = determinarStatusEntrega(compra.data_prevista_entrega, hoje);
    
    const atualizado: Compra = {
      ...compra,
      data_efetiva_entrega: hoje,
      status_entrega: statusAtualizado,
      atualizado_em: new Date().toISOString(),
    };

    await atualizarCompra(atualizado);
    exibirToast(
      statusAtualizado === 'no_prazo' 
        ? `Recebimento confirmado no prazo! (${compra.numero_pedido})` 
        : `Recebimento registrado com atraso (${compra.numero_pedido})`
    );
    await carregarDados();
  };

  // Exportar para CSV
  const handleExportCSV = () => {
    if (compras.length === 0) return;

    const cabecalhos = [
      'Numero Pedido',
      'Descricao',
      'Fornecedor',
      'CNPJ',
      'Categoria',
      'Departamento',
      'Data Pedido',
      'Previsao Entrega',
      'Entrega Efetiva',
      'Valor Orcado (R$)',
      'Valor Negociado (R$)',
      'Saving Economia (R$)',
      'Percentual Saving (%)',
      'Status Entrega',
      'Comprador'
    ];

    const linhas = compras.map((c) => {
      const saving = c.valor_orcado - c.valor_negociado;
      const pct = c.valor_orcado > 0 ? ((saving / c.valor_orcado) * 100).toFixed(2) : '0';
      return [
        `"${c.numero_pedido}"`,
        `"${c.descricao.replace(/"/g, '""')}"`,
        `"${c.fornecedor.replace(/"/g, '""')}"`,
        `"${c.cnpj_fornecedor}"`,
        `"${c.categoria}"`,
        `"${c.departamento}"`,
        `"${formatDateBR(c.data_pedido)}"`,
        `"${formatDateBR(c.data_prevista_entrega)}"`,
        `"${c.data_efetiva_entrega ? formatDateBR(c.data_efetiva_entrega) : '-'}"`,
        c.valor_orcado.toFixed(2),
        c.valor_negociado.toFixed(2),
        saving.toFixed(2),
        `${pct}%`,
        `"${c.status_entrega === 'no_prazo' ? 'No Prazo' : c.status_entrega === 'em_atraso' ? 'Em Atraso' : 'Em Transito'}"`,
        `"${c.comprador_responsavel}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [cabecalhos.join(';'), ...linhas].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `suprimentos_compras_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    exibirToast('Relatório CSV de compras gerado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* Toast flutuante */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl text-xs font-semibold border border-slate-700 dark:border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenNovaCompra={() => {
          setCompraEmEdicao(null);
          setModalCompraAberto(true);
        }}
        onOpenSupabase={() => setModalSupabaseAberto(true)}
        isSupabaseConnected={isSupabase}
        onExportCSV={handleExportCSV}
        totalCompras={compras.length}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner de Boas-Vindas & Status Executivo */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Painel Geral de Suprimentos & Aquisições
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                BRL (R$)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Controle unificado de ordens de compra, acompanhamento de prazos de entrega e economia líquida (Saving).
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setCompraEmEdicao(null);
                setModalCompraAberto(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Compra</span>
            </button>

            <button
              onClick={() => setModalSupabaseAberto(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Conectar Supabase</span>
            </button>
          </div>
        </div>

        {/* Card de Conexão Rápida Supabase (URL & ANON KEY) */}
        <SupabaseQuickConnect
          onConnected={carregarDados}
          onOpenModal={() => setModalSupabaseAberto(true)}
          isSupabaseConnected={isSupabase}
          compras={compras}
        />

        {/* ALERTA DE ATRASO CRÍTICO (se houver compras atrasadas) */}
        {metricas.comprasEmAtraso > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/30 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200">
                  Atenção: {metricas.comprasEmAtraso} {metricas.comprasEmAtraso === 1 ? 'compra está em atraso' : 'compras estão em atraso'}
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  Fornecedores ultrapassaram a data limite estipulada em contrato. Verifique o plano de ação de entrega.
                </p>
              </div>
            </div>

            <button
              onClick={() => setTabAtiva('prazos')}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors shrink-0 self-start sm:self-auto"
            >
              Ver Pedidos em Atraso
            </button>
          </div>
        )}

        {/* 4 CARDS DE INDICADORES (KPIs) - Requisito explícito: Qtd Compras, No Prazo vs Em Atraso, Valor Economizado */}
        <KpiCards metricas={metricas} />

        {/* Navegação por Abas do Sistema */}
        <div className="flex items-center space-x-1 sm:space-x-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto text-xs sm:text-sm">
          <button
            onClick={() => setTabAtiva('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              tabAtiva === 'dashboard'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Análise</span>
          </button>

          <button
            onClick={() => setTabAtiva('compras')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              tabAtiva === 'compras'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Gestão de Compras ({compras.length})</span>
          </button>

          <button
            onClick={() => setTabAtiva('saving')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              tabAtiva === 'saving'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Relatório de Saving ({formatCurrency(metricas.totalEconomizado)})</span>
          </button>

          <button
            onClick={() => setTabAtiva('prazos')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              tabAtiva === 'prazos'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Prazos & OTIF ({metricas.taxaPontualidade.toFixed(0)}%)</span>
          </button>
        </div>

        {/* Visualização de Gráficos e Analytics (Aba Dashboard) */}
        {tabAtiva === 'dashboard' && (
          <div className="space-y-6">
            <DashboardCharts compras={compras} />
            
            {/* Tabela de Compras no Dashboard */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Últimos Pedidos Cadastrados
                </h3>
                <span className="text-xs text-slate-500">
                  Clique em qualquer pedido para ver a ficha completa
                </span>
              </div>
              <ComprasTable
                compras={compras}
                onSelectCompra={(c) => setCompraDetalhes(c)}
                onEditCompra={(c) => {
                  setCompraEmEdicao(c);
                  setModalCompraAberto(true);
                }}
                onDeleteCompra={handleExcluirCompra}
                onMarcarEntregue={handleMarcarEntregue}
              />
            </div>
          </div>
        )}

        {/* Visualização Completa de Compras (Aba Compras) */}
        {tabAtiva === 'compras' && (
          <div className="space-y-4">
            <ComprasTable
              compras={compras}
              onSelectCompra={(c) => setCompraDetalhes(c)}
              onEditCompra={(c) => {
                setCompraEmEdicao(c);
                setModalCompraAberto(true);
              }}
              onDeleteCompra={handleExcluirCompra}
              onMarcarEntregue={handleMarcarEntregue}
            />
          </div>
        )}

        {/* Visualização de Saving / Economia (Aba Saving) */}
        {tabAtiva === 'saving' && (
          <div className="space-y-6">
            {/* Resumo do Saving */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Orçamento Global Referência</span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatCurrency(metricas.totalOrcado)}
                </div>
                <p className="text-xs text-slate-400 mt-2">Valor inicial aprovado pelas diretorias</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Valor Negociado Fechado</span>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {formatCurrency(metricas.totalGasto)}
                </div>
                <p className="text-xs text-slate-400 mt-2">Valor real desembolsado nas aquisições</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">Total Economizado (Saving Líquido)</span>
                <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
                  +{formatCurrency(metricas.totalEconomizado)}
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                  Retorno financeiro gerado pelo setor de suprimentos ({metricas.percentualSavingMedio.toFixed(1)}%)
                </p>
              </div>
            </div>

            <DashboardCharts compras={compras} />
          </div>
        )}

        {/* Visualização de Prazos & OTIF (Aba Prazos) */}
        {tabAtiva === 'prazos' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Entregas no Prazo</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                  {metricas.comprasNoPrazo}
                </div>
                <p className="text-xs text-slate-500 mt-1">Cumpriram o prazo contratual rigorosamente</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-rose-200 dark:border-rose-900/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Entregas em Atraso</span>
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
                  {metricas.comprasEmAtraso}
                </div>
                <p className="text-xs text-slate-500 mt-1">Requerem notificação formal aos fornecedores</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-sky-200 dark:border-sky-900/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">A Caminho (No Prazo)</span>
                  <Clock className="w-5 h-5 text-sky-600" />
                </div>
                <div className="text-3xl font-extrabold text-sky-600 dark:text-sky-400 mt-2">
                  {metricas.comprasPendentes}
                </div>
                <p className="text-xs text-slate-500 mt-1">Em produção ou transporte com data futura</p>
              </div>
            </div>

            <ComprasTable
              compras={compras}
              onSelectCompra={(c) => setCompraDetalhes(c)}
              onEditCompra={(c) => {
                setCompraEmEdicao(c);
                setModalCompraAberto(true);
              }}
              onDeleteCompra={handleExcluirCompra}
              onMarcarEntregue={handleMarcarEntregue}
            />
          </div>
        )}

      </main>

      {/* Rodapé Corporativo */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Supri</span>
            <span>•</span>
            <span>Sistema de Gestão de Suprimentos & Saving</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setModalSupabaseAberto(true)}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center space-x-1"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Status Banco de Dados</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Localização: Brasil (BRL R$)</span>
          </div>
        </div>
      </footer>

      {/* Modal Nova Compra / Edição */}
      <CompraModal
        isOpen={modalCompraAberto}
        onClose={() => setModalCompraAberto(false)}
        onSave={handleSalvarCompra}
        compraParaEditar={compraEmEdicao}
      />

      {/* Modal Conexão Supabase */}
      <SupabaseModal
        isOpen={modalSupabaseAberto}
        onClose={() => setModalSupabaseAberto(false)}
        compras={compras}
        onRefreshData={carregarDados}
        isSupabaseConnected={isSupabase}
      />

      {/* Modal Detalhes do Pedido */}
      <DetalhesModal
        compra={compraDetalhes}
        onClose={() => setCompraDetalhes(null)}
        onEdit={(c) => {
          setCompraDetalhes(null);
          setCompraEmEdicao(c);
          setModalCompraAberto(true);
        }}
        onDelete={handleExcluirCompra}
        onMarcarEntregue={handleMarcarEntregue}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
