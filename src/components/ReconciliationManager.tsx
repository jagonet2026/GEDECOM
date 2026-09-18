import { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertOctagon,
  RotateCcw,
  Tag,
  DollarSign,
  Search,
  Eye,
  FileCheck,
} from 'lucide-react';
import {
  Agent,
  DistributionRecord,
  ReconciliationRecord,
  ReconciliationItem,
  VoucherType,
  DamagedVoucherLog,
} from '../types';
import { formatRupiah, formatDate } from '../utils/calculations';

interface ReconciliationManagerProps {
  agents: Agent[];
  distributions: DistributionRecord[];
  reconciliations: ReconciliationRecord[];
  voucherTypes: VoucherType[];
  onAddReconciliation: (
    newRec: ReconciliationRecord,
    autoDamagedLogs?: DamagedVoucherLog[]
  ) => void;
  onUpdateReconciliationStatus: (id: string, status: 'draft' | 'verified' | 'settled') => void;
  onDeleteReconciliation: (id: string) => void;
  preselectedAgentId?: string | null;
  isOpenModalInitially?: boolean;
}

export default function ReconciliationManager({
  agents,
  distributions,
  reconciliations,
  voucherTypes,
  onAddReconciliation,
  onUpdateReconciliationStatus,
  onDeleteReconciliation,
  preselectedAgentId,
  isOpenModalInitially = false,
}: ReconciliationManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(isOpenModalInitially);
  const [searchHistory, setSearchHistory] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form State
  const [agentId, setAgentId] = useState(preselectedAgentId || agents[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodMonth, setPeriodMonth] = useState(new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'draft' | 'verified' | 'settled'>('verified');

  // Form Items State: One item per voucher type with distributed, sold, returned, damaged, remaining
  const [formItems, setFormItems] = useState<ReconciliationItem[]>([]);
  const [formError, setFormError] = useState('');

  // Calculate distributed units for a given agent
  const getAgentDistributedQty = (targetAgentId: string, voucherTypeId: string): number => {
    return distributions
      .filter((d) => d.agentId === targetAgentId)
      .reduce((sum, d) => {
        const item = d.items.find((i) => i.voucherTypeId === voucherTypeId);
        return sum + (item?.quantity || 0);
      }, 0);
  };

  // Initialize or update form items whenever agentId changes
  useEffect(() => {
    if (!agentId) return;

    const initialItems: ReconciliationItem[] = voucherTypes.map((vt) => {
      const distributed = getAgentDistributedQty(agentId, vt.id);
      return {
        voucherTypeId: vt.id,
        distributedQty: distributed,
        soldQty: 0,
        returnedQty: 0,
        damagedQty: 0,
        remainingQty: distributed,
        damageReason: '',
        priceUser: vt.priceUser,
        priceAgent: vt.priceAgent,
      };
    });

    setFormItems(initialItems);
  }, [agentId, distributions, voucherTypes]);

  const handleOpenModal = (targetAgentId?: string) => {
    const selected = targetAgentId || agents[0]?.id || '';
    setAgentId(selected);

    const itemsForAgent: ReconciliationItem[] = voucherTypes.map((vt) => {
      const distributed = getAgentDistributedQty(selected, vt.id);
      return {
        voucherTypeId: vt.id,
        distributedQty: distributed,
        soldQty: 0,
        returnedQty: 0,
        damagedQty: 0,
        remainingQty: distributed,
        damageReason: '',
        priceUser: vt.priceUser,
        priceAgent: vt.priceAgent,
      };
    });

    setFormItems(itemsForAgent);
    setDate(new Date().toISOString().slice(0, 10));
    setPeriodMonth(new Date().toISOString().slice(0, 7));
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleItemValueChange = (
    index: number,
    field: 'soldQty' | 'returnedQty' | 'damagedQty' | 'damageReason',
    value: any
  ) => {
    const updated = [...formItems];
    const current = { ...updated[index] };

    if (field === 'damageReason') {
      current.damageReason = value;
    } else {
      const numVal = Math.max(0, parseInt(value) || 0);
      (current as any)[field] = numVal;

      // Recalculate remaining stock
      const totalOut = (current.soldQty || 0) + (current.returnedQty || 0) + (current.damagedQty || 0);
      current.remainingQty = Math.max(0, current.distributedQty - totalOut);
    }

    updated[index] = current;
    setFormItems(updated);
  };

  // Live calculation of financial totals in form
  let formGrossSales = 0;
  let formAgentCommission = 0;
  let formNetDepositDue = 0;
  let formDamagedLoss = 0;
  let formTotalSold = 0;
  let formTotalReturned = 0;
  let formTotalDamaged = 0;
  let formTotalRemaining = 0;

  formItems.forEach((it) => {
    formTotalSold += it.soldQty || 0;
    formTotalReturned += it.returnedQty || 0;
    formTotalDamaged += it.damagedQty || 0;
    formTotalRemaining += it.remainingQty || 0;

    formGrossSales += (it.soldQty || 0) * it.priceUser;
    formAgentCommission += (it.soldQty || 0) * (it.priceUser - it.priceAgent);
    formNetDepositDue += (it.soldQty || 0) * it.priceAgent;
    formDamagedLoss += (it.damagedQty || 0) * it.priceAgent;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!agentId) {
      setFormError('Silakan pilih agen.');
      return;
    }

    // Check if any quantity exceeds distributed
    const hasOverLimit = formItems.some(
      (it) => it.soldQty + it.returnedQty + it.damagedQty > it.distributedQty && it.distributedQty > 0
    );

    if (hasOverLimit) {
      if (
        !confirm(
          'Perhatian: Ada baris voucher di mana jumlah (terjual + retur + rusak) melebihi kuantitas distribusi tercatat. Apakah Anda yakin ingin melanjutkan pencatatan?'
        )
      ) {
        return;
      }
    }

    const recCode = `REC-${periodMonth.replace('-', '')}-${String(reconciliations.length + 1).padStart(3, '0')}`;

    const newRecord: ReconciliationRecord = {
      id: `rec-${Date.now()}`,
      code: recCode,
      date,
      periodMonth,
      agentId,
      items: formItems,
      totalSoldQty: formTotalSold,
      totalReturnedQty: formTotalReturned,
      totalDamagedQty: formTotalDamaged,
      totalRemainingQty: formTotalRemaining,
      grossSalesAmount: formGrossSales,
      agentCommissionAmount: formAgentCommission,
      netDepositDue: formNetDepositDue,
      damagedLossAmount: formDamagedLoss,
      status,
      notes,
      settledDate: status === 'settled' ? date : undefined,
    };

    // Automatically create damaged voucher logs if any damagedQty > 0
    const autoDamagedLogs: DamagedVoucherLog[] = [];
    formItems.forEach((it) => {
      if (it.damagedQty > 0) {
        autoDamagedLogs.push({
          id: `dmg-${Date.now()}-${it.voucherTypeId}`,
          date,
          agentId,
          voucherTypeId: it.voucherTypeId,
          quantity: it.damagedQty,
          reason: it.damageReason || 'Kerusakan fisik / cacat barcode saat penanganan agen',
          costLoss: it.damagedQty * it.priceAgent,
          actionTaken: 'written_off',
          recordedBy: 'Rekonsiliasi Form ' + recCode,
        });
      }
    });

    onAddReconciliation(newRecord, autoDamagedLogs);
    setIsModalOpen(false);
  };

  // Filter reconciliation history
  const filteredHistory = reconciliations.filter((rec) => {
    const agent = agents.find((a) => a.id === rec.agentId);
    const searchLower = searchHistory.toLowerCase();
    const matchSearch =
      rec.code.toLowerCase().includes(searchLower) ||
      (agent?.name || '').toLowerCase().includes(searchLower) ||
      rec.periodMonth.includes(searchLower);

    if (!matchSearch) return false;
    if (statusFilter !== 'all' && rec.status !== statusFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            Rekonsiliasi Voucher Terjual, Retur & Sisa Stok
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Catat hasil penjualan berkala agen, retur voucher utuh, dan sisa stok fisik untuk menghitung komisi dan setoran bersih.
          </p>
        </div>

        <button
          id="btn-open-reconciliation-modal"
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Rekonsiliasi Baru</span>
        </button>
      </div>

      {/* History of Reconciliations */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Riwayat Rekonsiliasi Penjualan ({filteredHistory.length} Laporan)
            </h3>
            <span className="text-[11px] text-slate-400">
              Dokumen penyelesaian dan transparansi keuangan voucher agen
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari laporan / agen..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 text-slate-800"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draf (Draft)</option>
              <option value="verified">Terverifikasi</option>
              <option value="settled">Lunas (Settled)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-3 font-semibold">No. Rekonsiliasi</th>
                <th className="py-2.5 px-3 font-semibold">Tanggal & Periode</th>
                <th className="py-2.5 px-3 font-semibold">Mitra Agen</th>
                <th className="py-2.5 px-3 font-semibold text-center text-emerald-700">Terjual</th>
                <th className="py-2.5 px-3 font-semibold text-center text-blue-700">Retur</th>
                <th className="py-2.5 px-3 font-semibold text-center text-rose-700">Rusak</th>
                <th className="py-2.5 px-3 font-semibold text-center text-amber-700">Sisa Stok</th>
                <th className="py-2.5 px-3 font-semibold text-right">Penjualan Kotor</th>
                <th className="py-2.5 px-3 font-semibold text-right">Komisi Agen</th>
                <th className="py-2.5 px-3 font-semibold text-right text-indigo-700">Wajib Setor</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada riwayat rekonsiliasi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((rec) => {
                  const agent = agents.find((a) => a.id === rec.agentId);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {rec.code}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        <div>{formatDate(rec.date)}</div>
                        <div className="text-[10px] text-slate-400">Periode: {rec.periodMonth}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {agent?.name || 'Agen'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600 bg-emerald-50/30 whitespace-nowrap">
                        {rec.totalSoldQty} pcs
                      </td>
                      <td className="py-3 px-3 text-center text-blue-600 font-medium whitespace-nowrap">
                        {rec.totalReturnedQty} pcs
                      </td>
                      <td className="py-3 px-3 text-center text-rose-600 font-medium whitespace-nowrap">
                        {rec.totalDamagedQty} pcs
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-amber-700 bg-amber-50/40 whitespace-nowrap">
                        {rec.totalRemainingQty} pcs
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatRupiah(rec.grossSalesAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatRupiah(rec.agentCommissionAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {formatRupiah(rec.netDepositDue)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <select
                          value={rec.status}
                          onChange={(e) =>
                            onUpdateReconciliationStatus(
                              rec.id,
                              e.target.value as 'draft' | 'verified' | 'settled'
                            )
                          }
                          className={`text-[10px] font-semibold px-2 py-1 rounded-full border cursor-pointer ${
                            rec.status === 'settled'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : rec.status === 'verified'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}
                        >
                          <option value="draft">Draf (Draft)</option>
                          <option value="verified">Terverifikasi</option>
                          <option value="settled">Lunas (Settled)</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          id={`btn-delete-rec-${rec.id}`}
                          onClick={() => {
                            if (
                              confirm(
                                `Hapus catatan rekonsiliasi ${rec.code}? Status stok akan dihitung ulang secara otomatis.`
                              )
                            ) {
                              onDeleteReconciliation(rec.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Rekonsiliasi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Catat Rekonsiliasi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide">
                  Rekonsiliasi Stok, Voucher Terjual & Retur Agen
                </h3>
                <p className="text-xs text-slate-300">
                  Kalkulasi otomatis jumlah terjual, retur utuh, voucher rusak, dan sisa stok fisik di agen
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              {/* Baris 1: Agen, Bulan Periode, Tanggal, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Mitra Agen *
                  </label>
                  <select
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-semibold"
                    required
                  >
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Periode Laporan (Bulan) *
                  </label>
                  <input
                    type="month"
                    value={periodMonth}
                    onChange={(e) => setPeriodMonth(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Rekonsiliasi *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Dokumen
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as 'draft' | 'verified' | 'settled')
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="draft">Draf (Pengecekan Awal)</option>
                    <option value="verified">Terverifikasi & Disepakati</option>
                    <option value="settled">Lunas (Sudah Disetor)</option>
                  </select>
                </div>
              </div>

              {/* Table Input Terjual / Retur / Rusak Per Jenis Voucher */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Input Perhitungan Unit Per Jenis Voucher untuk{' '}
                    <span className="text-indigo-700">
                      {agents.find((a) => a.id === agentId)?.name}
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Sisa = Distribusi - Terjual - Retur - Rusak
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <th className="py-2.5 px-3 font-semibold">Jenis Voucher</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Terdistribusi (Pcs)</th>
                        <th className="py-2.5 px-3 font-semibold text-center text-emerald-700">
                          Terjual (Pcs) *
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-center text-blue-700">
                          Retur (Pcs)
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-center text-rose-700">
                          Rusak (Pcs)
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-center text-amber-700 bg-amber-50/50">
                          Sisa di Agen
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-right">Harga Jual</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Wajib Setor Bersih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formItems.map((item, idx) => {
                        const vt = voucherTypes.find((v) => v.id === item.voucherTypeId);
                        const isOver =
                          item.soldQty + item.returnedQty + item.damagedQty > item.distributedQty &&
                          item.distributedQty > 0;

                        return (
                          <tr
                            key={item.voucherTypeId}
                            className={`hover:bg-slate-50/70 ${isOver ? 'bg-rose-50/40' : ''}`}
                          >
                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  vt?.colorBadge || ''
                                }`}
                              >
                                {vt?.name}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                Modal: {formatRupiah(item.priceAgent)}
                              </div>
                            </td>

                            {/* Terdistribusi */}
                            <td className="py-3 px-3 text-center font-bold text-slate-800">
                              <span className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono">
                                {item.distributedQty}
                              </span>
                            </td>

                            {/* Terjual */}
                            <td className="py-3 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max={item.distributedQty || undefined}
                                value={item.soldQty}
                                onChange={(e) =>
                                  handleItemValueChange(idx, 'soldQty', e.target.value)
                                }
                                className="w-20 text-center font-bold text-xs py-1.5 bg-emerald-50/50 border border-emerald-300 rounded focus:bg-white focus:outline-hidden focus:border-emerald-600 text-emerald-800"
                              />
                            </td>

                            {/* Retur */}
                            <td className="py-3 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={item.returnedQty}
                                onChange={(e) =>
                                  handleItemValueChange(idx, 'returnedQty', e.target.value)
                                }
                                className="w-18 text-center font-medium text-xs py-1.5 bg-blue-50/50 border border-blue-200 rounded focus:bg-white focus:outline-hidden focus:border-blue-600 text-blue-800"
                              />
                            </td>

                            {/* Rusak */}
                            <td className="py-3 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={item.damagedQty}
                                onChange={(e) =>
                                  handleItemValueChange(idx, 'damagedQty', e.target.value)
                                }
                                className="w-18 text-center font-medium text-xs py-1.5 bg-rose-50/50 border border-rose-200 rounded focus:bg-white focus:outline-hidden focus:border-rose-600 text-rose-800"
                              />
                              {item.damagedQty > 0 && (
                                <input
                                  type="text"
                                  placeholder="Alasan rusak..."
                                  value={item.damageReason || ''}
                                  onChange={(e) =>
                                    handleItemValueChange(idx, 'damageReason', e.target.value)
                                  }
                                  className="mt-1 w-28 text-[10px] px-1 py-0.5 bg-white border border-rose-300 rounded"
                                />
                              )}
                            </td>

                            {/* Sisa di Agen */}
                            <td className="py-3 px-3 text-center font-bold text-amber-700 bg-amber-50/40 font-mono">
                              <span
                                className={`px-2 py-1 rounded ${
                                  isOver
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {item.remainingQty} pcs
                              </span>
                            </td>

                            {/* Harga Jual */}
                            <td className="py-3 px-3 text-right font-mono text-slate-600">
                              {formatRupiah(item.priceUser)}
                            </td>

                            {/* Wajib Setor */}
                            <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700">
                              {formatRupiah((item.soldQty || 0) * item.priceAgent)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial & Summary Cards in Modal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                    Total Voucher Terjual
                  </span>
                  <div className="text-base font-extrabold text-emerald-700">
                    {formTotalSold} pcs
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Retur: {formTotalReturned} | Rusak: {formTotalDamaged}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                    Penjualan Kotor (Omset)
                  </span>
                  <div className="text-base font-extrabold text-slate-900">
                    {formatRupiah(formGrossSales)}
                  </div>
                  <div className="text-[10px] text-slate-400">Harga konsumen</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                    Hak Komisi Agen
                  </span>
                  <div className="text-base font-extrabold text-blue-700">
                    {formatRupiah(formAgentCommission)}
                  </div>
                  <div className="text-[10px] text-slate-400">Keuntungan agen</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-indigo-600">
                    Wajib Setor Bersih
                  </span>
                  <div className="text-base font-black text-indigo-800">
                    {formatRupiah(formNetDepositDue)}
                  </div>
                  <div className="text-[10px] text-indigo-600/70">Wajib masuk ke pengelola</div>
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Rekonsiliasi & Berita Acara
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Pembayaran setoran via transfer BCA tgl 16, sisa stok telah dihitung bersama"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-reconciliation"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Rekonsiliasi & Update Laporan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
