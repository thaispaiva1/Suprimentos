import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Edit3, 
  Trash2, 
  Eye, 
  TrendingDown,
  Building,
  Check,
  Calendar,
  XCircle
} from 'lucide-react';
import { 
  Compra, 
  CategoriaCompra, 
  DepartamentoEmpresa, 
  StatusEntrega, 
  formatCurrency, 
  formatDateBR, 
  formatCNPJ,
  determinarStatusEntrega
} from '../types/procurement.ts';

interface ComprasTableProps {
  compras: Compra[];
  onSelectCompra: (compra: Compra) => void;
  onEditCompra: (compra: Compra) => void;
  onDeleteCompra: (id: string) => void;
  onMarcarEntregue: (compra: Compra) => void;
}

export const ComprasTable: React.FC<ComprasTableProps> = ({
  compras,
  onSelectCompra,
  onEditCompra,
  onDeleteCompra,
  onMarcarEntregue,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>('todos');
  const [ordenacao, setOrdenacao] = useState<'data_desc' | 'data_asc' | 'saving_desc' | 'valor_desc' | 'prazo'>('data_desc');
  
  // Paginação simples
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 8;

  // Filtragem e ordenação
  const comprasFiltradas = useMemo(() => {
    return compras
      .filter((c) => {
        // Busca texto
        const termo = busca.toLowerCase();
        const bateTexto = 
          c.numero_pedido.toLowerCase().includes(termo) ||
          c.fornecedor.toLowerCase().includes(termo) ||
          c.descricao.toLowerCase().includes(termo) ||
          c.cnpj_fornecedor.toLowerCase().includes(termo) ||
          c.comprador_responsavel.toLowerCase().includes(termo);

        if (!bateTexto) return false;

        // Filtro status
        if (filtroStatus !== 'todos' && c.status_entrega !== filtroStatus) {
          return false;
        }

        // Filtro categoria
        if (filtroCategoria !== 'todas' && c.categoria !== filtroCategoria) {
          return false;
        }

        // Filtro departamento
        if (filtroDepartamento !== 'todos' && c.departamento !== filtroDepartamento) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (ordenacao === 'data_desc') {
          return new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime();
        }
        if (ordenacao === 'data_asc') {
          return new Date(a.data_pedido).getTime() - new Date(b.data_pedido).getTime();
        }
        if (ordenacao === 'saving_desc') {
          const savingB = b.valor_orcado - b.valor_negociado;
          const savingA = a.valor_orcado - a.valor_negociado;
          return savingB - savingA;
        }
        if (ordenacao === 'valor_desc') {
          return b.valor_negociado - a.valor_negociado;
        }
        if (ordenacao === 'prazo') {
          return new Date(a.data_prevista_entrega).getTime() - new Date(b.data_prevista_entrega).getTime();
        }
        return 0;
      });
  }, [compras, busca, filtroStatus, filtroCategoria, filtroDepartamento, ordenacao]);

  // Paginação
  const totalPaginas = Math.ceil(comprasFiltradas.length / itensPorPagina) || 1;
  const comprasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return comprasFiltradas.slice(inicio, inicio + itensPorPagina);
  }, [comprasFiltradas, paginaAtual]);

  const limparFiltros = () => {
    setBusca('');
    setFiltroStatus('todos');
    setFiltroCategoria('todas');
    setFiltroDepartamento('todos');
    setPaginaAtual(1);
  };

  const getStatusBadge = (compra: Compra) => {
    if (compra.status_entrega === 'no_prazo') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>No Prazo</span>
        </span>
      );
    }
    if (compra.status_entrega === 'em_atraso') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Em Atraso</span>
        </span>
      );
    }
    if (compra.status_entrega === 'pendente') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Em Trânsito</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <XCircle className="w-3.5 h-3.5" />
        <span>Cancelado</span>
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Barra de Filtros e Busca */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Campo de Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por PO, Fornecedor, CNPJ, item ou comprador..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Ordenação */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Ordenar por:
            </span>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as any)}
              className="text-xs sm:text-sm py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="data_desc">Mais Recentes (Data Pedido)</option>
              <option value="data_asc">Mais Antigos</option>
              <option value="saving_desc">Maior Saving (Economia R$)</option>
              <option value="valor_desc">Maior Valor Negociado</option>
              <option value="prazo">Prazo de Entrega Próximo</option>
            </select>
          </div>
        </div>

        {/* Filtros em linha */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </span>

          {/* Filtro Status Entrega */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => { setFiltroStatus('todos'); setPaginaAtual(1); }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filtroStatus === 'todos' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos ({compras.length})
            </button>
            <button
              onClick={() => { setFiltroStatus('no_prazo'); setPaginaAtual(1); }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filtroStatus === 'no_prazo' 
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              No Prazo
            </button>
            <button
              onClick={() => { setFiltroStatus('em_atraso'); setPaginaAtual(1); }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filtroStatus === 'em_atraso' 
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              Em Atraso
            </button>
            <button
              onClick={() => { setFiltroStatus('pendente'); setPaginaAtual(1); }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filtroStatus === 'pendente' 
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-sky-600'
              }`}
            >
              Em Trânsito
            </button>
          </div>

          {/* Filtro Categoria */}
          <select
            value={filtroCategoria}
            onChange={(e) => { setFiltroCategoria(e.target.value); setPaginaAtual(1); }}
            className="py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="todas">Todas Categorias</option>
            <option value="TI & Hardware">TI & Hardware</option>
            <option value="Matéria-Prima & Insumos">Matéria-Prima & Insumos</option>
            <option value="Serviços & Terceirizados">Serviços & Terceirizados</option>
            <option value="Logística & Frota">Logística & Frota</option>
            <option value="Escritório & Facilities">Escritório & Facilities</option>
            <option value="Manutenção & MRO">Manutenção & MRO</option>
          </select>

          {/* Filtro Departamento */}
          <select
            value={filtroDepartamento}
            onChange={(e) => { setFiltroDepartamento(e.target.value); setPaginaAtual(1); }}
            className="py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="todos">Todos Departamentos</option>
            <option value="Tecnologia da Informação">TI</option>
            <option value="Produção Industrial">Produção</option>
            <option value="Operações & Logística">Operações</option>
            <option value="Administrativo & Financeiro">Financeiro</option>
            <option value="Recursos Humanos">RH</option>
            <option value="Comercial & Marketing">Comercial</option>
          </select>

          {(busca || filtroStatus !== 'todos' || filtroCategoria !== 'todas' || filtroDepartamento !== 'todos') && (
            <button
              onClick={limparFiltros}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-1.5 py-1"
            >
              Limpar Filtros
            </button>
          )}

          <div className="ml-auto text-xs text-slate-500 dark:text-slate-400">
            Exibindo <strong>{comprasFiltradas.length}</strong> compras
          </div>
        </div>
      </div>

      {/* Tabela de Compras */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3.5">Pedido / Data</th>
              <th className="px-4 py-3.5">Fornecedor</th>
              <th className="px-4 py-3.5">Item & Categoria</th>
              <th className="px-4 py-3.5">Orçado vs Negociado</th>
              <th className="px-4 py-3.5">Economia (Saving)</th>
              <th className="px-4 py-3.5">Prazo & Entrega</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {comprasPaginadas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhuma compra encontrada</p>
                    <p className="text-xs">Tente ajustar seus termos de busca ou filtros aplicados.</p>
                  </div>
                </td>
              </tr>
            ) : (
              comprasPaginadas.map((compra) => {
                const saving = compra.valor_orcado - compra.valor_negociado;
                const pctSaving = compra.valor_orcado > 0 ? (saving / compra.valor_orcado) * 100 : 0;

                return (
                  <tr 
                    key={compra.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectCompra(compra)}
                  >
                    {/* Pedido & Data */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white font-mono text-xs text-emerald-600 dark:text-emerald-400">
                        {compra.numero_pedido}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDateBR(compra.data_pedido)}</span>
                      </div>
                    </td>

                    {/* Fornecedor & CNPJ */}
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={compra.fornecedor}>
                        {compra.fornecedor}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {formatCNPJ(compra.cnpj_fornecedor)}
                      </div>
                    </td>

                    {/* Item & Categoria */}
                    <td className="px-4 py-3.5 max-w-[220px]">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1" title={compra.descricao}>
                        {compra.descricao}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {compra.categoria}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {compra.departamento}
                        </span>
                      </div>
                    </td>

                    {/* Orçado vs Negociado */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(compra.valor_negociado)}
                      </div>
                      <div className="text-[11px] text-slate-400 line-through">
                        {formatCurrency(compra.valor_orcado)}
                      </div>
                    </td>

                    {/* Saving */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1 font-bold text-teal-600 dark:text-teal-400">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>+{formatCurrency(saving)}</span>
                      </div>
                      <div className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold">
                        {pctSaving.toFixed(1)}% de economia
                      </div>
                    </td>

                    {/* Prazos */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 text-[11px]">Previsto: </span>
                        <strong>{formatDateBR(compra.data_prevista_entrega)}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="text-slate-400">Efetivo: </span>
                        {compra.data_efetiva_entrega ? (
                          <span className={compra.status_entrega === 'em_atraso' ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-medium'}>
                            {formatDateBR(compra.data_efetiva_entrega)}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">Aguardando</span>
                        )}
                      </div>
                    </td>

                    {/* Status Entrega */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(compra)}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        
                        {/* Se pendente, botão rápido para confirmar recebimento */}
                        {!compra.data_efetiva_entrega && compra.status_entrega !== 'cancelado' && (
                          <button
                            onClick={() => onMarcarEntregue(compra)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                            title="Confirmar Entrega / Recebimento"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => onSelectCompra(compra)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Ver Detalhes do Pedido"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditCompra(compra)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                          title="Editar Pedido"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteCompra(compra.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                          title="Excluir Registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Página {paginaAtual} de {totalPaginas}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
