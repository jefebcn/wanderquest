import { notFound } from "next/navigation";
import { getLandmarkById, getNearbyLandmarks } from "@/actions/landmarks";
import { VoiceSynthesizer } from "@/components/features/voice/VoiceSynthesizer";
import { MapPin, Star, Clock, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

// ISR: revalidate landmark pages every 24 hours
export const revalidate = 86400;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const landmark = await getLandmarkById(id);
  if (!landmark) return { title: "Monumento non trovato" };
  return {
    title: landmark.name,
    description: landmark.description?.slice(0, 160),
    openGraph: {
      title: landmark.name,
      description: landmark.description?.slice(0, 160),
      images: landmark.imageUrl ? [landmark.imageUrl] : [],
    },
  };
}

export async function generateStaticParams() {
  // Pre-generate the nearest landmarks at build time using Rome as center
  const { landmarks } = await getNearbyLandmarks(41.9028, 12.4964, 50000);
  return landmarks.map((lm) => ({ id: lm.id }));
}

export default async function LandmarkPage({ params }: Props) {
  const { id } = await params;
  const landmark = await getLandmarkById(id);

  if (!landmark) notFound();

  return (
    <div className="min-h-screen bg-[#080C1A] text-white pb-24">
      {/* Hero image */}
      <div className="relative h-64 w-full bg-white/5">
        {landmark.imageUrl ? (
          <Image
            src={landmark.imageUrl}
            alt={landmark.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <MapPin size={64} className="text-white/10" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080C1A] via-[#080C1A]/40 to-transparent" />

        {/* Back button */}
        <Link
          href="/scan"
          className="absolute left-4 top-14 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white"
        >
          <ChevronLeft size={20} />
        </Link>
      </div>

      {/* Content */}
      <div className="px-4 -mt-8 relative z-10 space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-black leading-tight flex-1">{landmark.name}</h1>
            <div className="rounded-2xl bg-amber-400/20 border border-amber-400/30 px-3 py-1.5 text-amber-400 text-sm font-black whitespace-nowrap">
              +{landmark.points} pt
            </div>
          </div>

          {landmark.category && (
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/40">
              {landmark.category}
            </p>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {landmark.city ?? "Italia"}
            </span>
            {landmark.radius && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Raggio check-in: {landmark.radius}m
              </span>
            )}
          </div>
        </div>

        {/* Voice narration */}
        {(landmark.audioUrl || landmark.description) && (
          <div className="rounded-2xl bg-white/4 border border-white/10 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
              Narrazione vocale
            </p>
            <VoiceSynthesizer
              text={landmark.description ?? ""}
              audioUrl={landmark.audioUrl}
              landmarkName={landmark.name}
            />
          </div>
        )}

        {/* Description */}
        {landmark.description && (
          <div className="rounded-2xl bg-white/4 border border-white/10 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400/60 mb-3">
              Storia e curiosità
            </p>
            <p className="text-sm text-white/70 leading-relaxed">{landmark.description}</p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Punti", value: `${landmark.points}` },
            { label: "Raggio", value: `${landmark.radius ?? 100}m` },
            { label: "Categoria", value: landmark.category ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-white/4 border border-white/10 p-3 text-center">
              <p className="text-xs text-white/40">{label}</p>
              <p className="mt-1 text-sm font-black capitalize">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
