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
  /** Subscription tier — drives multiplier & gating */
  tier: "free" | "pro";
  /** 1.0 for free, 1.25 for pro */
  pointsMultiplier: number;
  isPremium: boolean;
  premiumSince?: string;
  premiumExpiresAt?: string;
  paypalSubscriptionId?: string;
  totalPoints: number;
  totalVisits: number;
  /** Consecutive scan-days streak */
  currentStreak: number;
  /** All-time longest streak */
  longestStreak: number;
  /** ISO date string (YYYY-MM-DD) of last successful scan */
  lastScanDate?: string;
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

export interface LeaguePrizes {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
  diamond: number;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  prizePool: number; // in EUR cents
  /** Per-league prize pools (total to split among top 3 in that league) */
  leaguePrizes?: LeaguePrizes;
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
  /** Bonus points awarded for a streak milestone (0 if none) */
  streakBonus?: number;
  /** Updated streak count after this check-in */
  currentStreak?: number;
}

export interface NearbyLandmarksResult {
  landmarks: (Landmark & { distanceMetres: number })[];
}

// ── Photo Contest ────────────────────────────────────────────────────────

export interface ContestPhoto {
  id: string;
  userId: string;
  displayName: string;
  /** First-letter initials fallback (e.g. "SR") */
  initials: string;
  /** Tailwind gradient classes for avatar background */
  avatarGradient: string;
  imageUrl: string;
  caption: string;
  city?: string;
  likes: number;
  superLikes: number;
  skips: number;
  contestId: string;
  status?: string;
  uploadedAt: string;
}

export type VoteType = "like" | "superlike" | "skip";

// ── B2B Partner Hub ────────────────────────────────────────────────────────

export interface Coupon {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  discountText: string;
  code?: string;
  qrUrl?: string;
  isProOnly: boolean;
  expiresAt?: string;
  usageCount: number;
}

export interface Partner {
  id: string;
  name: string;
  category: "restaurant" | "bar" | "museum" | "hotel" | "shop" | "other";
  emoji: string;
  logoUrl?: string;
  description: string;
  city: string;
  coupons: Coupon[];
}

// ── Subscription ───────────────────────────────────────────────────────────

export interface SubscriptionActivation {
  success: boolean;
  message: string;
}

// ── League / Season ────────────────────────────────────────────────────────

export type LeagueId = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface Season {
  id: string;           // "YYYY-MM"
  startAt: string;      // ISO
  endAt: string;        // ISO
  status: "active" | "ended";
}

/** Entry in a league's season standings */
export interface SeasonStandingEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  seasonPoints: number;
  rank: number;
  leagueId: LeagueId;
}

// ── Safety Hub ─────────────────────────────────────────────────────────────

export type SafetyLevel = "STABLE" | "WARNING" | "CRITICAL";

export interface GeopoliticalEvent {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
}

export interface InflationData {
  value: number | null; // annual CPI inflation %
  year: string;
  countryCode: string;
}

export interface SafetyAudit {
  level: SafetyLevel;
  summary: string;       // 1-3 sentences from Haiku
  tip: string;           // single safety tip
  countryCode: string;
  countryName: string;
  events: GeopoliticalEvent[];
  inflation: InflationData | null;
  cachedAt: number;      // unix ms — used client-side to show freshness
}

export interface EmergencyContacts {
  police: string;
  ambulance: string;
  embassy: string;       // Italian Farnesina for IT users
  embassyPhone?: string;
}
