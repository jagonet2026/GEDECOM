import { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import KpiMetrics from './components/KpiMetrics';
import StockMonitoringView from './components/StockMonitoringView';
import DistributionManager from './components/DistributionManager';
import ReconciliationManager from './components/ReconciliationManager';
import DamagedVoucherTracker from './components/DamagedVoucherTracker';
import ReportsView from './components/ReportsView';
import AgentManagerModal from './components/AgentManagerModal';
import VoucherTypeManager from './components/VoucherTypeManager';
import {
  Agent,
  DistributionRecord,
  ReconciliationRecord,
  VoucherType,
  DamagedVoucherLog,
} from './types';
import { loadStoredData, saveStoredData, resetToFactoryData } from './utils/storage';
import { calculateAllAgentsSummary } from './utils/calculations';

export default function App() {
  // Master state initialized from localStorage / initial seed data
  const [data, setData] = useState(() => loadStoredData());

  const [activeTab, setActiveTab] = useState<string>('monitoring');

  // Contextual modal triggers
  const [targetAgentIdForAction, setTargetAgentIdForAction] = useState<string | null>(null);
  const [isNewDistModalOpen, setIsNewDistModalOpen] = useState(false);
  const [isNewRecModalOpen, setIsNewRecModalOpen] = useState(false);
  const [isNewDamagedModalOpen, setIsNewDamagedModalOpen] = useState(false);

  // Save to localStorage on any state modification
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  // Aggregate KPI calculations
  const globalKpi = useMemo(() => {
    const agentSummaries = calculateAllAgentsSummary(
      data.agents,
      data.distributions,
      data.reconciliations,
      data.voucherTypes
    );

    let totalDistributed = 0;
    let totalSold = 0;
    let totalReturned = 0;
    let totalDamaged = 0;
    let totalRemaining = 0;
    let totalGrossSales = 0;
    let totalAgentCommission = 0;
    let totalNetDepositDue = 0;
    let totalDamagedLoss = 0;

    agentSummaries.forEach((as) => {
      totalDistributed += as.totalDistributed;
      totalSold += as.totalSold;
      totalReturned += as.totalReturned;
      totalDamaged += as.totalDamaged;
      totalRemaining += as.totalRemaining;
      totalGrossSales += as.totalGrossSales;
      totalAgentCommission += as.totalAgentCommission;
      totalNetDepositDue += as.totalNetDepositDue;
      totalDamagedLoss += as.totalDamagedLoss;
    });

    return {
      totalDistributed,
      totalSold,
      totalReturned,
      totalDamaged,
      totalRemaining,
      totalGrossSales,
      totalAgentCommission,
      totalNetDepositDue,
      totalDamagedLoss,
    };
  }, [data]);

  // Handlers for Distribution
  const handleAddDistribution = (newDist: DistributionRecord) => {
    setData((prev) => ({
      ...prev,
      distributions: [newDist, ...prev.distributions],
    }));
  };

  const handleDeleteDistribution = (id: string) => {
    setData((prev) => ({
      ...prev,
      distributions: prev.distributions.filter((d) => d.id !== id),
    }));
  };

  // Handlers for Reconciliation
  const handleAddReconciliation = (
    newRec: ReconciliationRecord,
    autoDamagedLogs?: DamagedVoucherLog[]
  ) => {
    setData((prev) => {
      const updatedRecs = [newRec, ...prev.reconciliations];
      const updatedDamaged = autoDamagedLogs && autoDamagedLogs.length > 0
        ? [...autoDamagedLogs, ...prev.damagedLogs]
        : prev.damagedLogs;

      return {
        ...prev,
        reconciliations: updatedRecs,
        damagedLogs: updatedDamaged,
      };
    });
  };

  const handleUpdateReconciliationStatus = (
    id: string,
    status: 'draft' | 'verified' | 'settled'
  ) => {
    setData((prev) => ({
      ...prev,
      reconciliations: prev.reconciliations.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              settledDate: status === 'settled' ? new Date().toISOString().slice(0, 10) : undefined,
            }
          : r
      ),
    }));
  };

  const handleDeleteReconciliation = (id: string) => {
    setData((prev) => ({
      ...prev,
      reconciliations: prev.reconciliations.filter((r) => r.id !== id),
    }));
  };

  // Handlers for Damaged Vouchers
  const handleAddDamagedLog = (newLog: DamagedVoucherLog) => {
    setData((prev) => ({
      ...prev,
      damagedLogs: [newLog, ...prev.damagedLogs],
    }));
  };

  const handleDeleteDamagedLog = (id: string) => {
    setData((prev) => ({
      ...prev,
      damagedLogs: prev.damagedLogs.filter((d) => d.id !== id),
    }));
  };

  const handleUpdateDamagedAction = (
    id: string,
    actionTaken: 'written_off' | 'replaced' | 'under_review'
  ) => {
    setData((prev) => ({
      ...prev,
      damagedLogs: prev.damagedLogs.map((d) =>
        d.id === id ? { ...d, actionTaken } : d
      ),
    }));
  };

  // Handlers for Agents
  const handleAddAgent = (newAgent: Agent) => {
    setData((prev) => ({
      ...prev,
      agents: [...prev.agents, newAgent],
    }));
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    setData((prev) => ({
      ...prev,
      agents: prev.agents.map((a) => (a.id === updatedAgent.id ? updatedAgent : a)),
    }));
  };

  const handleDeleteAgent = (id: string) => {
    setData((prev) => ({
      ...prev,
      agents: prev.agents.filter((a) => a.id !== id),
    }));
  };

  // Handlers for Voucher Types
  const handleAddVoucherType = (newType: VoucherType) => {
    setData((prev) => ({
      ...prev,
      voucherTypes: [...prev.voucherTypes, newType],
    }));
  };

  const handleUpdateVoucherType = (updatedType: VoucherType) => {
    setData((prev) => ({
      ...prev,
      voucherTypes: prev.voucherTypes.map((vt) =>
        vt.id === updatedType.id ? updatedType : vt
      ),
    }));
  };

  const handleDeleteVoucherType = (id: string) => {
    setData((prev) => ({
      ...prev,
      voucherTypes: prev.voucherTypes.filter((vt) => vt.id !== id),
    }));
  };

  // Reset & Backup Handlers
  const handleDataReset = () => {
    setData(loadStoredData());
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_wifi_voucher_agents_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.agents && parsed.distributions && parsed.voucherTypes) {
          setData(parsed);
          alert('Data berhasil dipulihkan dari file JSON backup.');
        } else {
          alert('Format file JSON tidak sesuai dengan skema data aplikasi.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  // Jump from Agent card in monitoring to other tabs
  const handleOpenDistributionForAgent = (agentId: string) => {
    setTargetAgentIdForAction(agentId);
    setActiveTab('distribution');
  };

  const handleOpenReconciliationForAgent = (agentId: string) => {
    setTargetAgentIdForAction(agentId);
    setActiveTab('reconciliation');
  };

  const handleOpenReportForAgent = (agentId: string) => {
    setTargetAgentIdForAction(agentId);
    setActiveTab('reports');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewDistribution={() => {
          setTargetAgentIdForAction(null);
          setActiveTab('distribution');
        }}
        onOpenNewReconciliation={() => {
          setTargetAgentIdForAction(null);
          setActiveTab('reconciliation');
        }}
        onOpenAddAgent={() => {
          setActiveTab('agents');
        }}
        onOpenAddDamaged={() => {
          setActiveTab('damaged');
        }}
        onDataReset={handleDataReset}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Metrics Strip (visible on all tabs except print) */}
        <div className="print:hidden">
          <KpiMetrics
            totalDistributed={globalKpi.totalDistributed}
            totalSold={globalKpi.totalSold}
            totalReturned={globalKpi.totalReturned}
            totalDamaged={globalKpi.totalDamaged}
            totalRemaining={globalKpi.totalRemaining}
            totalGrossSales={globalKpi.totalGrossSales}
            totalAgentCommission={globalKpi.totalAgentCommission}
            totalNetDepositDue={globalKpi.totalNetDepositDue}
            totalDamagedLoss={globalKpi.totalDamagedLoss}
          />
        </div>

        {/* Tab 1: Monitoring Stok & Agen */}
        {activeTab === 'monitoring' && (
          <StockMonitoringView
            agents={data.agents}
            distributions={data.distributions}
            reconciliations={data.reconciliations}
            voucherTypes={data.voucherTypes}
            onOpenDistributionForAgent={handleOpenDistributionForAgent}
            onOpenReconciliationForAgent={handleOpenReconciliationForAgent}
            onOpenReportForAgent={handleOpenReportForAgent}
            onNavigateToVoucherTypes={() => setActiveTab('voucher-types')}
          />
        )}

        {/* Tab 2: Distribusi Baru & Riwayat */}
        {activeTab === 'distribution' && (
          <DistributionManager
            agents={data.agents}
            distributions={data.distributions}
            voucherTypes={data.voucherTypes}
            onAddDistribution={handleAddDistribution}
            onDeleteDistribution={handleDeleteDistribution}
            preselectedAgentId={targetAgentIdForAction}
            isOpenModalInitially={Boolean(targetAgentIdForAction)}
          />
        )}

        {/* Tab 3: Rekonsiliasi & Penjualan/Retur */}
        {activeTab === 'reconciliation' && (
          <ReconciliationManager
            agents={data.agents}
            distributions={data.distributions}
            reconciliations={data.reconciliations}
            voucherTypes={data.voucherTypes}
            onAddReconciliation={handleAddReconciliation}
            onUpdateReconciliationStatus={handleUpdateReconciliationStatus}
            onDeleteReconciliation={handleDeleteReconciliation}
            preselectedAgentId={targetAgentIdForAction}
            isOpenModalInitially={Boolean(targetAgentIdForAction)}
          />
        )}

        {/* Tab 4: Voucher Rusak & Audit Kerugian */}
        {activeTab === 'damaged' && (
          <DamagedVoucherTracker
            agents={data.agents}
            voucherTypes={data.voucherTypes}
            damagedLogs={data.damagedLogs}
            totalDistributed={globalKpi.totalDistributed}
            onAddDamagedLog={handleAddDamagedLog}
            onDeleteDamagedLog={handleDeleteDamagedLog}
            onUpdateDamagedAction={handleUpdateDamagedAction}
          />
        )}

        {/* Tab 5: Laporan Excel & PDF */}
        {activeTab === 'reports' && (
          <ReportsView
            agents={data.agents}
            distributions={data.distributions}
            reconciliations={data.reconciliations}
            voucherTypes={data.voucherTypes}
            damagedLogs={data.damagedLogs}
            preselectedAgentId={targetAgentIdForAction}
          />
        )}

        {/* Tab 6: Kelola Jenis Voucher */}
        {activeTab === 'voucher-types' && (
          <VoucherTypeManager
            voucherTypes={data.voucherTypes}
            distributions={data.distributions}
            reconciliations={data.reconciliations}
            onAddVoucherType={handleAddVoucherType}
            onUpdateVoucherType={handleUpdateVoucherType}
            onDeleteVoucherType={handleDeleteVoucherType}
          />
        )}

        {/* Tab 7: Kelola Agen */}
        {activeTab === 'agents' && (
          <AgentManagerModal
            agents={data.agents}
            onAddAgent={handleAddAgent}
            onUpdateAgent={handleUpdateAgent}
            onDeleteAgent={handleDeleteAgent}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <strong>WiFi Hotspot Agent Manager</strong> — Sistem Distribusi, Rekonsiliasi & Monitoring Stok Voucher Agen
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Sinkronisasi Data Real-time</span>
            <span>Ekspor Excel (.xlsx) & PDF</span>
            <span>Audit Kerugian Fisik Voucher</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
