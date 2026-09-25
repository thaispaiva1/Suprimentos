import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Building, 
  Tag, 
  Briefcase, 
  User, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Compra, 
  CategoriaCompra, 
  DepartamentoEmpresa, 
  formatCurrency,
  determinarStatusEntrega 
} from '../types/procurement.ts';

interface CompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (compra: Compra) => Promise<void>;
  compraParaEditar?: Compra | null;
}

const FORNECEDORES_SUGESTOES = [
  { nome: 'Dell Computadores do Brasil Ltda', cnpj: '72.381.189/0001-10', cat: 'TI & Hardware' as CategoriaCompra },
  { nome: 'Gerdau Aços Longos S.A.', cnpj: '07.358.761/0001-69', cat: 'Matéria-Prima & Insumos' as CategoriaCompra },
  { nome: 'TOTVS S.A.', cnpj: '53.113.791/0001-22', cat: 'TI & Hardware' as CategoriaCompra },
  { nome: 'Suzano S.A.', cnpj: '16.404.287/0001-55', cat: 'Matéria-Prima & Insumos' as CategoriaCompra },
  { nome: 'Braskem S.A.', cnpj: '42.150.391/0001-70', cat: 'Matéria-Prima & Insumos' as CategoriaCompra },
  { nome: 'Kalunga Comércio e Indústria Gráfica Ltda', cnpj: '43.283.811/0001-50', cat: 'Escritório & Facilities' as CategoriaCompra },
  { nome: 'WEG Equipamentos Elétricos S.A.', cnpj: '07.640.849/0001-08', cat: 'Manutenção & MRO' as CategoriaCompra },
  { nome: 'Edenred Brasil (Ticket Log)', cnpj: '02.404.858/0001-44', cat: 'Logística & Frota' as CategoriaCompra },
];

export const CompraModal: React.FC<CompraModalProps> = ({
  isOpen,
  onClose,
  onSave,
  compraParaEditar,
}) => {
  const isEditing = Boolean(compraParaEditar);

  const [numeroPedido, setNumeroPedido] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [cnpjFornecedor, setCnpjFornecedor] = useState('');
  const [categoria, setCategoria] = useState<CategoriaCompra>('TI & Hardware');
  const [departamento, setDepartamento] = useState<DepartamentoEmpresa>('Tecnologia da Informação');
  const [dataPedido, setDataPedido] = useState('');
  const [dataPrevistaEntrega, setDataPrevistaEntrega] = useState('');
  const [dataEfetivaEntrega, setDataEfetivaEntrega] = useState('');
  const [valorOrcado, setValorOrcado] = useState<number | string>('');
  const [valorNegociado, setValorNegociado] = useState<number | string>('');
  const [compradorResponsavel, setCompradorResponsavel] = useState('Carlos Mendonça');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Preenche dados ao abrir ou resetar
  useEffect(() => {
    if (compraParaEditar) {
      setNumeroPedido(compraParaEditar.numero_pedido);
      setDescricao(compraParaEditar.descricao);
      setFornecedor(compraParaEditar.fornecedor);
      setCnpjFornecedor(compraParaEditar.cnpj_fornecedor);
      setCategoria(compraParaEditar.categoria);
      setDepartamento(compraParaEditar.departamento);
      setDataPedido(compraParaEditar.data_pedido);
      setDataPrevistaEntrega(compraParaEditar.data_prevista_entrega);
      setDataEfetivaEntrega(compraParaEditar.data_efetiva_entrega || '');
      setValorOrcado(compraParaEditar.valor_orcado);
      setValorNegociado(compraParaEditar.valor_negociado);
      setCompradorResponsavel(compraParaEditar.comprador_responsavel || 'Carlos Mendonça');
      setObservacoes(compraParaEditar.observacoes || '');
    } else {
      const hoje = new Date().toISOString().split('T')[0];
      const dataPrazo = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
      const randomPO = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      setNumeroPedido(randomPO);
      setDescricao('');
      setFornecedor('');
      setCnpjFornecedor('');
      setCategoria('TI & Hardware');
      setDepartamento('Tecnologia da Informação');
      setDataPedido(hoje);
      setDataPrevistaEntrega(dataPrazo);
      setDataEfetivaEntrega('');
      setValorOrcado('');
      setValorNegociado('');
      setCompradorResponsavel('Carlos Mendonça');
      setObservacoes('');
    }
    setErro('');
  }, [compraParaEditar, isOpen]);

  if (!isOpen) return null;

  // Cálculos dinâmicos em tempo real
  const numOrcado = typeof valorOrcado === 'number' ? valorOrcado : parseFloat(valorOrcado) || 0;
  const numNegociado = typeof valorNegociado === 'number' ? valorNegociado : parseFloat(valorNegociado) || 0;
  const savingReal = Math.max(0, numOrcado - numNegociado);
  const pctSaving = numOrcado > 0 ? (savingReal / numOrcado) * 100 : 0;

  // Status calculado em tempo real
  const statusCalculado = determinarStatusEntrega(
    dataPrevistaEntrega,
    dataEfetivaEntrega || null
  );

  const selecionarSugestaoFornecedor = (sug: typeof FORNECEDORES_SUGESTOES[0]) => {
    setFornecedor(sug.nome);
    setCnpjFornecedor(sug.cnpj);
    setCategoria(sug.cat);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroPedido.trim() || !descricao.trim() || !fornecedor.trim()) {
      setErro('Preencha os campos obrigatórios: Pedido, Descrição e Fornecedor.');
      return;
    }

    if (!dataPedido || !dataPrevistaEntrega) {
      setErro('Informe as datas do pedido e a previsão de entrega.');
      return;
    }

    if (numNegociado <= 0) {
      setErro('O valor negociado deve ser maior que zero.');
      return;
    }

    try {
      setSalvando(true);
      setErro('');

      const novaCompra: Compra = {
        id: compraParaEditar ? compraParaEditar.id : `compra-${Date.now()}`,
        numero_pedido: numeroPedido.trim().toUpperCase(),
        descricao: descricao.trim(),
        fornecedor: fornecedor.trim(),
        cnpj_fornecedor: cnpjFornecedor.trim() || '00.000.000/0001-00',
        categoria,
        departamento,
        data_pedido: dataPedido,
        data_prevista_entrega: dataPrevistaEntrega,
        data_efetiva_entrega: dataEfetivaEntrega.trim() ? dataEfetivaEntrega : null,
        valor_orcado: numOrcado > 0 ? numOrcado : numNegociado,
        valor_negociado: numNegociado,
        status_entrega: statusCalculado,
        status_aprovacao: 'aprovado',
        comprador_responsavel: compradorResponsavel.trim(),
        observacoes: observacoes.trim() || undefined,
        criado_em: compraParaEditar?.criado_em || new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      await onSave(novaCompra);

      // Dispara confetti se teve bom saving!
      if (savingReal > 5000 || pctSaving >= 10) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro ao registrar compra.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Editar Pedido de Compra' : 'Novo Cadastro de Compra'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Suprimentos e Aquisições
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {erro && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* Linha 1: Número PO e Comprador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número do Pedido (PO) *
              </label>
              <input
                type="text"
                required
                value={numeroPedido}
                onChange={(e) => setNumeroPedido(e.target.value)}
                placeholder="Ex: PO-2026-0850"
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Comprador Responsável *
              </label>
              <input
                type="text"
                required
                value={compradorResponsavel}
                onChange={(e) => setCompradorResponsavel(e.target.value)}
                placeholder="Nome do analista de suprimentos"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Descrição do Item */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição do Item / Serviço Solicitado *
            </label>
            <input
              type="text"
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Servidores de alta performance, 10 toneladas de bobina de aço, etc."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Fornecedor Nacional & CNPJ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Razão Social do Fornecedor *
              </label>
              <input
                type="text"
                required
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Ex: Gerdau Aços Longos S.A."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                CNPJ do Fornecedor
              </label>
              <input
                type="text"
                value={cnpjFornecedor}
                onChange={(e) => setCnpjFornecedor(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Sugestões rápidas de fornecedores */}
          {!isEditing && (
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Preenchimento rápido (Fornecedores cadastrados):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {FORNECEDORES_SUGESTOES.slice(0, 4).map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selecionarSugestaoFornecedor(sug)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    + {sug.nome.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categoria e Departamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria de Compra *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaCompra)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="TI & Hardware">TI & Hardware</option>
                <option value="Matéria-Prima & Insumos">Matéria-Prima & Insumos</option>
                <option value="Serviços & Terceirizados">Serviços & Terceirizados</option>
                <option value="Logística & Frota">Logística & Frota</option>
                <option value="Escritório & Facilities">Escritório & Facilities</option>
                <option value="Manutenção & MRO">Manutenção & MRO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Departamento Solicitante *
              </label>
              <select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value as DepartamentoEmpresa)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Tecnologia da Informação">Tecnologia da Informação</option>
                <option value="Produção Industrial">Produção Industrial</option>
                <option value="Operações & Logística">Operações & Logística</option>
                <option value="Administrativo & Financeiro">Administrativo & Financeiro</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Comercial & Marketing">Comercial & Marketing</option>
              </select>
            </div>
          </div>

          {/* Valores: Orçamento de Referência vs Valor Negociado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Orçado / Cotação Inicial (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={valorOrcado}
                  onChange={(e) => setValorOrcado(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Negociado / Fechado (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={valorNegociado}
                  onChange={(e) => setValorNegociado(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* PREVIEW DO CÁLCULO DE SAVING (ECONOMIA) */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider block">
                  Economia Gerada (Saving)
                </span>
                <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(savingReal)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                Percentual
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
                {pctSaving.toFixed(1)}% de economia
              </span>
            </div>
          </div>

          {/* Prazos: Pedido, Previsão de Entrega, Efetiva */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Pedido *
              </label>
              <input
                type="date"
                required
                value={dataPedido}
                onChange={(e) => setDataPedido(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data Prevista Entrega *
              </label>
              <input
                type="date"
                required
                value={dataPrevistaEntrega}
                onChange={(e) => setDataPrevistaEntrega(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data Efetiva de Entrega
              </label>
              <input
                type="date"
                value={dataEfetivaEntrega}
                onChange={(e) => setDataEfetivaEntrega(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">Vazio se ainda em transporte</span>
            </div>
          </div>

          {/* Indicador de Status Previsto */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Status automático de entrega:
            </span>
            {statusCalculado === 'no_prazo' && (
              <span className="inline-flex items-center space-x-1 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>No Prazo (Pontual)</span>
              </span>
            )}
            {statusCalculado === 'em_atraso' && (
              <span className="inline-flex items-center space-x-1 font-bold text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Em Atraso (SLA violado)</span>
              </span>
            )}
            {statusCalculado === 'pendente' && (
              <span className="inline-flex items-center space-x-1 font-bold text-sky-600 dark:text-sky-400">
                <Calendar className="w-4 h-4" />
                <span>Em Trânsito (Dentro do Prazo)</span>
              </span>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações & Condições Comerciais
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Condição de pagamento 30DD, frete CIF incluso, cláusula de garantia de 12 meses..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center space-x-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{salvando ? 'Salvando...' : isEditing ? 'Atualizar Pedido' : 'Registrar Compra'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
