import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  ExternalLink,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  sincronizarTudoParaSupabase,
  SUPABASE_SETUP_SQL 
} from '../services/supabaseService.ts';
import { Compra } from '../types/procurement.ts';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  compras: Compra[];
  onRefreshData: () => Promise<void>;
  isSupabaseConnected: boolean;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  compras,
  onRefreshData,
  isSupabaseConnected,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [testando, setTestando] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{ success: boolean; message: string } | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [msgSincronizacao, setMsgSincronizacao] = useState('');
  const [copiado, setCopiado] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestando(true);
    setResultadoTeste(null);
    const res = await testSupabaseConnection(url, key);
    setResultadoTeste(res);
    setTestando(false);
  };

  const handleSaveAndConnect = async () => {
    saveSupabaseConfig(url, key);
    await onRefreshData();
    setResultadoTeste({ success: true, message: 'Configurações salvas! Sistema conectado ao Supabase.' });
  };

  const handleDisconnect = async () => {
    saveSupabaseConfig('', '');
    setUrl('');
    setKey('');
    setResultadoTeste(null);
    await onRefreshData();
  };

  const handleSyncToSupabase = async () => {
    setSincronizando(true);
    setMsgSincronizacao('');
    const res = await sincronizarTudoParaSupabase(compras);
    if (res.error) {
      setMsgSincronizacao(`Erro: ${res.error}`);
    } else {
      setMsgSincronizacao(`${res.count} compras sincronizadas com sucesso para o banco de dados Supabase!`);
      await onRefreshData();
    }
    setSincronizando(false);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Conexão com Banco de Dados Supabase</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isSupabaseConnected 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {isSupabaseConnected ? 'Conectado' : 'Modo Local / Pronto para Conectar'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Armazene e consulte suas compras com segurança na nuvem PostgreSQL do Supabase
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

        {/* Conteúdo */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Instruções amigáveis */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Como conectar ao seu projeto Supabase:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 ml-1">
              <li>Acesse seu painel no <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 underline font-medium inline-flex items-center space-x-0.5"><span>Supabase.com</span> <ExternalLink className="w-3 h-3 ml-0.5 inline" /></a></li>
              <li>Vá em <strong>Project Settings → API</strong> e copie a <strong>Project URL</strong> e a <strong>anon public API key</strong></li>
              <li>Cole as credenciais abaixo e clique em <strong>Testar & Salvar Conexão</strong></li>
            </ol>
          </div>

          {/* Campos de credenciais */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Project URL *
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://seu-projeto.supabase.co"
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Anon / Public Key *
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Feedback de teste */}
          {resultadoTeste && (
            <div className={`p-3 rounded-lg text-xs flex items-start space-x-2 border ${
              resultadoTeste.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}>
              {resultadoTeste.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold block">{resultadoTeste.success ? 'Sucesso!' : 'Atenção:'}</span>
                <span>{resultadoTeste.message}</span>
              </div>
            </div>
          )}

          {/* Ações de conexão */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleTestConnection}
              disabled={testando || !url || !key}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testando ? 'animate-spin' : ''}`} />
              <span>{testando ? 'Testando...' : 'Testar Conexão'}</span>
            </button>

            <button
              onClick={handleSaveAndConnect}
              disabled={!url || !key}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 disabled:opacity-40 transition-all flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar e Conectar</span>
            </button>

            {isSupabaseConnected && (
              <>
                <button
                  onClick={handleSyncToSupabase}
                  disabled={sincronizando}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center space-x-1.5"
                  title="Sincroniza as compras locais para o banco no Supabase"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{sincronizando ? 'Sincronizando...' : `Enviar Dados Locais (${compras.length})`}</span>
                </button>

                <button
                  onClick={handleDisconnect}
                  className="px-3 py-2 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors ml-auto"
                >
                  Desconectar
                </button>
              </>
            )}
          </div>

          {msgSincronizacao && (
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 text-xs border border-indigo-200 dark:border-indigo-800">
              {msgSincronizacao}
            </div>
          )}

          {/* Script SQL para criação da tabela no Supabase */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Script SQL de Criação da Tabela (Supabase SQL Editor)</span>
              </div>
              <button
                onClick={handleCopySQL}
                className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors"
              >
                {copiado ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-40 border border-slate-800 leading-relaxed">
              {SUPABASE_SETUP_SQL}
            </pre>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Basta copiar este script, acessar o <strong>SQL Editor</strong> no Supabase e clicar em <strong>Run</strong>. A tabela estará 100% pronta para persistir todas as compras da sua empresa nacional.
            </p>
          </div>

        </div>

        {/* Rodapé */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
