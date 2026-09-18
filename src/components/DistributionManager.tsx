import { useState } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Calendar,
  User,
  Hash,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Search,
} from 'lucide-react';
import { Agent, DistributionRecord, DistributionItem, VoucherType } from '../types';
import { formatRupiah, formatDate } from '../utils/calculations';

interface DistributionManagerProps {
  agents: Agent[];
  distributions: DistributionRecord[];
  voucherTypes: VoucherType[];
  onAddDistribution: (newDist: DistributionRecord) => void;
  onDeleteDistribution: (id: string) => void;
  preselectedAgentId?: string | null;
  isOpenModalInitially?: boolean;
}

export default function DistributionManager({
  agents,
  distributions,
  voucherTypes,
  onAddDistribution,
  onDeleteDistribution,
  preselectedAgentId,
  isOpenModalInitially = false,
}: DistributionManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(isOpenModalInitially);
  const [searchHistory, setSearchHistory] = useState('');

  // Form states
  const [agentId, setAgentId] = useState(preselectedAgentId || agents[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveredBy, setDeliveredBy] = useState('Admin Logistik Hotspot');
  const [receivedBy, setReceivedBy] = useState('');
  const [notes, setNotes] = useState('');

  // Multi-item rows
  const [items, setItems] = useState<DistributionItem[]>([
    {
      voucherTypeId: voucherTypes[0]?.id || '',
      quantity: 50,
      startSerial: '',
      endSerial: '',
      priceUser: voucherTypes[0]?.priceUser || 0,
      priceAgent: voucherTypes[0]?.priceAgent || 0,
    },
  ]);

  const [formError, setFormError] = useState('');

  const generateBatchCode = () => {
    const d = new Date(date || new Date());
    const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const count = distributions.length + 1;
    return `DST-${yyyymm}-${String(count).padStart(3, '0')}`;
  };

  const [customCode, setCustomCode] = useState(generateBatchCode());

  const handleOpenModal = (targetAgentId?: string) => {
    if (targetAgentId) {
      setAgentId(targetAgentId);
      const agent = agents.find((a) => a.id === targetAgentId);
      setReceivedBy(agent?.ownerName || '');
    } else if (agents.length > 0 && !agentId) {
      setAgentId(agents[0].id);
      setReceivedBy(agents[0].ownerName || '');
    }
    setCustomCode(generateBatchCode());
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    const firstType = voucherTypes[0];
    setItems([
      ...items,
      {
        voucherTypeId: firstType?.id || '',
        quantity: 50,
        startSerial: '',
        endSerial: '',
        priceUser: firstType?.priceUser || 0,
        priceAgent: firstType?.priceAgent || 0,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof DistributionItem, value: any) => {
    const newItems = [...items];
    const currentItem = { ...newItems[index], [field]: value };

    // If voucher type changed, sync prices
    if (field === 'voucherTypeId') {
      const vt = voucherTypes.find((v) => v.id === value);
      if (vt) {
        currentItem.priceUser = vt.priceUser;
        currentItem.priceAgent = vt.priceAgent;
      }
    }

    newItems[index] = currentItem;
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId) {
      setFormError('Silakan pilih Agen penerima.');
      return;
    }
    if (!date) {
      setFormError('Tanggal distribusi wajib diisi.');
      return;
    }

    const invalidItems = items.some((it) => !it.voucherTypeId || it.quantity <= 0);
    if (invalidItems) {
      setFormError('Setiap baris voucher harus memilih jenis voucher dan kuantitas minimal 1 pcs.');
      return;
    }

    const newRecord: DistributionRecord = {
      id: `dist-${Date.now()}`,
      code: customCode || generateBatchCode(),
      date,
      agentId,
      items,
      notes,
      deliveredBy,
      receivedBy: receivedBy || agents.find((a) => a.id === agentId)?.ownerName || 'Agen',
    };

    onAddDistribution(newRecord);
    setIsModalOpen(false);

    // Reset items for next distribution
    setItems([
      {
        voucherTypeId: voucherTypes[0]?.id || '',
        quantity: 50,
        startSerial: '',
        endSerial: '',
        priceUser: voucherTypes[0]?.priceUser || 0,
        priceAgent: voucherTypes[0]?.priceAgent || 0,
      },
    ]);
    setNotes('');
  };

  // Filter distribution history
  const filteredDistributions = distributions
    .filter((d) => {
      const agent = agents.find((a) => a.id === d.agentId);
      const searchLower = searchHistory.toLowerCase();
      return (
        d.code.toLowerCase().includes(searchLower) ||
        (agent?.name || '').toLowerCase().includes(searchLower) ||
        (d.receivedBy || '').toLowerCase().includes(searchLower) ||
        (d.notes || '').toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  // Compute total distributed in form
  const formTotalUnits = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const formTotalRetailValue = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.priceUser) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" />
            Distribusi Voucher WiFi ke Agen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Catat penyerahan voucher baru, kuantitas per jenis, nomor seri awal-akhir, dan tanda terima.
          </p>
        </div>

        <button
          id="btn-open-distribution-form"
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Distribusi Baru</span>
        </button>
      </div>

      {/* History of Distributions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Riwayat Distribusi Voucher ({filteredDistributions.length} Dokumen)
            </h3>
            <span className="text-[11px] text-slate-400">
              Semua pencatatan penyerahan voucher ke agen tersimpan secara sistematis
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode batch / agen..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-3 font-semibold">Kode Batch</th>
                <th className="py-2.5 px-3 font-semibold">Tanggal</th>
                <th className="py-2.5 px-3 font-semibold">Nama Agen</th>
                <th className="py-2.5 px-3 font-semibold">Rincian Paket & Jumlah Voucher</th>
                <th className="py-2.5 px-3 font-semibold text-center">Total Unit</th>
                <th className="py-2.5 px-3 font-semibold">Penerima & Pengirim</th>
                <th className="py-2.5 px-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDistributions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada riwayat distribusi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredDistributions.map((dist) => {
                  const agent = agents.find((a) => a.id === dist.agentId);
                  const totalUnits = dist.items.reduce((sum, it) => sum + (it.quantity || 0), 0);

                  return (
                    <tr key={dist.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {dist.code}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {formatDate(dist.date)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{agent?.name || 'Agen'}</div>
                        <div className="text-[10px] text-slate-400">{agent?.location}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1.5">
                          {dist.items.map((it, idx) => {
                            const vt = voucherTypes.find((v) => v.id === it.voucherTypeId);
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-800 border border-slate-200"
                              >
                                <span className="font-semibold">{vt?.name || 'Voucher'}:</span>
                                <strong className="text-indigo-700">{it.quantity} pcs</strong>
                                {it.startSerial && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ({it.startSerial}-{it.endSerial || '...'})
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                        {dist.notes && (
                          <div className="text-[10px] text-slate-500 italic mt-1">
                            Catatan: {dist.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded-md border border-indigo-200">
                          {totalUnits} pcs
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-600">
                        <div>
                          <strong>Penerima:</strong> {dist.receivedBy || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Petugas: {dist.deliveredBy || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          id={`btn-delete-dist-${dist.id}`}
                          onClick={() => {
                            if (
                              confirm(
                                `Hapus catatan distribusi ${dist.code}? Sisa stok agen akan disesuaikan otomatis.`
                              )
                            ) {
                              onDeleteDistribution(dist.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Distribusi"
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

      {/* Modal / Form Buat Distribusi Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide">
                  Form Penyerahan / Distribusi Voucher WiFi ke Agen
                </h3>
                <p className="text-xs text-slate-300">
                  Pastikan jumlah unit dan nomor seri fisik sesuai sebelum diserahkan ke agen
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
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Baris 1: Kode, Agen, Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Batch Distribusi
                  </label>
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Agen Penerima *
                  </label>
                  <select
                    id="select-modal-agent"
                    value={agentId}
                    onChange={(e) => {
                      setAgentId(e.target.value);
                      const ag = agents.find((a) => a.id === e.target.value);
                      if (ag) setReceivedBy(ag.ownerName);
                    }}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-slate-800"
                    required
                  >
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} - {ag.ownerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Distribusi *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Rincian Voucher Items */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Daftar Jenis Voucher yang Didistribusikan
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Jenis Voucher</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                            Jenis Voucher #{idx + 1}
                          </label>
                          <select
                            value={item.voucherTypeId}
                            onChange={(e) => handleItemChange(idx, 'voucherTypeId', e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500"
                          >
                            {voucherTypes.map((vt) => (
                              <option key={vt.id} value={vt.id}>
                                {vt.name} (Jual: {formatRupiah(vt.priceUser)} | Setor:{' '}
                                {formatRupiah(vt.priceAgent)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                            Jumlah (Pcs) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500 text-slate-900"
                            required
                          />
                        </div>

                        <div className="flex items-end justify-between">
                          <div className="text-[11px] font-mono text-slate-600">
                            <div>
                              Jual: {formatRupiah((item.quantity || 0) * item.priceUser)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Setor: {formatRupiah((item.quantity || 0) * item.priceAgent)}
                            </div>
                          </div>

                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Hapus Baris"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Nomor Seri opsional */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div>
                          <input
                            type="text"
                            placeholder="Nomor Seri Awal (misal VC2H-1001)"
                            value={item.startSerial || ''}
                            onChange={(e) => handleItemChange(idx, 'startSerial', e.target.value)}
                            className="w-full text-[11px] font-mono px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Nomor Seri Akhir (misal VC2H-1050)"
                            value={item.endSerial || ''}
                            onChange={(e) => handleItemChange(idx, 'endSerial', e.target.value)}
                            className="w-full text-[11px] font-mono px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total form summary badge */}
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span>Total yang diserahkan dalam batch ini:</span>
                  <div className="text-right">
                    <span className="text-indigo-700 font-bold mr-2">{formTotalUnits} pcs</span>
                    <span className="text-slate-500 text-[11px]">
                      (Estimasi Nilai Jual: {formatRupiah(formTotalRetailValue)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Pengirim, Penerima, Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Petugas Penyerah (Admin)
                  </label>
                  <input
                    type="text"
                    value={deliveredBy}
                    onChange={(e) => setDeliveredBy(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Penerima di Agen
                  </label>
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                    placeholder="Nama pemilik / kasir toko"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Distribusi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                    placeholder="Contoh: Titip stok persiapan weekend, kondisi fisik segel rapi"
                  />
                </div>
              </div>

              {/* Buttons */}
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
                  id="btn-save-distribution"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Perbarui Stok Real-Time</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
