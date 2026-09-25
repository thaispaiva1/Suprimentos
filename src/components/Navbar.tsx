import React from 'react';
import { 
  Building2, 
  Moon, 
  Sun, 
  Database, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Download,
  PackageCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';

interface NavbarProps {
  onOpenNovaCompra: () => void;
  onOpenSupabase: () => void;
  isSupabaseConnected: boolean;
  onExportCSV: () => void;
  totalCompras: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNovaCompra,
  onOpenSupabase,
  isSupabaseConnected,
  onExportCSV,
  totalCompras,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-emerald-600 dark:text-emerald-400">
                  Supri
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sistema de Gestão de Suprimentos & Saving
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Supabase Status / Setup Button */}
            <button
              onClick={onOpenSupabase}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                isSupabaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Configurar Conexão com Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isSupabaseConnected ? 'Supabase: Conectado' : 'Supabase: Modo Local'}
              </span>
              <span className="sm:hidden">
                {isSupabaseConnected ? 'Nuvem' : 'Local'}
              </span>
              {isSupabaseConnected ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
              title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
              aria-label="Alternar tema"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Export CSV Button */}
            {totalCompras > 0 && (
              <button
                onClick={onExportCSV}
                className="hidden md:flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                title="Exportar dados para planilha CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            )}

            {/* Nova Compra Action */}
            <button
              onClick={onOpenNovaCompra}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 hover:shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Compra</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
