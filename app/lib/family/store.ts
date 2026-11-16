// Browser storage for family data: IndexedDB, one store per record type,
// each record tagged with its workspace. Nothing here talks to a server.
// If IndexedDB isn't available (some private windows), the app runs from
// memory for that tab and says so.

import { ENTITY_NAMES, emptyData, type Change, type EntityName, type FamilyData, type Id, type Patch, type Workspace } from "./types";

const DB_NAME = "whatamiai-family";
const DB_VERSION = 1;
const META_CURRENT = "currentWorkspace";

type Tagged = { id: Id; ws: Id } & Record<string, unknown>;

let dbPromise: Promise<IDBDatabase> | null = null;

export function storageAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("The save was cancelled."));
  });
}

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, DB_VERSION);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains("workspaces")) db.createObjectStore("workspaces", { keyPath: "id" });
      for (const name of [...ENTITY_NAMES, "changes"]) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" }).createIndex("ws", "ws");
      }
      if (!db.objectStoreNames.contains("blobs")) db.createObjectStore("blobs", { keyPath: "id" }).createIndex("ws", "ws");
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
    };
    open.onsuccess = () => {
      const db = open.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(new Error("Close other WhatAmIAI tabs and reload."));
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const db = await openDb();
  const all = await req(db.transaction("workspaces").objectStore("workspaces").getAll());
  return (all as Workspace[]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function strip<T>(rec: Tagged): T {
  const { ws: _ws, ...rest } = rec;
  return rest as T;
}

export async function loadWorkspace(wsId: Id): Promise<FamilyData | null> {
  const db = await openDb();
  const tx = db.transaction(["workspaces", ...ENTITY_NAMES, "changes"]);
  const ws = (await req(tx.objectStore("workspaces").get(wsId))) as Workspace | undefined;
  if (!ws) return null;
  const data = emptyData(ws);
  for (const e of ENTITY_NAMES) {
    const rows = (await req(tx.objectStore(e).index("ws").getAll(wsId))) as Tagged[];
    const table: Record<Id, unknown> = {};
    for (const r of rows) table[r.id] = strip(r);
    (data as unknown as Record<string, unknown>)[e] = table;
  }
  const changes = (await req(tx.objectStore("changes").index("ws").getAll(wsId))) as Tagged[];
  data.changes = changes.map((c) => strip<Change>(c)).sort((a, b) => a.at.localeCompare(b.at));
  return data;
}

/** Write a whole workspace (new, imported or example). */
export async function saveWorkspace(data: FamilyData): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["workspaces", ...ENTITY_NAMES, "changes"], "readwrite");
  const ws = data.workspace.id;
  tx.objectStore("workspaces").put(data.workspace);
  for (const e of ENTITY_NAMES) {
    const store = tx.objectStore(e);
    for (const rec of Object.values(data[e] as Record<Id, object>)) store.put({ ...rec, ws });
  }
  for (const c of data.changes) tx.objectStore("changes").put({ ...c, ws });
  await done(tx);
}

export async function writePatch(wsId: Id, patch: Patch, workspace: Workspace): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["workspaces", ...ENTITY_NAMES, "changes"], "readwrite");
  for (const [e, recs] of Object.entries(patch.put) as [EntityName, Record<Id, object>][]) {
    const store = tx.objectStore(e);
    for (const rec of Object.values(recs)) store.put({ ...rec, ws: wsId });
  }
  for (const [e, ids] of Object.entries(patch.del) as [EntityName, Id[]][]) {
    const store = tx.objectStore(e);
    for (const id of ids) store.delete(id);
  }
  for (const c of patch.changes) tx.objectStore("changes").put({ ...c, ws: wsId });
  tx.objectStore("workspaces").put(workspace);
  await done(tx);
}

export async function deleteWorkspace(wsId: Id): Promise<void> {
  const db = await openDb();
  const names = ["workspaces", ...ENTITY_NAMES, "changes", "blobs"];
  const tx = db.transaction(names, "readwrite");
  tx.objectStore("workspaces").delete(wsId);
  for (const name of [...ENTITY_NAMES, "changes", "blobs"]) {
    const store = tx.objectStore(name);
    const keys = await req(store.index("ws").getAllKeys(wsId));
    for (const k of keys) store.delete(k);
  }
  await done(tx);
}

export async function getCurrentId(): Promise<Id | null> {
  const db = await openDb();
  const row = (await req(db.transaction("meta").objectStore("meta").get(META_CURRENT))) as { key: string; value: Id } | undefined;
  return row?.value ?? null;
}

export async function setCurrentId(id: Id | null): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("meta", "readwrite");
  if (id) tx.objectStore("meta").put({ key: META_CURRENT, value: id });
  else tx.objectStore("meta").delete(META_CURRENT);
  await done(tx);
}

export async function putBlob(id: Id, wsId: Id, blob: Blob): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("blobs", "readwrite");
  tx.objectStore("blobs").put({ id, ws: wsId, blob });
  await done(tx);
}

export async function getBlob(id: Id): Promise<Blob | null> {
  const db = await openDb();
  const row = (await req(db.transaction("blobs").objectStore("blobs").get(id))) as { blob: Blob } | undefined;
  return row?.blob ?? null;
}

export async function deleteBlob(id: Id): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("blobs", "readwrite");
  tx.objectStore("blobs").delete(id);
  await done(tx);
}

/** Delete every WhatAmIAI family record in this browser. */
export async function eraseEverything(): Promise<void> {
  if (dbPromise) {
    try {
      (await dbPromise).close();
    } catch {}
    dbPromise = null;
  }
  await new Promise<void>((resolve, reject) => {
    const r = indexedDB.deleteDatabase(DB_NAME);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error("Close other WhatAmIAI tabs, then try again."));
  });
}

/** Ask the browser not to clear this site's data under storage pressure. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export async function usage(): Promise<{ used: number; quota: number } | null> {
  try {
    const e = await navigator.storage?.estimate?.();
    return e ? { used: e.usage ?? 0, quota: e.quota ?? 0 } : null;
  } catch {
    return null;
  }
}
