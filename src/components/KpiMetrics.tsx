import { Send, CheckCircle2, RotateCcw, AlertOctagon, PackageCheck, Wallet } from 'lucide-react';
import { formatRupiah } from '../utils/calculations';

interface KpiMetricsProps {
  totalDistributed: number;
  totalSold: number;
  totalReturned: number;
  totalDamaged: number;
  totalRemaining: number;
  totalGrossSales: number;
  totalAgentCommission: number;
  totalNetDepositDue: number;
  totalDamagedLoss: number;
}

export default function KpiMetrics({
  totalDistributed,
  totalSold,
  totalReturned,
  totalDamaged,
  totalRemaining,
  totalGrossSales,
  totalAgentCommission,
  totalNetDepositDue,
  totalDamagedLoss,
}: KpiMetricsProps) {
  const soldPercentage =
    totalDistributed > 0 ? ((totalSold / totalDistributed) * 100).toFixed(1) : '0';
  const remainingPercentage =
    totalDistributed > 0 ? ((totalRemaining / totalDistributed) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Terdistribusi */}
      <div
        id="kpi-card-distributed"
        className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Terdistribusi</span>
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Send className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-slate-900 tracking-tight">
          {totalDistributed.toLocaleString('id-ID')}
          <span className="text-xs font-medium text-slate-500 ml-1">pcs</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 truncate">Total unit ke seluruh agen</p>
      </div>

      {/* 2. Terjual */}
      <div
        id="kpi-card-sold"
        className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-200 transition-all"
      >
        <div className="flex items-center justify-between text-emerald-600 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Voucher Terjual
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-emerald-700 tracking-tight">
          {totalSold.toLocaleString('id-ID')}
          <span className="text-xs font-medium text-emerald-600/80 ml-1">pcs</span>
        </div>
        <p className="text-[11px] text-emerald-600 font-medium mt-1">
          {soldPercentage}% dari total distribusi
        </p>
      </div>

      {/* 3. Retur (Dikembalikan) */}
      <div
        id="kpi-card-returned"
        className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-200 transition-all"
      >
        <div className="flex items-center justify-between text-blue-600 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Dikembalikan (Retur)
          </span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <RotateCcw className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-blue-700 tracking-tight">
          {totalReturned.toLocaleString('id-ID')}
          <span className="text-xs font-medium text-blue-600/80 ml-1">pcs</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Kembali utuh ke gudang</p>
      </div>

      {/* 4. Rusak / Kerugian */}
      <div
        id="kpi-card-damaged"
        className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:border-rose-200 transition-all"
      >
        <div className="flex items-center justify-between text-rose-600 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Voucher Rusak
          </span>
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
            <AlertOctagon className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-rose-700 tracking-tight">
          {totalDamaged.toLocaleString('id-ID')}
          <span className="text-xs font-medium text-rose-600/80 ml-1">pcs</span>
        </div>
        <p className="text-[11px] text-rose-600 font-medium mt-1 truncate" title={`Rugi modal: ${formatRupiah(totalDamagedLoss)}`}>
          Rugi: {formatRupiah(totalDamagedLoss)}
        </p>
      </div>

      {/* 5. Sisa Belum Terjual */}
      <div
        id="kpi-card-remaining"
        className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:border-amber-200 transition-all"
      >
        <div className="flex items-center justify-between text-amber-600 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Sisa di Agen
          </span>
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <PackageCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-amber-700 tracking-tight">
          {totalRemaining.toLocaleString('id-ID')}
          <span className="text-xs font-medium text-amber-600/80 ml-1">pcs</span>
        </div>
        <p className="text-[11px] text-amber-700 font-medium mt-1">
          {remainingPercentage}% stok aktif agen
        </p>
      </div>

      {/* 6. Wajib Setor Bersih */}
      <div
        id="kpi-card-deposit"
        className="bg-gradient-to-br from-slate-900 to-indigo-950 p-3.5 rounded-xl text-white shadow-xs"
      >
        <div className="flex items-center justify-between text-indigo-200 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Setoran Bersih
          </span>
          <div className="p-1.5 rounded-lg bg-white/10 text-emerald-400">
            <Wallet className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-lg font-black tracking-tight text-white truncate" title={formatRupiah(totalNetDepositDue)}>
          {formatRupiah(totalNetDepositDue)}
        </div>
        <p className="text-[10px] text-slate-300 mt-1 truncate">
          Komisi Agen: {formatRupiah(totalAgentCommission)}
        </p>
      </div>
    </div>
  );
}
