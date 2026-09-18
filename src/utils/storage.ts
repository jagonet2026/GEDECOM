import {
  Agent,
  DistributionRecord,
  ReconciliationRecord,
  VoucherType,
  DamagedVoucherLog,
} from '../types';
import {
  INITIAL_AGENTS,
  INITIAL_DISTRIBUTIONS,
  INITIAL_RECONCILIATIONS,
  INITIAL_VOUCHER_TYPES,
  INITIAL_DAMAGED_LOGS,
} from '../data/initialData';

const STORAGE_KEYS = {
  AGENTS: 'wifi_voucher_agents_v1',
  DISTRIBUTIONS: 'wifi_voucher_distributions_v1',
  RECONCILIATIONS: 'wifi_voucher_reconciliations_v1',
  VOUCHER_TYPES: 'wifi_voucher_types_v1',
  DAMAGED_LOGS: 'wifi_voucher_damaged_logs_v1',
};

export function loadStoredData() {
  try {
    const rawAgents = localStorage.getItem(STORAGE_KEYS.AGENTS);
    const rawDist = localStorage.getItem(STORAGE_KEYS.DISTRIBUTIONS);
    const rawRec = localStorage.getItem(STORAGE_KEYS.RECONCILIATIONS);
    const rawVT = localStorage.getItem(STORAGE_KEYS.VOUCHER_TYPES);
    const rawDmg = localStorage.getItem(STORAGE_KEYS.DAMAGED_LOGS);

    return {
      agents: rawAgents ? (JSON.parse(rawAgents) as Agent[]) : INITIAL_AGENTS,
      distributions: rawDist
        ? (JSON.parse(rawDist) as DistributionRecord[])
        : INITIAL_DISTRIBUTIONS,
      reconciliations: rawRec
        ? (JSON.parse(rawRec) as ReconciliationRecord[])
        : INITIAL_RECONCILIATIONS,
      voucherTypes: rawVT
        ? (JSON.parse(rawVT) as VoucherType[])
        : INITIAL_VOUCHER_TYPES,
      damagedLogs: rawDmg
        ? (JSON.parse(rawDmg) as DamagedVoucherLog[])
        : INITIAL_DAMAGED_LOGS,
    };
  } catch (err) {
    console.error('Error loading data from localStorage, falling back to defaults:', err);
    return {
      agents: INITIAL_AGENTS,
      distributions: INITIAL_DISTRIBUTIONS,
      reconciliations: INITIAL_RECONCILIATIONS,
      voucherTypes: INITIAL_VOUCHER_TYPES,
      damagedLogs: INITIAL_DAMAGED_LOGS,
    };
  }
}

export function saveStoredData(data: {
  agents?: Agent[];
  distributions?: DistributionRecord[];
  reconciliations?: ReconciliationRecord[];
  voucherTypes?: VoucherType[];
  damagedLogs?: DamagedVoucherLog[];
}) {
  try {
    if (data.agents) localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(data.agents));
    if (data.distributions)
      localStorage.setItem(STORAGE_KEYS.DISTRIBUTIONS, JSON.stringify(data.distributions));
    if (data.reconciliations)
      localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, JSON.stringify(data.reconciliations));
    if (data.voucherTypes)
      localStorage.setItem(STORAGE_KEYS.VOUCHER_TYPES, JSON.stringify(data.voucherTypes));
    if (data.damagedLogs)
      localStorage.setItem(STORAGE_KEYS.DAMAGED_LOGS, JSON.stringify(data.damagedLogs));
  } catch (err) {
    console.error('Error saving data to localStorage:', err);
  }
}

export function resetToFactoryData() {
  localStorage.removeItem(STORAGE_KEYS.AGENTS);
  localStorage.removeItem(STORAGE_KEYS.DISTRIBUTIONS);
  localStorage.removeItem(STORAGE_KEYS.RECONCILIATIONS);
  localStorage.removeItem(STORAGE_KEYS.VOUCHER_TYPES);
  localStorage.removeItem(STORAGE_KEYS.DAMAGED_LOGS);
}
