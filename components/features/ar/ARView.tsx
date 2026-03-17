"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Billboard, Html } from "@react-three/drei";
import * as THREE from "three";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getNearbyLandmarks } from "@/actions/landmarks";
import { haversineMetres } from "@/lib/geo";
import { formatDistance } from "@/lib/utils";
import type { Landmark } from "@/types";
import { Camera, X } from "lucide-react";

// ── AR Landmark Marker ────────────────────────────────────────────────────────
function LandmarkMarker({
  landmark,
  userLat,
  userLng,
  bearing,
}: {
  landmark: Landmark;
  userLat: number;
  userLng: number;
  bearing: number; // device compass heading in degrees
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Convert relative bearing to position on a virtual sphere
  const toRad = (d: number) => (d * Math.PI) / 180;

  const deltaLat = landmark.coordinates.lat - userLat;
  const deltaLng = landmark.coordinates.lng - userLng;
  const angleDeg = (Math.atan2(deltaLng, deltaLat) * 180) / Math.PI - bearing;
  const angleRad = toRad(angleDeg);
  const dist = haversineMetres({ lat: userLat, lng: userLng }, landmark.coordinates);
  const scale = Math.max(0.3, 1 - dist / 2000); // scale down with distance

  const x = Math.sin(angleRad) * 3;
  const z = -Math.cos(angleRad) * 3;

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <Billboard position={[x, 0, z]}>
      <mesh ref={meshRef} scale={scale}>
        <octahedronGeometry args={[0.25]} />
        <meshStandardMaterial
          color="#E8A228"
          emissive="#E8A228"
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      <Text
        position={[0, 0.55 * scale, 0]}
        fontSize={0.14 * scale}
        color="white"
        anchorX="center"
        anchorY="bottom"
        maxWidth={2}
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {landmark.name}
      </Text>
      <Text
        position={[0, 0.35 * scale, 0]}
        fontSize={0.1 * scale}
        color="#E8A228"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.015}
        outlineColor="#000000"
      >
        {formatDistance(dist)} · +{landmark.points}pt
      </Text>
    </Billboard>
  );
}

function ARScene({
  landmarks,
  userLat,
  userLng,
  bearing,
}: {
  landmarks: Landmark[];
  userLat: number;
  userLng: number;
  bearing: number;
}) {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      {landmarks.map((lm) => (
        <LandmarkMarker
          key={lm.id}
          landmark={lm}
          userLat={userLat}
          userLng={userLng}
          bearing={bearing}
        />
      ))}
    </>
  );
}

// ── Main ARView component ─────────────────────────────────────────────────────
export function ARView({ onClose }: { onClose?: () => void }) {
  const { position } = useUserLocation();
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [bearing, setBearing]     = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [camError, setCamError]   = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Start camera
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        setCameraStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => setCamError(`Accesso fotocamera negato: ${err.message}`));

    return () => {
      cameraStream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Device orientation / compass
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const alpha = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading ?? e.alpha ?? 0;
      setBearing(alpha);
    };
    window.addEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
    window.addEventListener("deviceorientation", handleOrientation as EventListener, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
      window.removeEventListener("deviceorientation", handleOrientation as EventListener, true);
    };
  }, []);

  // Fetch nearby landmarks
  useEffect(() => {
    if (!position) return;
    getNearbyLandmarks(position.lat, position.lng, 1000).then(({ landmarks }) =>
      setLandmarks(landmarks)
    );
  }, [position]);

  if (camError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-6 text-center">
        <Camera size={48} className="mb-4 text-amber-400 opacity-60" />
        <p className="font-bold">{camError}</p>
        <p className="text-xs text-white/40 mt-2">
          Abilita l'accesso fotocamera nelle impostazioni del browser.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera feed as background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Three.js overlay */}
      {position && (
        <Canvas
          className="absolute inset-0"
          camera={{ fov: 70, near: 0.1, far: 1000, position: [0, 0, 0] }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <ARScene
              landmarks={landmarks}
              userLat={position.lat}
              userLng={position.lng}
              bearing={bearing}
            />
          </Suspense>
        </Canvas>
      )}

      {/* UI overlay */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-14 pb-4 bg-gradient-to-b from-black/60 to-transparent">
        <div>
          <p className="text-white font-black text-lg">Vista AR</p>
          <p className="text-white/60 text-xs">{landmarks.length} monumenti nel raggio</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Crosshair */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border-2 border-amber-400/60 border-dashed" />
      </div>
    </div>
  );
}
