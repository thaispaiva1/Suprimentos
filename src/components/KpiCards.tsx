import React from 'react';
import { 
  ShoppingBag, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  PiggyBank, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import { ResumoMetricas, formatCurrency } from '../types/procurement.ts';

interface KpiCardsProps {
  metricas: ResumoMetricas;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ metricas }) => {
  const {
    totalCompras,
    totalGasto,
    totalEconomizado,
    percentualSavingMedio,
    comprasNoPrazo,
    comprasEmAtraso,
    comprasPendentes,
    taxaPontualidade,
  } = metricas;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. QUANTIDADE DE COMPRAS */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Quantidade de Compras
          </span>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalCompras}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            pedidos emitidos
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Volume Total Negociado:</span>
          <span className="font-semibold text-slate-900 dark:text-slate-200">
            {formatCurrency(totalGasto)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Pedidos a caminho:</span>
          <span className="font-medium text-indigo-600 dark:text-indigo-400">
            {comprasPendentes} em trânsito
          </span>
        </div>
      </div>

      {/* 2. NO PRAZO (PONTUALIDADE) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Entregas no Prazo
          </span>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {comprasNoPrazo}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            pedidos pontuais
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 dark:text-slate-400">Índice OTIF / Pontualidade:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {taxaPontualidade.toFixed(1)}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, taxaPontualidade)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. EM ATRASO */}
      <div className={`bg-white dark:bg-slate-900 rounded-xl p-5 border shadow-sm relative overflow-hidden transition-all hover:shadow-md ${
        comprasEmAtraso > 0 
          ? 'border-rose-200 dark:border-rose-900/60' 
          : 'border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Compras em Atraso
          </span>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            comprasEmAtraso > 0 
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline space-x-2">
          <span className={`text-3xl font-extrabold ${
            comprasEmAtraso > 0 
              ? 'text-rose-600 dark:text-rose-400' 
              : 'text-slate-700 dark:text-slate-300'
          }`}>
            {comprasEmAtraso}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {comprasEmAtraso === 1 ? 'pedido em atraso' : 'pedidos em atraso'}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Status Operacional:</span>
          {comprasEmAtraso > 0 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              Ação de follow-up necessária
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Nenhum atraso crítico
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Monitoramento diário contra SLA de fornecedores
        </div>
      </div>

      {/* 4. VALOR ECONOMIZADO (SAVING) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Valor Economizado (Saving)
          </span>
          <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline space-x-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">
            {formatCurrency(totalEconomizado)}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Média de Saving:</span>
          <span className="inline-flex items-center space-x-1 font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{percentualSavingMedio.toFixed(1)}% economizado</span>
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Orçamento de Referência:</span>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {formatCurrency(metricas.totalOrcado)}
          </span>
        </div>
      </div>

    </div>
  );
};
