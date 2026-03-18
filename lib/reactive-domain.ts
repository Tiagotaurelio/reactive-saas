export const requiredFields = [
  "cliente_id",
  "nome",
  "telefone",
  "vendedor_responsavel",
  "data_compra",
  "valor_compra",
  "pedido_id"
] as const;

export type RequiredField = (typeof requiredFields)[number];

export type ColumnMapping = Record<RequiredField, string>;

export type ImportedOrder = {
  customerId: string;
  customerName: string;
  phone: string;
  seller: string;
  orderDate: string;
  orderValue: number;
  orderId: string;
};

export type RejectedRow = {
  rowNumber: number;
  raw: Record<string, string>;
  reason: string;
};

export type ImportJob = {
  id: string;
  fileName: string;
  createdAt: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdCustomers: number;
  updatedCustomers: number;
  importedOrders: number;
  automaticFirstDispatches: number;
};

export type FirstDispatch = {
  customerId: string;
  dispatchedAt: string;
  createdAt: string;
  triggerStatus: "Atencao";
};

export type CustomerMetrics = {
  customerId: string;
  name: string;
  phone: string;
  seller: string;
  lastPurchaseAt: string;
  daysSinceLastPurchase: number;
  repurchaseWindowDays: number;
  last3OrdersValue: number;
  orderCount: number;
  priorityScore: number;
  status: "Atencao" | "Em risco" | "Inativo" | "Saudavel";
  lagLabel: string;
  firstAutoDispatchAt: string | null;
  recoveredRevenue: number;
  recoveredOrdersCount: number;
  canRegisterFirstDispatch: boolean;
  timeline: CustomerTimelineEvent[];
};

export type CustomerTimelineEvent = {
  id: string;
  type: "last_purchase" | "first_dispatch" | "recovered_order";
  title: string;
  occurredAt: string;
  amount?: number;
  orderId?: string;
};

export type DashboardStat = {
  label: string;
  value: string;
  delta: string;
};

export type AuditEvent = {
  id: string;
  type:
    | "import_completed"
    | "first_dispatch_recorded"
    | "inbox_handoff_completed"
    | "inbox_outbound_sent"
    | "inbox_inbound_received";
  title: string;
  description: string;
  entityId: string;
  occurredAt: string;
};

export type InboxMessage = {
  id: string;
  direction: "outbound" | "inbound";
  body: string;
  occurredAt: string;
};

export type InboxThread = {
  customerId: string;
  customer: string;
  seller: string;
  status: string;
  waiting: boolean;
  lastInbound: string;
  lastOutbound: string;
  messages: InboxMessage[];
};

export type InboxMutation =
  | {
      type: "complete_handoff";
      tenantId: string;
      customerId: string;
    }
  | {
      type: "add_outbound";
      tenantId: string;
      customerId: string;
      body: string;
    }
  | {
      type: "add_inbound";
      tenantId: string;
      customerId: string;
      body: string;
    };

export type ReactiveSnapshot = {
  orders: ImportedOrder[];
  importJobs: ImportJob[];
  firstDispatches: FirstDispatch[];
  inboxThreads: InboxThread[];
  auditEvents: AuditEvent[];
  customers: CustomerMetrics[];
  stats: DashboardStat[];
};

export type StoredState = {
  orders: ImportedOrder[];
  importJobs: ImportJob[];
  firstDispatches: FirstDispatch[];
  inboxThreads: InboxThread[];
  auditEvents: AuditEvent[];
};

export const seededOrders: ImportedOrder[] = [
  {
    customerId: "C-100",
    customerName: "Mercantil Costa Norte",
    phone: "11999990001",
    seller: "Carla Dias",
    orderDate: "2026-02-04",
    orderValue: 4820,
    orderId: "P-1001"
  },
  {
    customerId: "C-100",
    customerName: "Mercantil Costa Norte",
    phone: "11999990001",
    seller: "Carla Dias",
    orderDate: "2025-12-28",
    orderValue: 5140,
    orderId: "P-0911"
  },
  {
    customerId: "C-100",
    customerName: "Mercantil Costa Norte",
    phone: "11999990001",
    seller: "Carla Dias",
    orderDate: "2025-11-24",
    orderValue: 4320,
    orderId: "P-0834"
  },
  {
    customerId: "C-101",
    customerName: "Distribuidora M2",
    phone: "11999990002",
    seller: "Paulo Viana",
    orderDate: "2026-01-19",
    orderValue: 6210,
    orderId: "P-1022"
  },
  {
    customerId: "C-101",
    customerName: "Distribuidora M2",
    phone: "11999990002",
    seller: "Paulo Viana",
    orderDate: "2025-12-18",
    orderValue: 5980,
    orderId: "P-0930"
  },
  {
    customerId: "C-102",
    customerName: "Atacado Boa Compra",
    phone: "11999990003",
    seller: "Renata Alves",
    orderDate: "2026-02-12",
    orderValue: 3190,
    orderId: "P-1031"
  },
  {
    customerId: "C-102",
    customerName: "Atacado Boa Compra",
    phone: "11999990003",
    seller: "Renata Alves",
    orderDate: "2026-01-11",
    orderValue: 3520,
    orderId: "P-0970"
  },
  {
    customerId: "C-102",
    customerName: "Atacado Boa Compra",
    phone: "11999990003",
    seller: "Renata Alves",
    orderDate: "2025-12-10",
    orderValue: 3380,
    orderId: "P-0887"
  },
  {
    customerId: "C-103",
    customerName: "Comercial Santa Luz",
    phone: "11999990004",
    seller: "Felipe Moura",
    orderDate: "2025-11-01",
    orderValue: 8910,
    orderId: "P-0761"
  },
  {
    customerId: "C-103",
    customerName: "Comercial Santa Luz",
    phone: "11999990004",
    seller: "Felipe Moura",
    orderDate: "2025-09-12",
    orderValue: 8420,
    orderId: "P-0655"
  },
  {
    customerId: "C-103",
    customerName: "Comercial Santa Luz",
    phone: "11999990004",
    seller: "Felipe Moura",
    orderDate: "2025-07-28",
    orderValue: 8040,
    orderId: "P-0562"
  }
];

export const seededImportJobs: ImportJob[] = [
  {
    id: "job-seed-1",
    fileName: "seed-pedidos.csv",
    createdAt: "2026-03-15T09:00:00.000Z",
    totalRows: seededOrders.length,
    validRows: seededOrders.length,
    invalidRows: 0,
    createdCustomers: 4,
    updatedCustomers: 0,
    importedOrders: seededOrders.length,
    automaticFirstDispatches: 0
  }
];

export const seededFirstDispatches: FirstDispatch[] = [];

export const seededInboxThreads: InboxThread[] = [
  {
    customerId: "C-100",
    customer: "Mercantil Costa Norte",
    seller: "Carla Dias",
    status: "Atencao",
    waiting: true,
    lastInbound: "Quais itens ainda tem em promocao?",
    lastOutbound: "Posso te mostrar uma condicao especial desta semana.",
    messages: [
      {
        id: "m-100-1",
        direction: "outbound",
        body: "Posso te mostrar uma condicao especial desta semana.",
        occurredAt: "2026-03-16T13:10:00.000Z"
      },
      {
        id: "m-100-2",
        direction: "inbound",
        body: "Quais itens ainda tem em promocao?",
        occurredAt: "2026-03-16T13:18:00.000Z"
      }
    ]
  },
  {
    customerId: "C-101",
    customer: "Distribuidora M2",
    seller: "Paulo Viana",
    status: "Em risco",
    waiting: true,
    lastInbound: "Pode me ligar no fim da tarde?",
    lastOutbound: "Temos uma oportunidade para recompor seu mix.",
    messages: [
      {
        id: "m-101-1",
        direction: "outbound",
        body: "Temos uma oportunidade para recompor seu mix.",
        occurredAt: "2026-03-16T11:05:00.000Z"
      },
      {
        id: "m-101-2",
        direction: "inbound",
        body: "Pode me ligar no fim da tarde?",
        occurredAt: "2026-03-16T11:23:00.000Z"
      }
    ]
  }
];

export const seededAuditEvents: AuditEvent[] = [
  {
    id: "audit-seed-import",
    type: "import_completed",
    title: "Importacao inicial concluida",
    description: "Seed do projeto carregou 11 pedidos e 4 clientes.",
    entityId: "job-seed-1",
    occurredAt: "2026-03-15T09:00:00.000Z"
  }
];

export const sampleCsv = [
  "cliente_id,nome,telefone,vendedor_responsavel,data_compra,valor_compra,pedido_id",
  "C-104,Armazem Lima,11999990005,Ana Torres,2026-03-01,4270.50,P-1101",
  "C-104,Armazem Lima,11999990005,Ana Torres,2026-01-25,3890.00,P-1048",
  "C-105,Loja Horizonte,11999990006,Marcos Prado,2026-02-07,2750.30,P-1082"
].join("\n");

export function createDefaultMapping(headers: string[]): ColumnMapping {
  const normalized = new Map(headers.map((header) => [normalizeHeader(header), header]));

  return {
    cliente_id: normalized.get("cliente_id") ?? "",
    nome: normalized.get("nome") ?? "",
    telefone: normalized.get("telefone") ?? "",
    vendedor_responsavel: normalized.get("vendedor_responsavel") ?? "",
    data_compra: normalized.get("data_compra") ?? "",
    valor_compra: normalized.get("valor_compra") ?? "",
    pedido_id: normalized.get("pedido_id") ?? ""
  };
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    return headers.reduce<Record<string, string>>((accumulator, header, index) => {
      accumulator[header] = values[index] ?? "";
      return accumulator;
    }, {});
  });
}

export function getHeaders(text: string): string[] {
  const [firstLine = ""] = text.split(/\r?\n/);
  return parseCsvLine(firstLine.trim()).filter(Boolean);
}

export function validateRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): { validOrders: ImportedOrder[]; rejectedRows: RejectedRow[] } {
  const validOrders: ImportedOrder[] = [];
  const rejectedRows: RejectedRow[] = [];

  rows.forEach((row, index) => {
    const customerId = getMappedValue(row, mapping.cliente_id);
    const customerName = getMappedValue(row, mapping.nome);
    const phone = getMappedValue(row, mapping.telefone);
    const seller = getMappedValue(row, mapping.vendedor_responsavel);
    const orderDate = getMappedValue(row, mapping.data_compra);
    const orderValue = getMappedValue(row, mapping.valor_compra);
    const orderId = getMappedValue(row, mapping.pedido_id);

    const reasons: string[] = [];

    if (!customerId) reasons.push("cliente_id ausente");
    if (!customerName) reasons.push("nome ausente");
    if (!phone) reasons.push("telefone ausente");
    if (!seller) reasons.push("vendedor_responsavel ausente");
    if (!orderId) reasons.push("pedido_id ausente");

    const parsedDate = new Date(orderDate);
    if (!orderDate || Number.isNaN(parsedDate.getTime())) {
      reasons.push("data_compra invalida");
    }

    const parsedValue = Number(String(orderValue).replace(",", "."));
    if (!orderValue || Number.isNaN(parsedValue) || parsedValue <= 0) {
      reasons.push("valor_compra invalido");
    }

    if (reasons.length > 0) {
      rejectedRows.push({
        rowNumber: index + 2,
        raw: row,
        reason: reasons.join(", ")
      });
      return;
    }

    validOrders.push({
      customerId,
      customerName,
      phone,
      seller,
      orderDate: parsedDate.toISOString().slice(0, 10),
      orderValue: parsedValue,
      orderId
    });
  });

  return { validOrders, rejectedRows };
}

export function storeImportInState(
  state: StoredState,
  params: {
    fileName: string;
    totalRows: number;
    validOrders: ImportedOrder[];
    rejectedRows: RejectedRow[];
  }
): { nextState: StoredState; job: ImportJob; importedCustomerIds: string[] } {
  const existingCustomers = new Set(state.orders.map((order) => order.customerId));
  const seenOrderIds = new Set(state.orders.map((order) => order.orderId));
  const newOrders = params.validOrders.filter((order) => {
    if (seenOrderIds.has(order.orderId)) {
      return false;
    }

    seenOrderIds.add(order.orderId);
    return true;
  });
  const createdCustomers = new Set(
    newOrders.filter((order) => !existingCustomers.has(order.customerId)).map((order) => order.customerId)
  ).size;
  const updatedCustomers = new Set(
    newOrders.filter((order) => existingCustomers.has(order.customerId)).map((order) => order.customerId)
  ).size;

  const stateWithOrders: StoredState = {
    orders: [...newOrders, ...state.orders].sort((left, right) => right.orderDate.localeCompare(left.orderDate)),
    importJobs: state.importJobs,
    firstDispatches: state.firstDispatches,
    inboxThreads: state.inboxThreads,
    auditEvents: state.auditEvents
  };
  const automaticDispatchResult = applyAutomaticFirstDispatches(stateWithOrders);

  const job: ImportJob = {
    id: `job-${Date.now()}`,
    fileName: params.fileName,
    createdAt: new Date().toISOString(),
    totalRows: params.totalRows,
    validRows: params.validOrders.length,
    invalidRows: params.rejectedRows.length,
    createdCustomers,
    updatedCustomers,
    importedOrders: newOrders.length,
    automaticFirstDispatches: automaticDispatchResult.createdCount
  };

  return {
    nextState: {
      orders: automaticDispatchResult.state.orders,
      importJobs: [job, ...state.importJobs],
      firstDispatches: automaticDispatchResult.state.firstDispatches,
      inboxThreads: state.inboxThreads,
      auditEvents: [
        ...automaticDispatchResult.auditEvents,
        createAuditEvent({
          type: "import_completed",
          entityId: job.id,
          occurredAt: job.createdAt,
          title: "Importacao concluida",
          description: `${job.importedOrders} pedidos novos, ${job.invalidRows} linhas rejeitadas e ${job.automaticFirstDispatches} primeiros disparos automaticos.`
        }),
        ...state.auditEvents
      ]
    },
    job,
    importedCustomerIds: Array.from(new Set(newOrders.map((order) => order.customerId)))
  };
}

export function deriveSnapshot(state: StoredState): ReactiveSnapshot {
  const customers = deriveCustomers(state.orders, state.firstDispatches);

  return {
    orders: state.orders,
    importJobs: state.importJobs,
    firstDispatches: state.firstDispatches,
    inboxThreads: state.inboxThreads,
    auditEvents: state.auditEvents,
    customers,
    stats: deriveDashboardStats(customers, state.importJobs, state.firstDispatches)
  };
}

export function createSeedState(): StoredState {
  return {
    orders: seededOrders,
    importJobs: seededImportJobs,
    firstDispatches: seededFirstDispatches,
    inboxThreads: seededInboxThreads,
    auditEvents: seededAuditEvents
  };
}

export function registerFirstDispatchInState(
  state: StoredState,
  customerId: string
): { nextState: StoredState; created: boolean; dispatchAt: string | null } {
  if (state.firstDispatches.some((dispatch) => dispatch.customerId === customerId)) {
    const existing = state.firstDispatches.find((dispatch) => dispatch.customerId === customerId) ?? null;
    return {
      nextState: state,
      created: false,
      dispatchAt: existing?.dispatchedAt ?? null
    };
  }

  const dispatchAt = new Date().toISOString();
  return {
    nextState: {
      ...state,
      firstDispatches: [
        {
          customerId,
          dispatchedAt: dispatchAt,
          createdAt: dispatchAt,
          triggerStatus: "Atencao"
        },
        ...state.firstDispatches
      ],
      inboxThreads: state.inboxThreads,
      auditEvents: [
        createAuditEvent({
          type: "first_dispatch_recorded",
          entityId: customerId,
          occurredAt: dispatchAt,
          title: "Primeiro disparo registrado manualmente",
          description: `Cliente ${customerId} recebeu o primeiro disparo automatico.`
        }),
        ...state.auditEvents
      ]
    },
    created: true,
    dispatchAt
  };
}

function deriveDashboardStats(
  customers: CustomerMetrics[],
  importJobs: ImportJob[],
  firstDispatches: FirstDispatch[]
): DashboardStat[] {
  const revenueAtRisk = customers
    .filter((customer) => customer.status !== "Saudavel")
    .reduce((sum, customer) => sum + customer.last3OrdersValue, 0);
  const atencaoAndRisk = customers.filter((customer) => customer.status === "Atencao" || customer.status === "Em risco");
  const importedOrders = importJobs.reduce((sum, job) => sum + job.importedOrders, 0);
  const recoveredRevenue = customers.reduce((sum, customer) => sum + customer.recoveredRevenue, 0);
  const recoveredCustomers = customers.filter((customer) => customer.recoveredRevenue > 0).length;

  return [
    {
      label: "Receita Recuperada",
      value: formatCurrency(recoveredRevenue),
      delta: `${recoveredCustomers} clientes reativados`
    },
    {
      label: "Receita em Risco",
      value: formatCurrency(revenueAtRisk),
      delta: `${atencaoAndRisk.length} clientes priorizados`
    },
    {
      label: "Primeiros Disparos",
      value: String(firstDispatches.length),
      delta: "Gerado automaticamente no status Atencao"
    },
    {
      label: "Pedidos Consolidados",
      value: String(importedOrders),
      delta: `${importJobs.length} importacoes processadas`
    }
  ];
}

function deriveCustomers(orders: ImportedOrder[], firstDispatches: FirstDispatch[]): CustomerMetrics[] {
  const grouped = new Map<string, ImportedOrder[]>();
  const dispatchMap = new Map(firstDispatches.map((dispatch) => [dispatch.customerId, dispatch]));

  orders.forEach((order) => {
    const bucket = grouped.get(order.customerId) ?? [];
    bucket.push(order);
    grouped.set(order.customerId, bucket);
  });

  return Array.from(grouped.values())
    .map((customerOrders) => buildCustomerMetrics(customerOrders, dispatchMap.get(customerOrders[0].customerId) ?? null))
    .sort((left, right) => right.priorityScore - left.priorityScore);
}

function buildCustomerMetrics(customerOrders: ImportedOrder[], firstDispatch: FirstDispatch | null): CustomerMetrics {
  const sortedOrders = [...customerOrders].sort((left, right) => right.orderDate.localeCompare(left.orderDate));
  const [latest] = sortedOrders;
  const intervals = sortedOrders
    .slice(0, -1)
    .map((order, index) => daysBetween(sortedOrders[index + 1].orderDate, order.orderDate));
  const averageInterval = intervals.length > 0 ? average(intervals) : 30;
  const daysSinceLastPurchase = daysBetween(latest.orderDate, todayIsoDate());
  const last3OrdersValue = sortedOrders.slice(0, 3).reduce((sum, order) => sum + order.orderValue, 0);
  const valueComponent = Math.min(last3OrdersValue / 15000, 1) * 100;
  const frequencyComponent = Math.min(sortedOrders.length / 6, 1) * 100;
  const delayAfterWindow = daysSinceLastPurchase - averageInterval;
  const timingComponent =
    delayAfterWindow <= 0 ? 8 : Math.max(0, 100 - Math.abs(delayAfterWindow - 5) * 2.8);
  const priorityScore = Math.round(
    Math.min(100, valueComponent * 0.45 + frequencyComponent * 0.35 + timingComponent * 0.2)
  );
  const status = getStatus(daysSinceLastPurchase, averageInterval);
  const recoveredOrders = firstDispatch
    ? sortedOrders.filter((order) => order.orderDate > firstDispatch.dispatchedAt.slice(0, 10))
    : [];
  const recoveredRevenue = recoveredOrders.reduce((sum, order) => sum + order.orderValue, 0);

  return {
    customerId: latest.customerId,
    name: latest.customerName,
    phone: latest.phone,
    seller: latest.seller,
    lastPurchaseAt: latest.orderDate,
    daysSinceLastPurchase,
    repurchaseWindowDays: Math.round(averageInterval),
    last3OrdersValue,
    orderCount: sortedOrders.length,
    priorityScore,
    status,
    lagLabel: formatLagLabel(delayAfterWindow),
    firstAutoDispatchAt: firstDispatch?.dispatchedAt ?? null,
    recoveredRevenue,
    recoveredOrdersCount: recoveredOrders.length,
    canRegisterFirstDispatch: !firstDispatch && status === "Atencao",
    timeline: buildTimeline(latest.orderDate, latest.orderId, latest.orderValue, firstDispatch, recoveredOrders)
  };
}

function buildTimeline(
  lastPurchaseAt: string,
  lastOrderId: string,
  lastOrderValue: number,
  firstDispatch: FirstDispatch | null,
  recoveredOrders: ImportedOrder[]
): CustomerTimelineEvent[] {
  const events: CustomerTimelineEvent[] = [
    {
      id: `purchase-${lastOrderId}`,
      type: "last_purchase",
      title: "Ultima compra registrada",
      occurredAt: lastPurchaseAt,
      amount: lastOrderValue,
      orderId: lastOrderId
    }
  ];

  if (firstDispatch) {
    events.push({
      id: `dispatch-${firstDispatch.customerId}`,
      type: "first_dispatch",
      title: "Primeiro disparo automatico",
      occurredAt: firstDispatch.dispatchedAt
    });
  }

  recoveredOrders.forEach((order) => {
    events.push({
      id: `recovered-${order.orderId}`,
      type: "recovered_order",
      title: "Pedido atribuido como receita recuperada",
      occurredAt: order.orderDate,
      amount: order.orderValue,
      orderId: order.orderId
    });
  });

  return events.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
}

function applyAutomaticFirstDispatches(state: StoredState): {
  state: StoredState;
  createdCount: number;
  auditEvents: AuditEvent[];
} {
  const customers = deriveCustomers(state.orders, state.firstDispatches);
  const existing = new Set(state.firstDispatches.map((dispatch) => dispatch.customerId));
  const eligible = customers.filter(
    (customer) =>
      customer.status === "Atencao" &&
      customer.canRegisterFirstDispatch &&
      customer.phone.trim().length > 0 &&
      !existing.has(customer.customerId)
  );

  if (eligible.length === 0) {
    return { state, createdCount: 0, auditEvents: [] };
  }

  const dispatchAt = new Date().toISOString();
  const firstDispatches = eligible.map((customer) => ({
    customerId: customer.customerId,
    dispatchedAt: dispatchAt,
    createdAt: dispatchAt,
    triggerStatus: "Atencao" as const
  }));
  const auditEvents = eligible.map((customer) =>
    createAuditEvent({
      type: "first_dispatch_recorded",
      entityId: customer.customerId,
      occurredAt: dispatchAt,
      title: "Primeiro disparo automatico registrado",
      description: `${customer.name} entrou em Atencao e teve o marco inicial de atribuicao salvo.`
    })
  );

  return {
    state: {
      ...state,
      firstDispatches: [...firstDispatches, ...state.firstDispatches]
    },
    createdCount: firstDispatches.length,
    auditEvents
  };
}

function getStatus(
  daysSinceLastPurchase: number,
  repurchaseWindowDays: number
): "Atencao" | "Em risco" | "Inativo" | "Saudavel" {
  if (daysSinceLastPurchase <= repurchaseWindowDays) {
    return "Saudavel";
  }

  if (daysSinceLastPurchase <= repurchaseWindowDays + 15) {
    return "Atencao";
  }

  if (daysSinceLastPurchase <= repurchaseWindowDays + 45) {
    return "Em risco";
  }

  return "Inativo";
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function getMappedValue(row: Record<string, string>, field: string): string {
  return (row[field] ?? "").trim();
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (insideQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value);
}

function formatLagLabel(delayAfterWindow: number): string {
  if (delayAfterWindow <= 0) {
    return "antes da janela ideal";
  }

  return `${Math.round(delayAfterWindow)} dias apos janela`;
}

export function applyInboxMutation(
  state: StoredState,
  mutation: InboxMutation
): { nextState: StoredState; updated: boolean } {
  const now = new Date().toISOString();
  const nextThreads = state.inboxThreads.map((thread) => {
    if (thread.customerId !== mutation.customerId) {
      return thread;
    }

    if (mutation.type === "complete_handoff") {
      return {
        ...thread,
        waiting: false
      };
    }

    const body = mutation.body.trim();
    if (!body) {
      return thread;
    }

    const message: InboxMessage = {
      id: `msg-${mutation.customerId}-${Date.now()}`,
      direction: mutation.type === "add_inbound" ? "inbound" : "outbound",
      body,
      occurredAt: now
    };

    return {
      ...thread,
      waiting: mutation.type === "add_inbound" ? true : thread.waiting,
      lastInbound: mutation.type === "add_inbound" ? body : thread.lastInbound,
      lastOutbound: mutation.type === "add_outbound" ? body : thread.lastOutbound,
      messages: [...thread.messages, message]
    };
  });

  const updated = nextThreads.some((thread, index) => thread !== state.inboxThreads[index]);

  return {
    nextState: updated
      ? {
          ...state,
          inboxThreads: nextThreads,
          auditEvents: [
            createAuditEvent(
              mutation.type === "complete_handoff"
                ? {
                    type: "inbox_handoff_completed",
                    entityId: mutation.customerId,
                    occurredAt: now,
                    title: "Handoff concluido",
                    description: `Thread ${mutation.customerId} deixou de aguardar acao.`
                  }
                : mutation.type === "add_outbound"
                  ? {
                      type: "inbox_outbound_sent",
                      entityId: mutation.customerId,
                      occurredAt: now,
                      title: "Mensagem outbound registrada",
                      description: `Nova mensagem de saida enviada para ${mutation.customerId}.`
                    }
                  : {
                      type: "inbox_inbound_received",
                      entityId: mutation.customerId,
                      occurredAt: now,
                      title: "Mensagem inbound recebida",
                      description: `Nova resposta recebida de ${mutation.customerId}.`
                    }
            ),
            ...state.auditEvents
          ]
        }
      : state,
    updated
  };
}

function createAuditEvent(params: Omit<AuditEvent, "id">): AuditEvent {
  return {
    id: `audit-${params.type}-${params.entityId}-${params.occurredAt}`,
    ...params
  };
}
