import { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Search,
} from 'lucide-react';
import { Agent } from '../types';
import { formatDate } from '../utils/calculations';

interface AgentManagerModalProps {
  agents: Agent[];
  onAddAgent: (agent: Agent) => void;
  onUpdateAgent: (agent: Agent) => void;
  onDeleteAgent: (id: string) => void;
  isOpenModalInitially?: boolean;
}

export default function AgentManagerModal({
  agents,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
  isOpenModalInitially = false,
}: AgentManagerModalProps) {
  const [isFormOpen, setIsFormOpen] = useState(isOpenModalInitially);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingAgentId(null);
    setName('');
    setOwnerName('');
    setPhone('');
    setLocation('');
    setJoinDate(new Date().toISOString().slice(0, 10));
    setStatus('active');
    setNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (agent: Agent) => {
    setEditingAgentId(agent.id);
    setName(agent.name);
    setOwnerName(agent.ownerName);
    setPhone(agent.phone);
    setLocation(agent.location);
    setJoinDate(agent.joinDate);
    setStatus(agent.status);
    setNotes(agent.notes || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingAgentId) {
      const updated: Agent = {
        id: editingAgentId,
        name,
        ownerName,
        phone,
        location,
        joinDate,
        status,
        notes,
      };
      onUpdateAgent(updated);
    } else {
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        name,
        ownerName,
        phone,
        location,
        joinDate,
        status,
        notes,
      };
      onAddAgent(newAgent);
    }

    setIsFormOpen(false);
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Kelola Data Mitra Agen Voucher WiFi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar profil agen, pemilik kios/warkop, nomor kontak WhatsApp, dan lokasi penempatan voucher.
          </p>
        </div>

        <button
          id="btn-add-new-agent"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Agen Baru</span>
        </button>
      </div>

      {/* Agents Grid List */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Daftar Agen Terdaftar ({filteredAgents.length} Agen)
            </h3>
            <span className="text-[11px] text-slate-400">
              Mitra resmi distribusi voucher hotspot di seluruh wilayah
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari agen, pemilik, kontak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{agent.name}</h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Pemilik: <span className="text-slate-800">{agent.ownerName}</span>
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      agent.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {agent.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{agent.phone}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{agent.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Mitra Sejak: {formatDate(agent.joinDate)}</span>
                  </div>
                  {agent.notes && (
                    <div className="p-2 bg-white rounded border border-slate-200 text-[11px] text-slate-500 italic mt-2">
                      "{agent.notes}"
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
                <button
                  onClick={() => handleOpenEdit(agent)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Hapus agen ${agent.name}?`)) {
                      onDeleteAgent(agent.id);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Add / Edit Agent */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide">
                  {editingAgentId ? 'Edit Data Mitra Agen' : 'Tambah Mitra Agen Voucher Baru'}
                </h3>
                <p className="text-xs text-slate-300">
                  Masukkan data outlet/kios penyalur voucher hotspot
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Toko / Agen / Konter *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Berkah Cell, Warkop Barokah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pemilik / Penanggung Jawab *
                  </label>
                  <input
                    type="text"
                    placeholder="Nama orang yang bertanggung jawab"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / Telepon *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 0812-3456-7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat / Lokasi Penjualan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Merdeka Barat No. 14 (Dekat SMP 1)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Bergabung
                  </label>
                  <input
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Keaktifan
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="active">Aktif Beroperasi</option>
                    <option value="inactive">Non-Aktif (Ditangguhkan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Khusus (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Jam operasional 24 jam, batas jatuh tempo setoran setiap hari Senin"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Data Agen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
