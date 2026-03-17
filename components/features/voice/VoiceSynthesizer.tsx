"use client";

import { useState, useCallback, useRef } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceSynthesizerProps {
  text: string;
  /** Optional pre-recorded audio URL (e.g., from Firebase Storage). */
  audioUrl?: string;
  className?: string;
}

type PlayState = "idle" | "loading" | "playing" | "error";

/**
 * Narrates landmark descriptions using:
 * 1. Pre-recorded audio file from Firebase Storage (best quality).
 * 2. Browser Web Speech API (SpeechSynthesis) as fallback.
 * 3. Google TTS Cloud endpoint as final fallback.
 */
export function VoiceSynthesizer({ text, audioUrl, className }: VoiceSynthesizerProps) {
  const [state, setState] = useState<PlayState>("idle");
  const audioRef          = useRef<HTMLAudioElement | null>(null);
  const synthRef          = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    // Stop HTML audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Stop Web Speech API
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setState("idle");
  }, []);

  const playWithWebSpeech = useCallback(() => {
    if (!window.speechSynthesis) {
      setState("error");
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = "it-IT";
    utter.rate  = 0.9;
    // Prefer a natural Italian voice
    const voices = window.speechSynthesis.getVoices();
    const italian = voices.find((v) => v.lang.startsWith("it") && v.localService);
    if (italian) utter.voice = italian;

    utter.onstart = () => setState("playing");
    utter.onend   = () => setState("idle");
    utter.onerror = () => {
      // Last-resort: Google TTS
      playWithGoogleTTS();
    };

    synthRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [text]);

  const playWithGoogleTTS = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch(
        `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
          text.slice(0, 200)
        )}&tl=it&client=tw-ob`,
        { headers: { "Referer": "http://www.google.com/" } }
      );
      if (!res.ok) throw new Error("TTS fetch failed");
      const blob = URL.createObjectURL(await res.blob());
      const audio = new Audio(blob);
      audioRef.current = audio;
      audio.onplay  = () => setState("playing");
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("error");
      audio.play();
    } catch {
      setState("error");
    }
  }, [text]);

  const play = useCallback(async () => {
    if (state === "playing" || state === "loading") { stop(); return; }

    setState("loading");

    // 1. Try pre-recorded audio from Firebase Storage
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.oncanplaythrough = () => { setState("playing"); audio.play(); };
      audio.onended          = () => setState("idle");
      audio.onerror          = () => playWithWebSpeech();
      audio.load();
      return;
    }

    // 2. Web Speech API
    playWithWebSpeech();
  }, [state, audioUrl, stop, playWithWebSpeech]);

  const isPlaying = state === "playing";
  const isLoading = state === "loading";

  return (
    <button
      onClick={play}
      aria-label={isPlaying ? "Ferma narrazione" : "Ascolta descrizione"}
      className={cn(
        "flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all",
        isPlaying
          ? "bg-amber-400/20 border border-amber-400/40 text-amber-400"
          : "bg-white/8 text-white/60 hover:text-white hover:bg-white/12",
        className
      )}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isPlaying ? (
        <VolumeX size={14} />
      ) : (
        <Volume2 size={14} />
      )}
      {isPlaying ? "Stop" : "Ascolta"}
    </button>
  );
}
