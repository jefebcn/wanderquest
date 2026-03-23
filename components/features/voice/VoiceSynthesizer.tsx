"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceSynthesizerProps {
  text: string;
  audioUrl?: string;
  landmarkName?: string;
  className?: string;
}

type PlayState = "idle" | "loading" | "playing" | "error";

// ── Animated waveform bars ────────────────────────────────────────────────

function SoundWave() {
  const bars = [0.4, 0.9, 0.6, 1, 0.7, 0.85, 0.5];
  return (
    <span className="flex items-center gap-[2px] h-4" aria-hidden>
      {bars.map((scale, i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full bg-current"
          animate={{ scaleY: [1, scale, 0.3, scale, 1] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
          style={{ height: 14, originY: 0.5 }}
        />
      ))}
    </span>
  );
}

export function VoiceSynthesizer({ text, audioUrl, landmarkName, className }: VoiceSynthesizerProps) {
  const [state, setState] = useState<PlayState>("idle");
  const audioRef          = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    window.speechSynthesis?.cancel();
    setState("idle");
  }, []);

  const playWithWebSpeech = useCallback(() => {
    if (!window.speechSynthesis) { setState("error"); return; }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = "it-IT";
    utter.rate  = 0.88;
    const voices  = window.speechSynthesis.getVoices();
    const italian = voices.find((v) => v.lang.startsWith("it") && v.localService);
    if (italian) utter.voice = italian;
    utter.onstart = () => setState("playing");
    utter.onend   = () => setState("idle");
    utter.onerror = () => setState("error");
    window.speechSynthesis.speak(utter);
  }, [text]);

  const play = useCallback(async () => {
    if (state === "playing" || state === "loading") { stop(); return; }
    setState("loading");

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.oncanplaythrough = () => { setState("playing"); audio.play(); };
      audio.onended          = () => setState("idle");
      audio.onerror          = () => playWithWebSpeech();
      audio.load();
      return;
    }
    playWithWebSpeech();
  }, [state, audioUrl, stop, playWithWebSpeech]);

  const isPlaying = state === "playing";
  const isLoading = state === "loading";

  return (
    <button
      onClick={play}
      aria-label={isPlaying ? "Ferma narrazione" : "Ascolta descrizione"}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold",
        "transition-all active:scale-95",
        isPlaying
          ? "bg-[var(--s-primary)]/18 border border-[var(--s-primary)]/35 text-[var(--s-primary)]"
          : "bg-white/8 border border-white/8 text-white/60 hover:text-white hover:bg-white/12",
        className
      )}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin flex-shrink-0" />
      ) : isPlaying ? (
        <>
          <SoundWave />
          <VolumeX size={13} className="flex-shrink-0" />
        </>
      ) : (
        <Volume2 size={14} className="flex-shrink-0" />
      )}
      <span>{isPlaying ? "Stop" : "Ascolta"}</span>
    </button>
  );
}
