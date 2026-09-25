export type CategoriaCompra = 
  | 'TI & Hardware'
  | 'Matéria-Prima & Insumos'
  | 'Serviços & Terceirizados'
  | 'Logística & Frota'
  | 'Escritório & Facilities'
  | 'Manutenção & MRO';

export type DepartamentoEmpresa = 
  | 'Tecnologia da Informação'
  | 'Produção Industrial'
  | 'Operações & Logística'
  | 'Administrativo & Financeiro'
  | 'Recursos Humanos'
  | 'Comercial & Marketing';

export type StatusEntrega = 'no_prazo' | 'em_atraso' | 'pendente' | 'cancelado';
export type StatusAprovacao = 'aprovado' | 'em_analise' | 'rejeitado';

export interface Compra {
  id: string;
  numero_pedido: string; // Ex: PO-2026-0129
  descricao: string;
  fornecedor: string;
  cnpj_fornecedor: string;
  categoria: CategoriaCompra;
  departamento: DepartamentoEmpresa;
  data_pedido: string; // YYYY-MM-DD
  data_prevista_entrega: string; // YYYY-MM-DD
  data_efetiva_entrega?: string | null; // YYYY-MM-DD
  valor_orcado: number; // Cotação inicial / Orçamento previsto
  valor_negociado: number; // Valor final pago
  status_entrega: StatusEntrega;
  status_aprovacao: StatusAprovacao;
  comprador_responsavel: string;
  observacoes?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export interface ResumoMetricas {
  totalCompras: number;
  totalGasto: number;
  totalOrcado: number;
  totalEconomizado: number; // Saving em R$
  percentualSavingMedio: number; // %
  comprasNoPrazo: number;
  comprasEmAtraso: number;
  comprasPendentes: number;
  taxaPontualidade: number; // % de entregas no prazo sobre as concluídas
}

export function formatCurrency(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateBR(dateString?: string | null): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return cnpj;
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Calcula automaticamente o status de entrega com base nas datas:
 * - Se já foi entregue: compara data_efetiva_entrega com data_prevista_entrega
 * - Se ainda não foi entregue: se a data prevista já passou da data atual, está em atraso
 */
export function determinarStatusEntrega(
  dataPrevista: string,
  dataEfetiva?: string | null,
  statusAtual?: StatusEntrega
): StatusEntrega {
  if (statusAtual === 'cancelado') return 'cancelado';

  const hoje = new Date().toISOString().split('T')[0];

  if (dataEfetiva && dataEfetiva.trim() !== '') {
    // Já entregue
    if (dataEfetiva <= dataPrevista) {
      return 'no_prazo';
    } else {
      return 'em_atraso';
    }
  }

  // Ainda não entregue
  if (hoje > dataPrevista) {
    return 'em_atraso';
  }

  return 'pendente';
}

export function calcularSaving(valorOrcado: number, valorNegociado: number) {
  const economia = valorOrcado - valorNegociado;
  const percentual = valorOrcado > 0 ? (economia / valorOrcado) * 100 : 0;
  return {
    valorEconomizado: economia,
    percentualSaving: percentual,
  };
}
