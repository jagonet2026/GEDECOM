import { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  AlertOctagon,
  FileCheck2,
  DollarSign,
  Search,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Agent, DamagedVoucherLog, VoucherType } from '../types';
import { formatRupiah, formatDate } from '../utils/calculations';

interface DamagedVoucherTrackerProps {
  agents: Agent[];
  voucherTypes: VoucherType[];
  damagedLogs: DamagedVoucherLog[];
  totalDistributed: number;
  onAddDamagedLog: (log: DamagedVoucherLog) => void;
  onDeleteDamagedLog: (id: string) => void;
  onUpdateDamagedAction: (
    id: string,
    actionTaken: 'written_off' | 'replaced' | 'under_review'
  ) => void;
  isOpenModalInitially?: boolean;
}

export default function DamagedVoucherTracker({
  agents,
  voucherTypes,
  damagedLogs,
  totalDistributed,
  onAddDamagedLog,
  onDeleteDamagedLog,
  onUpdateDamagedAction,
  isOpenModalInitially = false,
}: DamagedVoucherTrackerProps) {
  const [isModalOpen, setIsModalOpen] = useState(isOpenModalInitially);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');

  // Form states
  const [agentId, setAgentId] = useState(agents[0]?.id || '');
  const [voucherTypeId, setVoucherTypeId] = useState(voucherTypes[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('Lapisan hologram tergores terlalu dalam / PIN hilang');
  const [serialNumbers, setSerialNumbers] = useState('');
  const [actionTaken, setActionTaken] = useState<'written_off' | 'replaced' | 'under_review'>(
    'written_off'
  );
  const [recordedBy, setRecordedBy] = useState('Admin Hotspot');

  const totalDamagedPcs = damagedLogs.reduce((sum, d) => sum + (d.quantity || 0), 0);
  const totalCostLoss = damagedLogs.reduce((sum, d) => sum + (d.costLoss || 0), 0);
  const damageRate =
    totalDistributed > 0 ? ((totalDamagedPcs / totalDistributed) * 100).toFixed(2) : '0';

  const commonReasons = [
    'Lapisan hologram tergores terlalu dalam / PIN hilang',
    'Voucher basah terkena tumpahan air / lembab di etalase',
    'Barcode buram / cetakan printer cacat gagal scan',
    'Kertas sobek saat dipisahkan dari buku bundel voucher',
    'Salah potong perforasi / nomor seri hilang separuh',
    'Lainnya (Tuliskan secara spesifik)',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vt = voucherTypes.find((v) => v.id === voucherTypeId);
    const costPerUnit = vt?.priceAgent || 0;
    const costLoss = (quantity || 1) * costPerUnit;

    const newLog: DamagedVoucherLog = {
      id: `dmg-${Date.now()}`,
      date,
      agentId,
      voucherTypeId,
      quantity: Math.max(1, quantity),
      reason,
      serialNumbers,
      costLoss,
      actionTaken,
      recordedBy,
    };

    onAddDamagedLog(newLog);
    setIsModalOpen(false);

    // Reset form
    setQuantity(1);
    setSerialNumbers('');
  };

  // Filter logs
  const filteredLogs = damagedLogs.filter((log) => {
    const agent = agents.find((a) => a.id === log.agentId);
    const vt = voucherTypes.find((v) => v.id === log.voucherTypeId);
    const searchLower = searchQuery.toLowerCase();

    const matchSearch =
      (agent?.name || '').toLowerCase().includes(searchLower) ||
      (vt?.name || '').toLowerCase().includes(searchLower) ||
      log.reason.toLowerCase().includes(searchLower) ||
      (log.serialNumbers || '').toLowerCase().includes(searchLower);

    if (!matchSearch) return false;
    if (agentFilter !== 'all' && log.agentId !== agentFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            Pelacakan Voucher Rusak & Audit Kerugian Inventaris
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan sistematis voucher rusak/cacat fisik, identifikasi penyebab, dan rekonsiliasi kerugian modal.
          </p>
        </div>

        <button
          id="btn-add-damaged-voucher"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Voucher Rusak</span>
        </button>
      </div>

      {/* Metrics Row for Damaged Inventory */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Voucher Rusak</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-700">
            {totalDamagedPcs} <span className="text-xs font-medium text-slate-500">pcs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Rasio cacat fisik: <strong className="text-rose-600">{damageRate}%</strong> dari total
            distribusi
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Kerugian Modal (HPP)
            </span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatRupiah(totalCostLoss)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Dihitung berdasarkan harga modal pokok voucher
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Status Penyelesaian Audit
            </span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xs space-y-1 mt-1 text-slate-600">
            <div className="flex justify-between">
              <span>Dihapusbukukan (Write-off):</span>
              <strong className="text-slate-900">
                {damagedLogs.filter((d) => d.actionTaken === 'written_off').length} insiden
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Diganti Voucher Baru:</span>
              <strong className="text-blue-600">
                {damagedLogs.filter((d) => d.actionTaken === 'replaced').length} insiden
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Dalam Peninjauan:</span>
              <strong className="text-amber-600">
                {damagedLogs.filter((d) => d.actionTaken === 'under_review').length} insiden
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Daftar Insiden Voucher Rusak ({filteredLogs.length} Data)
            </h3>
            <span className="text-[11px] text-slate-400">
              Catatan transparansi kerugian inventaris untuk rekonsiliasi bulanan
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari alasan / serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-rose-500 text-slate-800"
              />
            </div>

            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:border-rose-500"
            >
              <option value="all">Semua Agen</option>
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-3 font-semibold">Tanggal</th>
                <th className="py-2.5 px-3 font-semibold">Mitra Agen</th>
                <th className="py-2.5 px-3 font-semibold">Jenis Voucher</th>
                <th className="py-2.5 px-3 font-semibold text-center">Jumlah</th>
                <th className="py-2.5 px-3 font-semibold text-right">Nilai Kerugian</th>
                <th className="py-2.5 px-3 font-semibold">Penyebab / Alasan Kerusakan</th>
                <th className="py-2.5 px-3 font-semibold">Nomor Seri</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status Tindakan</th>
                <th className="py-2.5 px-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada catatan voucher rusak yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const agent = agents.find((a) => a.id === log.agentId);
                  const vt = voucherTypes.find((v) => v.id === log.voucherTypeId);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {formatDate(log.date)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {agent?.name || 'Agen'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            vt?.colorBadge || 'bg-slate-100'
                          }`}
                        >
                          {vt?.name || 'Voucher'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-rose-700 bg-rose-50/40">
                        {log.quantity} pcs
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                        {formatRupiah(log.costLoss)}
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-xs">{log.reason}</td>
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                        {log.serialNumbers || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <select
                          value={log.actionTaken}
                          onChange={(e) =>
                            onUpdateDamagedAction(
                              log.id,
                              e.target.value as 'written_off' | 'replaced' | 'under_review'
                            )
                          }
                          className={`text-[10px] font-semibold px-2 py-1 rounded-full border cursor-pointer ${
                            log.actionTaken === 'written_off'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : log.actionTaken === 'replaced'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}
                        >
                          <option value="written_off">Hapus Buku (Loss)</option>
                          <option value="replaced">Diganti Baru</option>
                          <option value="under_review">Diperiksa</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            if (confirm('Hapus log voucher rusak ini?')) {
                              onDeleteDamagedLog(log.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus"
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

      {/* Modal Tambah Voucher Rusak */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide">
                  Catat Insiden Voucher Rusak / Cacat Fisik
                </h3>
                <p className="text-xs text-slate-300">
                  Rekonsiliasi kerugian dan pembebasan tanggung jawab setor agen
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mitra Agen Terkait *
                  </label>
                  <select
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-rose-500 font-semibold"
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
                    Tanggal Insiden *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Voucher *
                  </label>
                  <select
                    value={voucherTypeId}
                    onChange={(e) => setVoucherTypeId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-rose-500"
                    required
                  >
                    {voucherTypes.map((vt) => (
                      <option key={vt.id} value={vt.id}>
                        {vt.name} (Modal: {formatRupiah(vt.priceAgent)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Rusak (Pcs) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-rose-500 text-rose-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Penyebab Kerusakan *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-rose-500 mb-2"
                >
                  {commonReasons.map((r, i) => (
                    <option key={i} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {reason === 'Lainnya (Tuliskan secara spesifik)' && (
                  <input
                    type="text"
                    placeholder="Jelaskan secara detail penyebab kerusakan..."
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-rose-300 rounded-lg focus:outline-hidden focus:border-rose-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Seri Voucher (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: VC2H-1044, VC2H-1045"
                  value={serialNumbers}
                  onChange={(e) => setSerialNumbers(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tindakan Penyelesaian
                  </label>
                  <select
                    value={actionTaken}
                    onChange={(e) =>
                      setActionTaken(e.target.value as 'written_off' | 'replaced' | 'under_review')
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="written_off">Dihapusbukukan (Kerugian Modal)</option>
                    <option value="replaced">Diganti Unit Baru ke Agen</option>
                    <option value="under_review">Dalam Peninjauan / Klaim</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Petugas Pencatat
                  </label>
                  <input
                    type="text"
                    value={recordedBy}
                    onChange={(e) => setRecordedBy(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Total kerugian kalkulasi info */}
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs flex items-center justify-between">
                <span className="font-semibold text-rose-900">Estimasi Kerugian Modal:</span>
                <span className="font-black text-rose-700 font-mono text-sm">
                  {formatRupiah(
                    (quantity || 1) *
                      (voucherTypes.find((v) => v.id === voucherTypeId)?.priceAgent || 0)
                  )}
                </span>
              </div>

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
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Log Kerusakan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
