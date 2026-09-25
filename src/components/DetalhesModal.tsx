import React from 'react';
import { 
  X, 
  Calendar, 
  Building, 
  Tag, 
  DollarSign, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Edit3, 
  Trash2, 
  Check,
  FileText,
  User,
  ShieldCheck
} from 'lucide-react';
import { 
  Compra, 
  formatCurrency, 
  formatDateBR, 
  formatCNPJ 
} from '../types/procurement.ts';

interface DetalhesModalProps {
  compra: Compra | null;
  onClose: () => void;
  onEdit: (compra: Compra) => void;
  onDelete: (id: string) => void;
  onMarcarEntregue: (compra: Compra) => void;
}

export const DetalhesModal: React.FC<DetalhesModalProps> = ({
  compra,
  onClose,
  onEdit,
  onDelete,
  onMarcarEntregue,
}) => {
  if (!compra) return null;

  const saving = compra.valor_orcado - compra.valor_negociado;
  const pctSaving = compra.valor_orcado > 0 ? (saving / compra.valor_orcado) * 100 : 0;

  // Cálculo de dias de atraso ou dias restantes
  const hoje = new Date().toISOString().split('T')[0];
  const dtPrevista = new Date(compra.data_prevista_entrega).getTime();
  const dtComparar = compra.data_efetiva_entrega 
    ? new Date(compra.data_efetiva_entrega).getTime() 
    : new Date(hoje).getTime();
  const diffDias = Math.round((dtComparar - dtPrevista) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">
                {compra.numero_pedido}
              </span>
              {compra.status_entrega === 'no_prazo' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Entregue no Prazo</span>
                </span>
              )}
              {compra.status_entrega === 'em_atraso' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Em Atraso ({diffDias > 0 ? `+${diffDias} dias` : 'Atrasado'})</span>
                </span>
              )}
              {compra.status_entrega === 'pendente' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Em Transporte (No Prazo)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Emitido em {formatDateBR(compra.data_pedido)} por {compra.comprador_responsavel}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo de Informações */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Item e Fornecedor */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {compra.descricao}
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Fornecedor:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">{compra.fornecedor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">CNPJ:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{formatCNPJ(compra.cnpj_fornecedor)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Categoria / Depto:</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {compra.categoria} • {compra.departamento}
                </span>
              </div>
            </div>
          </div>

          {/* Destaque Financeiro & Saving */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200 flex items-center space-x-1.5">
                <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Resultado da Negociação & Saving</span>
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                {pctSaving.toFixed(1)}% de economia
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 text-center">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Orçado</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 line-through">
                  {formatCurrency(compra.valor_orcado)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Negociado</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatCurrency(compra.valor_negociado)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase font-bold">Saving (R$)</span>
                <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
                  +{formatCurrency(saving)}
                </span>
              </div>
            </div>
          </div>

          {/* Cronograma de Entrega */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Cronograma e Cumprimento de Prazos
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[11px]">Data Prevista em Contrato:</span>
                <strong className="text-slate-900 dark:text-slate-100 text-sm">
                  {formatDateBR(compra.data_prevista_entrega)}
                </strong>
              </div>

              <div className={`p-3 rounded-lg border ${
                compra.data_efetiva_entrega 
                  ? compra.status_entrega === 'em_atraso'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}>
                <span className="text-slate-400 block text-[11px]">Data Efetiva de Entrega:</span>
                <strong className={`text-sm ${
                  compra.data_efetiva_entrega
                    ? compra.status_entrega === 'em_atraso'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 italic'
                }`}>
                  {compra.data_efetiva_entrega ? formatDateBR(compra.data_efetiva_entrega) : 'Aguardando recebimento'}
                </strong>
              </div>
            </div>
          </div>

          {/* Observações */}
          {compra.observacoes && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Condições & Observações:
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {compra.observacoes}
              </p>
            </div>
          )}

        </div>

        {/* Ações do Rodapé */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onEdit(compra);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onDelete(compra.id);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {!compra.data_efetiva_entrega && compra.status_entrega !== 'cancelado' && (
              <button
                onClick={() => {
                  onMarcarEntregue(compra);
                  onClose();
                }}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar Recebimento</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
