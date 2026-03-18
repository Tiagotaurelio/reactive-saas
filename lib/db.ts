import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { Pool } from "pg";

import { createSeedState, InboxThread, StoredState } from "@/lib/reactive-domain";

type SessionRow = {
  token: string;
  user_id: string;
  tenant_id: string;
  expires_at: string;
  user_name: string;
  user_email: string;
  tenant_name: string;
};

export type AuthSession = {
  token: string;
  userId: string;
  tenantId: string;
  userName: string;
  userEmail: string;
  tenantName: string;
  expiresAt: string;
};

const demoTenantId = "tenant-demo";
const demoUserId = "user-demo";
const demoEmail = "admin@reactive.local";
const demoPassword = "demo123";

let sqliteDb: Database.Database | null = null;
let postgresPool: Pool | null = null;
let postgresReady = false;

function hasPostgresConfig() {
  return Boolean(process.env.DATABASE_URL);
}

function getSqlite() {
  if (sqliteDb) {
    return sqliteDb;
  }

  const dataDirectory = getReactiveDataDirectory();
  const sqlitePath = path.join(dataDirectory, "reactive.db");
  mkdirSync(dataDirectory, { recursive: true });
  sqliteDb = new Database(sqlitePath);
  sqliteDb.pragma("journal_mode = WAL");
  initializeSqliteSchema(sqliteDb);
  seedSqlite(sqliteDb);
  return sqliteDb;
}

function getReactiveDataDirectory() {
  return process.env.REACTIVE_DATA_DIR?.trim() || path.join(process.cwd(), "data");
}

function getPostgresPool() {
  if (postgresPool) {
    return postgresPool;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  postgresPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "require" ? { rejectUnauthorized: false } : undefined
  });
  return postgresPool;
}

async function ensurePostgresReady() {
  if (!hasPostgresConfig() || postgresReady) {
    return;
  }

  const pool = getPostgresPool();
  await pool.query(`
    create table if not exists tenants (
      id text primary key,
      name text not null
    );

    create table if not exists users (
      id text primary key,
      tenant_id text not null,
      name text not null,
      email text not null unique,
      password_hash text not null
    );

    create table if not exists sessions (
      token text primary key,
      user_id text not null,
      tenant_id text not null,
      expires_at text not null
    );

    create table if not exists orders (
      tenant_id text not null,
      customer_id text not null,
      customer_name text not null,
      phone text not null,
      seller text not null,
      order_date text not null,
      order_value double precision not null,
      order_id text not null,
      primary key (tenant_id, order_id)
    );

    create table if not exists import_jobs (
      tenant_id text not null,
      id text not null,
      file_name text not null,
      created_at text not null,
      total_rows integer not null,
      valid_rows integer not null,
      invalid_rows integer not null,
      created_customers integer not null,
      updated_customers integer not null,
      imported_orders integer not null,
      automatic_first_dispatches integer not null,
      primary key (tenant_id, id)
    );

    create table if not exists first_dispatches (
      tenant_id text not null,
      customer_id text not null,
      dispatched_at text not null,
      created_at text not null,
      trigger_status text not null,
      primary key (tenant_id, customer_id)
    );

    create table if not exists inbox_threads (
      tenant_id text not null,
      customer_id text not null,
      customer text not null,
      seller text not null,
      status text not null,
      waiting boolean not null,
      last_inbound text not null,
      last_outbound text not null,
      messages_json text not null,
      primary key (tenant_id, customer_id)
    );

    create table if not exists audit_events (
      tenant_id text not null,
      id text not null,
      type text not null,
      title text not null,
      description text not null,
      entity_id text not null,
      occurred_at text not null,
      primary key (tenant_id, id)
    );
  `);

  const countResult = await pool.query<{ count: string }>("select count(*)::text as count from tenants");
  if (Number(countResult.rows[0]?.count ?? "0") === 0) {
    await pool.query("insert into tenants (id, name) values ($1, $2)", [demoTenantId, "Tenant Demo"]);
    await pool.query(
      "insert into users (id, tenant_id, name, email, password_hash) values ($1, $2, $3, $4, $5)",
      [demoUserId, demoTenantId, "Operador Demo", demoEmail, hashPassword(demoPassword)]
    );
    await persistTenantStatePostgres(demoTenantId, readLegacySeed());
  }

  postgresReady = true;
}

export async function loadTenantState(tenantId: string): Promise<StoredState> {
  if (hasPostgresConfig()) {
    await ensurePostgresReady();
    return loadTenantStatePostgres(tenantId);
  }

  return loadTenantStateSqlite(tenantId);
}

export async function persistTenantState(tenantId: string, state: StoredState) {
  if (hasPostgresConfig()) {
    await ensurePostgresReady();
    await persistTenantStatePostgres(tenantId, state);
    return;
  }

  persistTenantStateSqlite(tenantId, state);
}

export async function createSession(email: string, password: string): Promise<AuthSession | null> {
  if (hasPostgresConfig()) {
    await ensurePostgresReady();
    const pool = getPostgresPool();
    const userResult = await pool.query<{
      user_id: string;
      tenant_id: string;
      user_name: string;
      user_email: string;
      password_hash: string;
      tenant_name: string;
    }>(
      `select users.id as user_id, users.tenant_id as tenant_id, users.name as user_name, users.email as user_email,
              users.password_hash as password_hash, tenants.name as tenant_name
       from users
       join tenants on tenants.id = users.tenant_id
       where users.email = $1`,
      [email]
    );
    const user = userResult.rows[0];
    if (!user || user.password_hash !== hashPassword(password)) {
      return null;
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    await pool.query(
      "insert into sessions (token, user_id, tenant_id, expires_at) values ($1, $2, $3, $4)",
      [token, user.user_id, user.tenant_id, expiresAt]
    );

    return {
      token,
      userId: user.user_id,
      tenantId: user.tenant_id,
      userName: user.user_name,
      userEmail: user.user_email,
      tenantName: user.tenant_name,
      expiresAt
    };
  }

  return createSessionSqlite(email, password);
}

export async function getSession(token: string | undefined): Promise<AuthSession | null> {
  if (!token) {
    return null;
  }

  if (hasPostgresConfig()) {
    await ensurePostgresReady();
    const pool = getPostgresPool();
    const result = await pool.query<SessionRow>(
      `select sessions.token, sessions.user_id, sessions.tenant_id, sessions.expires_at,
              users.name as user_name, users.email as user_email, tenants.name as tenant_name
       from sessions
       join users on users.id = sessions.user_id
       join tenants on tenants.id = sessions.tenant_id
       where sessions.token = $1`,
      [token]
    );
    const row = result.rows[0];
    if (!row || new Date(row.expires_at).getTime() <= Date.now()) {
      if (row) {
        await pool.query("delete from sessions where token = $1", [token]);
      }
      return null;
    }

    return mapSessionRow(row);
  }

  return getSessionSqlite(token);
}

export async function deleteSession(token: string | undefined) {
  if (!token) {
    return;
  }

  if (hasPostgresConfig()) {
    await ensurePostgresReady();
    await getPostgresPool().query("delete from sessions where token = $1", [token]);
    return;
  }

  getSqlite().prepare("delete from sessions where token = ?").run(token);
}

export function getDemoCredentials() {
  return {
    email: demoEmail,
    password: demoPassword
  };
}

function loadTenantStateSqlite(tenantId: string): StoredState {
  const db = getSqlite();

  return {
    orders: db
      .prepare(
        `select customer_id as customerId, customer_name as customerName, phone, seller, order_date as orderDate, order_value as orderValue, order_id as orderId
         from orders
         where tenant_id = ?
         order by order_date desc`
      )
      .all(tenantId) as StoredState["orders"],
    importJobs: db
      .prepare(
        `select id, file_name as fileName, created_at as createdAt, total_rows as totalRows, valid_rows as validRows, invalid_rows as invalidRows,
                created_customers as createdCustomers, updated_customers as updatedCustomers, imported_orders as importedOrders,
                automatic_first_dispatches as automaticFirstDispatches
         from import_jobs
         where tenant_id = ?
         order by created_at desc`
      )
      .all(tenantId) as StoredState["importJobs"],
    firstDispatches: db
      .prepare(
        `select customer_id as customerId, dispatched_at as dispatchedAt, created_at as createdAt, trigger_status as triggerStatus
         from first_dispatches
         where tenant_id = ?
         order by created_at desc`
      )
      .all(tenantId) as StoredState["firstDispatches"],
    inboxThreads: (
      db
        .prepare(
          `select customer_id as customerId, customer, seller, status, waiting, last_inbound as lastInbound, last_outbound as lastOutbound, messages_json as messagesJson
           from inbox_threads
           where tenant_id = ?
           order by customer asc`
        )
        .all(tenantId) as Array<{ messagesJson: string } & Omit<InboxThread, "messages">>
    ).map((row) => ({
      ...row,
      waiting: Boolean(row.waiting),
      messages: JSON.parse(row.messagesJson)
    })) as StoredState["inboxThreads"],
    auditEvents: db
      .prepare(
        `select id, type, title, description, entity_id as entityId, occurred_at as occurredAt
         from audit_events
         where tenant_id = ?
         order by occurred_at desc`
      )
      .all(tenantId) as StoredState["auditEvents"]
  };
}

function persistTenantStateSqlite(tenantId: string, state: StoredState) {
  const db = getSqlite();
  const replace = db.transaction((nextState: StoredState) => {
    db.prepare("delete from orders where tenant_id = ?").run(tenantId);
    db.prepare("delete from import_jobs where tenant_id = ?").run(tenantId);
    db.prepare("delete from first_dispatches where tenant_id = ?").run(tenantId);
    db.prepare("delete from inbox_threads where tenant_id = ?").run(tenantId);
    db.prepare("delete from audit_events where tenant_id = ?").run(tenantId);

    const insertOrder = db.prepare(
      `insert into orders (tenant_id, customer_id, customer_name, phone, seller, order_date, order_value, order_id)
       values (@tenant_id, @customer_id, @customer_name, @phone, @seller, @order_date, @order_value, @order_id)`
    );
    nextState.orders.forEach((order) => {
      insertOrder.run({
        tenant_id: tenantId,
        customer_id: order.customerId,
        customer_name: order.customerName,
        phone: order.phone,
        seller: order.seller,
        order_date: order.orderDate,
        order_value: order.orderValue,
        order_id: order.orderId
      });
    });

    const insertJob = db.prepare(
      `insert into import_jobs (tenant_id, id, file_name, created_at, total_rows, valid_rows, invalid_rows, created_customers, updated_customers, imported_orders, automatic_first_dispatches)
       values (@tenant_id, @id, @file_name, @created_at, @total_rows, @valid_rows, @invalid_rows, @created_customers, @updated_customers, @imported_orders, @automatic_first_dispatches)`
    );
    nextState.importJobs.forEach((job) => {
      insertJob.run({
        tenant_id: tenantId,
        id: job.id,
        file_name: job.fileName,
        created_at: job.createdAt,
        total_rows: job.totalRows,
        valid_rows: job.validRows,
        invalid_rows: job.invalidRows,
        created_customers: job.createdCustomers,
        updated_customers: job.updatedCustomers,
        imported_orders: job.importedOrders,
        automatic_first_dispatches: job.automaticFirstDispatches
      });
    });

    const insertDispatch = db.prepare(
      `insert into first_dispatches (tenant_id, customer_id, dispatched_at, created_at, trigger_status)
       values (@tenant_id, @customer_id, @dispatched_at, @created_at, @trigger_status)`
    );
    nextState.firstDispatches.forEach((dispatch) => {
      insertDispatch.run({
        tenant_id: tenantId,
        customer_id: dispatch.customerId,
        dispatched_at: dispatch.dispatchedAt,
        created_at: dispatch.createdAt,
        trigger_status: dispatch.triggerStatus
      });
    });

    const insertThread = db.prepare(
      `insert into inbox_threads (tenant_id, customer_id, customer, seller, status, waiting, last_inbound, last_outbound, messages_json)
       values (@tenant_id, @customer_id, @customer, @seller, @status, @waiting, @last_inbound, @last_outbound, @messages_json)`
    );
    nextState.inboxThreads.forEach((thread) => {
      insertThread.run({
        tenant_id: tenantId,
        customer_id: thread.customerId,
        customer: thread.customer,
        seller: thread.seller,
        status: thread.status,
        waiting: thread.waiting ? 1 : 0,
        last_inbound: thread.lastInbound,
        last_outbound: thread.lastOutbound,
        messages_json: JSON.stringify(thread.messages)
      });
    });

    const insertAudit = db.prepare(
      `insert into audit_events (tenant_id, id, type, title, description, entity_id, occurred_at)
       values (@tenant_id, @id, @type, @title, @description, @entity_id, @occurred_at)`
    );
    nextState.auditEvents.forEach((event) => {
      insertAudit.run({
        tenant_id: tenantId,
        id: event.id,
        type: event.type,
        title: event.title,
        description: event.description,
        entity_id: event.entityId,
        occurred_at: event.occurredAt
      });
    });
  });

  replace(state);
}

async function loadTenantStatePostgres(tenantId: string): Promise<StoredState> {
  const pool = getPostgresPool();

  const [orders, importJobs, firstDispatches, inboxThreads, auditEvents] = await Promise.all([
    pool.query(
      `select customer_id as "customerId", customer_name as "customerName", phone, seller, order_date as "orderDate", order_value as "orderValue", order_id as "orderId"
       from orders where tenant_id = $1 order by order_date desc`,
      [tenantId]
    ),
    pool.query(
      `select id, file_name as "fileName", created_at as "createdAt", total_rows as "totalRows", valid_rows as "validRows", invalid_rows as "invalidRows",
              created_customers as "createdCustomers", updated_customers as "updatedCustomers", imported_orders as "importedOrders",
              automatic_first_dispatches as "automaticFirstDispatches"
       from import_jobs where tenant_id = $1 order by created_at desc`,
      [tenantId]
    ),
    pool.query(
      `select customer_id as "customerId", dispatched_at as "dispatchedAt", created_at as "createdAt", trigger_status as "triggerStatus"
       from first_dispatches where tenant_id = $1 order by created_at desc`,
      [tenantId]
    ),
    pool.query(
      `select customer_id as "customerId", customer, seller, status, waiting, last_inbound as "lastInbound", last_outbound as "lastOutbound", messages_json as "messagesJson"
       from inbox_threads where tenant_id = $1 order by customer asc`,
      [tenantId]
    ),
    pool.query(
      `select id, type, title, description, entity_id as "entityId", occurred_at as "occurredAt"
       from audit_events where tenant_id = $1 order by occurred_at desc`,
      [tenantId]
    )
  ]);

  return {
    orders: orders.rows as StoredState["orders"],
    importJobs: importJobs.rows as StoredState["importJobs"],
    firstDispatches: firstDispatches.rows as StoredState["firstDispatches"],
    inboxThreads: inboxThreads.rows.map((row) => ({
      ...row,
      waiting: Boolean(row.waiting),
      messages: JSON.parse(row.messagesJson as string)
    })) as StoredState["inboxThreads"],
    auditEvents: auditEvents.rows as StoredState["auditEvents"]
  };
}

async function persistTenantStatePostgres(tenantId: string, state: StoredState) {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    await client.query("delete from orders where tenant_id = $1", [tenantId]);
    await client.query("delete from import_jobs where tenant_id = $1", [tenantId]);
    await client.query("delete from first_dispatches where tenant_id = $1", [tenantId]);
    await client.query("delete from inbox_threads where tenant_id = $1", [tenantId]);
    await client.query("delete from audit_events where tenant_id = $1", [tenantId]);

    for (const order of state.orders) {
      await client.query(
        `insert into orders (tenant_id, customer_id, customer_name, phone, seller, order_date, order_value, order_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [tenantId, order.customerId, order.customerName, order.phone, order.seller, order.orderDate, order.orderValue, order.orderId]
      );
    }

    for (const job of state.importJobs) {
      await client.query(
        `insert into import_jobs (tenant_id, id, file_name, created_at, total_rows, valid_rows, invalid_rows, created_customers, updated_customers, imported_orders, automatic_first_dispatches)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          tenantId,
          job.id,
          job.fileName,
          job.createdAt,
          job.totalRows,
          job.validRows,
          job.invalidRows,
          job.createdCustomers,
          job.updatedCustomers,
          job.importedOrders,
          job.automaticFirstDispatches
        ]
      );
    }

    for (const dispatch of state.firstDispatches) {
      await client.query(
        `insert into first_dispatches (tenant_id, customer_id, dispatched_at, created_at, trigger_status)
         values ($1,$2,$3,$4,$5)`,
        [tenantId, dispatch.customerId, dispatch.dispatchedAt, dispatch.createdAt, dispatch.triggerStatus]
      );
    }

    for (const thread of state.inboxThreads) {
      await client.query(
        `insert into inbox_threads (tenant_id, customer_id, customer, seller, status, waiting, last_inbound, last_outbound, messages_json)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          tenantId,
          thread.customerId,
          thread.customer,
          thread.seller,
          thread.status,
          thread.waiting,
          thread.lastInbound,
          thread.lastOutbound,
          JSON.stringify(thread.messages)
        ]
      );
    }

    for (const event of state.auditEvents) {
      await client.query(
        `insert into audit_events (tenant_id, id, type, title, description, entity_id, occurred_at)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [tenantId, event.id, event.type, event.title, event.description, event.entityId, event.occurredAt]
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

function createSessionSqlite(email: string, password: string): AuthSession | null {
  const db = getSqlite();
  const user = db
    .prepare(
      `select users.id as user_id, users.tenant_id as tenant_id, users.name as user_name, users.email as user_email, users.password_hash as password_hash, tenants.name as tenant_name
       from users
       join tenants on tenants.id = users.tenant_id
       where users.email = ?`
    )
    .get(email) as
    | {
        user_id: string;
        tenant_id: string;
        user_name: string;
        user_email: string;
        password_hash: string;
        tenant_name: string;
      }
    | undefined;

  if (!user || user.password_hash !== hashPassword(password)) {
    return null;
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  db.prepare("insert into sessions (token, user_id, tenant_id, expires_at) values (?, ?, ?, ?)").run(
    token,
    user.user_id,
    user.tenant_id,
    expiresAt
  );

  return {
    token,
    userId: user.user_id,
    tenantId: user.tenant_id,
    userName: user.user_name,
    userEmail: user.user_email,
    tenantName: user.tenant_name,
    expiresAt
  };
}

function getSessionSqlite(token: string): AuthSession | null {
  const db = getSqlite();
  const row = db
    .prepare(
      `select sessions.token, sessions.user_id, sessions.tenant_id, sessions.expires_at, users.name as user_name, users.email as user_email, tenants.name as tenant_name
       from sessions
       join users on users.id = sessions.user_id
       join tenants on tenants.id = sessions.tenant_id
       where sessions.token = ?`
    )
    .get(token) as SessionRow | undefined;

  if (!row || new Date(row.expires_at).getTime() <= Date.now()) {
    if (row) {
      db.prepare("delete from sessions where token = ?").run(token);
    }
    return null;
  }

  return mapSessionRow(row);
}

function initializeSqliteSchema(db: Database.Database) {
  db.exec(`
    create table if not exists tenants (
      id text primary key,
      name text not null
    );

    create table if not exists users (
      id text primary key,
      tenant_id text not null,
      name text not null,
      email text not null unique,
      password_hash text not null
    );

    create table if not exists sessions (
      token text primary key,
      user_id text not null,
      tenant_id text not null,
      expires_at text not null
    );

    create table if not exists orders (
      tenant_id text not null,
      customer_id text not null,
      customer_name text not null,
      phone text not null,
      seller text not null,
      order_date text not null,
      order_value real not null,
      order_id text not null,
      primary key (tenant_id, order_id)
    );

    create table if not exists import_jobs (
      tenant_id text not null,
      id text not null,
      file_name text not null,
      created_at text not null,
      total_rows integer not null,
      valid_rows integer not null,
      invalid_rows integer not null,
      created_customers integer not null,
      updated_customers integer not null,
      imported_orders integer not null,
      automatic_first_dispatches integer not null,
      primary key (tenant_id, id)
    );

    create table if not exists first_dispatches (
      tenant_id text not null,
      customer_id text not null,
      dispatched_at text not null,
      created_at text not null,
      trigger_status text not null,
      primary key (tenant_id, customer_id)
    );

    create table if not exists inbox_threads (
      tenant_id text not null,
      customer_id text not null,
      customer text not null,
      seller text not null,
      status text not null,
      waiting integer not null,
      last_inbound text not null,
      last_outbound text not null,
      messages_json text not null,
      primary key (tenant_id, customer_id)
    );

    create table if not exists audit_events (
      tenant_id text not null,
      id text not null,
      type text not null,
      title text not null,
      description text not null,
      entity_id text not null,
      occurred_at text not null,
      primary key (tenant_id, id)
    );
  `);
}

function seedSqlite(db: Database.Database) {
  const tenantExists = db.prepare("select count(*) as count from tenants").get() as { count: number };
  if (tenantExists.count > 0) {
    return;
  }

  db.prepare("insert into tenants (id, name) values (?, ?)").run(demoTenantId, "Tenant Demo");
  db.prepare(
    "insert into users (id, tenant_id, name, email, password_hash) values (?, ?, ?, ?, ?)"
  ).run(demoUserId, demoTenantId, "Operador Demo", demoEmail, hashPassword(demoPassword));
  persistTenantStateSqlite(demoTenantId, readLegacySeed());
}

function readLegacySeed(): StoredState {
  const legacyStatePath = path.join(getReactiveDataDirectory(), "reactive-store.json");

  if (existsSync(legacyStatePath)) {
    return JSON.parse(readFileSync(legacyStatePath, "utf8")) as StoredState;
  }
  return createSeedState();
}

function mapSessionRow(row: SessionRow): AuthSession {
  return {
    token: row.token,
    userId: row.user_id,
    tenantId: row.tenant_id,
    userName: row.user_name,
    userEmail: row.user_email,
    tenantName: row.tenant_name,
    expiresAt: row.expires_at
  };
}

function hashPassword(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function resetSqliteForTests() {
  sqliteDb?.close();
  sqliteDb = null;
}
