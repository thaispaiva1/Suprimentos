import React, { useState } from 'react';
import { 
  Database, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Globe,
  ChevronRight,
  Code2
} from 'lucide-react';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  sincronizarTudoParaSupabase 
} from '../services/supabaseService.ts';
import { Compra } from '../types/procurement.ts';

interface SupabaseQuickConnectProps {
  onConnected: () => Promise<void>;
  onOpenModal: () => void;
  isSupabaseConnected: boolean;
  compras: Compra[];
}

export const SupabaseQuickConnect: React.FC<SupabaseQuickConnectProps> = ({
  onConnected,
  onOpenModal,
  isSupabaseConnected,
  compras,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [mostrarCampos, setMostrarCampos] = useState(!isSupabaseConnected);

  const handleConectar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      setFeedback({ success: false, message: 'Por favor, informe a URL e a Anon Key do Supabase.' });
      return;
    }

    try {
      setLoading(true);
      setFeedback(null);

      // 1. Testa a conexão
      const teste = await testSupabaseConnection(url.trim(), key.trim());
      if (!teste.success) {
        setFeedback(teste);
        setLoading(false);
        return;
      }

      // 2. Salva a configuração
      saveSupabaseConfig(url.trim(), key.trim());

      // 3. Tenta sincronizar as compras existentes se houver
      if (compras.length > 0) {
        await sincronizarTudoParaSupabase(compras);
      }

      // 4. Atualiza estado global
      await onConnected();
      setFeedback({ 
        success: true, 
        message: 'Conectado com sucesso! Seus dados agora estão prontos e sincronizados com o Supabase.' 
      });
      setMostrarCampos(false);
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Falha ao conectar com o Supabase.' });
    } finally {
      setLoading(false);
    }
  };

  if (isSupabaseConnected && !mostrarCampos) {
    return (
      <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Supabase Conectado & Ativo
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 font-semibold">
                Nuvem
              </span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-mono truncate max-w-md">
              URL: {url || currentConfig.url}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMostrarCampos(true)}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors border border-emerald-300 dark:border-emerald-800"
          >
            Alterar Chaves
          </button>
          <button
            onClick={onOpenModal}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs"
          >
            Ver Script SQL & Detalhes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-indigo-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-2xl p-5 shadow-sm space-y-4">
      
      {/* Header do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-800/60 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Conectar Chaves do Supabase (URL & ANON KEY)</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Cole sua <strong>Project URL</strong> e <strong>Anon Public Key</strong> para ativar a persistência em tempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center space-x-1"
          >
            <span>Painel Supabase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onOpenModal}
            className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center space-x-1"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Script SQL</span>
          </button>
        </div>
      </div>

      {/* Formulário Inline de Conexão */}
      <form onSubmit={handleConectar} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Campo URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Supabase Project URL *</span>
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://seu-projeto.supabase.co"
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          {/* Campo Anon Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Supabase Anon / Public Key *</span>
            </label>
            <input
              type="text"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

        </div>

        {/* Feedback de erro ou sucesso */}
        {feedback && (
          <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
            feedback.success 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800' 
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
          }`}>
            {feedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Botão de Conexão */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Dica: No Supabase, acesse <strong>Project Settings → API</strong> para copiar a URL e a Anon Key.
          </div>

          <button
            type="submit"
            disabled={loading || !url || !key}
            className="flex items-center space-x-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Testando & Conectando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Conectar Agora</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
