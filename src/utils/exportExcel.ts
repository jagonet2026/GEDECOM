import * as XLSX from 'xlsx';
import { Agent, DistributionRecord, ReconciliationRecord, VoucherType, DamagedVoucherLog } from '../types';
import { calculateAllAgentsSummary, calculateAgentSummary } from './calculations';

export interface ExportFilterOptions {
  month?: string;
  agentId?: string; // empty means all agents
}

export function exportToExcel(
  agents: Agent[],
  distributions: DistributionRecord[],
  reconciliations: ReconciliationRecord[],
  voucherTypes: VoucherType[],
  damagedLogs: DamagedVoucherLog[],
  options: ExportFilterOptions = {}
) {
  const wb = XLSX.utils.book_new();

  // Filter agents if specific agent is selected
  const targetAgents = options.agentId
    ? agents.filter((a) => a.id === options.agentId)
    : agents;

  // 1. SHEET: Rekapitulasi Stok & Penjualan Agen
  const stockSummaryData: any[] = [];
  stockSummaryData.push(['LAPORAN REKONSILIASI DISTRIBUSI & STOK VOUCHER WIFI']);
  stockSummaryData.push([
    `Periode: ${options.month || 'Semua Periode'} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`,
  ]);
  stockSummaryData.push([]); // blank line

  // Header row
  stockSummaryData.push([
    'No',
    'Nama Agen',
    'Lokasi',
    'Jenis Voucher',
    'Harga Jual (Rp)',
    'Harga Setor (Rp)',
    'Terdistribusi (Pcs)',
    'Terjual (Pcs)',
    'Retur (Pcs)',
    'Rusak (Pcs)',
    'Sisa Stok (Pcs)',
    'Total Penjualan (Rp)',
    'Komisi Agen (Rp)',
    'Wajib Setor Bersih (Rp)',
    'Nilai Kerugian Rusak (Rp)',
  ]);

  let rowCounter = 1;
  let grandDistributed = 0;
  let grandSold = 0;
  let grandReturned = 0;
  let grandDamaged = 0;
  let grandRemaining = 0;
  let grandGrossSales = 0;
  let grandCommission = 0;
  let grandNetDeposit = 0;
  let grandDamagedLoss = 0;

  targetAgents.forEach((agent) => {
    const summary = calculateAgentSummary(agent, distributions, reconciliations, voucherTypes);

    voucherTypes.forEach((vt) => {
      const rowItem = summary.byVoucherType[vt.id];
      if (!rowItem) return;

      // Only display if there was distribution or transaction for this voucher type
      if (
        rowItem.distributed > 0 ||
        rowItem.sold > 0 ||
        rowItem.returned > 0 ||
        rowItem.damaged > 0
      ) {
        stockSummaryData.push([
          rowCounter++,
          agent.name,
          agent.location,
          vt.name,
          vt.priceUser,
          vt.priceAgent,
          rowItem.distributed,
          rowItem.sold,
          rowItem.returned,
          rowItem.damaged,
          rowItem.remaining,
          rowItem.grossSales,
          rowItem.agentCommission,
          rowItem.netDeposit,
          rowItem.damagedLoss,
        ]);
      }
    });

    grandDistributed += summary.totalDistributed;
    grandSold += summary.totalSold;
    grandReturned += summary.totalReturned;
    grandDamaged += summary.totalDamaged;
    grandRemaining += summary.totalRemaining;
    grandGrossSales += summary.totalGrossSales;
    grandCommission += summary.totalAgentCommission;
    grandNetDeposit += summary.totalNetDepositDue;
    grandDamagedLoss += summary.totalDamagedLoss;
  });

  // Grand Total Row
  stockSummaryData.push([]);
  stockSummaryData.push([
    '',
    'TOTAL KESELURUHAN',
    '',
    '',
    '',
    '',
    grandDistributed,
    grandSold,
    grandReturned,
    grandDamaged,
    grandRemaining,
    grandGrossSales,
    grandCommission,
    grandNetDeposit,
    grandDamagedLoss,
  ]);

  const wsStock = XLSX.utils.aoa_to_sheet(stockSummaryData);
  XLSX.utils.book_append_sheet(wb, wsStock, 'Rekapitulasi Stok & Setoran');

  // 2. SHEET: Riwayat Distribusi
  const distRows: any[] = [
    ['RIWAYAT PEMBERIAN / DISTRIBUSI VOUCHER KE AGEN'],
    [`Dicetak pada: ${new Date().toLocaleString('id-ID')}`],
    [],
    [
      'Kode Distribusi',
      'Tanggal',
      'Nama Agen',
      'Jenis Voucher',
      'Jumlah (Pcs)',
      'Nomor Seri Awal',
      'Nomor Seri Akhir',
      'Harga Jual Satuan',
      'Harga Setor Satuan',
      'Penerima',
      'Catatan',
    ],
  ];

  const filteredDists = options.agentId
    ? distributions.filter((d) => d.agentId === options.agentId)
    : distributions;

  filteredDists.forEach((dist) => {
    const agent = agents.find((a) => a.id === dist.agentId);
    dist.items.forEach((item) => {
      const vt = voucherTypes.find((v) => v.id === item.voucherTypeId);
      distRows.push([
        dist.code,
        dist.date,
        agent?.name || dist.agentId,
        vt?.name || item.voucherTypeId,
        item.quantity,
        item.startSerial || '-',
        item.endSerial || '-',
        item.priceUser,
        item.priceAgent,
        dist.receivedBy || '-',
        dist.notes || '-',
      ]);
    });
  });

  const wsDist = XLSX.utils.aoa_to_sheet(distRows);
  XLSX.utils.book_append_sheet(wb, wsDist, 'Riwayat Distribusi');

  // 3. SHEET: Log Voucher Rusak & Audit Kerugian
  const damageRows: any[] = [
    ['LOG VOUCHER RUSAK & KERUGIAN INVENTARIS'],
    [`Dicetak pada: ${new Date().toLocaleString('id-ID')}`],
    [],
    [
      'Tanggal',
      'Nama Agen',
      'Jenis Voucher',
      'Jumlah Rusak (Pcs)',
      'Kerugian Modal (Rp)',
      'Alasan Kerusakan',
      'Nomor Seri Terkait',
      'Status Audit',
      'Dicatat Oleh',
    ],
  ];

  const filteredDamages = options.agentId
    ? damagedLogs.filter((d) => d.agentId === options.agentId)
    : damagedLogs;

  filteredDamages.forEach((dmg) => {
    const agent = agents.find((a) => a.id === dmg.agentId);
    const vt = voucherTypes.find((v) => v.id === dmg.voucherTypeId);
    damageRows.push([
      dmg.date,
      agent?.name || dmg.agentId,
      vt?.name || dmg.voucherTypeId,
      dmg.quantity,
      dmg.costLoss,
      dmg.reason,
      dmg.serialNumbers || '-',
      dmg.actionTaken === 'written_off'
        ? 'Dihapusbukukan (Write-off)'
        : dmg.actionTaken === 'replaced'
        ? 'Diganti Baru'
        : 'Dalam Verifikasi',
      dmg.recordedBy || '-',
    ]);
  });

  const wsDmg = XLSX.utils.aoa_to_sheet(damageRows);
  XLSX.utils.book_append_sheet(wb, wsDmg, 'Audit Voucher Rusak');

  // Write file
  const filename = options.agentId
    ? `Laporan_Voucher_${targetAgents[0]?.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
    : `Laporan_Distribusi_Voucher_WiFi_Semua_Agen_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, filename);
}
