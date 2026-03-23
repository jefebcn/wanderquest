"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useContest } from "@/hooks/useContest";
import { getFirebaseClient } from "@/lib/firebase/client";
import { createOrRenewContest } from "@/actions/contest";
import { doc, getDoc } from "firebase/firestore";
import { Trophy, Plus, RefreshCw, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { formatCents } from "@/lib/utils";

export function AdminContestPanel() {
  const { user, loading: authLoading } = useAuth();
  const { contest, loading: contestLoading } = useContest();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [prizePool, setPrizePool] = useState("350");
  const [durationDays, setDurationDays] = useState("30");

  useEffect(() => {
    if (!user) { setAdminChecked(true); return; }
    const { db } = getFirebaseClient();
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      setIsAdmin(!!snap.data()?.isAdmin);
      setAdminChecked(true);
    });
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    setMessage(null);
    try {
      const { auth } = getFirebaseClient();
      const tok = await auth.currentUser?.getIdToken();
      if (!tok) throw new Error("Not authenticated");

      const result = await createOrRenewContest(tok, {
        title: title.trim() || undefined,
        prizePool: Math.round(parseFloat(prizePool) * 100),
        durationDays: parseInt(durationDays, 10),
      });

      setMessage({ type: result.success ? "success" : "error", text: result.message });
      if (result.success) { setTitle(""); }
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Errore sconosciuto." });
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || !adminChecked) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-white/40" size={24} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-white/40 text-sm">
        Effettua il login per accedere al pannello admin.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertTriangle size={32} className="text-amber-400" />
        <p className="text-sm text-white/50">Accesso riservato agli amministratori.</p>
      </div>
    );
  }

  const isGalleryMode = contest?.id === "general";

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 pt-14 pb-12 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--s-primary)]/15 border border-[var(--s-primary)]/25">
          <Trophy className="text-[var(--s-primary)]" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black">Admin Contest</h1>
          <p className="text-xs text-white/40">Gestione dei contest fotografici</p>
        </div>
      </div>

      {/* Current contest status */}
      <section className="rounded-2xl bg-white/[0.04] border border-white/8 p-4 mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Contest attuale</p>
        {contestLoading ? (
          <Loader2 className="animate-spin text-white/40" size={18} />
        ) : isGalleryMode ? (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2">
            <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300">
              Nessun contest reale attivo — in modalità gallery (foto salvate come &quot;general&quot;).
              Crea un contest per attivare premi e classifiche.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="font-bold text-sm">{contest?.title}</p>
            <p className="text-xs text-white/40">
              Premio: {formatCents(contest?.prizePool ?? 0)} · Scade: {contest?.endDate ? new Date(contest.endDate).toLocaleDateString("it-IT") : "—"}
            </p>
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">✓ Attivo</p>
          </div>
        )}
      </section>

      {/* Create / renew contest */}
      <section className="rounded-2xl bg-white/[0.04] border border-white/8 p-4 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">
          {isGalleryMode ? "Crea contest" : "Rinnova contest"}
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Titolo (opzionale)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Contest ${new Date().toLocaleString("it-IT", { month: "long", year: "numeric" })}`}
              className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[var(--s-primary)]/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Premio totale (€)</label>
              <input
                type="number"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                min="0"
                step="10"
                className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--s-primary)]/40"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Durata (giorni)</label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                min="1"
                max="365"
                className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--s-primary)]/40"
              />
            </div>
          </div>
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              : "bg-red-500/10 border border-red-500/20 text-red-300"
          }`}>
            {message.type === "success"
              ? <CheckCircle2 size={14} className="flex-shrink-0" />
              : <AlertTriangle size={14} className="flex-shrink-0" />}
            {message.text}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--s-primary)] py-3.5 text-sm font-black text-slate-900 shadow-[0_4px_20px_rgba(255,215,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating
            ? <Loader2 size={16} className="animate-spin" />
            : isGalleryMode
            ? <><Plus size={16} />Crea contest</>
            : <><RefreshCw size={16} />Rinnova contest</>}
        </button>
      </section>

      <p className="text-xs text-white/20 text-center mt-6">
        Il contest viene attivato immediatamente e durerà {durationDays} giorni dall&apos;ora di creazione.
      </p>
    </div>
  );
}
