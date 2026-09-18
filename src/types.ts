export interface VoucherType {
  id: string;
  name: string;
  duration: string;
  speed?: string;
  priceUser: number;      // Harga jual ke konsumen (misal Rp 5.000)
  priceAgent: number;     // Harga setor agen (misal Rp 4.200)
  colorBadge: string;
}

export interface Agent {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  location: string;
  joinDate: string;
  status: 'active' | 'inactive';
  notes?: string;
}

export interface DistributionItem {
  voucherTypeId: string;
  quantity: number;
  startSerial?: string;
  endSerial?: string;
  priceUser: number;
  priceAgent: number;
}

export interface DistributionRecord {
  id: string;
  code: string; // e.g. DST-202609-001
  date: string;
  agentId: string;
  items: DistributionItem[];
  notes?: string;
  deliveredBy?: string;
  receivedBy?: string;
}

export interface ReconciliationItem {
  voucherTypeId: string;
  distributedQty: number; // Snapshot of distributed units
  soldQty: number;        // Jumlah terjual
  returnedQty: number;    // Jumlah retur (kembali bagus)
  damagedQty: number;     // Jumlah rusak (cacat fisik / gagal gesek)
  remainingQty: number;   // Sisa = distributed - sold - returned - damaged
  damageReason?: string;  // Keterangan kerusakan
  priceUser: number;
  priceAgent: number;
}

export interface ReconciliationRecord {
  id: string;
  code: string; // REC-202609-001
  date: string;
  periodMonth: string; // e.g. '2026-09'
  agentId: string;
  items: ReconciliationItem[];
  totalSoldQty: number;
  totalReturnedQty: number;
  totalDamagedQty: number;
  totalRemainingQty: number;
  grossSalesAmount: number;    // soldQty * priceUser
  agentCommissionAmount: number; // soldQty * (priceUser - priceAgent)
  netDepositDue: number;       // soldQty * priceAgent (wajib disetor agen)
  damagedLossAmount: number;   // damagedQty * priceAgent (kerugian inventaris)
  status: 'draft' | 'verified' | 'settled';
  notes?: string;
  settledDate?: string;
}

export interface DamagedVoucherLog {
  id: string;
  date: string;
  agentId: string;
  voucherTypeId: string;
  quantity: number;
  reason: string; // misal: "Gosokan rusak/pin tergores habis", "Fisik robek/terkena air", "Barcode gagal scan"
  serialNumbers?: string;
  costLoss: number; // Nilai kerugian modal
  actionTaken: 'written_off' | 'replaced' | 'under_review';
  recordedBy?: string;
}

export interface AgentStockSummary {
  agent: Agent;
  byVoucherType: {
    [voucherTypeId: string]: {
      voucherType: VoucherType;
      distributed: number;
      sold: number;
      returned: number;
      damaged: number;
      remaining: number;
      grossSales: number;
      agentCommission: number;
      netDeposit: number;
      damagedLoss: number;
    };
  };
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
