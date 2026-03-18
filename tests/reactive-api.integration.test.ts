import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

import Database from "better-sqlite3";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieState = vi.hoisted(() => ({
  value: undefined as string | undefined
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get(name: string) {
      if (name !== "reactive_session" || !cookieState.value) {
        return undefined;
      }

      return { name, value: cookieState.value };
    },
    set(name: string, value: string) {
      if (name === "reactive_session") {
        cookieState.value = value;
      }
    }
  }))
}));

import { resetSqliteForTests } from "../lib/db";
import { POST as loginRoute } from "../app/api/auth/login/route";
import { POST as logoutRoute } from "../app/api/auth/logout/route";
import { GET as sessionRoute } from "../app/api/auth/session/route";
import { GET as snapshotRoute } from "../app/api/reactive/snapshot/route";
import { POST as importRoute } from "../app/api/reactive/import/route";
import { POST as dispatchRoute } from "../app/api/reactive/dispatch/route";
import { POST as inboxRoute } from "../app/api/reactive/inbox/route";

describe("ReActive API integration", () => {
  let dataDir = "";

  beforeEach(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), "reactive-api-test-"));
    process.env.REACTIVE_DATA_DIR = dataDir;
    cookieState.value = undefined;
    resetSqliteForTests();
  });

  afterEach(async () => {
    resetSqliteForTests();
    cookieState.value = undefined;
    delete process.env.REACTIVE_DATA_DIR;
    await rm(dataDir, { recursive: true, force: true });
  });

  it("runs the authenticated flow from login to snapshot, import, dispatch and inbox mutation", async () => {
    const loginResponse = await loginRoute(
      jsonRequest("http://localhost/api/auth/login", {
        email: "admin@reactive.local",
        password: "demo123"
      })
    );

    expect(loginResponse.status).toBe(200);
    expect(await loginResponse.json()).toEqual({ ok: true });
    expect(cookieState.value).toBeTruthy();

    const sessionResponse = await sessionRoute();
    const sessionPayload = (await sessionResponse.json()) as {
      session: { tenantId: string; userEmail: string } | null;
    };
    expect(sessionPayload.session?.tenantId).toBe("tenant-demo");
    expect(sessionPayload.session?.userEmail).toBe("admin@reactive.local");

    const initialSnapshotResponse = await snapshotRoute();
    expect(initialSnapshotResponse.status).toBe(200);
    const initialSnapshot = (await initialSnapshotResponse.json()) as {
      orders: Array<{ customerId: string }>;
      importJobs: Array<{ fileName: string }>;
    };
    expect(initialSnapshot.orders).toHaveLength(11);
    expect(initialSnapshot.importJobs[0]?.fileName).toBe("seed-pedidos.csv");

    const importResponse = await importRoute(
      jsonRequest("http://localhost/api/reactive/import", {
        fileName: "reactive-api-test.csv",
        totalRows: 3,
        validOrders: [
          {
            customerId: "C-200",
            customerName: "Armazem API",
            phone: "11999990100",
            seller: "Ana Torres",
            orderDate: "2026-03-01",
            orderValue: 4270.5,
            orderId: "P-2101"
          },
          {
            customerId: "C-200",
            customerName: "Armazem API",
            phone: "11999990100",
            seller: "Ana Torres",
            orderDate: "2026-01-25",
            orderValue: 3890,
            orderId: "P-2048"
          },
          {
            customerId: "C-201",
            customerName: "Loja Teste",
            phone: "11999990101",
            seller: "Marcos Prado",
            orderDate: "2026-02-07",
            orderValue: 2750.3,
            orderId: "P-2082"
          }
        ],
        rejectedRows: []
      })
    );

    expect(importResponse.status).toBe(200);
    const importPayload = (await importResponse.json()) as {
      job: {
        fileName: string;
        createdCustomers: number;
        importedOrders: number;
        automaticFirstDispatches: number;
      };
      impact: {
        duplicateOrders: number;
        impactedCustomers: Array<{
          customerId: string;
          name: string;
          seller: string;
          status: string;
          priorityScore: number;
          recoveredRevenue: number;
        }>;
      };
    };
    expect(importPayload.job.fileName).toBe("reactive-api-test.csv");
    expect(importPayload.job.createdCustomers).toBe(2);
    expect(importPayload.job.importedOrders).toBe(3);
    expect(importPayload.impact.duplicateOrders).toBe(0);
    expect(importPayload.impact.impactedCustomers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customerId: "C-200",
          name: "Armazem API",
          seller: "Ana Torres"
        }),
        expect.objectContaining({
          customerId: "C-201",
          name: "Loja Teste",
          seller: "Marcos Prado"
        })
      ])
    );

    const updatedSnapshotResponse = await snapshotRoute();
    expect(updatedSnapshotResponse.status).toBe(200);
    const updatedSnapshot = (await updatedSnapshotResponse.json()) as {
      orders: Array<{ customerId: string; orderId: string }>;
      importJobs: Array<{ fileName: string; importedOrders: number }>;
      customers: Array<{ customerId: string; status: string }>;
      firstDispatches: Array<{ customerId: string }>;
    };
    expect(updatedSnapshot.importJobs[0]).toMatchObject({
      fileName: "reactive-api-test.csv",
      importedOrders: 3
    });
    expect(updatedSnapshot.orders.map((order) => order.orderId)).toEqual(
      expect.arrayContaining(["P-2101", "P-2048", "P-2082"])
    );
    expect(updatedSnapshot.customers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ customerId: "C-200" }),
        expect.objectContaining({ customerId: "C-201", status: "Atencao" })
      ])
    );
    expect(updatedSnapshot.firstDispatches).toEqual(
      expect.arrayContaining([expect.objectContaining({ customerId: "C-201" })])
    );

    const dispatchResponse = await dispatchRoute(
      jsonRequest("http://localhost/api/reactive/dispatch", {
        customerId: "C-200"
      })
    );
    expect(dispatchResponse.status).toBe(200);
    expect(await dispatchResponse.json()).toMatchObject({
      created: true,
      dispatchAt: expect.any(String)
    });

    const inboxResponse = await inboxRoute(
      jsonRequest("http://localhost/api/reactive/inbox", {
        type: "add_inbound",
        customerId: "C-100",
        body: "Quero revisar a ultima proposta."
      })
    );
    expect(inboxResponse.status).toBe(200);
    expect(await inboxResponse.json()).toEqual({ updated: true });

    const finalSnapshotResponse = await snapshotRoute();
    const finalSnapshot = (await finalSnapshotResponse.json()) as {
      firstDispatches: Array<{ customerId: string }>;
      inboxThreads: Array<{ customerId: string; lastInbound: string; waiting: boolean }>;
      auditEvents: Array<{ entityId: string; type: string }>;
    };
    expect(finalSnapshot.firstDispatches).toEqual(
      expect.arrayContaining([expect.objectContaining({ customerId: "C-200" })])
    );
    expect(finalSnapshot.inboxThreads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customerId: "C-100",
          lastInbound: "Quero revisar a ultima proposta.",
          waiting: true
        })
      ])
    );
    expect(finalSnapshot.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityId: "C-200",
          type: "first_dispatch_recorded"
        }),
        expect.objectContaining({
          entityId: "C-100",
          type: "inbox_inbound_received"
        })
      ])
    );
  });

  it("ignores duplicate order ids from the existing base and from the same payload", async () => {
    const loginResponse = await loginRoute(
      jsonRequest("http://localhost/api/auth/login", {
        email: "admin@reactive.local",
        password: "demo123"
      })
    );
    expect(loginResponse.status).toBe(200);

    const importResponse = await importRoute(
      jsonRequest("http://localhost/api/reactive/import", {
        fileName: "reactive-duplicate-test.csv",
        totalRows: 3,
        validOrders: [
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
            customerId: "C-300",
            customerName: "Distribuidor Delta",
            phone: "11999990120",
            seller: "Renato Lima",
            orderDate: "2026-03-10",
            orderValue: 1999,
            orderId: "P-3001"
          },
          {
            customerId: "C-300",
            customerName: "Distribuidor Delta",
            phone: "11999990120",
            seller: "Renato Lima",
            orderDate: "2026-03-10",
            orderValue: 1999,
            orderId: "P-3001"
          }
        ],
        rejectedRows: []
      })
    );

    expect(importResponse.status).toBe(200);
    const payload = (await importResponse.json()) as {
      job: {
        importedOrders: number;
        createdCustomers: number;
      };
      impact: {
        duplicateOrders: number;
        impactedCustomers: Array<{ customerId: string }>;
      };
    };
    expect(payload.job.importedOrders).toBe(1);
    expect(payload.job.createdCustomers).toBe(1);
    expect(payload.impact.duplicateOrders).toBe(2);
    expect(payload.impact.impactedCustomers).toEqual([
      expect.objectContaining({ customerId: "C-300" })
    ]);

    const snapshotResponse = await snapshotRoute();
    const snapshot = (await snapshotResponse.json()) as {
      orders: Array<{ orderId: string; customerId: string }>;
      importJobs: Array<{ fileName: string; importedOrders: number }>;
    };
    expect(snapshot.orders.filter((order) => order.orderId === "P-3001")).toHaveLength(1);
    expect(snapshot.orders.filter((order) => order.orderId === "P-1001")).toHaveLength(1);
    expect(snapshot.importJobs[0]).toMatchObject({
      fileName: "reactive-duplicate-test.csv",
      importedOrders: 1
    });
  });

  it("rejects invalid import payloads with status 400", async () => {
    const loginResponse = await loginRoute(
      jsonRequest("http://localhost/api/auth/login", {
        email: "admin@reactive.local",
        password: "demo123"
      })
    );
    expect(loginResponse.status).toBe(200);

    const invalidResponse = await importRoute(
      jsonRequest("http://localhost/api/reactive/import", {
        fileName: "",
        totalRows: "3",
        validOrders: {},
        rejectedRows: []
      })
    );

    expect(invalidResponse.status).toBe(400);
    expect(await invalidResponse.json()).toEqual({
      error: "Payload de importacao invalido."
    });
  });

  it("clears the session on logout and treats expired sessions as anonymous", async () => {
    const loginResponse = await loginRoute(
      jsonRequest("http://localhost/api/auth/login", {
        email: "admin@reactive.local",
        password: "demo123"
      })
    );
    expect(loginResponse.status).toBe(200);
    expect(cookieState.value).toBeTruthy();

    const logoutResponse = await logoutRoute();
    expect(logoutResponse.status).toBe(200);
    expect(await logoutResponse.json()).toEqual({ ok: true });
    expect(cookieState.value).toBe("");

    const anonymousSessionResponse = await sessionRoute();
    expect(await anonymousSessionResponse.json()).toEqual({ session: null });

    await loginRoute(
      jsonRequest("http://localhost/api/auth/login", {
        email: "admin@reactive.local",
        password: "demo123"
      })
    );
    expect(cookieState.value).toBeTruthy();

    expireCurrentSession(dataDir, cookieState.value!);

    const expiredSessionResponse = await sessionRoute();
    expect(await expiredSessionResponse.json()).toEqual({ session: null });
  });

  it("keeps dispatch idempotent and rejects invalid inbox mutations", async () => {
    const loginResponse = await loginRoute(
      jsonRequest("http://localhost/api/auth/login", {
        email: "admin@reactive.local",
        password: "demo123"
      })
    );
    expect(loginResponse.status).toBe(200);

    const firstDispatchResponse = await dispatchRoute(
      jsonRequest("http://localhost/api/reactive/dispatch", {
        customerId: "C-100"
      })
    );
    expect(firstDispatchResponse.status).toBe(200);
    const firstDispatchPayload = (await firstDispatchResponse.json()) as {
      created: boolean;
      dispatchAt: string | null;
    };
    expect(firstDispatchPayload.created).toBe(true);
    expect(firstDispatchPayload.dispatchAt).toEqual(expect.any(String));

    const secondDispatchResponse = await dispatchRoute(
      jsonRequest("http://localhost/api/reactive/dispatch", {
        customerId: "C-100"
      })
    );
    expect(secondDispatchResponse.status).toBe(200);
    expect(await secondDispatchResponse.json()).toEqual({
      created: false,
      dispatchAt: firstDispatchPayload.dispatchAt
    });

    const missingCustomerResponse = await dispatchRoute(
      jsonRequest("http://localhost/api/reactive/dispatch", {})
    );
    expect(missingCustomerResponse.status).toBe(400);
    expect(await missingCustomerResponse.json()).toEqual({
      error: "customerId obrigatorio."
    });

    const invalidInboxResponse = await inboxRoute(
      jsonRequest("http://localhost/api/reactive/inbox", {
        type: "add_outbound",
        customerId: "C-100",
        body: "   "
      })
    );
    expect(invalidInboxResponse.status).toBe(400);
    expect(await invalidInboxResponse.json()).toEqual({
      error: "Mensagem obrigatoria."
    });

    const missingTypeResponse = await inboxRoute(
      jsonRequest("http://localhost/api/reactive/inbox", {
        customerId: "C-100"
      })
    );
    expect(missingTypeResponse.status).toBe(400);
    expect(await missingTypeResponse.json()).toEqual({
      error: "Payload de inbox invalido."
    });

    const unknownThreadResponse = await inboxRoute(
      jsonRequest("http://localhost/api/reactive/inbox", {
        type: "complete_handoff",
        customerId: "C-999"
      })
    );
    expect(unknownThreadResponse.status).toBe(200);
    expect(await unknownThreadResponse.json()).toEqual({ updated: false });
  });
});

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json"
    }
  });
}

function expireCurrentSession(dataDir: string, token: string) {
  const dbPath = path.join(dataDir, "reactive.db");
  const db = new Database(dbPath);
  db.prepare("update sessions set expires_at = ? where token = ?").run(
    "2000-01-01T00:00:00.000Z",
    token
  );
  db.close();
}
