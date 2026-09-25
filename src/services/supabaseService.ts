import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Compra } from '../types/procurement.ts';
import { INITIAL_COMPRAS } from '../data/mockCompras.ts';

const STORAGE_KEY_COMPRAS = 'suprinac_compras_data_v1';
const STORAGE_KEY_SUPABASE_URL = 'suprinac_supabase_url';
const STORAGE_KEY_SUPABASE_ANON_KEY = 'suprinac_supabase_key';

let cachedClient: SupabaseClient | null = null;
let currentConfig: { url: string; key: string } = { url: '', key: '' };

export const SUPABASE_SETUP_SQL = `-- =========================================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO SUPABASE (BANCO DE DADOS & STORAGE)
-- Sistema Supri - Gestão de Suprimentos & Compras
-- Copie e cole no painel: Supabase -> SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. TABELA PRINCIPAL DE COMPRAS
CREATE TABLE IF NOT EXISTS public.compras (
  id TEXT PRIMARY KEY,
  numero_pedido TEXT NOT NULL,
  descricao TEXT NOT NULL,
  fornecedor TEXT NOT NULL,
  cnpj_fornecedor TEXT,
  categoria TEXT NOT NULL,
  departamento TEXT NOT NULL,
  data_pedido DATE NOT NULL,
  data_prevista_entrega DATE NOT NULL,
  data_efetiva_entrega DATE,
  valor_orcado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_negociado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status_entrega TEXT NOT NULL DEFAULT 'pendente',
  status_aprovacao TEXT NOT NULL DEFAULT 'aprovado',
  comprador_responsavel TEXT,
  observacoes TEXT,
  anexos JSONB DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ÍNDICES DE PERFORMANCE PARA O DASHBOARD
CREATE INDEX IF NOT EXISTS idx_compras_data_pedido ON public.compras(data_pedido DESC);
CREATE INDEX IF NOT EXISTS idx_compras_status_entrega ON public.compras(status_entrega);
CREATE INDEX IF NOT EXISTS idx_compras_fornecedor ON public.compras(fornecedor);
CREATE INDEX IF NOT EXISTS idx_compras_categoria ON public.compras(categoria);

-- 3. GATILHO AUTOMÁTICO PARA ATUALIZAÇÃO DE DATA (atualizado_em)
CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_compras_atualizado_em ON public.compras;
CREATE TRIGGER trigger_compras_atualizado_em
BEFORE UPDATE ON public.compras
FOR EACH ROW
EXECUTE FUNCTION public.set_atualizado_em();

-- 4. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) NA TABELA COMPRAS
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso na tabela de compras (anon e authenticated)
DROP POLICY IF EXISTS "Politica de Leitura de Compras" ON public.compras;
CREATE POLICY "Politica de Leitura de Compras" 
ON public.compras FOR SELECT 
TO public, anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Politica de Insercao de Compras" ON public.compras;
CREATE POLICY "Politica de Insercao de Compras" 
ON public.compras FOR INSERT 
TO public, anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Politica de Atualizacao de Compras" ON public.compras;
CREATE POLICY "Politica de Atualizacao de Compras" 
ON public.compras FOR UPDATE 
TO public, anon, authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Politica de Exclusao de Compras" ON public.compras;
CREATE POLICY "Politica de Exclusao de Compras" 
ON public.compras FOR DELETE 
TO public, anon, authenticated 
USING (true);

-- =========================================================================
-- 5. CONFIGURAÇÃO DO BUCKET DE ARMAZENAMENTO (SUPABASE STORAGE)
-- Bucket para notas fiscais, pedidos em PDF, comprovantes e cotações
-- =========================================================================

-- Criação do Bucket de Armazenamento 'compras-anexos'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'compras-anexos',
  'compras-anexos',
  true,
  52428800, -- Limite de 50MB por arquivo
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800;

-- 6. POLÍTICAS DE SEGURANÇA DE ARMAZENAMENTO (STORAGE RLS)
-- Permite leitura e download de documentos anexos
DROP POLICY IF EXISTS "Permitir Leitura e Download de Anexos" ON storage.objects;
CREATE POLICY "Permitir Leitura e Download de Anexos"
ON storage.objects FOR SELECT
TO public, anon, authenticated
USING (bucket_id = 'compras-anexos');

-- Permite upload de notas fiscais, propostas e comprovantes
DROP POLICY IF EXISTS "Permitir Upload de Anexos" ON storage.objects;
CREATE POLICY "Permitir Upload de Anexos"
ON storage.objects FOR INSERT
TO public, anon, authenticated
WITH CHECK (bucket_id = 'compras-anexos');

-- Permite atualizar/substituir anexos existentes
DROP POLICY IF EXISTS "Permitir Atualizacao de Anexos" ON storage.objects;
CREATE POLICY "Permitir Atualizacao de Anexos"
ON storage.objects FOR UPDATE
TO public, anon, authenticated
USING (bucket_id = 'compras-anexos')
WITH CHECK (bucket_id = 'compras-anexos');

-- Permite remover anexos excluídos
DROP POLICY IF EXISTS "Permitir Exclusao de Anexos" ON storage.objects;
CREATE POLICY "Permitir Exclusao de Anexos"
ON storage.objects FOR DELETE
TO public, anon, authenticated
USING (bucket_id = 'compras-anexos');
`;

export function getStoredSupabaseConfig() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem(STORAGE_KEY_SUPABASE_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_SUPABASE_ANON_KEY) || '';

  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
    isConfigured: Boolean((localUrl || envUrl) && (localKey || envKey)),
  };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url.trim() && key.trim()) {
    localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_SUPABASE_ANON_KEY, key.trim());
    cachedClient = createClient(url.trim(), key.trim());
    currentConfig = { url: url.trim(), key: key.trim() };
  } else {
    localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEY_SUPABASE_ANON_KEY);
    cachedClient = null;
    currentConfig = { url: '', key: '' };
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.isConfigured) return null;

  if (!cachedClient || currentConfig.url !== config.url || currentConfig.key !== config.key) {
    try {
      cachedClient = createClient(config.url, config.key);
      currentConfig = { url: config.url, key: config.key };
    } catch (e) {
      console.error('Falha ao instanciar Supabase client:', e);
      return null;
    }
  }

  return cachedClient;
}

export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string }> {
  const testUrl = url || getStoredSupabaseConfig().url;
  const testKey = key || getStoredSupabaseConfig().key;

  if (!testUrl || !testKey) {
    return { success: false, message: 'URL ou Chave Anônima não fornecidas.' };
  }

  try {
    const client = createClient(testUrl, testKey);
    // Tenta consultar a tabela compras
    const { data, error } = await client.from('compras').select('id').limit(1);

    if (error) {
      // Se der erro de tabela inexistente
      if (error.code === '42P01' || error.message.includes('relation "compras" does not exist')) {
        return {
          success: true,
          message: 'Conectado ao Supabase com sucesso! A tabela "compras" ainda não foi criada. Copie o script SQL abaixo e execute no SQL Editor.',
        };
      }
      return { success: false, message: `Erro do Supabase: ${error.message}` };
    }

    return {
      success: true,
      message: `Conexão bem-sucedida! Tabela 'compras' encontrada (${data?.length ?? 0} registros encontrados).`,
    };
  } catch (err: any) {
    return { success: false, message: `Falha de conexão: ${err.message || 'Verifique a URL e a Chave'}` };
  }
}

/**
 * Persistência LocalStorage para modo offline ou fallback
 */
export function getLocalCompras(): Compra[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_COMPRAS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY_COMPRAS, JSON.stringify(INITIAL_COMPRAS));
      return INITIAL_COMPRAS;
    }
    return JSON.parse(stored);
  } catch (e) {
    console.error('Erro ao ler compras do localStorage', e);
    return INITIAL_COMPRAS;
  }
}

export function saveLocalCompras(compras: Compra[]) {
  try {
    localStorage.setItem(STORAGE_KEY_COMPRAS, JSON.stringify(compras));
  } catch (e) {
    console.error('Erro ao salvar compras no localStorage', e);
  }
}

/**
 * Operações CRUD unificadas (Supabase prioritário com sincronização e fallback transparente)
 */
export async function carregarCompras(): Promise<{ compras: Compra[]; isSupabase: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('compras')
        .select('*')
        .order('data_pedido', { ascending: false });

      if (error) {
        console.warn('Erro ao carregar do Supabase, recorrendo ao LocalStorage:', error.message);
        return { compras: getLocalCompras(), isSupabase: false, error: error.message };
      }

      if (data && data.length > 0) {
        // Atualiza cache local
        saveLocalCompras(data as Compra[]);
        return { compras: data as Compra[], isSupabase: true };
      } else {
        // Se a tabela estiver vazia no Supabase, retorna os dados locais e permite sincronizar
        const local = getLocalCompras();
        return { compras: local, isSupabase: true };
      }
    } catch (err: any) {
      console.error('Falha de rede com Supabase:', err);
      return { compras: getLocalCompras(), isSupabase: false, error: err.message };
    }
  }

  return { compras: getLocalCompras(), isSupabase: false };
}

export async function salvarNovaCompra(compra: Compra): Promise<{ success: boolean; isSupabase: boolean; error?: string }> {
  // 1. Salva no localStorage
  const current = getLocalCompras();
  const updated = [compra, ...current];
  saveLocalCompras(updated);

  // 2. Se Supabase estiver conectado, insere na nuvem
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('compras').insert([compra]);
      if (error) {
        console.error('Erro ao inserir no Supabase:', error);
        return { success: true, isSupabase: false, error: `Salvo localmente. Erro no Supabase: ${error.message}` };
      }
      return { success: true, isSupabase: true };
    } catch (err: any) {
      return { success: true, isSupabase: false, error: err.message };
    }
  }

  return { success: true, isSupabase: false };
}

export async function atualizarCompra(compra: Compra): Promise<{ success: boolean; isSupabase: boolean; error?: string }> {
  // 1. Atualiza no localStorage
  const current = getLocalCompras();
  const updated = current.map((c) => (c.id === compra.id ? compra : c));
  saveLocalCompras(updated);

  // 2. Atualiza no Supabase
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('compras').update(compra).eq('id', compra.id);
      if (error) {
        return { success: true, isSupabase: false, error: error.message };
      }
      return { success: true, isSupabase: true };
    } catch (err: any) {
      return { success: true, isSupabase: false, error: err.message };
    }
  }

  return { success: true, isSupabase: false };
}

export async function deletarCompra(id: string): Promise<{ success: boolean; isSupabase: boolean; error?: string }> {
  // 1. Remove do localStorage
  const current = getLocalCompras();
  const updated = current.filter((c) => c.id !== id);
  saveLocalCompras(updated);

  // 2. Remove do Supabase
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('compras').delete().eq('id', id);
      if (error) {
        return { success: true, isSupabase: false, error: error.message };
      }
      return { success: true, isSupabase: true };
    } catch (err: any) {
      return { success: true, isSupabase: false, error: err.message };
    }
  }

  return { success: true, isSupabase: false };
}

export async function sincronizarTudoParaSupabase(compras: Compra[]): Promise<{ count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { count: 0, error: 'Supabase não está configurado.' };
  }

  try {
    const { data, error } = await client.from('compras').upsert(compras, { onConflict: 'id' });
    if (error) {
      return { count: 0, error: error.message };
    }
    return { count: compras.length };
  } catch (err: any) {
    return { count: 0, error: err.message || 'Falha ao sincronizar' };
  }
}
