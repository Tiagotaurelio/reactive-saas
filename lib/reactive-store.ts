import "server-only";

import {
  applyInboxMutation,
  deriveSnapshot,
  ImportedOrder,
  InboxMutation,
  registerFirstDispatchInState,
  RejectedRow,
  ReactiveSnapshot,
  storeImportInState,
  StoredState
} from "@/lib/reactive-domain";
import { loadTenantState, persistTenantState } from "@/lib/db";

export async function readReactiveState(tenantId: string): Promise<StoredState> {
  return loadTenantState(tenantId);
}

export async function readReactiveSnapshot(tenantId: string): Promise<ReactiveSnapshot> {
  const state = await readReactiveState(tenantId);
  return deriveSnapshot(state);
}

export async function persistImport(params: {
  tenantId: string;
  fileName: string;
  totalRows: number;
  validOrders: ImportedOrder[];
  rejectedRows: RejectedRow[];
}) {
  const state = await readReactiveState(params.tenantId);
  const { nextState, job, importedCustomerIds } = storeImportInState(state, params);
  await persistTenantState(params.tenantId, nextState);
  return {
    job,
    importedCustomerIds
  };
}

export async function persistFirstDispatch(tenantId: string, customerId: string) {
  const state = await readReactiveState(tenantId);
  const result = registerFirstDispatchInState(state, customerId);
  await persistTenantState(tenantId, result.nextState);
  return result;
}

export async function persistInboxMutation(mutation: InboxMutation) {
  const state = await readReactiveState(mutation.tenantId);
  const result = applyInboxMutation(state, mutation);

  if (result.updated) {
    await persistTenantState(mutation.tenantId, result.nextState);
  }

  return result;
}
