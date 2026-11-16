"use client";

// Holds the open family in memory and keeps the browser database in step.
// Every edit goes through commit(patch): the screen updates at once and the
// same records are written to IndexedDB in order. Other open tabs reload
// when this one saves.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { applyPatch, newWorkspace } from "../lib/family/ops";
import { buildExampleFamily, EXAMPLE_NAME } from "../lib/family/example";
import * as store from "../lib/family/store";
import { emptyData, type FamilyData, type Id, type Patch, type Workspace } from "../lib/family/types";

type Status = "loading" | "ready" | "memory";

interface FamilyApi {
  status: Status;
  data: FamilyData | null;
  workspaces: Workspace[];
  error: string | null;
  commit: (patch: Patch) => Promise<FamilyData | null>;
  /** the person's own family, created on first use */
  ensureMine: () => Promise<FamilyData>;
  openWorkspace: (id: Id) => Promise<void>;
  openExample: () => Promise<void>;
  addWorkspace: (data: FamilyData) => Promise<void>;
  removeWorkspace: (id: Id) => Promise<void>;
  eraseAll: () => Promise<void>;
  saveFile: (id: Id, blob: Blob) => Promise<void>;
  readFile: (id: Id) => Promise<Blob | null>;
  dropFile: (id: Id) => Promise<void>;
  toast: (message: string) => void;
}

const Ctx = createContext<FamilyApi | null>(null);
const CHANNEL = "whatamiai-family";

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<FamilyData | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const dataRef = useRef<FamilyData | null>(null);
  const memory = useRef(new Map<Id, FamilyData>());
  const blobs = useRef(new Map<Id, Blob>());
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const channel = useRef<BroadcastChannel | null>(null);
  const statusRef = useRef<Status>("loading");

  const setCurrent = useCallback((d: FamilyData | null) => {
    dataRef.current = d;
    setData(d);
  }, []);

  const refreshList = useCallback(async () => {
    if (statusRef.current === "memory") setWorkspaces([...memory.current.values()].map((d) => d.workspace));
    else setWorkspaces(await store.listWorkspaces());
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!store.storageAvailable()) {
        statusRef.current = "memory";
        setStatus("memory");
        setError("This browser isn't letting WhatAmIAI save. You can try things out, but nothing will be kept after you close this tab.");
        return;
      }
      try {
        const list = await store.listWorkspaces();
        const current = await store.getCurrentId();
        const id = current && list.some((w) => w.id === current) ? current : list[0]?.id;
        const loaded = id ? await store.loadWorkspace(id) : null;
        if (!alive) return;
        setWorkspaces(list);
        setCurrent(loaded);
        statusRef.current = "ready";
        setStatus("ready");
      } catch {
        if (!alive) return;
        statusRef.current = "memory";
        setStatus("memory");
        setError("This browser isn't letting WhatAmIAI save. You can try things out, but nothing will be kept after you close this tab.");
      }
    })();
    try {
      channel.current = new BroadcastChannel(CHANNEL);
      channel.current.onmessage = async (ev: MessageEvent<{ ws?: Id }>) => {
        if (statusRef.current !== "ready") return;
        await refreshList();
        const cur = dataRef.current;
        if (cur && ev.data?.ws === cur.workspace.id) setCurrent(await store.loadWorkspace(cur.workspace.id));
      };
    } catch {}
    return () => {
      alive = false;
      channel.current?.close();
    };
  }, [refreshList, setCurrent]);

  const announce = (ws: Id) => {
    try {
      channel.current?.postMessage({ ws });
    } catch {}
  };

  const toast = useCallback((message: string) => {
    setToastMsg(message);
    window.setTimeout(() => setToastMsg((m) => (m === message ? null : m)), 3200);
  }, []);

  const commit = useCallback(
    async (patch: Patch) => {
      const cur = dataRef.current;
      if (!cur) return null;
      const next = applyPatch(cur, patch);
      next.workspace = { ...next.workspace, updatedAt: new Date().toISOString() };
      setCurrent(next);
      if (statusRef.current === "memory") {
        memory.current.set(next.workspace.id, next);
        return next;
      }
      const write = queue.current.then(() => store.writePatch(next.workspace.id, patch, next.workspace));
      queue.current = write.catch(() => {});
      try {
        await write;
        announce(next.workspace.id);
      } catch {
        setError("A change couldn't be saved in this browser. Download a backup from Your data to keep your work.");
      }
      return next;
    },
    [setCurrent],
  );

  const save = useCallback(
    async (d: FamilyData) => {
      if (statusRef.current === "memory") memory.current.set(d.workspace.id, d);
      else {
        await store.saveWorkspace(d);
        await store.setCurrentId(d.workspace.id);
        announce(d.workspace.id);
      }
      setCurrent(d);
      await refreshList();
    },
    [refreshList, setCurrent],
  );

  const ensureMine = useCallback(async () => {
    const cur = dataRef.current;
    if (cur && cur.workspace.kind === "mine") return cur;
    const list = statusRef.current === "memory" ? [...memory.current.values()].map((d) => d.workspace) : await store.listWorkspaces();
    const mine = list.find((w) => w.kind === "mine");
    if (mine) {
      const loaded = statusRef.current === "memory" ? memory.current.get(mine.id)! : await store.loadWorkspace(mine.id);
      if (loaded) {
        if (statusRef.current !== "memory") await store.setCurrentId(mine.id);
        setCurrent(loaded);
        return loaded;
      }
    }
    const fresh = emptyData(newWorkspace("My family", "mine"));
    await save(fresh);
    return fresh;
  }, [save, setCurrent]);

  const openWorkspace = useCallback(
    async (id: Id) => {
      if (statusRef.current === "memory") {
        setCurrent(memory.current.get(id) ?? null);
        return;
      }
      const loaded = await store.loadWorkspace(id);
      if (loaded) {
        await store.setCurrentId(id);
        setCurrent(loaded);
      }
    },
    [setCurrent],
  );

  const openExample = useCallback(async () => {
    const list = statusRef.current === "memory" ? [...memory.current.values()].map((d) => d.workspace) : await store.listWorkspaces();
    const ex = list.find((w) => w.kind === "example");
    if (ex) return openWorkspace(ex.id);
    await save(buildExampleFamily());
  }, [openWorkspace, save]);

  const addWorkspace = useCallback(async (d: FamilyData) => save(d), [save]);

  const removeWorkspace = useCallback(
    async (id: Id) => {
      if (statusRef.current === "memory") memory.current.delete(id);
      else {
        await store.deleteWorkspace(id);
        announce(id);
      }
      if (dataRef.current?.workspace.id === id) {
        const rest = statusRef.current === "memory" ? [...memory.current.values()] : [];
        const list = statusRef.current === "memory" ? rest.map((d) => d.workspace) : await store.listWorkspaces();
        const next = list[0] ? (statusRef.current === "memory" ? memory.current.get(list[0].id)! : await store.loadWorkspace(list[0].id)) : null;
        if (statusRef.current !== "memory") await store.setCurrentId(next?.workspace.id ?? null);
        setCurrent(next);
      }
      await refreshList();
    },
    [refreshList, setCurrent],
  );

  const eraseAll = useCallback(async () => {
    if (statusRef.current === "memory") {
      memory.current.clear();
      blobs.current.clear();
    } else await store.eraseEverything();
    setCurrent(null);
    setWorkspaces([]);
  }, [setCurrent]);

  const saveFile = useCallback(async (id: Id, blob: Blob) => {
    const ws = dataRef.current?.workspace.id;
    if (!ws) return;
    if (statusRef.current === "memory") blobs.current.set(id, blob);
    else await store.putBlob(id, ws, blob);
  }, []);
  const readFile = useCallback(async (id: Id) => (statusRef.current === "memory" ? blobs.current.get(id) ?? null : store.getBlob(id)), []);
  const dropFile = useCallback(async (id: Id) => {
    if (statusRef.current === "memory") blobs.current.delete(id);
    else await store.deleteBlob(id);
  }, []);

  const api = useMemo<FamilyApi>(
    () => ({ status, data, workspaces, error, commit, ensureMine, openWorkspace, openExample, addWorkspace, removeWorkspace, eraseAll, saveFile, readFile, dropFile, toast }),
    [status, data, workspaces, error, commit, ensureMine, openWorkspace, openExample, addWorkspace, removeWorkspace, eraseAll, saveFile, readFile, dropFile, toast],
  );

  return (
    <Ctx.Provider value={api}>
      {data?.workspace.kind === "example" ? (
        <div className="w-example-bar w-no-print" role="note">
          <div>
            <span>
              <strong>{EXAMPLE_NAME}.</strong> Everyone and every record here is made up, to show how WhatAmIAI works.
            </span>
            <button type="button" className="w-link" onClick={() => ensureMine()}>
              Switch to my family
            </button>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="w-example-bar w-no-print" role="alert">
          <div>
            <span className="w-error">{error}</span>
            <button type="button" className="w-link" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      {children}
      {toastMsg ? (
        <div className="w-toast" role="status">
          {toastMsg}
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

export function useFamily(): FamilyApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFamily must be used inside FamilyProvider");
  return v;
}
