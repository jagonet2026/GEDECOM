import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Agent, DistributionRecord, ReconciliationRecord, VoucherType, DamagedVoucherLog } from '../types';
import { calculateAgentSummary, formatRupiah, formatDate } from './calculations';

export function exportToPdf(
  agents: Agent[],
  distributions: DistributionRecord[],
  reconciliations: ReconciliationRecord[],
  voucherTypes: VoucherType[],
  damagedLogs: DamagedVoucherLog[],
  agentId?: string,
  periodMonth?: string
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const selectedAgent = agentId ? agents.find((a) => a.id === agentId) : null;
  const targetAgents = selectedAgent ? [selectedAgent] : agents;

  targetAgents.forEach((agent, agentIndex) => {
    if (agentIndex > 0) {
      doc.addPage();
    }

    const summary = calculateAgentSummary(agent, distributions, reconciliations, voucherTypes);
    const agentDamaged = damagedLogs.filter((d) => d.agentId === agent.id);

    // Header / KOP Laporan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('LAPORAN STATUS & REKONSILIASI DISTRIBUSI VOUCHER WIFI', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Dokumen Transparansi Distribusi, Penjualan, Retur & Rekonsiliasi Inventaris Agen', 14, 20);

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 23, 283, 23);

    // Agent Info Box (Left) & Metadata (Right)
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMASI MITRA AGEN:', 14, 30);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nama Agen    : ${agent.name} (${agent.ownerName})`, 14, 35);
    doc.text(`Kontak/HP    : ${agent.phone}`, 14, 40);
    doc.text(`Lokasi Toko  : ${agent.location}`, 14, 45);

    doc.setFont('helvetica', 'bold');
    doc.text('INFORMASI PERIODE & STATUS:', 160, 30);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode Laporan : ${periodMonth || 'Berjalan (Real-time)'}`, 160, 35);
    doc.text(`Tanggal Cetak   : ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`, 160, 40);
    doc.text(`Status Agen     : ${agent.status === 'active' ? 'Aktif Beroperasi' : 'Non-Aktif'}`, 160, 45);

    // KPI Summary Badges
    const startY = 51;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, startY, 269, 17, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const kpiYTitle = startY + 5;
    const kpiYVal = startY + 12;

    // 1. Total Distribusi
    doc.text('TOTAL DISTRIBUSI', 20, kpiYTitle);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`${summary.totalDistributed} Pcs`, 20, kpiYVal);

    // 2. Terjual
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('TERJUAL', 65, kpiYTitle);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129); // emerald
    doc.text(`${summary.totalSold} Pcs`, 65, kpiYVal);

    // 3. Retur
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('DIKEMBALIKAN (RETUR)', 105, kpiYTitle);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(59, 130, 246); // blue
    doc.text(`${summary.totalReturned} Pcs`, 105, kpiYVal);

    // 4. Rusak
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('RUSAK / CACAT', 155, kpiYTitle);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(239, 68, 68); // red
    doc.text(`${summary.totalDamaged} Pcs`, 155, kpiYVal);

    // 5. Sisa Belum Terjual
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('SISA DI AGEN', 195, kpiYTitle);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(217, 119, 6); // amber
    doc.text(`${summary.totalRemaining} Pcs`, 195, kpiYVal);

    // 6. Total Setoran Bersih
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('SETORAN BERSIH AGENT', 235, kpiYTitle);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229); // indigo
    doc.text(formatRupiah(summary.totalNetDepositDue), 235, kpiYVal);

    // Table Data
    const tableBody = voucherTypes
      .map((vt, idx) => {
        const item = summary.byVoucherType[vt.id];
        if (!item || (item.distributed === 0 && item.sold === 0 && item.returned === 0 && item.damaged === 0)) {
          return null;
        }
        return [
          idx + 1,
          vt.name,
          `${item.distributed} pcs`,
          `${item.sold} pcs`,
          `${item.returned} pcs`,
          `${item.damaged} pcs`,
          `${item.remaining} pcs`,
          formatRupiah(vt.priceUser),
          formatRupiah(item.grossSales),
          formatRupiah(item.agentCommission),
          formatRupiah(item.netDeposit),
        ];
      })
      .filter(Boolean) as any[];

    // Add totals row
    tableBody.push([
      { content: 'TOTAL', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
      `${summary.totalDistributed} pcs`,
      `${summary.totalSold} pcs`,
      `${summary.totalReturned} pcs`,
      `${summary.totalDamaged} pcs`,
      `${summary.totalRemaining} pcs`,
      '-',
      formatRupiah(summary.totalGrossSales),
      formatRupiah(summary.totalAgentCommission),
      { content: formatRupiah(summary.totalNetDepositDue), styles: { fontStyle: 'bold', textColor: [79, 70, 229] } },
    ]);

    autoTable(doc, {
      startY: 73,
      head: [
        [
          'No',
          'Jenis Voucher WiFi',
          'Terdistribusi',
          'Terjual',
          'Retur',
          'Rusak',
          'Sisa Stok',
          'Harga Jual',
          'Total Penjualan',
          'Komisi Agen',
          'Wajib Setor',
        ],
      ],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 42 },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right' },
        10: { halign: 'right' },
      },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 6;

    // Catatan Kerusakan (jika ada)
    if (agentDamaged.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(185, 28, 28);
      doc.text('Rincian Log Voucher Rusak (Kerugian Inventaris):', 14, finalY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);

      agentDamaged.slice(0, 3).forEach((dmg) => {
        finalY += 4;
        const vt = voucherTypes.find((v) => v.id === dmg.voucherTypeId);
        doc.text(
          `• ${formatDate(dmg.date)} | ${vt?.name || 'Voucher'}: ${dmg.quantity} pcs rusak [${dmg.reason}] (Estimasi Biaya: ${formatRupiah(dmg.costLoss)})`,
          16,
          finalY
        );
      });
      finalY += 4;
    }

    // Tanda Tangan
    const signY = Math.max(finalY + 8, 160);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    // Pengelola
    doc.text('Diserahkan & Diperiksa Oleh,', 30, signY);
    doc.text('Pengelola Hotspot WiFi', 30, signY + 4);
    doc.line(30, signY + 22, 75, signY + 22);
    doc.text('( Admin / Koordinator Lapangan )', 30, signY + 26);

    // Agen
    doc.text('Diterima & Disetujui Oleh,', 215, signY);
    doc.text(`Mitra Agen: ${agent.name}`, 215, signY + 4);
    doc.line(215, signY + 22, 265, signY + 22);
    doc.text(`( ${agent.ownerName} )`, 215, signY + 26);
  });

  const filename = selectedAgent
    ? `Laporan_Voucher_${selectedAgent.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
    : `Laporan_Distribusi_Voucher_WiFi_Rekonsiliasi_${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(filename);
}
