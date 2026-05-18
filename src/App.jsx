import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import islaLogo from "./assets/isla-logo.svg";

function useSwipeClose(onClose, threshold = 72) {
  const ref = useRef(null);
  const startY = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onStart = (e) => { startY.current = e.touches[0].clientY; };
    const onMove = (e) => {
      if (startY.current === null) return;
      if (e.touches[0].clientY - startY.current > 0) e.preventDefault();
    };
    const onEnd = (e) => {
      if (startY.current === null) return;
      if (e.changedTouches[0].clientY - startY.current > threshold) onCloseRef.current();
      startY.current = null;
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [threshold]);

  return ref;
}

const initialSecrets = [
  { id: 1, name: "OPENAI_API_KEY", env: "prod", workspace: "AI", value: "••••••••••••", category: "AI" },
  { id: 2, name: "OPENAI_API_KEY", env: "staging", workspace: "AI", value: "••••••••••••", category: "AI" },
  { id: 3, name: "STRIPE_SECRET", env: "prod", workspace: "Payments", value: "••••••••••••", category: "PAYMENTS" },
  { id: 4, name: "STRIPE_SECRET", env: "dev", workspace: "Payments", value: "••••••••••••", category: "PAYMENTS" },
  { id: 5, name: "VERCEL_TOKEN", env: "dev", workspace: "Infra", value: "••••••••••••", category: "INFRASTRUCTURE" },
];

const envs = ["prod", "staging", "dev"];
const maskSecret = (value) => "•".repeat(Math.max(12, String(value || "").length));
const AUTO_LOCK_MS = 5 * 60 * 1000;
const SCREENS = new Set(["workspaces", "secrets"]);

export function App({ user }) {
  const [vaultLoaded, setVaultLoaded] = useState(false);
  const [locked, setLocked] = useState(true);
  const [screen, setScreen] = useState("workspaces");
  const [workspace, setWorkspace] = useState("AI");
  const [secrets, setSecrets] = useState(initialSecrets);
  const [workspaces, setWorkspaces] = useState([...new Set(initialSecrets.map((item) => item.workspace))]);
  const [hideSecurityNotice, setHideSecurityNotice] = useState(false);
  const [query, setQuery] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showDelete, setShowDelete] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showWorkspaceSheet, setShowWorkspaceSheet] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteWorkspaceTarget, setDeleteWorkspaceTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [workspaceQuery, setWorkspaceQuery] = useState("");
  const [lastCopiedAt, setLastCopiedAt] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: "", value: "", env: "prod" });
  const [revealEditValue, setRevealEditValue] = useState(false);
  const clipboardClearRef = useRef(null);
  const importRef = useRef(null);

  // Load vault from Firestore on login
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "vaults", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.workspaces)) setWorkspaces(data.workspaces);
        if (Array.isArray(data.secrets)) setSecrets(data.secrets);
        if (typeof data.hideSecurityNotice === "boolean") setHideSecurityNotice(data.hideSecurityNotice);
        if (SCREENS.has(data.screen)) setScreen(data.screen);
        if (data.workspace) setWorkspace(data.workspace);
      }
      setVaultLoaded(true);
    }).catch(() => setVaultLoaded(true));
  }, [user]);

  // Save vault to Firestore (debounced 800ms after last change)
  useEffect(() => {
    if (!vaultLoaded || !user) return;
    const timer = window.setTimeout(() => {
      setDoc(doc(db, "vaults", user.uid), {
        version: 1,
        screen,
        workspace,
        workspaces,
        secrets,
        hideSecurityNotice,
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [screen, workspace, workspaces, secrets, hideSecurityNotice, vaultLoaded, user]);

  const visibleSecrets = useMemo(
    () => secrets
      .filter((item) => item.workspace === workspace)
      .filter((item) => item.name.toLowerCase().includes(query.toLowerCase())),
    [secrets, workspace, query]
  );


  const recentSecrets = useMemo(() => secrets.slice(-4).reverse(), [secrets]);
  const filteredWorkspaces = useMemo(() => {
    const queryText = workspaceQuery.trim().toLowerCase();
    if (!queryText) return workspaces;
    return workspaces.filter((workspaceName) => {
      const workspaceMatch = workspaceName.toLowerCase().includes(queryText);
      const secretMatch = secrets.some(
        (entry) => entry.workspace === workspaceName && entry.name.toLowerCase().includes(queryText)
      );
      return workspaceMatch || secretMatch;
    });
  }, [workspaceQuery, workspaces, secrets]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 1800);
  };

  const onCopy = (text) => {
    if (!text) {
      showToast("No secret value to copy", "error");
      return;
    }
    navigator.clipboard?.writeText(text);
    showToast("✓ Copied — clears in 30s", "success");
    setLastCopiedAt(Date.now());
    window.clearTimeout(clipboardClearRef.current);
    clipboardClearRef.current = window.setTimeout(() => {
      navigator.clipboard?.writeText("");
    }, 30_000);
  };

  const relock = useCallback(() => {
    window.clearTimeout(clipboardClearRef.current);
    navigator.clipboard?.writeText("");
    setLocked(true);
    setSelectMode(false);
    setSelected([]);
    setShowDelete(false);
    setShowEditor(false);
    setShowWorkspaceSheet(false);
    setRenameTarget(null);
    setDeleteWorkspaceTarget(null);
    setEditingId(null);
    setRevealEditValue(false);
  }, []);

  const exportVault = () => {
    const data = JSON.stringify({ version: 1, workspaces, secrets }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `isla-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Vault exported");
  };

  const importVault = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data.workspaces) || !Array.isArray(data.secrets)) {
          showToast("Invalid vault file", "error");
          return;
        }
        setWorkspaces(data.workspaces);
        setSecrets(data.secrets);
        if (data.workspaces.length > 0) setWorkspace(data.workspaces[0]);
        setScreen("workspaces");
        showToast("Vault imported");
      } catch {
        showToast("Could not read file", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const deleteWorkspace = (name) => {
    const remaining = workspaces.filter((item) => item !== name);
    setWorkspaces(remaining);
    setSecrets((prev) => prev.filter((item) => item.workspace !== name));
    if (workspace === name) {
      if (remaining.length > 0) setWorkspace(remaining[0]);
      setScreen("workspaces");
    }
    setDeleteWorkspaceTarget(null);
    showToast("Workspace deleted");
  };

  const currentWorkspaceCount = useMemo(
    () => secrets.filter((item) => item.workspace === workspace).length,
    [secrets, workspace]
  );

  const lastCopyLabel = useMemo(() => {
    if (!lastCopiedAt) return "never";
    const minutes = Math.max(0, Math.floor((Date.now() - lastCopiedAt) / 60000));
    if (minutes < 1) return "just now";
    if (minutes === 1) return "1m ago";
    return `${minutes}m ago`;
  }, [lastCopiedAt, toast]);

  const toggleSelection = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]);
  };

  const deleteSelected = () => {
    if (selected.length === 0) {
      showToast("No secrets selected", "error");
      return;
    }
    setSecrets((prev) => prev.filter((item) => !selected.includes(item.id)));
    setSelected([]);
    setSelectMode(false);
    setShowDelete(false);
    showToast("Secrets deleted", "success");
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditDraft({ name: item.name, value: item.value, env: item.env });
    setRevealEditValue(false);
  };

  const saveEdit = (id) => {
    if (!editDraft.name.trim() || !editDraft.value.trim()) {
      showToast("Name and value are required", "error");
      return;
    }
    setSecrets((prev) => prev.map((item) => (item.id === id ? { ...item, ...editDraft } : item)));
    setEditingId(null);
    setRevealEditValue(false);
    showToast("Secret updated", "success");
  };

  const addSecret = ({ name, value, env, workspaceName }) => {
    if (!name.trim() || !value.trim()) {
      showToast("Name and value are required", "error");
      return;
    }
    if (!workspaceName.trim()) {
      showToast("Workspace is required", "error");
      return;
    }
    setSecrets((prev) => [...prev, { id: Date.now(), name, value, env, workspace: workspaceName }]);
    setWorkspaces((prev) => (prev.includes(workspaceName) ? prev : [...prev, workspaceName]));
    setWorkspace(workspaceName);
    setShowEditor(false);
    showToast("Secret added", "success");
  };

  const addWorkspace = (workspaceName) => {
    if (!workspaceName.trim()) {
      showToast("Workspace name is required", "error");
      return;
    }
    if (workspaces.some((item) => item.toLowerCase() === workspaceName.toLowerCase())) {
      showToast("Workspace already exists", "error");
      return;
    }
    setWorkspaces((prev) => (prev.includes(workspaceName) ? prev : [...prev, workspaceName]));
    setWorkspace(workspaceName);
    setShowWorkspaceSheet(false);
    setScreen("secrets");
    showToast("Workspace created", "success");
  };

  const renameWorkspace = (oldName, nextNameRaw) => {
    const nextName = nextNameRaw.trim();
    if (!nextName || oldName === nextName) {
      setRenameTarget(null);
      showToast("No workspace changes", "error");
      return;
    }
    if (workspaces.some((item) => item.toLowerCase() === nextName.toLowerCase() && item !== oldName)) {
      showToast("Workspace name already exists", "error");
      return;
    }
    setWorkspaces((prev) => prev.map((item) => (item === oldName ? nextName : item)));
    setSecrets((prev) => prev.map((item) => (item.workspace === oldName ? { ...item, workspace: nextName } : item)));
    if (workspace === oldName) setWorkspace(nextName);
    setRenameTarget(null);
    showToast("Workspace renamed", "success");
  };

  useEffect(() => {
    if (locked) return undefined;
    let timeoutId;
    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        relock();
      }, AUTO_LOCK_MS);
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [locked, relock]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (showDelete) return setShowDelete(false);
      if (deleteWorkspaceTarget) return setDeleteWorkspaceTarget(null);
      if (renameTarget) return setRenameTarget(null);
      if (showWorkspaceSheet) return setShowWorkspaceSheet(false);
      if (showEditor) return setShowEditor(false);
      if (editingId) {
        setEditingId(null);
        setRevealEditValue(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDelete, deleteWorkspaceTarget, renameTarget, showWorkspaceSheet, showEditor, editingId]);

  if (!vaultLoaded) {
    return (
      <div className="app auth-wrap">
        <div className="auth-card">
          <img src={islaLogo} alt="Isla" className="auth-logo" />
          <p className="auth-hint">Vault wird geladen…</p>
        </div>
      </div>
    );
  }

  if (locked) {
    return <LockScreen user={user} onUnlock={() => setLocked(false)} />;
  }

  return (
    <div className="app">
      <header className="appbar">
        <div className="brand">
          <button className="brand-logo-btn" onClick={() => setScreen("workspaces")} aria-label="Go to home">
            <img src={islaLogo} alt="Isla Logo" className="brand-logo" />
          </button>
          <span className="brand-label">API Vault</span>
        </div>

        <nav className="segmented-nav">
          <button className={screen === "workspaces" ? "tab active" : "tab"} onClick={() => setScreen("workspaces")}>Workspaces</button>
          <button className={screen === "secrets" ? "tab active" : "tab"} onClick={() => setScreen("secrets")}>Secrets</button>
        </nav>

        <div className="quick-actions">
          <button className="quick" aria-label="Create new secret" onClick={() => setShowEditor(true)}>+ Secret</button>
          <button className="quick" aria-label="Create new workspace" onClick={() => setShowWorkspaceSheet(true)}>+ Workspace</button>
          <button className="quick signout-btn" aria-label="Sign out" onClick={() => signOut(auth)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </header>
      <div className="context-bar">
        <span>Workspace: <strong>{workspace}</strong></span>
        <span>·</span>
        <span>{currentWorkspaceCount} secrets</span>
        <span>·</span>
        <span>Last copy: {lastCopyLabel}</span>
        <span>·</span>
        <span className="user-email">{user.email}</span>
      </div>

      {!hideSecurityNotice && (
        <SecurityNotice onDismiss={() => setHideSecurityNotice(true)} />
      )}

      {screen === "workspaces" && (
        <section className="panel">
          <div className="row between">
            <h2>Workspaces</h2>
            <div className="row">
              <button className="link" aria-label="Export vault as JSON" onClick={exportVault}>↓ Export</button>
              <button className="link" aria-label="Import vault from JSON" onClick={() => importRef.current?.click()}>↑ Import</button>
              <input ref={importRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={importVault} />
              <button className="primary top-cta" aria-label="Open new workspace dialog" onClick={() => setShowWorkspaceSheet(true)}>+ New Workspace</button>
            </div>
          </div>

          <input
            className="input workspace-search"
            placeholder="Search workspace or secret..."
            value={workspaceQuery}
            onChange={(event) => setWorkspaceQuery(event.target.value)}
            aria-label="Search workspace or secret"
          />

          <div className="recent-block">
            <label className="label">Recently Accessed</label>
            <div className="recent-list">
              {recentSecrets.map((item) => (
                <div key={item.id} className="recent-item">
                  <div className="recent-meta">
                    <strong className="recent-name">{item.name}</strong>
                    <small className="recent-subline">
                      <span>{item.workspace}</span>
                      <span>·</span>
                      <span>{item.env}</span>
                    </small>
                  </div>
                  <button className="copy" aria-label={`Copy secret value for ${item.name}`} onClick={() => onCopy(item.value)}>Copy</button>
                </div>
              ))}
            </div>
          </div>

          <div className="workspace-grid">
            {workspaces.length === 0 && (
              <div className="workspace-card empty">
                <strong>No workspace selected</strong>
                <small>Create your first workspace to get started.</small>
              </div>
            )}
            {filteredWorkspaces.map((item) => (
              <button key={item} className={workspace === item ? "workspace-card active" : "workspace-card"} onClick={() => { setWorkspace(item); setScreen("secrets"); }}>
                <div className="workspace-card-head">
                  <span>{item}</span>
                  <div className="row">
                    <span className="workspace-dot" />
                    <span
                      className="workspace-rename"
                      role="button"
                      tabIndex={0}
                      aria-label={`Rename workspace ${item}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setRenameTarget(item);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          setRenameTarget(item);
                        }
                      }}
                    >
                      Rename
                    </span>
                    <span
                      className="workspace-rename workspace-delete"
                      role="button"
                      tabIndex={0}
                      aria-label={`Delete workspace ${item}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteWorkspaceTarget(item);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          setDeleteWorkspaceTarget(item);
                        }
                      }}
                    >
                      Delete
                    </span>
                  </div>
                </div>
                <small>{secrets.filter((entry) => entry.workspace === item).length} secrets</small>
                <small className="muted-meta">
                  {["prod", "staging", "dev"]
                    .map((env) => `${env}: ${secrets.filter((entry) => entry.workspace === item && entry.env === env).length}`)
                    .join(" · ")}
                </small>
              </button>
            ))}
            {filteredWorkspaces.length === 0 && (
              <div className="workspace-card empty">
                <strong>No matches</strong>
                <small>Try a different workspace or secret name.</small>
              </div>
            )}
            <button className="workspace-card add" onClick={() => setShowEditor(true)}>+ New Secret</button>
          </div>
        </section>
      )}

      {screen === "secrets" && (
        <section className="panel">
          <div className="row between">
            <h2>{workspace}</h2>
            <button className="link" onClick={() => { setSelectMode((prev) => !prev); setSelected([]); }}>
              {selectMode ? "Cancel" : "Select"}
            </button>
          </div>

          <input className="input" placeholder="Search secrets" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search secrets" />

          {selectMode && selected.length > 0 && (
            <div className="toolbar">
              <span>{selected.length} selected</span>
              <button className="danger-chip" onClick={() => setShowDelete(true)}>Delete</button>
            </div>
          )}

          <div className="list">
            {visibleSecrets.length === 0 && (
              <div className="empty-panel">
                <strong>No secrets yet</strong>
                <small>Add your first secret for this workspace.</small>
              </div>
            )}
            {visibleSecrets.map((item) => (
              <div key={item.id} className={selected.includes(item.id) ? "secret-row selected" : "secret-row"}>
                {selectMode && (
                  <button className={selected.includes(item.id) ? "check on" : "check"} aria-label={`Select secret ${item.name}`} onClick={() => toggleSelection(item.id)} />
                )}
                <div className="grow" onClick={() => selectMode && toggleSelection(item.id)}>
                  {editingId === item.id ? (
                    <div className="edit-wrap">
                      <input className="input compact" value={editDraft.name} onChange={(event) => setEditDraft((prev) => ({ ...prev, name: event.target.value }))} />
                      <div className="secure-input-row">
                        <input
                          className="input compact"
                          type={revealEditValue ? "text" : "password"}
                          value={editDraft.value}
                          onChange={(event) => setEditDraft((prev) => ({ ...prev, value: event.target.value }))}
                          aria-label={`Edit secret value for ${item.name}`}
                        />
                        <button
                          className="copy"
                          aria-label="Reveal secret value for 8 seconds"
                          onClick={() => {
                            setRevealEditValue(true);
                            window.setTimeout(() => setRevealEditValue(false), 8000);
                          }}
                        >
                          Reveal 8s
                        </button>
                      </div>
                      <div className="row env-row">
                        {envs.map((env) => (
                          <button key={env} className={editDraft.env === env ? "chip active" : "chip"} onClick={() => setEditDraft((prev) => ({ ...prev, env }))}>
                            {env}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="row">
                        <strong>{item.name}</strong>
                        <span className={`env ${item.env}`}>{item.env}</span>
                      </div>
                      <small>{maskSecret(item.value)}</small>
                    </>
                  )}
                </div>
                {editingId === item.id ? (
                  <div className="edit-actions">
                    <button className="copy" onClick={() => { setEditingId(null); setRevealEditValue(false); }}>Cancel</button>
                    <button className="primary small" onClick={() => saveEdit(item.id)}>Save</button>
                  </div>
                ) : (
                  <div className="edit-actions">
                    <button className="copy" aria-label={`Copy secret value for ${item.name}`} onClick={() => onCopy(item.value)}>Copy</button>
                    <button className="copy" aria-label={`Edit secret ${item.name}`} onClick={() => startEdit(item)}>Edit</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="fab" aria-label="Open add secret dialog" onClick={() => setShowEditor(true)}>+ Add Secret</button>
        </section>
      )}

      {showEditor && <AddSheet workspaces={workspaces} onClose={() => setShowEditor(false)} onSave={addSecret} />}
      {showWorkspaceSheet && <WorkspaceSheet onClose={() => setShowWorkspaceSheet(false)} onSave={addWorkspace} />}
      {renameTarget && (
        <RenameWorkspaceSheet
          currentName={renameTarget}
          onClose={() => setRenameTarget(null)}
          onSave={renameWorkspace}
        />
      )}

      {showDelete && (
        <DeleteSecretsSheet count={selected.length} onClose={() => setShowDelete(false)} onConfirm={deleteSelected} />
      )}

      {deleteWorkspaceTarget && (
        <DeleteWorkspaceSheet
          name={deleteWorkspaceTarget}
          secretCount={secrets.filter((item) => item.workspace === deleteWorkspaceTarget).length}
          onClose={() => setDeleteWorkspaceTarget(null)}
          onConfirm={() => deleteWorkspace(deleteWorkspaceTarget)}
        />
      )}

      {toast && <div className={toast.type === "error" ? "toast error" : "toast"}>{toast.message}</div>}
    </div>
  );
}

function SecurityNotice({ onDismiss }) {
  return (
    <div className="security-notice" role="note" aria-label="Security notice">
      <div className="title">Sicherheits-Hinweis (Demo)</div>
      <div className="small">
        Secrets werden in dieser Web-Demo <strong>unverschlüsselt</strong> im Browser gespeichert (localStorage) und beim Kopieren in die Zwischenablage gelegt.
        Verwende dafür keine echten Produktions-Keys.
      </div>
      <div className="actions">
        <button className="dismiss" onClick={onDismiss}>Verstanden</button>
      </div>
    </div>
  );
}

function LockScreen({ user, onUnlock }) {
  return (
    <div className="app lock-wrap">
      <section className="panel lock-panel">
        <div className="lock-centered">
          <img src={islaLogo} alt="Isla Logo" className="lock-logo" />
          <h1 className="lock-title">Isla</h1>
          <p className="lock-subtitle">Secure API keys for every environment.</p>
          {user && (
            <div className="lock-user">
              {user.photoURL
                ? <img src={user.photoURL} alt={user.displayName || user.email} className="lock-avatar" referrerPolicy="no-referrer" />
                : <div className="lock-avatar-placeholder">{(user.displayName || user.email || "?")[0].toUpperCase()}</div>
              }
              <span className="lock-user-name">{user.displayName || user.email}</span>
            </div>
          )}
          <button className="lock-unlock-btn" onClick={onUnlock}>Unlock Vault</button>
        </div>
      </section>
    </div>
  );
}

function AddSheet({ workspaces, onClose, onSave }) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [env, setEnv] = useState("prod");
  const [workspaceName, setWorkspaceName] = useState(workspaces[0] || "");
  const [revealValue, setRevealValue] = useState(false);
  const sheetRef = useSwipeClose(onClose);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" ref={sheetRef} onClick={(event) => event.stopPropagation()}>
        <div className="handle" />
        <h3>New Secret</h3>
        <label className="label">NAME</label>
        <input className="input" value={name} onChange={(event) => setName(event.target.value)} aria-label="Secret name" />
        <label className="label">VALUE</label>
        <div className="secure-input-row">
          <input className="input" type={revealValue ? "text" : "password"} value={value} onChange={(event) => setValue(event.target.value)} aria-label="Secret value" />
          <button
            className="copy"
            aria-label="Reveal secret value for 8 seconds"
            onClick={() => {
              setRevealValue(true);
              window.setTimeout(() => setRevealValue(false), 8000);
            }}
          >
            Reveal 8s
          </button>
        </div>
        <label className="label">ENVIRONMENT</label>
        <div className="row env-row">
          {envs.map((item) => <button key={item} className={env === item ? "chip active" : "chip"} onClick={() => setEnv(item)}>{item}</button>)}
        </div>
        <label className="label">WORKSPACE</label>
        <input className="input" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} aria-label="Workspace for secret" />
        <div className="row-buttons">
          <button className="outline" onClick={onClose}>Cancel</button>
          <button className="primary" onClick={() => onSave({ name, value, env, workspaceName })} disabled={!name || !value}>Save Secret</button>
        </div>
      </div>
    </div>
  );
}

function WorkspaceSheet({ onClose, onSave }) {
  const [workspaceName, setWorkspaceName] = useState("");
  const sheetRef = useSwipeClose(onClose);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" ref={sheetRef} onClick={(event) => event.stopPropagation()}>
        <div className="handle" />
        <h3>New Workspace</h3>
        <label className="label">WORKSPACE NAME</label>
        <input className="input" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="e.g. Client-X" aria-label="New workspace name" />
        <div className="row-buttons">
          <button className="outline" onClick={onClose}>Cancel</button>
          <button className="primary" onClick={() => onSave(workspaceName.trim())} disabled={!workspaceName.trim()}>Create Workspace</button>
        </div>
      </div>
    </div>
  );
}

function RenameWorkspaceSheet({ currentName, onClose, onSave }) {
  const [nextName, setNextName] = useState(currentName);
  const sheetRef = useSwipeClose(onClose);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" ref={sheetRef} onClick={(event) => event.stopPropagation()}>
        <div className="handle" />
        <h3>Rename Workspace</h3>
        <label className="label">CURRENT</label>
        <input className="input" value={currentName} disabled />
        <label className="label">NEW NAME</label>
        <input className="input" value={nextName} onChange={(event) => setNextName(event.target.value)} aria-label="Renamed workspace value" />
        <div className="row-buttons">
          <button className="outline" onClick={onClose}>Cancel</button>
          <button className="primary" onClick={() => onSave(currentName, nextName)} disabled={!nextName.trim()}>
            Save Name
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteSecretsSheet({ count, onClose, onConfirm }) {
  const sheetRef = useSwipeClose(onClose);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        <h3>Delete {count} Secret(s)?</h3>
        <p>This action cannot be undone.</p>
        <div className="warn">
          <strong>Security Protocol</strong>
          <p>Deleting these secrets is permanent. Ensure you have backups or rotated keys before confirming.</p>
        </div>
        <div className="row-buttons">
          <button className="outline" onClick={onClose}>Cancel</button>
          <button className="primary" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function DeleteWorkspaceSheet({ name, secretCount, onClose, onConfirm }) {
  const sheetRef = useSwipeClose(onClose);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        <h3>Delete "{name}"?</h3>
        <p>This will permanently delete the workspace and all {secretCount} secret(s) inside it.</p>
        <div className="warn">
          <strong>Cannot be undone</strong>
          <p>Export your vault first if you want a backup.</p>
        </div>
        <div className="row-buttons">
          <button className="outline" onClick={onClose}>Cancel</button>
          <button className="primary" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
