import { useState } from 'react';
import {
  Wifi,
  BarChart3,
  Send,
  CheckSquare,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  Tag,
  Plus,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { resetToFactoryData } from '../utils/storage';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewDistribution: () => void;
  onOpenNewReconciliation: () => void;
  onOpenAddAgent: () => void;
  onOpenAddDamaged: () => void;
  onDataReset: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  onOpenNewDistribution,
  onOpenNewReconciliation,
  onOpenAddAgent,
  onOpenAddDamaged,
  onDataReset,
  onExportJson,
  onImportJson,
}: HeaderProps) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const tabs = [
    { id: 'monitoring', label: 'Monitoring Stok', icon: BarChart3 },
    { id: 'distribution', label: 'Distribusi Voucher', icon: Send },
    { id: 'reconciliation', label: 'Penjualan & Retur', icon: CheckSquare },
    { id: 'damaged', label: 'Voucher Rusak & Audit', icon: AlertTriangle },
    { id: 'reports', label: 'Laporan Excel & PDF', icon: FileSpreadsheet },
    { id: 'voucher-types', label: 'Jenis Voucher', icon: Tag },
    { id: 'agents', label: 'Kelola Agen', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar: Brand + Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  WiFi Voucher Agent Stock & Distribution
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Real-time
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sistem Monitoring Stok, Distribusi, Penjualan, Retur & Rekonsiliasi Agen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
            <button
              id="btn-quick-distribute"
              onClick={onOpenNewDistribution}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>+ Distribusi</span>
            </button>

            <button
              id="btn-quick-reconciliation"
              onClick={onOpenNewReconciliation}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>+ Catat Terjual/Retur</span>
            </button>

            <button
              id="btn-quick-damaged"
              onClick={onOpenAddDamaged}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>+ Voucher Rusak</span>
            </button>

            {/* Menu backup/reset data */}
            <div className="relative">
              <button
                id="btn-toggle-settings"
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Cadangkan & Pengaturan Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {showSettingsMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 text-xs text-slate-700"
                  onClick={() => setShowSettingsMenu(false)}
                >
                  <div className="px-3 py-1 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    Manajemen Data
                  </div>
                  <button
                    onClick={onExportJson}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cadangkan Data (JSON)</span>
                  </button>
                  <label className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Pulihkan Data (JSON)</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onImportJson(file);
                      }}
                    />
                  </label>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          'Kembalikan data ke contoh awal bawaan? Perubahan kustom Anda akan diatur ulang.'
                        )
                      ) {
                        resetToFactoryData();
                        onDataReset();
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset ke Data Contoh</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
