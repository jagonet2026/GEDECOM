import { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Wifi,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { VoucherType, DistributionRecord, ReconciliationRecord } from '../types';
import { formatRupiah } from '../utils/calculations';

interface VoucherTypeManagerProps {
  voucherTypes: VoucherType[];
  distributions: DistributionRecord[];
  reconciliations: ReconciliationRecord[];
  onAddVoucherType: (newType: VoucherType) => void;
  onUpdateVoucherType: (updatedType: VoucherType) => void;
  onDeleteVoucherType: (id: string) => void;
}

// Preset color options for voucher badges
const COLOR_BADGE_OPTIONS = [
  {
    name: 'Emerald (Hijau)',
    value: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    previewBg: 'bg-emerald-500',
  },
  {
    name: 'Blue (Biru)',
    value: 'bg-blue-100 text-blue-800 border-blue-300',
    previewBg: 'bg-blue-500',
  },
  {
    name: 'Indigo (Indigo)',
    value: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    previewBg: 'bg-indigo-500',
  },
  {
    name: 'Purple (Ungu)',
    value: 'bg-purple-100 text-purple-800 border-purple-300',
    previewBg: 'bg-purple-500',
  },
  {
    name: 'Amber (Kuning Emas)',
    value: 'bg-amber-100 text-amber-800 border-amber-300',
    previewBg: 'bg-amber-500',
  },
  {
    name: 'Rose (Merah Muda)',
    value: 'bg-rose-100 text-rose-800 border-rose-300',
    previewBg: 'bg-rose-500',
  },
  {
    name: 'Cyan (Biru Muda)',
    value: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    previewBg: 'bg-cyan-500',
  },
  {
    name: 'Teal (Toska)',
    value: 'bg-teal-100 text-teal-800 border-teal-300',
    previewBg: 'bg-teal-500',
  },
  {
    name: 'Orange (Oranye)',
    value: 'bg-orange-100 text-orange-800 border-orange-300',
    previewBg: 'bg-orange-500',
  },
];

// Quick templates for instant creation
const QUICK_PRESETS = [
  {
    name: 'Voucher 1 Jam',
    duration: '1 Jam',
    speed: 'Up to 3 Mbps',
    priceUser: 1500,
    priceAgent: 1200,
    colorBadge: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  {
    name: 'Voucher 3 Jam',
    duration: '3 Jam',
    speed: 'Up to 5 Mbps',
    priceUser: 3000,
    priceAgent: 2500,
    colorBadge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  {
    name: 'Voucher 12 Jam',
    duration: '12 Jam',
    speed: 'Up to 7 Mbps',
    priceUser: 7000,
    priceAgent: 5800,
    colorBadge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    name: 'Voucher 3 Hari',
    duration: '3 Hari',
    speed: 'Up to 10 Mbps',
    priceUser: 15000,
    priceAgent: 12500,
    colorBadge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    name: 'Voucher 14 Hari (2 Minggu)',
    duration: '14 Hari',
    speed: 'Up to 12 Mbps',
    priceUser: 40000,
    priceAgent: 34000,
    colorBadge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
];

export default function VoucherTypeManager({
  voucherTypes,
  distributions,
  reconciliations,
  onAddVoucherType,
  onUpdateVoucherType,
  onDeleteVoucherType,
}: VoucherTypeManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [speed, setSpeed] = useState('');
  const [priceUser, setPriceUser] = useState<number>(5000);
  const [priceAgent, setPriceAgent] = useState<number>(4200);
  const [colorBadge, setColorBadge] = useState<string>(COLOR_BADGE_OPTIONS[0].value);
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal State
  const [deletingType, setDeletingType] = useState<VoucherType | null>(null);

  // Statistics Calculation
  const usageStats = useMemo(() => {
    const stats: Record<string, { totalDistributed: number; totalSold: number }> = {};

    voucherTypes.forEach((vt) => {
      let totalDistributed = 0;
      distributions.forEach((d) => {
        d.items.forEach((item) => {
          if (item.voucherTypeId === vt.id) {
            totalDistributed += item.quantity || 0;
          }
        });
      });

      let totalSold = 0;
      reconciliations.forEach((r) => {
        r.items.forEach((item) => {
          if (item.voucherTypeId === vt.id) {
            totalSold += item.soldQty || 0;
          }
        });
      });

      stats[vt.id] = { totalDistributed, totalSold };
    });

    return stats;
  }, [voucherTypes, distributions, reconciliations]);

  const handleOpenAdd = () => {
    setEditingTypeId(null);
    setName('');
    setDuration('');
    setSpeed('Up to 5 Mbps');
    setPriceUser(5000);
    setPriceAgent(4200);
    setColorBadge(COLOR_BADGE_OPTIONS[Math.floor(Math.random() * COLOR_BADGE_OPTIONS.length)].value);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vt: VoucherType) => {
    setEditingTypeId(vt.id);
    setName(vt.name);
    setDuration(vt.duration);
    setSpeed(vt.speed || '');
    setPriceUser(vt.priceUser);
    setPriceAgent(vt.priceAgent);
    setColorBadge(vt.colorBadge || COLOR_BADGE_OPTIONS[0].value);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setName(preset.name);
    setDuration(preset.duration);
    setSpeed(preset.speed);
    setPriceUser(preset.priceUser);
    setPriceAgent(preset.priceAgent);
    setColorBadge(preset.colorBadge);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Nama jenis voucher wajib diisi.');
      return;
    }

    if (!duration.trim()) {
      setFormError('Durasi masa aktif voucher wajib diisi.');
      return;
    }

    if (priceUser <= 0) {
      setFormError('Harga jual ke konsumen harus lebih dari 0.');
      return;
    }

    if (priceAgent <= 0) {
      setFormError('Harga setor agen harus lebih dari 0.');
      return;
    }

    if (priceAgent > priceUser) {
      setFormError('Harga setor agen tidak boleh lebih tinggi dari harga jual konsumen.');
      return;
    }

    if (editingTypeId) {
      const updated: VoucherType = {
        id: editingTypeId,
        name: name.trim(),
        duration: duration.trim(),
        speed: speed.trim() || undefined,
        priceUser: Number(priceUser),
        priceAgent: Number(priceAgent),
        colorBadge,
      };
      onUpdateVoucherType(updated);
    } else {
      const newType: VoucherType = {
        id: `vt-${Date.now()}`,
        name: name.trim(),
        duration: duration.trim(),
        speed: speed.trim() || undefined,
        priceUser: Number(priceUser),
        priceAgent: Number(priceAgent),
        colorBadge,
      };
      onAddVoucherType(newType);
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deletingType) return;
    onDeleteVoucherType(deletingType.id);
    setDeletingType(null);
  };

  const filteredTypes = voucherTypes.filter(
    (vt) =>
      vt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vt.duration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vt.speed || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      vt.priceUser.toString().includes(searchQuery) ||
      vt.priceAgent.toString().includes(searchQuery)
  );

  const calculatedCommission = Math.max(0, priceUser - priceAgent);
  const commissionPercentage =
    priceUser > 0 ? ((calculatedCommission / priceUser) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            Kelola Jenis & Tarif Paket Voucher WiFi Hotspot
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur paket voucher, durasi masa aktif, kecepatan bandwidth, harga jual konsumen, harga setor agen, dan margin komisi agen.
          </p>
        </div>

        <button
          id="btn-add-voucher-type"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Jenis Voucher</span>
        </button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Paket Aktif</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {voucherTypes.length} <span className="text-xs font-medium text-slate-500">paket</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Mencakup paket hitungan jam, harian, hingga bulanan
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Rata-rata Margin Komisi Agen
            </span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {voucherTypes.length > 0
              ? (
                  voucherTypes.reduce(
                    (acc, vt) =>
                      acc + ((vt.priceUser - vt.priceAgent) / (vt.priceUser || 1)) * 100,
                    0
                  ) / voucherTypes.length
                ).toFixed(1)
              : 0}
            %
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Persentase keuntungan yang langsung dinikmati mitra agen
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Unit Terdistribusi
            </span>
            <Wifi className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {Object.values(usageStats).reduce((sum, s) => sum + s.totalDistributed, 0)}{' '}
            <span className="text-xs font-medium text-slate-500">pcs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Akumulasi seluruh jenis voucher yang diserahkan ke agen
          </p>
        </div>
      </div>

      {/* Main Content List & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Daftar Paket Voucher ({filteredTypes.length} Jenis)
            </h3>
            <span className="text-[11px] text-slate-400">
              Katalog voucher yang otomatis tersedia pada menu distribusi dan rekonsiliasi stok
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, durasi, harga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-slate-800"
            />
          </div>
        </div>

        {filteredTypes.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">Tidak ada paket voucher yang sesuai</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Coba kata kunci pencarian lain atau tambahkan paket voucher baru.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTypes.map((vt) => {
              const comm = vt.priceUser - vt.priceAgent;
              const commPct = ((comm / (vt.priceUser || 1)) * 100).toFixed(0);
              const stats = usageStats[vt.id] || { totalDistributed: 0, totalSold: 0 };

              return (
                <div
                  key={vt.id}
                  className="rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden shadow-2xs"
                >
                  {/* Card Header with Voucher Visual Style */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${
                          vt.colorBadge || 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        <Tag className="w-3 h-3" />
                        <span>{vt.name}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(vt)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                          title="Edit Paket"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingType(vt)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                          title="Hapus Paket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{vt.duration}</span>
                      </div>
                      {vt.speed && (
                        <div className="flex items-center gap-1">
                          <Wifi className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-600">{vt.speed}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          Harga Jual Konsumen
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {formatRupiah(vt.priceUser)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          Harga Setor Agen
                        </span>
                        <span className="font-mono font-bold text-indigo-700 text-sm">
                          {formatRupiah(vt.priceAgent)}
                        </span>
                      </div>
                    </div>

                    {/* Commission Highlight */}
                    <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800">
                      <span className="font-medium flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-emerald-600" />
                        Komisi Agen / pcs:
                      </span>
                      <div className="font-mono font-bold">
                        {formatRupiah(comm)}{' '}
                        <span className="text-[11px] font-normal text-emerald-600">({commPct}%)</span>
                      </div>
                    </div>

                    {/* Operational usage stats */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Total Beredar: <strong className="text-slate-700">{stats.totalDistributed} pcs</strong></span>
                      <span>Terjual: <strong className="text-emerald-700">{stats.totalSold} pcs</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Add / Edit Voucher Type */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide">
                  {editingTypeId ? 'Edit Jenis Paket Voucher' : 'Tambah Jenis Paket Voucher Baru'}
                </h3>
                <p className="text-xs text-slate-300">
                  Konfigurasi masa aktif durasi, kecepatan bandwidth, dan skema bagi hasil harga setor
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets for New Items */}
            {!editingTypeId && (
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Gunakan Template Paket Siap Pakai (1-Klik):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="text-[11px] px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-md font-semibold text-slate-700 transition-colors cursor-pointer"
                    >
                      {preset.duration} ({formatRupiah(preset.priceUser)})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Paket Voucher *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Voucher 2 Jam, Voucher 12 Jam"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durasi Masa Aktif *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 2 Jam, 24 Jam, 7 Hari"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kecepatan / Bandwidth (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Up to 5 Mbps"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Jual Konsumen (Rp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="500"
                      step="500"
                      value={priceUser || ''}
                      onChange={(e) => setPriceUser(parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-mono font-bold pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-slate-900"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Harga yang dibayar pengguna akhir
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Setor Agen (Rp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="500"
                      step="100"
                      value={priceAgent || ''}
                      onChange={(e) => setPriceAgent(parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-mono font-bold pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-indigo-700"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Kewajiban setor per unit terjual
                  </span>
                </div>

                {/* Profit preview strip */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">
                    Estimasi Keuntungan / Komisi Agen:
                  </span>
                  <div className="font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                    <span>{formatRupiah(calculatedCommission)} / unit</span>
                    <span className="text-[11px] font-normal px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                      {commissionPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Badge Color Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Warna Label Voucher
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_BADGE_OPTIONS.map((opt) => {
                    const isSelected = colorBadge === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setColorBadge(opt.value)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${opt.previewBg}`} />
                        <span className="truncate text-[11px] font-medium text-slate-700">
                          {opt.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">Pratinjau Badge:</span>
                <span
                  className={`px-3 py-1 rounded-md text-xs font-bold border ${colorBadge}`}
                >
                  {name || 'Nama Voucher'} - {duration || 'Durasi'}
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
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingTypeId ? 'Simpan Perubahan' : 'Tambah Paket Voucher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deletingType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hapus Jenis Voucher?</h3>
                <p className="text-xs text-slate-500">
                  Konfirmasi penghapusan paket {deletingType.name}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span>Nama Paket:</span>
                <strong className="text-slate-900">{deletingType.name}</strong>
              </div>
              <div className="flex justify-between">
                <span>Harga Jual:</span>
                <strong>{formatRupiah(deletingType.priceUser)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Unit Terdistribusi di Agen:</span>
                <strong className="text-indigo-700">
                  {usageStats[deletingType.id]?.totalDistributed || 0} pcs
                </strong>
              </div>
            </div>

            {(usageStats[deletingType.id]?.totalDistributed || 0) > 0 && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Perhatian:</strong> Paket ini telah digunakan dalam riwayat distribusi aktif. Menghapusnya akan menyembunyikan paket ini dari transaksi baru.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingType(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Paket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
