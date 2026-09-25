import React, { useMemo } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  ShieldAlert, 
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Compra, formatCurrency } from '../types/procurement.ts';

interface DashboardChartsProps {
  compras: Compra[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ compras }) => {
  // 1. Dados por Mês (Últimos meses)
  const dadosMensais = useMemo(() => {
    const mesesMap: { [key: string]: { label: string; gasto: number; saving: number; count: number } } = {};
    
    // Nomes dos meses em PT-BR
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    compras.forEach((c) => {
      if (!c.data_pedido) return;
      const [ano, mes] = c.data_pedido.split('-');
      const chave = `${ano}-${mes}`;
      const mesIndex = parseInt(mes, 10) - 1;
      const label = `${nomesMeses[mesIndex]}/${ano.slice(2)}`;

      if (!mesesMap[chave]) {
        mesesMap[chave] = { label, gasto: 0, saving: 0, count: 0 };
      }
      mesesMap[chave].gasto += c.valor_negociado;
      mesesMap[chave].saving += Math.max(0, c.valor_orcado - c.valor_negociado);
      mesesMap[chave].count += 1;
    });

    return Object.entries(mesesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([_, v]) => v);
  }, [compras]);

  // 2. Desempenho de Entregas (No Prazo, Em Atraso, Pendente)
  const statusEntregas = useMemo(() => {
    let noPrazo = 0;
    let emAtraso = 0;
    let pendente = 0;

    compras.forEach((c) => {
      if (c.status_entrega === 'no_prazo') noPrazo++;
      else if (c.status_entrega === 'em_atraso') emAtraso++;
      else if (c.status_entrega === 'pendente') pendente++;
    });

    const total = compras.length || 1;
    return {
      noPrazo,
      emAtraso,
      pendente,
      pctNoPrazo: (noPrazo / total) * 100,
      pctEmAtraso: (emAtraso / total) * 100,
      pctPendente: (pendente / total) * 100,
    };
  }, [compras]);

  // 3. Distribuição por Categoria
  const categoriasData = useMemo(() => {
    const catMap: { [cat: string]: { totalGasto: number; totalSaving: number; count: number } } = {};

    compras.forEach((c) => {
      if (!catMap[c.categoria]) {
        catMap[c.categoria] = { totalGasto: 0, totalSaving: 0, count: 0 };
      }
      catMap[c.categoria].totalGasto += c.valor_negociado;
      catMap[c.categoria].totalSaving += Math.max(0, c.valor_orcado - c.valor_negociado);
      catMap[c.categoria].count += 1;
    });

    const totalGeral = Object.values(catMap).reduce((acc, curr) => acc + curr.totalGasto, 0) || 1;

    return Object.entries(catMap)
      .map(([nome, dados]) => ({
        nome,
        totalGasto: dados.totalGasto,
        totalSaving: dados.totalSaving,
        count: dados.count,
        percentual: (dados.totalGasto / totalGeral) * 100,
      }))
      .sort((a, b) => b.totalGasto - a.totalGasto);
  }, [compras]);

  // 4. Fornecedores mais ativos e economia
  const topFornecedores = useMemo(() => {
    const fornMap: { [forn: string]: { gasto: number; saving: number; count: number; noPrazo: number } } = {};

    compras.forEach((c) => {
      if (!fornMap[c.fornecedor]) {
        fornMap[c.fornecedor] = { gasto: 0, saving: 0, count: 0, noPrazo: 0 };
      }
      fornMap[c.fornecedor].gasto += c.valor_negociado;
      fornMap[c.fornecedor].saving += Math.max(0, c.valor_orcado - c.valor_negociado);
      fornMap[c.fornecedor].count += 1;
      if (c.status_entrega === 'no_prazo') fornMap[c.fornecedor].noPrazo += 1;
    });

    return Object.entries(fornMap)
      .map(([nome, dados]) => ({
        nome,
        ...dados,
        taxaPontualidade: dados.count > 0 ? (dados.noPrazo / dados.count) * 100 : 0,
      }))
      .sort((a, b) => b.gasto - a.gasto)
      .slice(0, 5);
  }, [compras]);

  const maxMensal = useMemo(() => {
    return Math.max(...dadosMensais.map((d) => d.gasto), 1000);
  }, [dadosMensais]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Gráfico 1: Evolução Mensal - Gastos vs Saving (2 colunas em telas grandes) */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Evolução Mensal: Volume de Compras & Economia Gerada (Saving)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparativo de investimento real vs valor negociado e economizado pela empresa
            </p>
          </div>
          
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-300">Valor Negociado</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-teal-400 inline-block" />
              <span className="text-slate-600 dark:text-slate-300">Saving (Economia)</span>
            </div>
          </div>
        </div>

        {/* Gráfico de Barras Responsivo */}
        <div className="mt-6 h-60 flex items-end justify-between gap-3 px-2">
          {dadosMensais.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
              Nenhuma compra cadastrada no período.
            </div>
          ) : (
            dadosMensais.map((d, idx) => {
              const heightNegociado = Math.max(12, (d.gasto / maxMensal) * 100);
              const heightSaving = Math.max(8, (d.saving / maxMensal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="text-[10px] text-center mb-1 text-slate-400 dark:text-slate-500 opacity-80 group-hover:opacity-100">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {d.count} {d.count === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>

                  <div className="w-full max-w-[48px] flex items-end justify-center space-x-1 h-44 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-1">
                    {/* Barra Negociado */}
                    <div 
                      className="w-1/2 bg-indigo-500 dark:bg-indigo-600 rounded-t-md transition-all duration-500 hover:brightness-110 relative"
                      style={{ height: `${heightNegociado}%` }}
                      title={`Negociado: ${formatCurrency(d.gasto)}`}
                    />
                    {/* Barra Saving */}
                    <div 
                      className="w-1/2 bg-teal-400 dark:bg-teal-500 rounded-t-md transition-all duration-500 hover:brightness-110 relative"
                      style={{ height: `${heightSaving}%` }}
                      title={`Economia (Saving): ${formatCurrency(d.saving)}`}
                    />
                  </div>

                  {/* Label Mês */}
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-2 truncate">
                    {d.label}
                  </span>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold truncate">
                    +{formatCurrency(d.saving)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Gráfico 2: Desempenho de Entregas & Prazos (1 coluna) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Desempenho de Entregas (Prazos)</span>
          </h3>

          {/* Barra de distribuição percentual contínua */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
              <span>Status Operacional</span>
              <span>{compras.length} pedidos totais</span>
            </div>

            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              <div 
                className="bg-emerald-500 transition-all duration-500" 
                style={{ width: `${statusEntregas.pctNoPrazo}%` }}
                title={`No Prazo: ${statusEntregas.noPrazo} (${statusEntregas.pctNoPrazo.toFixed(1)}%)`}
              />
              <div 
                className="bg-rose-500 transition-all duration-500" 
                style={{ width: `${statusEntregas.pctEmAtraso}%` }}
                title={`Em Atraso: ${statusEntregas.emAtraso} (${statusEntregas.pctEmAtraso.toFixed(1)}%)`}
              />
              <div 
                className="bg-sky-400 transition-all duration-500" 
                style={{ width: `${statusEntregas.pctPendente}%` }}
                title={`Pendentes / A caminho: ${statusEntregas.pendente} (${statusEntregas.pctPendente.toFixed(1)}%)`}
              />
            </div>
          </div>

          {/* Cards detalhados de status */}
          <div className="mt-5 space-y-2.5">
            {/* No Prazo */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">No Prazo / Concluído</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {statusEntregas.noPrazo} pedidos
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                  ({statusEntregas.pctNoPrazo.toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Em Atraso */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Em Atraso (Crítico)</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {statusEntregas.emAtraso} pedidos
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                  ({statusEntregas.pctEmAtraso.toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Pendente / Em Trânsito */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Em Trânsito (No Prazo)</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                  {statusEntregas.pendente} pedidos
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                  ({statusEntregas.pctPendente.toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center">
          Meta corporativa OTIF: <strong className="text-slate-700 dark:text-slate-300">≥ 85% de pontualidade</strong>
        </div>
      </div>

      {/* Gráfico 3: Distribuição por Categoria & Saving */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Composição de Compras por Categoria & Saving Gerado</span>
        </h3>

        <div className="mt-4 space-y-3">
          {categoriasData.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {cat.nome}
                  <span className="text-slate-400 font-normal ml-1.5">
                    ({cat.count} {cat.count === 1 ? 'pedido' : 'pedidos'})
                  </span>
                </span>
                <div className="text-right space-x-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(cat.totalGasto)}
                  </span>
                  <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded">
                    Saving: {formatCurrency(cat.totalSaving)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(5, cat.percentual))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico 4: Principais Fornecedores */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Principais Fornecedores</span>
        </h3>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {topFornecedores.map((forn, idx) => (
            <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[190px]">
                    {forn.nome}
                  </h4>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {forn.count} {forn.count === 1 ? 'pedido' : 'pedidos'}
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      OTIF: {forn.taxaPontualidade.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(forn.gasto)}
                  </div>
                  <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                    Economizado: {formatCurrency(forn.saving)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
