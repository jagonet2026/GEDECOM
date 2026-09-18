import { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Building2,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Agent, DistributionRecord, ReconciliationRecord, VoucherType, AgentStockSummary } from '../types';
import { calculateAllAgentsSummary, formatRupiah, formatDate } from '../utils/calculations';

interface StockMonitoringViewProps {
  agents: Agent[];
  distributions: DistributionRecord[];
  reconciliations: ReconciliationRecord[];
  voucherTypes: VoucherType[];
  onOpenDistributionForAgent: (agentId: string) => void;
  onOpenReconciliationForAgent: (agentId: string) => void;
  onOpenReportForAgent: (agentId: string) => void;
  onNavigateToVoucherTypes?: () => void;
}

export default function StockMonitoringView({
  agents,
  distributions,
  reconciliations,
  voucherTypes,
  onOpenDistributionForAgent,
  onOpenReconciliationForAgent,
  onOpenReportForAgent,
  onNavigateToVoucherTypes,
}: StockMonitoringViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoucherFilter, setSelectedVoucherFilter] = useState<string>('all');
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  // Calculate real-time summaries for all agents
  const agentSummaries: AgentStockSummary[] = useMemo(() => {
    return calculateAllAgentsSummary(agents, distributions, reconciliations, voucherTypes);
  }, [agents, distributions, reconciliations, voucherTypes]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return agentSummaries.filter((summary) => {
      const matchSearch =
        summary.agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.agent.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.agent.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.agent.phone.includes(searchTerm);

      if (!matchSearch) return false;

      if (selectedVoucherFilter !== 'all') {
        const vtItem = summary.byVoucherType[selectedVoucherFilter];
        return vtItem && (vtItem.distributed > 0 || vtItem.remaining > 0);
      }

      return true;
    });
  }, [agentSummaries, searchTerm, selectedVoucherFilter]);

  // Stock totals across all agents per voucher type
  const voucherTypeMatrix = useMemo(() => {
    return voucherTypes.map((vt) => {
      let totalDist = 0;
      let totalSold = 0;
      let totalRet = 0;
      let totalDmg = 0;
      let totalRem = 0;
      let totalNet = 0;

      agentSummaries.forEach((as) => {
        const item = as.byVoucherType[vt.id];
        if (item) {
          totalDist += item.distributed;
          totalSold += item.sold;
          totalRet += item.returned;
          totalDmg += item.damaged;
          totalRem += item.remaining;
          totalNet += item.netDeposit;
        }
      });

      return {
        voucherType: vt,
        totalDist,
        totalSold,
        totalRet,
        totalDmg,
        totalRem,
        totalNet,
      };
    });
  }, [voucherTypes, agentSummaries]);

  const toggleExpand = (agentId: string) => {
    setExpandedAgentId(expandedAgentId === agentId ? null : agentId);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-agent"
            type="text"
            placeholder="Cari agen, pemilik, kontak, atau lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Voucher:</label>
          <select
            id="select-voucher-filter"
            value={selectedVoucherFilter}
            onChange={(e) => setSelectedVoucherFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">Semua Jenis Voucher</option>
            {voucherTypes.map((vt) => (
              <option key={vt.id} value={vt.id}>
                {vt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Stock Per Voucher Type Summary Matrix */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Matriks Real-Time Stok & Penjualan Per Jenis Voucher
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">
              Total {voucherTypes.length} Jenis Paket Hotspot
            </span>
            {onNavigateToVoucherTypes && (
              <button
                id="btn-goto-voucher-types"
                onClick={onNavigateToVoucherTypes}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Kelola Jenis Voucher</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-3 font-semibold">Jenis Voucher</th>
                <th className="py-2.5 px-3 font-semibold text-right">Harga Jual / Setor</th>
                <th className="py-2.5 px-3 font-semibold text-center">Terdistribusi</th>
                <th className="py-2.5 px-3 font-semibold text-center text-emerald-700">Terjual</th>
                <th className="py-2.5 px-3 font-semibold text-center text-blue-700">Retur</th>
                <th className="py-2.5 px-3 font-semibold text-center text-rose-700">Rusak</th>
                <th className="py-2.5 px-3 font-semibold text-center text-amber-700">Sisa Stok</th>
                <th className="py-2.5 px-3 font-semibold text-right text-indigo-700">Nilai Setoran Terkumpul</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {voucherTypeMatrix.map((item) => (
                <tr key={item.voucherType.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${item.voucherType.colorBadge}`}
                    >
                      {item.voucherType.name}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5">{item.voucherType.speed}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                    <div className="font-semibold text-slate-900">{formatRupiah(item.voucherType.priceUser)}</div>
                    <div className="text-[10px] text-slate-400">Setor: {formatRupiah(item.voucherType.priceAgent)}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                    {item.totalDist} <span className="text-[10px] text-slate-400">pcs</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600 bg-emerald-50/30">
                    {item.totalSold} <span className="text-[10px] text-emerald-600/70">pcs</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-medium text-blue-600">
                    {item.totalRet} <span className="text-[10px] text-blue-400">pcs</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-medium text-rose-600">
                    {item.totalDmg} <span className="text-[10px] text-rose-400">pcs</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-amber-700 bg-amber-50/40">
                    {item.totalRem} <span className="text-[10px] text-amber-600/70">pcs</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-indigo-700 font-mono">
                    {formatRupiah(item.totalNet)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Agent Stock List with Detailed Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Daftar Stok & Status Real-Time Per Agen ({filteredSummaries.length} Agen)
          </h2>
          <span className="text-xs text-slate-500">
            Klik baris agen untuk melihat rincian unit per jenis voucher
          </span>
        </div>

        {filteredSummaries.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-xs">
            Tidak ada agen yang sesuai dengan pencarian "{searchTerm}".
          </div>
        ) : (
          filteredSummaries.map((summary) => {
            const isExpanded = expandedAgentId === summary.agent.id;
            const soldRate =
              summary.totalDistributed > 0
                ? Math.round((summary.totalSold / summary.totalDistributed) * 100)
                : 0;

            // Find last distribution date for this agent
            const agentDists = distributions
              .filter((d) => d.agentId === summary.agent.id)
              .sort((a, b) => (a.date < b.date ? 1 : -1));
            const lastDistDate = agentDists[0]?.date;

            return (
              <div
                key={summary.agent.id}
                id={`agent-card-${summary.agent.id}`}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300/80 transition-all overflow-hidden"
              >
                {/* Header / Summary Row */}
                <div
                  onClick={() => toggleExpand(summary.agent.id)}
                  className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      className="mt-1 text-slate-400 hover:text-slate-600 transition-transform"
                      title={isExpanded ? 'Tutup Rincian' : 'Buka Rincian'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {summary.agent.name}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({summary.agent.ownerName})
                        </span>
                        {summary.agent.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            Non-aktif
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-slate-500 text-[11px] mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {summary.agent.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {summary.agent.phone}
                        </span>
                        {lastDistDate && (
                          <span className="inline-flex items-center gap-1 text-indigo-600">
                            <Clock className="w-3 h-3" />
                            Distribusi Terakhir: {formatDate(lastDistDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* High Level Numbers */}
                  <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="text-center min-w-[70px]">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">
                        Terdistribusi
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        {summary.totalDistributed} pcs
                      </div>
                    </div>

                    <div className="text-center min-w-[70px]">
                      <div className="text-[10px] uppercase font-semibold text-emerald-600">
                        Terjual
                      </div>
                      <div className="text-xs font-bold text-emerald-600">
                        {summary.totalSold} pcs
                        <span className="text-[10px] ml-0.5 text-slate-400">({soldRate}%)</span>
                      </div>
                    </div>

                    <div className="text-center min-w-[60px]">
                      <div className="text-[10px] uppercase font-semibold text-rose-500">
                        Rusak
                      </div>
                      <div className="text-xs font-bold text-rose-600">
                        {summary.totalDamaged} pcs
                      </div>
                    </div>

                    <div className="text-center min-w-[70px]">
                      <div className="text-[10px] uppercase font-semibold text-amber-600">
                        Sisa Stok
                      </div>
                      <div className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {summary.totalRemaining} pcs
                      </div>
                    </div>

                    <div className="text-right min-w-[110px]">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">
                        Wajib Setor
                      </div>
                      <div className="text-xs font-black text-indigo-700 font-mono">
                        {formatRupiah(summary.totalNetDepositDue)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details per Voucher Type + Action Bar */}
                {isExpanded && (
                  <div className="bg-slate-50/80 p-4 border-t border-slate-200/80">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Rincian Unit Per Jenis Voucher untuk {summary.agent.name}
                      </h4>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          id={`btn-distribute-to-${summary.agent.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDistributionForAgent(summary.agent.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>+ Kirim Stok</span>
                        </button>

                        <button
                          id={`btn-reconcile-for-${summary.agent.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReconciliationForAgent(summary.agent.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-md transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Update Terjual/Retur</span>
                        </button>

                        <button
                          id={`btn-report-for-${summary.agent.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReportForAgent(summary.agent.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span>Lihat & Cetak Laporan</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
                            <th className="py-2 px-3 font-semibold">Jenis Voucher</th>
                            <th className="py-2 px-3 font-semibold text-right">Harga Jual</th>
                            <th className="py-2 px-3 font-semibold text-right">Harga Setor (Modal)</th>
                            <th className="py-2 px-3 font-semibold text-center">Terdistribusi</th>
                            <th className="py-2 px-3 font-semibold text-center text-emerald-700">Terjual</th>
                            <th className="py-2 px-3 font-semibold text-center text-blue-700">Retur</th>
                            <th className="py-2 px-3 font-semibold text-center text-rose-700">Rusak</th>
                            <th className="py-2 px-3 font-semibold text-center text-amber-700">Sisa di Agen</th>
                            <th className="py-2 px-3 font-semibold text-right">Komisi Agen</th>
                            <th className="py-2 px-3 font-semibold text-right text-indigo-700">Wajib Setor Bersih</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {voucherTypes.map((vt) => {
                            const item = summary.byVoucherType[vt.id];
                            if (!item) return null;

                            const hasActivity =
                              item.distributed > 0 ||
                              item.sold > 0 ||
                              item.returned > 0 ||
                              item.damaged > 0;

                            return (
                              <tr
                                key={vt.id}
                                className={`hover:bg-slate-50/80 ${
                                  !hasActivity ? 'opacity-40' : ''
                                }`}
                              >
                                <td className="py-2 px-3 font-medium">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${vt.colorBadge}`}
                                  >
                                    {vt.name}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-600">
                                  {formatRupiah(vt.priceUser)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-600">
                                  {formatRupiah(vt.priceAgent)}
                                </td>
                                <td className="py-2 px-3 text-center font-medium text-slate-800">
                                  {item.distributed} pcs
                                </td>
                                <td className="py-2 px-3 text-center font-bold text-emerald-600">
                                  {item.sold} pcs
                                </td>
                                <td className="py-2 px-3 text-center text-blue-600 font-medium">
                                  {item.returned} pcs
                                </td>
                                <td className="py-2 px-3 text-center text-rose-600 font-medium">
                                  {item.damaged} pcs
                                </td>
                                <td className="py-2 px-3 text-center font-bold text-amber-700 bg-amber-50/50">
                                  {item.remaining} pcs
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-600">
                                  {formatRupiah(item.agentCommission)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">
                                  {formatRupiah(item.netDeposit)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-100 font-semibold text-slate-800 border-t border-slate-200">
                          <tr>
                            <td colSpan={3} className="py-2 px-3 text-right">
                              Total Akumulasi Agen:
                            </td>
                            <td className="py-2 px-3 text-center">{summary.totalDistributed} pcs</td>
                            <td className="py-2 px-3 text-center text-emerald-700">{summary.totalSold} pcs</td>
                            <td className="py-2 px-3 text-center text-blue-700">{summary.totalReturned} pcs</td>
                            <td className="py-2 px-3 text-center text-rose-700">{summary.totalDamaged} pcs</td>
                            <td className="py-2 px-3 text-center text-amber-800 font-bold">
                              {summary.totalRemaining} pcs
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {formatRupiah(summary.totalAgentCommission)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-black text-indigo-800">
                              {formatRupiah(summary.totalNetDepositDue)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {summary.totalDamaged > 0 && (
                      <div className="mt-2.5 p-2 bg-rose-50 rounded-lg border border-rose-200 text-[11px] text-rose-800 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>
                          Tercatat {summary.totalDamaged} voucher rusak pada agen ini dengan estimasi kerugian modal senilai{' '}
                          <strong>{formatRupiah(summary.totalDamagedLoss)}</strong>. Lihat rincian di tab Voucher Rusak.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
