import { Agent, DistributionRecord, ReconciliationRecord, VoucherType, AgentStockSummary } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function calculateAgentSummary(
  agent: Agent,
  distributions: DistributionRecord[],
  reconciliations: ReconciliationRecord[],
  voucherTypes: VoucherType[]
): AgentStockSummary {
  // Filter for this agent
  const agentDistributions = distributions.filter((d) => d.agentId === agent.id);
  const agentReconciliations = reconciliations.filter((r) => r.agentId === agent.id);

  const byVoucherType: AgentStockSummary['byVoucherType'] = {};

  let totalDistributed = 0;
  let totalSold = 0;
  let totalReturned = 0;
  let totalDamaged = 0;
  let totalRemaining = 0;
  let totalGrossSales = 0;
  let totalAgentCommission = 0;
  let totalNetDepositDue = 0;
  let totalDamagedLoss = 0;

  voucherTypes.forEach((vt) => {
    // Sum distributed quantity for this voucher type
    let distributedQty = 0;
    agentDistributions.forEach((dist) => {
      dist.items.forEach((item) => {
        if (item.voucherTypeId === vt.id) {
          distributedQty += item.quantity || 0;
        }
      });
    });

    // Sum reconciliations for this voucher type
    let soldQty = 0;
    let returnedQty = 0;
    let damagedQty = 0;

    agentReconciliations.forEach((rec) => {
      rec.items.forEach((item) => {
        if (item.voucherTypeId === vt.id) {
          soldQty += item.soldQty || 0;
          returnedQty += item.returnedQty || 0;
          damagedQty += item.damagedQty || 0;
        }
      });
    });

    // Remaining stock at the agent
    const remainingQty = Math.max(0, distributedQty - soldQty - returnedQty - damagedQty);

    const grossSales = soldQty * vt.priceUser;
    const agentCommission = soldQty * (vt.priceUser - vt.priceAgent);
    const netDeposit = soldQty * vt.priceAgent;
    const damagedLoss = damagedQty * vt.priceAgent;

    byVoucherType[vt.id] = {
      voucherType: vt,
      distributed: distributedQty,
      sold: soldQty,
      returned: returnedQty,
      damaged: damagedQty,
      remaining: remainingQty,
      grossSales,
      agentCommission,
      netDeposit,
      damagedLoss,
    };

    totalDistributed += distributedQty;
    totalSold += soldQty;
    totalReturned += returnedQty;
    totalDamaged += damagedQty;
    totalRemaining += remainingQty;
    totalGrossSales += grossSales;
    totalAgentCommission += agentCommission;
    totalNetDepositDue += netDeposit;
    totalDamagedLoss += damagedLoss;
  });

  return {
    agent,
    byVoucherType,
    totalDistributed,
    totalSold,
    totalReturned,
    totalDamaged,
    totalRemaining,
    totalGrossSales,
    totalAgentCommission,
    totalNetDepositDue,
    totalDamagedLoss,
  };
}

export function calculateAllAgentsSummary(
  agents: Agent[],
  distributions: DistributionRecord[],
  reconciliations: ReconciliationRecord[],
  voucherTypes: VoucherType[]
): AgentStockSummary[] {
  return agents.map((agent) =>
    calculateAgentSummary(agent, distributions, reconciliations, voucherTypes)
  );
}
