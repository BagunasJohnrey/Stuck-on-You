import { useState, useEffect, useCallback } from 'react';
import { Trash2, ShieldAlert, LogOut, RefreshCw, StickyNote, X } from 'lucide-react';
import logo from '../assets/logo.png';

const fetchOpts = { credentials: 'include' };

const Admin = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const ADMIN = `${API_URL}${import.meta.env.VITE_ADMIN_PREFIX || '/api/z8f2-admin'}`;

  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('reports'); // 'reports' | 'notes'

  const [reports, setReports] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ADMIN}/reports`, { ...fetchOpts });
      if (res.status === 401) {
        setAuthed(false);
        setError('Session expired. Please log in again.');
        return;
      }
      if (!res.ok) throw new Error('Failed to load reports');
      const data = await res.json();
      setReports(data);
      setAuthed(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [ADMIN]);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let page = 0;
      let collected = [];
      while (true) {
        const res = await fetch(`${API_URL}/api/notes?page=${page}&limit=100`);
        if (!res.ok) throw new Error('Failed to load notes');
        const batch = await res.json();
        collected = collected.concat(batch);
        if (batch.length < 100) break;
        page += 1;
      }
      setNotes(collected);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (!authed) return;
    if (tab === 'reports') fetchReports();
    else fetchNotes();
  }, [authed, tab, fetchReports, fetchNotes]);

  const handleLogin = async () => {
    setError(null);
    try {
      const res = await fetch(`${ADMIN}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        ...fetchOpts,
      });
      if (!res.ok) {
        let msg = 'Invalid admin password.';
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch { /* keep default */ }
        setError(msg);
        return;
      }
      setPassword('');
      setAuthed(true);
      fetchReports();
    } catch {
      setError('Login failed. Try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${ADMIN}/logout`, { method: 'POST', ...fetchOpts });
    } catch {
      /* ignore */
    }
    setAuthed(false);
    setReports([]);
    setNotes([]);
  };

  const refresh = () => (tab === 'reports' ? fetchReports() : fetchNotes());

  const deleteReport = async (id) => {
    setActionStatus(`dismiss-${id}`);
    try {
      const res = await fetch(`${ADMIN}/reports/${id}`, {
        method: 'DELETE',
        ...fetchOpts,
      });
      if (!res.ok) throw new Error();
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError('Failed to dismiss report');
    } finally {
      setActionStatus(null);
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm('Delete this note permanently?')) return;
    setActionStatus(`delete-${id}`);
    try {
      const res = await fetch(`${ADMIN}/notes/${id}`, {
        method: 'DELETE',
        ...fetchOpts,
      });
      if (!res.ok) throw new Error();
      setReports((prev) => prev.filter((r) => r.noteId !== id));
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setError('Failed to delete note');
    } finally {
      setActionStatus(null);
    }
  };

  // Shared notebook-lined paper background.
  const paperBg = {
    backgroundColor: '#fdfbf7',
    backgroundImage: `
      linear-gradient(90deg, transparent 40px, #ab161520 41px, transparent 41px),
      repeating-linear-gradient(0deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 28px)
    `,
    backgroundAttachment: 'local',
  };

  // A sticky-note styled note card.
  const NoteView = ({ note, footer }) => (
    <div
      className="relative w-full shadow-xl flex flex-col transform rotate-1"
      style={{ backgroundColor: note.color, fontFamily: '"Caveat", cursive' }}
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-white/30 backdrop-blur-md rotate-[-2deg] shadow-sm border border-white/20 z-10"></div>
      <div className="w-full p-5 sm:p-6 flex flex-col gap-2 min-h-0">
        {note.to_name && (
          <span className="text-lg font-bold opacity-60">To: {note.to_name}</span>
        )}
        <p className="text-2xl sm:text-3xl leading-tight text-black break-words whitespace-pre-wrap grow">
          {note.message}
        </p>
        {note.alias && (
          <span className="text-lg font-bold opacity-60 text-right">- {note.alias}</span>
        )}
        {footer}
      </div>
    </div>
  );

  if (!authed) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={paperBg}
      >
        <div className="grow flex items-center justify-center p-4 pt-20">
          <div
            className="relative w-full max-w-md shadow-2xl transform rotate-1"
            style={{ backgroundColor: '#fdffb6', fontFamily: '"Caveat", cursive' }}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/30 backdrop-blur-md rotate-[-2deg] shadow-sm border border-white/20"></div>
            <div className="w-full p-8 flex flex-col gap-3">
              <div className="flex items-center justify-center text-primary">
                <ShieldAlert size={44} />
              </div>
              <h1 className="text-4xl font-bold text-black/70 text-center">Admin Access</h1>
              <p className="text-center text-black/50 text-lg">Enter your admin password to continue.</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Admin password"
                className="bg-transparent border-b-2 border-black/20 focus:border-black/50 outline-none text-2xl px-2 py-1 text-center placeholder:text-black/20 font-sans"
              />
              {error && (
                <div className="bg-red-500/20 text-red-900 px-4 py-2 rounded-md text-center font-sans text-sm font-bold border border-red-500/30">
                  {error}
                </div>
              )}
              <button
                onClick={handleLogin}
                className="mt-2 w-full px-8 py-3 rounded-full bg-black/80 text-white font-bold shadow-lg hover:bg-black hover:scale-105 active:scale-95 transition-all font-sans"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={paperBg}
    >
      <div className="grow max-w-5xl mx-auto w-full px-4 py-10">
        {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-y-3 mb-6">
          <div className="flex items-center gap-2 sm:gap-3 text-primary min-w-0">
            <img src={logo} alt="Stuck on You" className="h-6 sm:h-10 w-auto max-w-[120px] sm:max-w-[200px] object-contain drop-shadow-sm shrink-0" />
            <h1 className="text-2xl sm:text-4xl font-bold font-cursive text-primary whitespace-normal leading-tight">Admin Board</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="p-2.5 rounded-full bg-white shadow border border-primary/20 text-primary hover:scale-105 transition-all"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-full bg-white shadow border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all text-sm font-semibold"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-8 border-b border-primary/15 font-cursive overflow-x-auto">
          <button
            onClick={() => setTab('reports')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 text-xl sm:text-2xl font-bold transition-all border-b-2 -mb-px whitespace-nowrap
              ${tab === 'reports'
                ? 'border-primary text-primary'
                : 'border-transparent text-primary/40 hover:text-primary/70'}`}
          >
            <ShieldAlert size={18} className="sm:w-5 sm:h-5" /> Reports
            {reports.length > 0 && (
              <span className="ml-1 bg-primary text-white text-xs font-bold rounded-full px-2 py-0.5 font-sans">
                {reports.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('notes')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 text-xl sm:text-2xl font-bold transition-all border-b-2 -mb-px whitespace-nowrap
              ${tab === 'notes'
                ? 'border-primary text-primary'
                : 'border-transparent text-primary/40 hover:text-primary/70'}`}
          >
            <StickyNote size={18} className="sm:w-5 sm:h-5" /> All Notes
            {tab === 'notes' && notes.length > 0 && (
              <span className="ml-1 bg-primary/20 text-primary text-xs font-bold rounded-full px-2 py-0.5 font-sans">
                {notes.length}
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-900 px-4 py-2 rounded-md text-center font-sans text-sm font-bold border border-red-500/30 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-primary">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-cursive text-2xl">Loading...</p>
          </div>
        ) : tab === 'reports' ? (
          reports.length === 0 ? (
            <div className="text-center py-20 text-primary/50 text-3xl font-cursive">No reports yet. 🎉</div>
          ) : (
            <div className="flex flex-col gap-6">
              {reports.map((r) => (
                <NoteView
                  key={r.id}
                  note={r.note || { id: r.noteId, color: '#fdffb6', message: 'Note no longer exists.', to_name: null, alias: null }}
                  footer={
                    <div className="flex flex-col gap-2 pt-3 border-t border-black/10 font-sans">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded">
                          Report #{r.id}
                        </span>
                        <span className="text-xs text-black/40">
                          {new Date(r.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-black/70">
                        <span className="font-semibold">Reason:</span> {r.reason}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-end pt-1">
                        <button
                          onClick={() => deleteReport(r.id)}
                          disabled={actionStatus === `dismiss-${r.id}`}
                          className="px-4 py-2 rounded-full bg-white shadow border border-primary/20 text-primary hover:bg-primary/5 transition-all disabled:opacity-50 text-sm font-semibold"
                        >
                          Dismiss
                        </button>
                        {r.note && (
                          <button
                            onClick={() => deleteNote(r.note.id)}
                            disabled={actionStatus === `delete-${r.note.id}`}
                            className="flex items-center gap-1 px-4 py-2 rounded-full bg-black/80 text-white font-bold shadow-lg hover:bg-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 text-sm"
                          >
                            <Trash2 size={16} /> Delete Note
                          </button>
                        )}
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )
        ) : notes.length === 0 ? (
          <div className="text-center py-20 text-primary/50 text-3xl font-cursive">No notes found.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {notes.map((note) => (
              <NoteView
                key={note.id}
                note={note}
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/10 font-sans">
                    <span className="text-xs text-black/40">
                      Note #{note.id} · {new Date(note.created_at).toLocaleString()}
                    </span>
                    <button
                      onClick={() => deleteNote(note.id)}
                      disabled={actionStatus === `delete-${note.id}`}
                      className="flex items-center gap-1 px-4 py-2 rounded-full bg-black/80 text-white font-bold shadow-lg hover:bg-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 text-sm"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
