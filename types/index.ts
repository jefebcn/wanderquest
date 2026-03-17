// ─── Domain types ──────────────────────────────────────────────────────────

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Landmark {
  id: string;
  name: string;
  description: string;
  audioUrl?: string;
  imageUrl?: string;
  coordinates: GeoPoint;
  city: string;
  country: string;
  category: "monument" | "museum" | "park" | "viewpoint" | "restaurant" | "other";
  points: number;
  radius: number; // check-in radius in metres
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  plan: "free" | "pro";
  totalPoints: number;
  totalVisits: number;
  createdAt: string;
}

export interface Visit {
  id: string;
  userId: string;
  landmarkId: string;
  landmarkName: string;
  pointsEarned: number;
  coordinates: GeoPoint;
  verifiedAt: string;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  prizePool: number; // in EUR cents
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "ended";
  minThresholdCents: number; // minimum to withdraw
  topN: number; // top N winners share the prize
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  photoURL?: string;
  points: number;
  visits: number;
  prizeShare?: number; // in EUR cents, if in prize zone
}

export interface UserWallet {
  userId: string;
  balanceCents: number;
  pendingCents: number;
  totalEarnedCents: number;
  stripeAccountId?: string;
  paypalEmail?: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amountCents: number;
  method: "stripe" | "paypal";
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface CheckInPayload {
  landmarkId: string;
  userLat: number;
  userLng: number;
  contestId?: string;
}

export interface CheckInResult {
  success: boolean;
  pointsEarned: number;
  distanceMetres: number;
  message: string;
  visit?: Visit;
}

export interface NearbyLandmarksResult {
  landmarks: (Landmark & { distanceMetres: number })[];
}
