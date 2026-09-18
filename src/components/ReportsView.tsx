import { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  UserCheck,
  Receipt,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  Agent,
  DistributionRecord,
  ReconciliationRecord,
  VoucherType,
  DamagedVoucherLog,
} from '../types';
import { calculateAgentSummary, formatRupiah, formatDate } from '../utils/calculations';
import { exportToExcel } from '../utils/exportExcel';
import { exportToPdf } from '../utils/exportPdf';

interface ReportsViewProps {
  agents: Agent[];
  distributions: DistributionRecord[];
  reconciliations: ReconciliationRecord[];
  voucherTypes: VoucherType[];
  damagedLogs: DamagedVoucherLog[];
  preselectedAgentId?: string | null;
}

export default function ReportsView({
  agents,
  distributions,
  reconciliations,
  voucherTypes,
  damagedLogs,
  preselectedAgentId,
}: ReportsViewProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(preselectedAgentId || 'all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-09');

  const targetAgents = useMemo(() => {
    if (selectedAgentId === 'all') return agents;
    return agents.filter((a) => a.id === selectedAgentId);
  }, [agents, selectedAgentId]);

  const handleExportExcel = () => {
    exportToExcel(agents, distributions, reconciliations, voucherTypes, damagedLogs, {
      month: selectedPeriod,
      agentId: selectedAgentId === 'all' ? undefined : selectedAgentId,
    });
  };

  const handleExportPdf = () => {
    exportToPdf(
      agents,
      distributions,
      reconciliations,
      voucherTypes,
      damagedLogs,
      selectedAgentId === 'all' ? undefined : selectedAgentId,
      selectedPeriod
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Export Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            Pusat Template Laporan Bulanan & Ekspor Transparan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unduh laporan rekonsiliasi berformat Excel (.xlsx) atau PDF resmi untuk diserahkan ke agen voucher.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Bulan */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Periode:</label>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Filter Agen */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Mitra Agen:</label>
            <select
              id="select-report-agent"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500 font-semibold"
            >
              <option value="all">Semua Agen (Rekapitulasi Global)</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.ownerName})
                </option>
              ))}
            </select>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

          {/* Export Buttons */}
          <button
            id="btn-download-excel"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Unduh Laporan Format Microsoft Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download Excel (.xlsx)</span>
          </button>

          <button
            id="btn-download-pdf"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Unduh Laporan Berita Acara PDF Resmi"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Download PDF (.pdf)</span>
          </button>

          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Cetak Langsung Halaman Ini"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Document Sheet Live Preview */}
      <div className="space-y-8">
        {targetAgents.map((agent) => {
          const summary = calculateAgentSummary(agent, distributions, reconciliations, voucherTypes);
          const agentDamaged = damagedLogs.filter((d) => d.agentId === agent.id);

          return (
            <div
              key={agent.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 max-w-5xl mx-auto print:border-none print:shadow-none print:p-0"
            >
              {/* Kop Laporan Resmi */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600">
                      WIFI HOTSPOT NETWORK MANAGEMENT
                    </span>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                      BERITA ACARA REKONSILIASI & STATUS VOUCHER BULANAN
                    </h1>
                    <p className="text-xs text-slate-500">
                      Laporan Transparan Status Unit Voucher yang Didistribusikan, Terjual, Retur & Sisa Stok
                    </p>
                  </div>

                  <div className="text-left sm:text-right text-xs text-slate-600">
                    <div className="font-semibold text-slate-900">
                      Periode: {selectedPeriod}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Dicetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-[10px] font-semibold">
                      REF-{agent.id.toUpperCase()}-{selectedPeriod.replace('-', '')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Mitra Agen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1.5 text-indigo-700">
                    Data Mitra Agen Voucher:
                  </h4>
                  <div className="space-y-1 text-slate-700">
                    <div>
                      <strong className="text-slate-900">Nama Agen:</strong> {agent.name}
                    </div>
                    <div>
                      <strong className="text-slate-900">Penanggung Jawab:</strong> {agent.ownerName}
                    </div>
                    <div>
                      <strong className="text-slate-900">Kontak WhatsApp/HP:</strong> {agent.phone}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1.5 text-indigo-700">
                    Lokasi Toko & Catatan:
                  </h4>
                  <div className="space-y-1 text-slate-700">
                    <div>
                      <strong className="text-slate-900">Alamat Outlet:</strong> {agent.location}
                    </div>
                    <div>
                      <strong className="text-slate-900">Bergabung Sejak:</strong> {formatDate(agent.joinDate)}
                    </div>
                    <div className="text-slate-500 italic text-[11px]">
                      {agent.notes || 'Status operasional lancar & aktif.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Ringkasan Transparansi Unit */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Terdistribusi</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {summary.totalDistributed} <span className="text-[11px] font-normal text-slate-500">pcs</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Voucher Terjual</div>
                  <div className="text-lg font-black text-emerald-700 mt-0.5">
                    {summary.totalSold} <span className="text-[11px] font-normal text-emerald-600">pcs</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-[10px] uppercase font-bold text-blue-700">Retur Utuh</div>
                  <div className="text-lg font-black text-blue-700 mt-0.5">
                    {summary.totalReturned} <span className="text-[11px] font-normal text-blue-600">pcs</span>
                  </div>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="text-[10px] uppercase font-bold text-rose-700">Voucher Rusak</div>
                  <div className="text-lg font-black text-rose-700 mt-0.5">
                    {summary.totalDamaged} <span className="text-[11px] font-normal text-rose-600">pcs</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase font-bold text-amber-800">Sisa Stok di Agen</div>
                  <div className="text-lg font-black text-amber-800 mt-0.5">
                    {summary.totalRemaining} <span className="text-[11px] font-normal text-amber-700">pcs</span>
                  </div>
                </div>
              </div>

              {/* Tabel Rincian Unit Per Jenis Voucher */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                <div className="bg-slate-100/70 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-800">
                  Rincian Unit & Keuangan Per Jenis Paket Voucher WiFi
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">Jenis Voucher</th>
                        <th className="py-2.5 px-3 text-right">Harga Jual</th>
                        <th className="py-2.5 px-3 text-right">Harga Setor</th>
                        <th className="py-2.5 px-3 text-center">Terdistribusi</th>
                        <th className="py-2.5 px-3 text-center text-emerald-700">Terjual</th>
                        <th className="py-2.5 px-3 text-center text-blue-700">Retur</th>
                        <th className="py-2.5 px-3 text-center text-rose-700">Rusak</th>
                        <th className="py-2.5 px-3 text-center text-amber-700">Sisa Stok</th>
                        <th className="py-2.5 px-3 text-right">Omset Kotor</th>
                        <th className="py-2.5 px-3 text-right">Komisi Agen</th>
                        <th className="py-2.5 px-3 text-right text-indigo-700">Wajib Setor Bersih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {voucherTypes.map((vt, idx) => {
                        const row = summary.byVoucherType[vt.id];
                        if (!row) return null;

                        return (
                          <tr key={vt.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {vt.name}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              {formatRupiah(vt.priceUser)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              {formatRupiah(vt.priceAgent)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-medium text-slate-800">
                              {row.distributed} pcs
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-emerald-600 bg-emerald-50/30">
                              {row.sold} pcs
                            </td>
                            <td className="py-2.5 px-3 text-center text-blue-600 font-medium">
                              {row.returned} pcs
                            </td>
                            <td className="py-2.5 px-3 text-center text-rose-600 font-medium">
                              {row.damaged} pcs
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-amber-800 bg-amber-50/40">
                              {row.remaining} pcs
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              {formatRupiah(row.grossSales)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              {formatRupiah(row.agentCommission)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                              {formatRupiah(row.netDeposit)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[10px]">
                          TOTAL REKONSILIASI:
                        </td>
                        <td className="py-2.5 px-3 text-center">{summary.totalDistributed} pcs</td>
                        <td className="py-2.5 px-3 text-center text-emerald-700">{summary.totalSold} pcs</td>
                        <td className="py-2.5 px-3 text-center text-blue-700">{summary.totalReturned} pcs</td>
                        <td className="py-2.5 px-3 text-center text-rose-700">{summary.totalDamaged} pcs</td>
                        <td className="py-2.5 px-3 text-center text-amber-800 font-extrabold">
                          {summary.totalRemaining} pcs
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {formatRupiah(summary.totalGrossSales)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-blue-700">
                          {formatRupiah(summary.totalAgentCommission)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-800 text-sm">
                          {formatRupiah(summary.totalNetDepositDue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Catatan Kerusakan & Pembebasan Tanggung Jawab */}
              {agentDamaged.length > 0 && (
                <div className="mb-6 p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 text-xs">
                  <h4 className="font-bold text-rose-800 mb-1 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Catatan Audit Voucher Rusak / Cacat Fisik:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                    {agentDamaged.map((dmg) => {
                      const vt = voucherTypes.find((v) => v.id === dmg.voucherTypeId);
                      return (
                        <li key={dmg.id}>
                          <strong>{formatDate(dmg.date)}</strong> - {vt?.name}: {dmg.quantity} pcs rusak. Alasan:{' '}
                          <em>"{dmg.reason}"</em>. (Estimasi nilai kerugian modal: {formatRupiah(dmg.costLoss)} - Status:{' '}
                          {dmg.actionTaken === 'written_off' ? 'Dihapusbukukan dari kewajiban setor agen' : 'Diganti baru'}).
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Ringkasan Finansial Setoran */}
              <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    TOTAL KEWAJIBAN SETOR BERSIH AGEN
                  </span>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                    {formatRupiah(summary.totalNetDepositDue)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    (Voucher Terjual x Harga Setor) - Seluruh komisi penjualan senilai{' '}
                    <strong className="text-white">{formatRupiah(summary.totalAgentCommission)}</strong> telah dipotong
                    sebagai keuntungan langsung agen.
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs">
                  <div className="text-slate-300">Sisa Fisik Voucher di Agen:</div>
                  <div className="text-lg font-bold text-amber-400 font-mono">
                    {summary.totalRemaining} pcs siap jual
                  </div>
                </div>
              </div>

              {/* Blok Tanda Tangan */}
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs text-slate-700">
                <div className="text-center">
                  <p className="font-semibold text-slate-800">Dibuat & Diserahkan Oleh,</p>
                  <p className="text-[11px] text-slate-500">Pengelola WiFi Hotspot (Admin)</p>
                  <div className="h-20 flex items-end justify-center">
                    <div className="w-48 border-b border-slate-400"></div>
                  </div>
                  <p className="font-bold text-slate-900 mt-1.5">( Koordinator Lapangan )</p>
                </div>

                <div className="text-center">
                  <p className="font-semibold text-slate-800">Diterima & Disetujui Oleh,</p>
                  <p className="text-[11px] text-slate-500">Mitra Agen Voucher WiFi</p>
                  <div className="h-20 flex items-end justify-center">
                    <div className="w-48 border-b border-slate-400"></div>
                  </div>
                  <p className="font-bold text-slate-900 mt-1.5">( {agent.ownerName} )</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
