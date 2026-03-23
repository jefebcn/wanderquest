"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useContest } from "@/hooks/useContest";
import { AuthModal } from "@/components/features/auth/AuthModal";
import { CurrencyConverter } from "@/components/features/currency/CurrencyConverter";
import { WeatherQuest }      from "@/components/features/weather/WeatherQuest";
import { SafetyHub }         from "@/components/features/safety/SafetyHub";
import { GoPro }             from "@/components/features/subscription/GoPro";
import { BottomSheet }       from "@/components/ui/BottomSheet";
import { formatCents } from "@/lib/utils";
import {
  Compass,
  ScanLine,
  Trophy,
  Wallet,
  ChevronRight,
  MapPin,
  Sparkles,
  Star,
  Loader2,
  Shield,
  CalendarDays,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Euro,
  Info,
  Quote,
  Download,
  Navigation2,
  X,
  Search,
  UtensilsCrossed,
  Moon,
  Landmark,
  ChefHat,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// ── Bento step cards ────────────────────────────────────────────────────────

const steps = [
  {
    step: "01",
    icon: Compass,
    title: "Esplora",
    desc: "Scopri monumenti storici nei dintorni con la mappa interattiva.",
    gradient: "from-blue-500/20 via-blue-600/8 to-transparent",
    border: "border-blue-500/25",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    glow: "rgba(59,130,246,0.18)",
  },
  {
    step: "02",
    icon: ScanLine,
    title: "Scansiona",
    desc: "Arriva sul posto e scannerizza il monumento per guadagnare punti.",
    gradient: "from-amber-500/20 via-amber-600/8 to-transparent",
    border: "border-amber-500/25",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    glow: "rgba(245,158,11,0.18)",
  },
  {
    step: "03",
    icon: Trophy,
    title: "Scala la classifica",
    desc: "I migliori esploratori si dividono il montepremi in euro.",
    gradient: "from-purple-500/20 via-purple-600/8 to-transparent",
    border: "border-purple-500/25",
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-400",
    glow: "rgba(139,92,246,0.18)",
  },
  {
    step: "04",
    icon: Wallet,
    title: "Incassa",
    desc: "Preleva i tuoi premi in euro direttamente sul tuo conto bancario.",
    gradient: "from-green-500/20 via-green-600/8 to-transparent",
    border: "border-green-500/25",
    iconBg: "bg-green-500/15",
    iconColor: "text-green-400",
    glow: "rgba(34,197,94,0.18)",
  },
] as const;

// ── Featured cities ─────────────────────────────────────────────────────────

const CITIES = [
  { name: "Barcellona", country: "ES", landmarks: 48, active: true,  img: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80" },
  { name: "Roma",       country: "IT", landmarks: 62, active: false, img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80" },
  { name: "Parigi",     country: "FR", landmarks: 55, active: false, img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80" },
  { name: "Madrid",     country: "ES", landmarks: 39, active: false, img: "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=400&q=80" },
  { name: "Firenze",    country: "IT", landmarks: 33, active: false, img: "https://images.unsplash.com/photo-1543414164-09db18f38c05?w=400&q=80" },
  { name: "Amsterdam",  country: "NL", landmarks: 41, active: false, img: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&q=80" },
  { name: "Vienna",     country: "AT", landmarks: 37, active: false, img: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=400&q=80" },
  { name: "Lisbona",    country: "PT", landmarks: 29, active: false, img: "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=400&q=80" },
  { name: "Praga",      country: "CZ", landmarks: 44, active: false, img: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=400&q=80" },
  { name: "Budapest",   country: "HU", landmarks: 31, active: false, img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { name: "Venezia",    country: "IT", landmarks: 52, active: false, img: "https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=400&q=80" },
  { name: "Milano",     country: "IT", landmarks: 28, active: false, img: "https://images.unsplash.com/photo-1552751753-0fc84ae5b6c8?w=400&q=80" },
  { name: "Berlino",    country: "DE", landmarks: 46, active: false, img: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&q=80" },
  { name: "Siviglia",   country: "ES", landmarks: 22, active: false, img: "https://images.unsplash.com/photo-1593672715438-d88a70629abe?w=400&q=80" },
  { name: "Atene",      country: "GR", landmarks: 35, active: false, img: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&q=80" },
  { name: "Londra",     country: "GB", landmarks: 58, active: false, img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80" },
  { name: "Dublino",    country: "IE", landmarks: 24, active: false, img: "https://images.unsplash.com/photo-1564959130747-897fb406b9af?w=400&q=80" },
  { name: "Zurigo",     country: "CH", landmarks: 26, active: false, img: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400&q=80" },
  { name: "Monaco",     country: "DE", landmarks: 34, active: false, img: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&q=80" },
  { name: "Copenaghen", country: "DK", landmarks: 27, active: false, img: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=400&q=80" },
  { name: "Stoccolma",  country: "SE", landmarks: 30, active: false, img: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=400&q=80" },
  { name: "Cracovia",   country: "PL", landmarks: 32, active: false, img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80" },
  { name: "Napoli",     country: "IT", landmarks: 25, active: false, img: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&q=80" },
  { name: "Edimburgo",  country: "GB", landmarks: 28, active: false, img: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&q=80" },
  { name: "Santorini",  country: "GR", landmarks: 18, active: false, img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&q=80" },
];

// ── City detail data ──────────────────────────────────────────────────────────

const CITY_DETAILS: Record<string, {
  description: string;
  highlights: string[];
  topLandmarks: Array<{ name: string; pts: number; emoji: string }>;
  openDate?: string;
  bestFor: string;
  countryEmoji: string;
}> = {
  "Barcellona": {
    description: "La perla del Mediterraneo, patria di Gaudì e della cultura catalana. Architettura modernista unica, spiagge urbane e vita notturna imbattibile.",
    highlights: ["48 monumenti da conquistare", "Architettura Art Nouveau UNESCO", "Spiagge a 15 min dal centro storico"],
    topLandmarks: [
      { name: "Sagrada Família", pts: 750, emoji: "⛪" },
      { name: "Park Güell",      pts: 500, emoji: "🌿" },
      { name: "Casa Batlló",     pts: 620, emoji: "🏛️" },
    ],
    bestFor: "Architettura & Spiagge",
    countryEmoji: "🇪🇸",
  },
  "Roma": {
    description: "La Città Eterna dove ogni pietra racconta tremila anni di storia. Colosseo, Vaticano, fontane barocche — il museo a cielo aperto più grande del mondo.",
    highlights: ["62 monumenti storici", "Sede del Vaticano e Sistina", "Gastronomia tradizionale autentica"],
    topLandmarks: [
      { name: "Colosseo",        pts: 800, emoji: "🏛️" },
      { name: "Fontana di Trevi", pts: 450, emoji: "⛲" },
      { name: "Pantheon",        pts: 550, emoji: "🔵" },
    ],
    openDate: "Maggio 2025",
    bestFor: "Storia & Cultura",
    countryEmoji: "🇮🇹",
  },
  "Parigi": {
    description: "La Ville Lumière che ha ispirato artisti e sognatori per secoli. Torre Eiffel, Louvre, Montmartre — ogni quartiere è un'opera d'arte.",
    highlights: ["55 monumenti iconici", "Più di 130 musei mondiali", "Cucina haute cuisine certificata"],
    topLandmarks: [
      { name: "Torre Eiffel",     pts: 700, emoji: "🗼" },
      { name: "Louvre",           pts: 650, emoji: "🖼️" },
      { name: "Arco di Trionfo",  pts: 500, emoji: "🏛️" },
    ],
    openDate: "Giugno 2025",
    bestFor: "Arte & Romanticismo",
    countryEmoji: "🇫🇷",
  },
  "Madrid": {
    description: "La capitale spagnola che non dorme mai. Prado, Retiro, tapas e flamenco — una città che ti conquista con la sua energia contagiosa.",
    highlights: ["39 luoghi da esplorare", "Museo del Prado di fama mondiale", "Vita notturna leggendaria"],
    topLandmarks: [
      { name: "Museo del Prado", pts: 600, emoji: "🖼️" },
      { name: "Plaza Mayor",     pts: 400, emoji: "🏟️" },
      { name: "Palacio Real",    pts: 550, emoji: "🏰" },
    ],
    openDate: "Luglio 2025",
    bestFor: "Arte & Vita Notturna",
    countryEmoji: "🇪🇸",
  },
  "Firenze": {
    description: "La culla del Rinascimento italiano. Duomo, Uffizi, Ponte Vecchio — ogni angolo di Firenze è un capolavoro assoluto dell'umanità.",
    highlights: ["33 gioielli rinascimentali", "Galleria degli Uffizi", "Vista dal Piazzale Michelangelo"],
    topLandmarks: [
      { name: "Duomo di Firenze",  pts: 700, emoji: "⛪" },
      { name: "Galleria degli Uffizi", pts: 550, emoji: "🖼️" },
      { name: "Ponte Vecchio",     pts: 450, emoji: "🌉" },
    ],
    openDate: "Agosto 2025",
    bestFor: "Arte Rinascimentale",
    countryEmoji: "🇮🇹",
  },
  "Amsterdam": {
    description: "La città dei canali, dei tulipani e dell'arte. Rijksmuseum, Anne Frank House e centinaia di ponti — Amsterdam è unica al mondo.",
    highlights: ["41 destinazioni iconiche", "165 canali navigabili UNESCO", "Van Gogh Museum"],
    topLandmarks: [
      { name: "Rijksmuseum",       pts: 600, emoji: "🖼️" },
      { name: "Anne Frank House",  pts: 500, emoji: "🏠" },
      { name: "Vondelpark",        pts: 300, emoji: "🌳" },
    ],
    openDate: "Settembre 2025",
    bestFor: "Canali & Musei",
    countryEmoji: "🇳🇱",
  },
  "Vienna": {
    description: "La città imperiale degli Asburgo, capitale mondiale della musica classica. Palazzi barocchi, Schönbrunn e Wiener Schnitzel — eleganza pura.",
    highlights: ["37 palazzi e musei imperiali", "Patrimonio musicale di Mozart & Beethoven", "Caffè storici leggendari"],
    topLandmarks: [
      { name: "Palazzo Schönbrunn", pts: 650, emoji: "🏰" },
      { name: "Stephansdom",        pts: 500, emoji: "⛪" },
      { name: "Belvedere",          pts: 550, emoji: "🎨" },
    ],
    openDate: "Ottobre 2025",
    bestFor: "Musica & Architettura Imperiale",
    countryEmoji: "🇦🇹",
  },
  "Lisbona": {
    description: "La città dalle sette colline e dai vicoli lastricati dove il fado risuona tra le azulejos. La capitale più autentica dell'Europa occidentale.",
    highlights: ["29 luoghi da scoprire", "Tram storico n.28 iconico", "Belém e la Torre famosa"],
    topLandmarks: [
      { name: "Torre de Belém",          pts: 550, emoji: "🗼" },
      { name: "Mosteiro dos Jerónimos",  pts: 600, emoji: "⛪" },
      { name: "Castelo de S. Jorge",     pts: 500, emoji: "🏰" },
    ],
    openDate: "Novembre 2025",
    bestFor: "Cultura Fado & Storia",
    countryEmoji: "🇵🇹",
  },
  "Praga": {
    description: "La città dalle cento torri con il suo centro medievale intatto e magico. Castello di Praga, Ponte Carlo e birra artigianale a fiumi.",
    highlights: ["44 gioielli medievali", "Castello più grande d'Europa", "Birre artigianali leggendarie"],
    topLandmarks: [
      { name: "Castello di Praga",              pts: 700, emoji: "🏰" },
      { name: "Ponte Carlo",                     pts: 550, emoji: "🌉" },
      { name: "Piazza della Città Vecchia",      pts: 450, emoji: "🏟️" },
    ],
    openDate: "Dicembre 2025",
    bestFor: "Medioevo & Birra Artigianale",
    countryEmoji: "🇨🇿",
  },
  "Budapest": {
    description: "La Perla del Danubio divisa in Buda e Pest, con terme storiche, un parlamento mozzafiato e una scena gastronomica in continua evoluzione.",
    highlights: ["31 attrazioni sul Danubio", "Terme Széchenyi e Gellért", "Parlamento tra i più belli d'Europa"],
    topLandmarks: [
      { name: "Parlamento Ungherese", pts: 700, emoji: "🏛️" },
      { name: "Castello di Buda",     pts: 600, emoji: "🏰" },
      { name: "Terme Széchenyi",      pts: 400, emoji: "♨️" },
    ],
    openDate: "Gennaio 2026",
    bestFor: "Terme & Architettura",
    countryEmoji: "🇭🇺",
  },
  "Venezia": {
    description: "La Serenissima galleggiante sull'acqua, labirinto di calli e ponti dove ogni angolo è una sorpresa. Unica, irripetibile, irresistibile.",
    highlights: ["52 monumenti su acqua e terra", "Intero centro storico UNESCO", "Carnevale leggendario"],
    topLandmarks: [
      { name: "Piazza San Marco",  pts: 600, emoji: "🕌" },
      { name: "Palazzo Ducale",    pts: 650, emoji: "🏛️" },
      { name: "Ponte di Rialto",   pts: 450, emoji: "🌉" },
    ],
    openDate: "Febbraio 2026",
    bestFor: "Canali & Arte Veneziana",
    countryEmoji: "🇮🇹",
  },
  "Milano": {
    description: "La capitale italiana della moda, del design e degli affari. Il Duomo imponente, l'Ultima Cena di Leonardo e i Navigli per gli aperitivi.",
    highlights: ["28 destinazioni fashion & art", "Duomo tra le cattedrali più grandi al mondo", "Scena culturale e notturna vivace"],
    topLandmarks: [
      { name: "Duomo di Milano",                pts: 700, emoji: "⛪" },
      { name: "Ultima Cena (da Vinci)",          pts: 750, emoji: "🖼️" },
      { name: "Galleria Vittorio Emanuele II",   pts: 450, emoji: "🏛️" },
    ],
    openDate: "Marzo 2026",
    bestFor: "Moda & Design",
    countryEmoji: "🇮🇹",
  },
  "Berlino": {
    description: "La capitale tedesca reinventata, dove storia difficile incontra arte d'avanguardia. Muro, Brandeburgo, musei di livello mondiale e nightlife globale.",
    highlights: ["46 luoghi di storia e cultura", "Isola dei Musei UNESCO", "Nightlife famosa in tutto il mondo"],
    topLandmarks: [
      { name: "Porta di Brandeburgo", pts: 600, emoji: "🏛️" },
      { name: "Museo di Pergamo",     pts: 550, emoji: "🏺" },
      { name: "Muro di Berlino",      pts: 500, emoji: "🧱" },
    ],
    openDate: "Aprile 2026",
    bestFor: "Storia & Arte Contemporanea",
    countryEmoji: "🇩🇪",
  },
  "Siviglia": {
    description: "Il cuore dell'Andalusia, patria del flamenco e dell'architettura moresca. Real Alcázar, Catedral e tapas infinite sotto il sole.",
    highlights: ["22 tesori andalusi", "Real Alcázar patrimonio UNESCO", "Flamenco autentico ogni sera"],
    topLandmarks: [
      { name: "Real Alcázar",          pts: 600, emoji: "🏰" },
      { name: "Cattedrale di Siviglia", pts: 700, emoji: "⛪" },
      { name: "Plaza de España",        pts: 450, emoji: "🏟️" },
    ],
    openDate: "Maggio 2026",
    bestFor: "Flamenco & Architettura Moresca",
    countryEmoji: "🇪🇸",
  },
  "Atene": {
    description: "La culla della civiltà occidentale, dove la democrazia e la filosofia sono nate. Acropoli, Partenone e souvlaki — un viaggio nella storia.",
    highlights: ["35 siti dell'antichità classica", "Acropoli: monumento più emblematico d'Europa", "Cucina greca autentica"],
    topLandmarks: [
      { name: "Partenone / Acropoli",  pts: 850, emoji: "🏛️" },
      { name: "Museo dell'Acropoli",   pts: 550, emoji: "🏺" },
      { name: "Agorà Antica",          pts: 450, emoji: "⚱️" },
    ],
    openDate: "Giugno 2026",
    bestFor: "Archeologia & Cultura Greca",
    countryEmoji: "🇬🇷",
  },
  "Londra": {
    description: "La capitale del Regno Unito, metropoli cosmopolita dove tradizione e innovazione convivono. Big Ben, Tower Bridge, musei gratuiti di livello mondiale.",
    highlights: ["58 monumenti e attrazioni", "British Museum e National Gallery gratis", "Vita culturale infinita"],
    topLandmarks: [
      { name: "Big Ben & Parlamento", pts: 700, emoji: "🕰️" },
      { name: "Tower of London",     pts: 650, emoji: "🏰" },
      { name: "British Museum",      pts: 550, emoji: "🏛️" },
    ],
    openDate: "Luglio 2026",
    bestFor: "Cultura & Tradizione",
    countryEmoji: "🇬🇧",
  },
  "Dublino": {
    description: "La capitale irlandese dal fascino genuino. Temple Bar, Trinity College, Guinness e pub storici dove la musica dal vivo non si ferma mai.",
    highlights: ["24 luoghi da esplorare", "Trinity College e Book of Kells", "Pub con musica live ogni sera"],
    topLandmarks: [
      { name: "Trinity College",      pts: 550, emoji: "📚" },
      { name: "Guinness Storehouse",  pts: 450, emoji: "🍺" },
      { name: "Temple Bar",           pts: 350, emoji: "🎵" },
    ],
    openDate: "Agosto 2026",
    bestFor: "Pub & Musica Live",
    countryEmoji: "🇮🇪",
  },
  "Zurigo": {
    description: "La città svizzera sulle rive del lago, dove l'efficienza incontra la bellezza alpina. Centro finanziario mondiale ma anche cultura, cioccolato e panorami mozzafiato.",
    highlights: ["26 attrazioni imperdibili", "Lago e Alpi come sfondo", "Cioccolato e formaggi artigianali"],
    topLandmarks: [
      { name: "Grossmünster",       pts: 500, emoji: "⛪" },
      { name: "Lago di Zurigo",     pts: 400, emoji: "🏞️" },
      { name: "Bahnhofstrasse",     pts: 350, emoji: "🛍️" },
    ],
    openDate: "Settembre 2026",
    bestFor: "Laghi & Panorami Alpini",
    countryEmoji: "🇨🇭",
  },
  "Monaco": {
    description: "Monaco di Baviera: birra, castelli e tradizione bavarese. Marienplatz, Englischer Garten e l'Oktoberfest più famoso del mondo.",
    highlights: ["34 luoghi da visitare", "Englischer Garten più grande di Central Park", "Birrerie storiche leggendarie"],
    topLandmarks: [
      { name: "Marienplatz",          pts: 600, emoji: "🏟️" },
      { name: "Englischer Garten",    pts: 400, emoji: "🌳" },
      { name: "Nymphenburg Palace",   pts: 550, emoji: "🏰" },
    ],
    openDate: "Ottobre 2026",
    bestFor: "Tradizione Bavarese & Birra",
    countryEmoji: "🇩🇪",
  },
  "Copenaghen": {
    description: "La capitale danese, modello di design scandinavo e qualità della vita. Tivoli, Sirenetta, Nyhavn colorato e cucina New Nordic stellata.",
    highlights: ["27 destinazioni uniche", "Tivoli: parco divertimenti più antico", "Capitale del New Nordic Food"],
    topLandmarks: [
      { name: "Giardini di Tivoli",   pts: 550, emoji: "🎡" },
      { name: "Nyhavn",               pts: 450, emoji: "🏘️" },
      { name: "La Sirenetta",         pts: 350, emoji: "🧜" },
    ],
    openDate: "Novembre 2026",
    bestFor: "Design & Gastronomia Nordica",
    countryEmoji: "🇩🇰",
  },
  "Stoccolma": {
    description: "La Venezia del Nord, costruita su 14 isole collegate da 57 ponti. Gamla Stan medievale, museo Vasa e panorami sull'arcipelago svedese.",
    highlights: ["30 attrazioni sulle isole", "Gamla Stan medievale intatta", "Museo Vasa unico al mondo"],
    topLandmarks: [
      { name: "Gamla Stan",       pts: 550, emoji: "🏘️" },
      { name: "Museo Vasa",       pts: 600, emoji: "🚢" },
      { name: "Palazzo Reale",    pts: 450, emoji: "🏰" },
    ],
    openDate: "Dicembre 2026",
    bestFor: "Isole & Storia Vichinga",
    countryEmoji: "🇸🇪",
  },
  "Cracovia": {
    description: "L'antica capitale polacca con un centro storico medievale perfettamente conservato. Piazza del Mercato, castello di Wawel e la storia toccante di Auschwitz.",
    highlights: ["32 siti storici", "Piazza del Mercato più grande d'Europa", "Miniere di sale di Wieliczka"],
    topLandmarks: [
      { name: "Castello di Wawel",     pts: 650, emoji: "🏰" },
      { name: "Piazza del Mercato",    pts: 500, emoji: "🏟️" },
      { name: "Miniera di Wieliczka",  pts: 550, emoji: "⛏️" },
    ],
    openDate: "Gennaio 2027",
    bestFor: "Storia Medievale & Cultura",
    countryEmoji: "🇵🇱",
  },
  "Napoli": {
    description: "La città più autentica d'Italia, caotica e affascinante. Vesuvio, Pompei, pizza originale e Spaccanapoli — energia pura e cuore grande.",
    highlights: ["25 tesori partenopei", "Pizza napoletana patrimonio UNESCO", "Pompei ed Ercolano a due passi"],
    topLandmarks: [
      { name: "Centro Storico",        pts: 500, emoji: "🏘️" },
      { name: "Pompei",               pts: 750, emoji: "🏛️" },
      { name: "Castel dell'Ovo",      pts: 400, emoji: "🏰" },
    ],
    openDate: "Febbraio 2027",
    bestFor: "Pizza & Archeologia",
    countryEmoji: "🇮🇹",
  },
  "Edimburgo": {
    description: "La capitale scozzese dal fascino gotico e misterioso. Castello arroccato sulla roccia vulcanica, Royal Mile e il festival più grande del mondo.",
    highlights: ["28 luoghi iconici", "Castello medievale spettacolare", "Edinburgh Festival di fama mondiale"],
    topLandmarks: [
      { name: "Edinburgh Castle",  pts: 700, emoji: "🏰" },
      { name: "Royal Mile",        pts: 450, emoji: "🛤️" },
      { name: "Arthur's Seat",     pts: 400, emoji: "⛰️" },
    ],
    openDate: "Marzo 2027",
    bestFor: "Castelli & Festival",
    countryEmoji: "🇬🇧",
  },
  "Santorini": {
    description: "L'isola greca da cartolina con le case bianche e blu a picco sulla caldera. Tramonti leggendari di Oia, spiagge vulcaniche e cucina mediterranea.",
    highlights: ["18 meraviglie dell'isola", "Tramonto di Oia tra i più belli al mondo", "Spiagge di sabbia nera e rossa"],
    topLandmarks: [
      { name: "Oia",              pts: 600, emoji: "🌅" },
      { name: "Fira",             pts: 450, emoji: "🏘️" },
      { name: "Spiaggia Rossa",   pts: 400, emoji: "🏖️" },
    ],
    openDate: "Aprile 2027",
    bestFor: "Tramonti & Isole Greche",
    countryEmoji: "🇬🇷",
  },
};

// ── City Explorer types ──────────────────────────────────────────────────────

interface CitySearchResult {
  city: string;
  country: string;
  countryEmoji: string;
  description: string;
  restaurants: Array<{ name: string; cuisine: string; rating: string; priceRange: string; tripadvisorRank: number }>;
  typicalDish: { name: string; description: string; emoji: string };
  monuments: Array<{ name: string; description: string; emoji: string; mustSee: boolean }>;
  nightlife: Array<{ name: string; type: string; description: string; vibe: string }>;
}

// ── City Explorer component ──────────────────────────────────────────────────

function CityExplorer() {
  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<CitySearchResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [open, setOpen]         = useState(false);
  const inputRef                = useRef<HTMLInputElement>(null);

  const search = useCallback(async (cityName: string) => {
    const trimmed = cityName.trim();
    if (trimmed.length < 2) return;

    // Check local DB first
    const localKey = Object.keys(CITY_DETAILS).find(
      (k) => k.toLowerCase() === trimmed.toLowerCase(),
    );
    if (localKey) {
      const city = CITIES.find((c) => c.name === localKey);
      const details = CITY_DETAILS[localKey];
      if (city && details) {
        const localResult: CitySearchResult = {
          city: localKey,
          country: city.country,
          countryEmoji: details.countryEmoji,
          description: details.description,
          restaurants: [
            { name: "Ristorante #1", cuisine: "Cucina locale", rating: "4.8", priceRange: "€€€", tripadvisorRank: 1 },
            { name: "Ristorante #2", cuisine: "Cucina tipica", rating: "4.6", priceRange: "€€",  tripadvisorRank: 2 },
            { name: "Ristorante #3", cuisine: "Cucina moderna", rating: "4.5", priceRange: "€€€", tripadvisorRank: 3 },
          ],
          typicalDish: { name: details.bestFor, description: details.highlights[0] ?? "", emoji: "🍽️" },
          monuments: details.topLandmarks.map((lm) => ({
            name: lm.name,
            description: `Uno dei luoghi più visitati di ${localKey}.`,
            emoji: lm.emoji,
            mustSee: true,
          })),
          nightlife: [
            { name: "Bar centro storico", type: "Bar", description: `Atmosfera autentica nel cuore di ${localKey}.`, vibe: "Relax e cocktail" },
            { name: "Club principale", type: "Club", description: "La discoteca più popolare della città.", vibe: "Energia & musica" },
          ],
        };
        setResult(localResult);
        setOpen(true);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/city-search?city=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Errore nella ricerca");
      }
      const data: CitySearchResult = await res.json();
      setResult(data);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const NIGHTLIFE_ICONS: Record<string, string> = {
    Club: "🎧",
    Bar: "🍹",
    Lounge: "✨",
    Rooftop: "🌃",
  };

  return (
    <>
      {/* Search Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.82 }}
        className="mx-4 mb-8 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/8 to-indigo-500/5 p-5"
        style={{ boxShadow: "0 8px 32px rgba(59,130,246,0.10)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15">
            <Search size={16} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white">Esplora una città</p>
            <p className="text-[10px] text-white/40">Ristoranti, monumenti, nightlife e molto altro</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Es. "Malaga", "Tokyo", "Napoli"…'
              className="w-full rounded-xl bg-white/6 border border-white/10 pl-9 pr-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/50 min-h-[44px]"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-3 text-[13px] font-black text-white disabled:opacity-40 min-h-[44px] min-w-[80px] justify-center"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : "Cerca"}
          </motion.button>
        </form>

        {error && (
          <p className="mt-2 text-[11px] text-red-400">{error}</p>
        )}

        <p className="mt-3 text-[10px] text-white/25">
          Powered by <span className="text-blue-400/70">Claude AI</span> — cerca qualsiasi città del mondo
        </p>
      </motion.div>

      {/* Result Bottom Sheet */}
      <AnimatePresence>
        {open && result && (
          <>
            <motion.div
              key="city-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="city-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "110%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="fixed bottom-0 left-0 right-0 z-[70] max-h-[92svh] rounded-t-[28px] bg-slate-900 border-t border-white/12 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                <div className="h-1 w-10 rounded-full bg-white/25" />
              </div>

              {/* Header */}
              <div className="px-5 pb-4 flex items-start justify-between gap-3 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{result.countryEmoji}</span>
                    <h2 className="text-2xl font-black text-white">{result.city}</h2>
                  </div>
                  <p className="text-xs text-white/45 mt-0.5">{result.country}</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/50 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Scrollable content */}
              <div
                className="overflow-y-auto overscroll-contain flex-1 px-5 pb-8 space-y-6"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {/* Description */}
                <p className="text-sm text-white/65 leading-relaxed">{result.description}</p>

                {/* Top Restaurants */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <UtensilsCrossed size={14} className="text-orange-400" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Top 3 Ristoranti — TripAdvisor
                    </p>
                  </div>
                  <div className="space-y-2">
                    {result.restaurants.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/8 px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 flex-shrink-0">
                          <span className="text-sm font-black text-orange-400">#{r.tripadvisorRank}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{r.name}</p>
                          <p className="text-[11px] text-white/40">{r.cuisine}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 justify-end">
                            <Star size={10} className="text-[#FFD700]" fill="currentColor" />
                            <span className="text-[12px] font-black text-[#FFD700]">{r.rating}</span>
                          </div>
                          <span className="text-[10px] text-white/35">{r.priceRange}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typical Dish */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ChefHat size={14} className="text-amber-400" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Piatto tipico
                    </p>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-4">
                    <span className="text-3xl">{result.typicalDish.emoji}</span>
                    <div>
                      <p className="text-base font-black text-white">{result.typicalDish.name}</p>
                      <p className="text-[12px] text-white/50 mt-0.5 leading-snug">{result.typicalDish.description}</p>
                    </div>
                  </div>
                </div>

                {/* Monuments */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Landmark size={14} className="text-blue-400" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Monumenti da visitare
                    </p>
                  </div>
                  <div className="space-y-2">
                    {result.monuments.map((m, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/8 px-4 py-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">{m.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">{m.name}</p>
                            {m.mustSee && (
                              <span className="rounded-full bg-[#FFD700]/15 border border-[#FFD700]/25 px-1.5 py-0.5 text-[9px] font-black text-[#FFD700]">
                                DA VEDERE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/45 mt-0.5 leading-snug">{m.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nightlife */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Moon size={14} className="text-purple-400" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Nightlife — Locali & Discoteche
                    </p>
                  </div>
                  <div className="space-y-2">
                    {result.nightlife.map((n, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl bg-purple-500/[0.05] border border-purple-500/15 px-4 py-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">
                          {NIGHTLIFE_ICONS[n.type] ?? "🎉"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">{n.name}</p>
                            <span className="rounded-full bg-purple-500/20 border border-purple-500/25 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
                              {n.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/45 mt-0.5 leading-snug">{n.description}</p>
                          <p className="text-[10px] text-purple-300/50 mt-1 italic">{n.vibe}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Testimonials ────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: "Marco B.",
    city: "Roma",
    avatar: "MB",
    color: "bg-blue-500/20 text-blue-300",
    stars: 5,
    text: "In 2 settimane ho guadagnato €47 esplorando la città. Incredibile fare turismo e guadagnare allo stesso tempo!",
  },
  {
    name: "Sofia A.",
    city: "Barcellona",
    avatar: "SA",
    color: "bg-purple-500/20 text-purple-300",
    stars: 5,
    text: "L'ho installata come PWA e si apre istantaneamente. Design bellissimo, funziona perfettamente offline.",
  },
  {
    name: "Luca M.",
    city: "Parigi",
    avatar: "LM",
    color: "bg-amber-500/20 text-amber-300",
    stars: 5,
    text: "Top 5 finisher per 3 mesi consecutivi. La community è fantastica e i pagamenti arrivano puntuali.",
  },
];

// ── GPS rules ───────────────────────────────────────────────────────────────

const GPS_RULES = [
  {
    icon: MapPin,
    color: "text-blue-400",
    bg: "bg-blue-500/12 border-blue-500/20",
    title: "Raggio di verifica: 50 m",
    desc: "Devi trovarti fisicamente entro 50 metri dal monumento per registrare il check-in.",
  },
  {
    icon: CalendarDays,
    color: "text-purple-400",
    bg: "bg-purple-500/12 border-purple-500/20",
    title: "Un check-in al giorno",
    desc: "Puoi guadagnare punti dallo stesso monumento al massimo una volta ogni 24 ore.",
  },
  {
    icon: Smartphone,
    color: "text-amber-400",
    bg: "bg-amber-500/12 border-amber-500/20",
    title: "GPS obbligatorio",
    desc: "L'app richiede l'accesso alla posizione GPS del dispositivo per verificare la tua presenza.",
  },
  {
    icon: Shield,
    color: "text-green-400",
    bg: "bg-green-500/12 border-green-500/20",
    title: "Anti-truffa",
    desc: "Il sistema verifica in tempo reale coordinate, timestamp e IP per garantire la correttezza del gioco.",
  },
];

// ── Payout schedule ─────────────────────────────────────────────────────────

const PAYOUT_STEPS = [
  { label: "Fine mese", desc: "Il contest si chiude l'ultimo giorno del mese alle 23:59 (ora locale)." },
  { label: "Calcolo vincitori", desc: "Nei primi 3 giorni del mese vengono calcolate le classifiche finali." },
  { label: "Notifica", desc: "I vincitori ricevono un'email con il riepilogo del premio." },
  { label: "Pagamento", desc: "Il bonifico Stripe/PayPal viene eseguito entro 7 giorni lavorativi." },
];

// ── City card ───────────────────────────────────────────────────────────────

function CityCard({
  city,
  index,
  onSelect,
}: {
  city: typeof CITIES[number];
  index: number;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.9 + index * 0.07 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className="relative flex-shrink-0 w-44 snap-start rounded-2xl overflow-hidden h-60 border border-white/10 cursor-pointer select-none"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <Image
        src={city.img}
        alt={city.name}
        fill
        className="object-cover transition-transform duration-300 hover:scale-105"
        sizes="176px"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      {/* Hover shimmer */}
      <div className="absolute inset-0 bg-white/0 hover:bg-white/5 transition-colors duration-200 rounded-2xl" />

      {/* Live / soon badge */}
      <div className="absolute top-2.5 right-2.5">
        {city.active ? (
          <span className="flex items-center gap-1 rounded-full bg-green-500/20 border border-green-500/40 px-2 py-0.5 text-[9px] font-black text-green-400 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            LIVE
          </span>
        ) : (
          <span className="rounded-full bg-white/10 border border-white/15 px-2 py-0.5 text-[9px] font-bold text-white/50 backdrop-blur-sm">
            Presto
          </span>
        )}
      </div>

      {/* Info chip bottom-left */}
      <div className="absolute top-2.5 left-2.5">
        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-black/40 border border-white/20 backdrop-blur-sm">
          <Info size={11} className="text-white/60" />
        </span>
      </div>

      {/* City info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-0.5">{city.country}</p>
        <p className="font-black text-white text-sm leading-tight">{city.name}</p>
        <p className="text-[11px] text-white/55 mt-0.5">{city.landmarks} monumenti</p>
      </div>
    </motion.div>
  );
}

// ── City detail modal ─────────────────────────────────────────────────────────

function CityDetailModal({
  city,
  onClose,
  user,
  onAuthOpen,
}: {
  city: typeof CITIES[number] | null;
  onClose: () => void;
  user: unknown;
  onAuthOpen: () => void;
}) {
  const details = city ? CITY_DETAILS[city.name] : null;

  return (
    <BottomSheet open={!!city} onClose={onClose} snapTo="full">
      {city && details && (
        <div className="pb-10">
          {/* Hero image */}
          <div className="relative h-52 w-full overflow-hidden rounded-t-none">
            <Image src={city.img} alt={city.name} fill className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Status badge */}
            <div className="absolute top-4 right-4">
              {city.active ? (
                <span className="flex items-center gap-1.5 rounded-full bg-green-500/80 border border-green-400/50 px-3 py-1 text-[11px] font-black text-white backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  LIVE ORA
                </span>
              ) : (
                <span className="rounded-full bg-black/50 border border-white/25 px-3 py-1 text-[11px] font-bold text-white/80 backdrop-blur-sm">
                  🗓 {details.openDate ?? "Prossimamente"}
                </span>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 border border-white/20 backdrop-blur-sm"
            >
              <X size={14} className="text-white/80" />
            </button>

            {/* City name overlay */}
            <div className="absolute bottom-4 left-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5">
                {details.countryEmoji} {city.country}
              </p>
              <h2 className="text-3xl font-black text-white">{city.name}</h2>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pt-5 space-y-5">
            {/* Description */}
            <p className="text-sm text-white/70 leading-relaxed">{details.description}</p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/[0.05] border border-white/10 p-3 text-center">
                <p className="text-xl font-black text-[#FFD700]">{city.landmarks}</p>
                <p className="text-[10px] text-white/40 mt-0.5">Monumenti</p>
              </div>
              <div className="rounded-xl bg-white/[0.05] border border-white/10 p-3 text-center">
                <p className="text-xl font-black text-[#FFD700]">
                  {details.topLandmarks.reduce((a, l) => a + l.pts, 0)}+
                </p>
                <p className="text-[10px] text-white/40 mt-0.5">Punti top 3</p>
              </div>
              <div className="rounded-xl bg-white/[0.05] border border-white/10 p-3 text-center">
                <p className="text-xl font-black text-white/60">{city.active ? "🟢" : "🔜"}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{city.active ? "Disponibile" : "In arrivo"}</p>
              </div>
            </div>

            {/* Highlights */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2">Highlights</p>
              <div className="space-y-2">
                {details.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-[#FFD700] flex-shrink-0" />
                    <p className="text-sm text-white/65">{h}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Landmarks */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2">Top Monumenti</p>
              <div className="grid grid-cols-3 gap-2">
                {details.topLandmarks.map((lm) => (
                  <div key={lm.name} className="rounded-xl bg-white/[0.05] border border-white/8 p-3 text-center">
                    <p className="text-2xl mb-1">{lm.emoji}</p>
                    <p className="text-[10px] font-bold text-white/70 leading-tight line-clamp-2">{lm.name}</p>
                    <p className="text-[11px] font-black text-[#FFD700] mt-1">+{lm.pts}pt</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Best For tag */}
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/8 px-4 py-3">
              <Sparkles size={14} className="text-[#FFD700]" />
              <p className="text-xs text-white/60">
                <span className="font-bold text-white/80">Ideale per:</span> {details.bestFor}
              </p>
            </div>

            {/* CTA */}
            {city.active ? (
              user ? (
                <Link
                  href="/scan"
                  onClick={onClose}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD700] py-4 text-sm font-black text-slate-900 shadow-[0_4px_24px_rgba(255,215,0,0.32)]"
                >
                  <Navigation2 size={16} />
                  Inizia a Esplorare {city.name}
                </Link>
              ) : (
                <button
                  onClick={() => { onClose(); onAuthOpen(); }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD700] py-4 text-sm font-black text-slate-900 shadow-[0_4px_24px_rgba(255,215,0,0.32)]"
                >
                  <Compass size={16} />
                  Registrati e Inizia a Esplorare
                </button>
              )
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
                <p className="text-xs text-white/40 mb-1">Disponibile a partire da</p>
                <p className="text-2xl font-black text-[#FFD700]">{details.openDate ?? "Prossimamente"}</p>
                <p className="text-xs text-white/30 mt-2">Segui WanderQuest per essere tra i primi esploratori</p>
              </div>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

// ── Floating landmark pill ───────────────────────────────────────────────────

function FloatingPill({ name, pts, delay, style }: {
  name: string; pts: number; delay: number; style: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1, y: [0, -7, 0] }}
      transition={{
        opacity: { delay, duration: 0.4 },
        scale:   { delay, duration: 0.4 },
        y:       { delay: delay + 0.5, duration: 3.8, repeat: Infinity, ease: "easeInOut" },
      }}
      className="absolute flex items-center gap-1.5 rounded-full bg-slate-900/80 border border-white/15 px-3 py-1.5 backdrop-blur-md shadow-lg pointer-events-none"
      style={style}
    >
      <MapPin size={10} className="text-[#FFD700]" />
      <span className="text-[11px] font-bold text-white">{name}</span>
      <span className="text-[10px] font-black text-[#FFD700]">+{pts}pt</span>
    </motion.div>
  );
}

// ── Animated prize counter ───────────────────────────────────────────────────

function AnimatedPrize({ targetCents }: { targetCents: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 1600;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * targetCents));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetCents]);

  const euros = (displayed / 100).toFixed(2);
  return (
    <span className="text-3xl font-black text-[#FFD700] tabular-nums">
      €{euros}
    </span>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user, loading } = useAuth();
  const { contest }       = useContest();
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<typeof CITIES[number] | null>(null);
  /* iOS Safari "Add to Home Screen" hint — shown once per session */
  const [showInstallHint, setShowInstallHint] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as { standalone?: boolean }).standalone === true;
    const dismissed = sessionStorage.getItem("wq_install_dismissed");
    if (isIOS && !isStandalone && !dismissed) setShowInstallHint(true);
  }, []);

  const dismissInstall = () => {
    sessionStorage.setItem("wq_install_dismissed", "1");
    setShowInstallHint(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617]">
        <Loader2 size={32} className="animate-spin text-[#FFD700]/50" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden pb-28">

        {/* ── iOS "Add to Home Screen" hint ──────────────────────── */}
        {showInstallHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-[env(safe-area-inset-top,0px)] left-0 right-0 z-50 mx-3 mt-2"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-[#FFD700]/30 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFD700]/15">
                <Download size={16} className="text-[#FFD700]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-black text-white">Installa WanderQuest</p>
                <p className="text-[10px] text-white/50 leading-tight mt-0.5">
                  Tocca <span className="text-white/80">Condividi →</span> poi <span className="text-white/80">&ldquo;Aggiungi a Home&rdquo;</span> per l'esperienza completa.
                </p>
              </div>
              <button
                onClick={dismissInstall}
                className="text-white/30 hover:text-white/60 text-lg leading-none flex-shrink-0 px-1"
                aria-label="Chiudi"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {/* ── HERO — Barcelona full-bleed ──────────────────────────── */}
        <section className="relative min-h-[92svh] flex flex-col justify-end overflow-hidden">
          <div className="absolute inset-0">
            {/* Barcelona skyline — Sagrada Família at dusk */}
            <Image
              src="https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&q=85"
              alt="Barcellona — Sagrada Família al tramonto"
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
            {/* Multi-layer gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/65 to-[#020617]/5" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/55 via-transparent to-transparent" />
            {/* Subtle gold glow at horizon */}
            <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-[#FFD700]/7 to-transparent" />
          </div>

          {/* Floating landmark pills — clear of status bar */}
          <FloatingPill name="Sagrada Família" pts={750} delay={0.9} style={{ left: "7%",  top: "22%" }} />
          <FloatingPill name="Park Güell"      pts={500} delay={1.3} style={{ left: "50%", top: "16%" }} />
          <FloatingPill name="Casa Batlló"     pts={620} delay={1.7} style={{ left: "12%", top: "42%" }} />

          {/* Copy */}
          <div className="relative z-10 px-5 pb-10">
            {/* Tagline chip */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/8 border border-white/15 px-3 py-1 mb-4 backdrop-blur-sm"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                Viaggia come un locale
              </span>
            </motion.div>

            {contest && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#FFD700]/12 border border-[#FFD700]/30 px-4 py-1.5 mb-5"
              >
                <Sparkles size={12} className="text-[#FFD700]" />
                <span className="text-xs font-black text-[#FFD700]">
                  {formatCents(contest.prizePool)} in palio — Contest attivo
                </span>
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.55 }}
              className="font-serif text-[2.9rem] leading-[1.04] font-black mb-4"
            >
              Ogni Angolo<br />Nasconde
              <br />
              <span style={{
                background: "linear-gradient(135deg,#FFD700 0%,#FFA500 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                il Tuo Premio
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-base text-white/60 leading-relaxed mb-7 max-w-xs"
            >
              Visita monumenti reali, scala la classifica e incassa premi in euro veri.
              La tua prossima avventura parte adesso.
            </motion.p>

            {user ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 24 }}
              >
                <Link
                  href="/scan"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD700] py-4 text-[15px] font-black text-slate-900 shadow-[0_6px_32px_rgba(255,215,0,0.40)] hover:bg-yellow-300 transition-colors min-h-[52px]"
                >
                  <Trophy size={18} />
                  Vai al Contest
                  <ChevronRight size={16} />
                </Link>
              </motion.div>
            ) : (
              <>
                <motion.button
                  initial={{ opacity: 0, scale: 0.93 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 24 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setAuthOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD700] py-4 text-[15px] font-black text-slate-900 shadow-[0_6px_32px_rgba(255,215,0,0.40)] hover:bg-yellow-300 transition-colors min-h-[52px]"
                >
                  <Compass size={18} />
                  Inizia l&apos;avventura
                  <ChevronRight size={16} />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => setAuthOpen(true)}
                  className="w-full text-center mt-3 text-xs text-white/38 py-2 hover:text-white/60 transition-colors"
                >
                  Hai già un account? <span className="underline underline-offset-2">Accedi</span>
                </motion.button>
              </>
            )}
          </div>
        </section>

        {/* ── ANIMATED PRIZE COUNTER BANNER ──────────────────────── */}
        {contest && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="mx-4 mb-8 rounded-2xl border border-[#FFD700]/22 bg-gradient-to-r from-[#FFD700]/12 to-[#FFD700]/4 p-5 flex items-center gap-4"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFD700]/15">
              <Star size={22} className="text-[#FFD700]" fill="currentColor" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#FFD700]/60">
                Montepremi attuale — {contest.title}
              </p>
              <AnimatedPrize targetCents={contest.prizePool} />
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-white/35">Contest</p>
              <p className="text-xs font-bold text-white/65">attivo ora</p>
            </div>
          </motion.section>
        )}

        {/* ── CITY EXPLORER ──────────────────────────────────────── */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62 }}
            className="px-4 mb-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">Scopri il Mondo</p>
            <h2 className="text-2xl font-black">Cerca una città</h2>
          </motion.div>
          <CityExplorer />
        </section>

        {/* ── SAFETY HUB ─────────────────────────────────────────── */}
        <section className="px-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.68 }}
          >
            <SafetyHub />
          </motion.div>
        </section>

        {/* ── FEATURED CITIES — horizontal scroll ─────────────────── */}
        <section className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="px-4 mb-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">Destinazioni</p>
            <h2 className="text-2xl font-black">Esplora l&apos;Europa</h2>
          </motion.div>

          <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {CITIES.map((city, i) => (
              <CityCard key={city.name} city={city} index={i} onSelect={() => setSelectedCity(city)} />
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS — BENTO GRID ─────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-5"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">Come funziona</p>
            <h2 className="text-2xl font-black">4 passi per vincere</h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {steps.map(({ step, icon: Icon, title, desc, gradient, border, iconBg, iconColor, glow }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.09, type: "spring", stiffness: 280, damping: 24 }}
                className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradient} ${border} p-4`}
                style={{ boxShadow: `0 8px 32px ${glow}` }}
              >
                <span className="absolute right-3 top-1 text-[3.2rem] font-black leading-none text-white/4 select-none pointer-events-none">
                  {step}
                </span>
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                  <Icon size={20} className={iconColor} />
                </div>
                <h3 className="font-black text-[14px] text-white leading-tight mb-1">{title}</h3>
                <p className="text-[11px] text-white/48 leading-snug">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── AI WEATHERQUEST CARD ───────────────────────────────── */}
        <section className="px-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.78 }}
          >
            <WeatherQuest />
          </motion.div>
        </section>

        {/* ── STATS ROW ──────────────────────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 grid grid-cols-3 divide-x divide-white/8 backdrop-blur-sm"
          >
            {[
              { value: "500+", label: "Monumenti" },
              { value: "€10k+", label: "Distribuiti" },
              { value: "12+", label: "Città" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center px-2">
                <p className="text-xl font-black text-[#FFD700]">{value}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── TESTIMONIALS ───────────────────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mb-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">Community</p>
            <h2 className="text-2xl font-black">Chi ha già vinto</h2>
          </motion.div>

          <div className="space-y-3">
            {TESTIMONIALS.map(({ name, city, avatar, color, stars, text }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.92 + i * 0.08 }}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm overflow-hidden"
              >
                {/* Subtle quote mark */}
                <Quote size={40} className="absolute -right-1 -top-1 text-white/4 rotate-180" />

                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-black ${color}`}>
                    {avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-black text-white">{name}</p>
                        <p className="text-[10px] text-white/40 flex items-center gap-1">
                          <MapPin size={8} />
                          {city}
                        </p>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: stars }).map((_, s) => (
                          <Star key={s} size={10} className="text-[#FFD700]" fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[12px] text-white/60 leading-relaxed">{text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── PREMIUM PLAN ───────────────────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 }}
            className="mb-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">Piano Premium</p>
            <h2 className="text-2xl font-black">WanderQuest Pro</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <GoPro />
          </motion.div>
        </section>

        {/* ── GPS VERIFICATION RULES ─────────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mb-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">Regole del gioco</p>
            <h2 className="text-2xl font-black">Come funziona la verifica GPS</h2>
          </motion.div>

          <div className="space-y-3">
            {GPS_RULES.map(({ icon: Icon, color, bg, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 + i * 0.07 }}
                className={`flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-sm ${bg}`}
              >
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-black/20 ${color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="text-[11px] text-white/50 mt-0.5 leading-snug">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── MONTHLY PAYOUT SCHEDULE ───────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05 }}
            className="mb-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">Pagamenti</p>
            <h2 className="text-2xl font-black">Calendario premi mensile</h2>
          </motion.div>

          <div className="relative pl-4">
            <div className="absolute left-[1.35rem] top-2 bottom-2 w-px bg-gradient-to-b from-[#FFD700]/40 via-[#FFD700]/20 to-transparent" />
            <div className="space-y-4">
              {PAYOUT_STEPS.map(({ label, desc }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.05 + i * 0.08 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 z-10">
                    <CheckCircle2 size={13} className="text-[#FFD700]" />
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-black text-white">{label}</p>
                    <p className="text-[11px] text-white/45 leading-snug mt-0.5">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CURRENCY CONVERTER ────────────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mb-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">Strumenti per il viaggiatore</p>
            <h2 className="text-2xl font-black">Convertitore valute live</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.15 }}
          >
            <CurrencyConverter />
          </motion.div>
        </section>

        {/* ── FINAL CTA ──────────────────────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="relative overflow-hidden rounded-3xl border border-[#FFD700]/22 p-6"
            style={{
              background: "linear-gradient(135deg,#1a1200 0%,#0d1a30 100%)",
              boxShadow: "0 12px 48px rgba(255,215,0,0.10)",
            }}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#FFD700]/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-blue-500/8 blur-2xl" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#FFD700]/50 mb-2">Pronto?</p>
            <h3 className="text-[1.6rem] font-black mb-2 leading-tight">
              La prossima avventura<br />è a un passo.
            </h3>
            <p className="text-sm text-white/48 mb-5 leading-relaxed">
              Registrati gratis in 30 secondi e inizia a guadagnare punti reali esplorando la tua città.
            </p>
            {user ? (
              <Link
                href="/scan"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD700] py-4 text-sm font-black text-slate-900 shadow-[0_4px_24px_rgba(255,215,0,0.32)] hover:bg-yellow-300 transition-colors min-h-[48px]"
              >
                <Trophy size={16} />
                Vai al Contest
              </Link>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD700] py-4 text-sm font-black text-slate-900 shadow-[0_4px_24px_rgba(255,215,0,0.32)] hover:bg-yellow-300 transition-colors min-h-[48px]"
              >
                <Compass size={16} />
                Crea account gratis
              </button>
            )}
          </motion.div>
        </section>

        {/* ── LEGAL FOOTER ───────────────────────────────────────── */}
        <footer className="px-4 pb-4">
          <div className="rounded-2xl bg-white/[0.025] border border-white/6 p-4 space-y-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Info size={13} className="text-white/30 flex-shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                Note legali — Diritto spagnolo
              </p>
            </div>

            <div className="flex items-start gap-2">
              <AlertTriangle size={12} className="text-amber-400/60 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-white/35 leading-relaxed">
                <span className="text-white/55 font-bold">Premi e tassazione:</span> In conformità alla normativa
                fiscale spagnola (Ley IRPF), i premi in denaro di importo superiore a <strong className="text-white/55">€300</strong> sono
                soggetti a ritenuta alla fonte del 19% e devono essere dichiarati nella dichiarazione
                dei redditi annuale. WanderQuest emette certificazione fiscale per premi ≥ €300.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Euro size={12} className="text-green-400/60 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-white/35 leading-relaxed">
                <span className="text-white/55 font-bold">Prelievo minimo:</span> Il prelievo minimo è di <strong className="text-white/55">€5,00</strong>.
                I pagamenti vengono elaborati tramite Stripe Connect o PayPal entro 7 giorni lavorativi
                dalla richiesta, nei limiti della normativa sui servizi di pagamento (PSD2).
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Shield size={12} className="text-blue-400/60 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-white/35 leading-relaxed">
                <span className="text-white/55 font-bold">Concorso a premi:</span> WanderQuest opera ai sensi
                della normativa spagnola sui concorsi a premi (Real Decreto 1463/1997). La
                partecipazione è gratuita. Il montepremi è finanziato dai ricavi della piattaforma,
                non dai partecipanti. Vietata la partecipazione ai minori di 18 anni.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Download size={12} className="text-purple-400/60 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-white/35 leading-relaxed">
                <span className="text-white/55 font-bold">Basi del concorso:</span> Le basi complete del
                concorso sono depositate ante notario e disponibili su richiesta a{" "}
                <span className="text-white/55">legal@wanderquest.app</span>, in conformità all&apos;art.&nbsp;8
                del Real Decreto 1463/1997 e alla Ley 13/2011 di regolamentazione del gioco.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Sparkles size={12} className="text-orange-400/60 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-white/35 leading-relaxed">
                <span className="text-white/55 font-bold">Link affiliati:</span> Alcune offerte di esperienze
                e hotel presenti nell&apos;app sono link di affiliazione verso GetYourGuide e Booking.com.
                WanderQuest può ricevere una commissione a fronte di prenotazioni effettuate tramite tali
                link, senza costi aggiuntivi per l&apos;utente. Conforme alla Direttiva UE 2019/2161 (Omnibus).
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Star size={12} className="text-white/20 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-white/35 leading-relaxed">
                <span className="text-white/55 font-bold">RGPD / Datos personales:</span> I dati di
                geolocalizzazione sono trattati esclusivamente per validare le visite ai monumenti e non
                vengono ceduti a terzi. Responsabile del trattamento: WanderQuest S.L., CIF ficticio,
                Barcelona. Diritti di accesso, rettifica, cancellazione e opposizione:
                <span className="text-white/55"> privacy@wanderquest.app</span>. Conforme al RGPD (UE) 2016/679.
              </p>
            </div>

            <div className="pt-2 border-t border-white/6 flex items-center justify-between">
              <p className="text-[9px] text-white/20">
                © {new Date().getFullYear()} WanderQuest S.L. · Barcelona, España
              </p>
              <p className="text-[9px] text-white/20">v1.0</p>
            </div>
          </div>
        </footer>

      </div>

      <CityDetailModal
        city={selectedCity}
        onClose={() => setSelectedCity(null)}
        user={user}
        onAuthOpen={() => setAuthOpen(true)}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
