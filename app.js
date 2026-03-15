// WanderQuest v3.0 — App Logic

// ═══════════════════════════════════════════════════════════════════════
// FIREBASE — SDK MODULARE v10
// ═══════════════════════════════════════════════════════════════════════
import { initializeApp }                                    from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword,
         signInWithEmailAndPassword, signOut,
         onAuthStateChanged }                               from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, collection, getDocs, getDoc,
         doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey:            "AIzaSyCX-TpXeBbJ2zo4iaxQWlLrmncI0_Bn0_8",
  authDomain:        "wanderquest-aac22.firebaseapp.com",
  projectId:         "wanderquest-aac22",
  storageBucket:     "wanderquest-aac22.firebasestorage.app",
  messagingSenderId: "811873678158",
  appId:             "1:811873678158:web:9c816974e5b00ebb13a41f"
};

const firebaseApp  = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const firestoreDb  = getFirestore(firebaseApp);

// ═══════════════════════════════════════════════════════════════════════
// CLAUDE HAIKU — Proxy Cloudflare Worker (nessuna API key nel frontend)
// ═══════════════════════════════════════════════════════════════════════
const CLAUDE_MODEL    = 'claude-haiku-4-5-20251001';
const CLAUDE_ENDPOINT = 'https://claude-proxy.conti9708.workers.dev';
// ═══════════════════════════════════════════════════════════════════════
// DATABASE GERARCHICO COMPLETO
// ═══════════════════════════════════════════════════════════════════════
const DB = {
  continents: {
    EU: {
      name: "Europa", emoji: "🌍", countryCount: 45,
      countries: {
        IT: {
          name: "Italia", emoji: "🇮🇹",
          cities: {
            ROM: {
              name: "Roma", emoji: "🏛️",
              bg: "linear-gradient(135deg,#8B0000,#C0392B)",
              hidden_gems: [
                { name: "Quartiere Pigneto", desc: "Il Brooklyn romano: street art autentica, cocktail bar alternativi e locali frequentati solo dai romani. Zero turisti." },
                { name: "Centrale Montemartini", desc: "Museo unico al mondo: sculture greche e romane collocate tra enormi macchinari industriali a vapore degli anni '30." },
                { name: "Giardino degli Aranci", desc: "Terrazza sull'Aventino con la migliore vista segreta su Roma. La mattina è quasi deserta. Tramonto mozzafiato." }
              ],
              food: {
                dishes: ["Cacio e Pepe", "Supplì al Telefono", "Gricia", "Maritozzo con la panna"],
                spots: ["Osteria da Fortunata — pasta fatta a mano davanti ai tuoi occhi", "Forno Campo de' Fiori — pizza bianca ancora calda"]
              },
              cultural_pill: "A Roma non si cammina veloci. Il 'dolce far niente' è filosofia: siediti al bar, ordina un espresso, osserva il mondo passare.",
              weather: { estate: "☀️ 30-35°C", inverno: "🌧️ 8-12°C", primavera: "⛅ 18-22°C", autunno: "🍂 15-20°C" },
              weather_tags: ["hot_summer", "mild_spring", "mild_autumn", "cool_winter"],
              affiliates_amazon: [
                { item: "Scarpe comode da walking", why: "Roma ha sampietrini ovunque: non venire con tacchi o sneaker piatte", asin: "B07XQM3VFF" },
                { item: "Borsa antitaccheggio", why: "Zona Colosseo e Trevi: turisti = target facile", asin: "B09GHJK123" }
              ],
              affiliates_booking: [
                { name: "Hotel zone Trastevere", why: "Posizione autentica, niente turisti, tutto raggiungibile a piedi" },
                { name: "B&B Pigneto", why: "Il quartiere cool di Roma, a 10min dal centro in metro" }
              ]
            },
            FLR: {
              name: "Firenze", emoji: "🌸",
              bg: "linear-gradient(135deg,#8B4513,#D4A017)",
              hidden_gems: [
                { name: "Piazzale Michelangelo at Sunrise", desc: "Tutti ci vanno al tramonto. All'alba alle 6:00 sei solo tu, la nebbia sul Duomo e un caffè termos." },
                { name: "Oltrarno — Via de' Bardi", desc: "La Firenze vera: artigiani del cuoio, botteghe di restauro, nessun ristorante con foto plastificate." },
                { name: "Museo Bardini", desc: "Il museo meno visitato di Firenze. 3 euro, zero file, collezione privata stupefacente." }
              ],
              food: {
                dishes: ["Lampredotto (quinto quarto)", "Ribollita", "Bistecca Fiorentina", "Schiacciata all'uva"],
                spots: ["Lampredotto da Nerbone — Mercato Centrale, 5€, l'originale", "Il Latini — trattoria storica, si mangia tutti insieme"]
              },
              cultural_pill: "I fiorentini sono orgogliosi e diretti. Non fare i turisti: entra in una bottega, chiedi, ascolta. Saranno ospitali.",
              weather: { estate: "☀️ 32-37°C", inverno: "🌧️ 6-10°C", primavera: "⛅ 16-21°C", autunno: "🍂 14-19°C" },
              weather_tags: ["very_hot_summer", "mild_spring", "mild_autumn", "cool_winter"],
              affiliates_amazon: [
                { item: "Zaino day-pack 20L", why: "Musei su musei: servono mani libere e zaino controllato ai metal detector", asin: "B08XYZ1234" },
                { item: "Guida Firenze offline", why: "Wi-Fi nei musei è lento. La guida cartacea non muore mai", asin: "B07ABC5678" }
              ],
              affiliates_booking: [
                { name: "Hotel Oltrarno", why: "Lontano dalle masse, autenticamente fiorentino" },
                { name: "Appartamento San Niccolò", why: "Zona residenziale, mercato quotidiano, vero sapore locale" }
              ]
            },
            VCE: {
              name: "Venezia", emoji: "🚤",
              bg: "linear-gradient(135deg,#1a3a5c,#0e6e8c)",
              hidden_gems: [
                { name: "Cannaregio — Fondamenta della Misericordia", desc: "Bacari (bar veneziani) locali dove i veneziani bevono l'ombra (bicchiere di vino) alle 18. Zero inglese." },
                { name: "Isola di Torcello", desc: "L'isola più antica della laguna, 20 minuti di vaporetto. 50 abitanti, un'osteria, silenzio assoluto." },
                { name: "Scuola Grande di San Rocco", desc: "Il Tintoretto più spettacolare del mondo, meno noto degli Uffizi. Sala superiore da togliere il fiato." }
              ],
              food: {
                dishes: ["Sarde in saor", "Baccalà mantecato", "Cicchetti misti", "Risotto al nero di seppia"],
                spots: ["Trattoria da Jonatan — Cannaregio, prenota, solo veneziani", "All'Arco — cicchetti freschi ogni mattina, in piedi al banco"]
              },
              cultural_pill: "Venezia si vive lentamente e ci si perde apposta. Non usare Google Maps: gira a caso, ogni vicolo nasconde qualcosa.",
              weather: { estate: "☀️ 28-33°C", inverno: "🌫️ 2-7°C (acqua alta)", primavera: "⛅ 15-20°C", autunno: "🌧️ 12-18°C" },
              weather_tags: ["hot_summer", "foggy_winter", "mild_spring", "rainy_autumn"],
              affiliates_amazon: [
                { item: "Stivali di gomma waterproof", why: "Acqua alta: ottobre-marzo, arriva senza preavviso", asin: "B09BOOTS01" },
                { item: "Trolley cabina senza ruote hard", why: "I ponti veneziani: niente ruote. Solo trolley da sollevare", asin: "B08TROLLE5" }
              ],
              affiliates_booking: [
                { name: "B&B Cannaregio", why: "Il sestiere più autentico, lontano da San Marco" },
                { name: "Appartamento Dorsoduro", why: "Quartiere degli studenti, vita reale veneziana" }
              ]
            }
          }
        },
        ES: {
          name: "Spagna", emoji: "🇪🇸",
          cities: {
            BCN: {
              name: "Barcellona", emoji: "🎨",
              bg: "linear-gradient(135deg,#B22222,#FFD700)",
              hidden_gems: [
                { name: "Bunkers del Carmel", desc: "La migliore vista panoramica su Barcellona. I locali ci vanno al tramonto con birra e chitarra. Nessun turista informato." },
                { name: "Mercato de l'Abaceria (Gràcia)", desc: "Il vero mercato del quartiere Gràcia. Tapas da 1.5€, prodotti locali, solo spagnoli." },
                { name: "Barri de Poblenou", desc: "Il Williamsburg di Barcellona. Street art, co-working, cocktail bar e zero souvenir." }
              ],
              food: {
                dishes: ["Pa amb tomàquet", "Patatas bravas", "Croquetas de jamón", "Bombas (Barceloneta)"],
                spots: ["Bar Calders — Eixample, aperitivo del venerdì, solo locali", "La Pepita (mercadona alternativa) — brunch autentico"]
              },
              cultural_pill: "A Barcellona non chiamarla 'spagnola': è catalana. I locali parlano catalano tra di loro. Un 'Gràcies' (non Gracias) apre molte porte.",
              weather: { estate: "☀️ 28-32°C", inverno: "🌤️ 10-14°C", primavera: "⛅ 18-23°C", autunno: "🍂 16-21°C" },
              weather_tags: ["hot_summer", "mild_winter", "warm_spring", "warm_autumn"],
              affiliates_amazon: [
                { item: "Foulard leggero UPF50", why: "Sagrada Família e Gaudí richiedono spalle coperte: portalo sempre", asin: "B07SCARF99" },
                { item: "Borsa antifurto crossbody", why: "Las Ramblas: zona a rischio borseggio, documentata", asin: "B08ANTITHEFT" }
              ],
              affiliates_booking: [
                { name: "Hotel Gràcia / Eixample", why: "Fuori dal centro turistico, molto più autentico" },
                { name: "Apartamento Poblenou", why: "Il quartiere più cool del momento, vicino alla spiaggia" }
              ]
            },
            MAD: {
              name: "Madrid", emoji: "👑",
              bg: "linear-gradient(135deg,#8B0000,#C0392B)",
              hidden_gems: [
                { name: "Lavapiés Tabacalera", desc: "Centro culturale squat auto-gestito in un'ex fabbrica di tabacco. Concerti gratis, arte anarchica, Madrid alternativa." },
                { name: "Rastro del Domingo", desc: "Il mercato delle pulci più grande d'Europa, solo domenica mattina. Arrivi entro le 9 o trovi solo turisti con selfie stick." },
                { name: "El Retiro all'Alba", desc: "Il parco apre alle 6. Corri, medita o semplicemente siediti: hai 350 ettari solo per te." }
              ],
              food: {
                dishes: ["Bocadillo de calamares", "Cocido madrileño", "Tortilla española", "Churros con chocolate"],
                spots: ["Mercado de San Miguel — ma solo per i pintxos del mattino", "Casa Julio — tortilla de patatas, ordinane solo quella"]
              },
              cultural_pill: "Madrid cena alle 22:00 e fa vita alle 3:00 di notte. Non cercare di adattarti: abbraccia il ritmo. La notte è la vera Madrid.",
              weather: { estate: "☀️ 34-40°C", inverno: "❄️ 4-8°C (a volte neve)", primavera: "⛅ 17-22°C", autunno: "🍂 14-19°C" },
              weather_tags: ["extreme_heat_summer", "cold_winter", "mild_spring", "mild_autumn"],
              affiliates_amazon: [
                { item: "Protezione solare SPF50+", why: "Estate madrilena: 40°C con sole diretto. Non scherzare", asin: "B09SPF5050" },
                { item: "Borraccia termica 750ml", why: "L'acqua in bottiglia in estate a Madrid è una spesa continua", asin: "B08THERMOS7" }
              ],
              affiliates_booking: [
                { name: "Hostal zona Malasaña", why: "Il quartiere alternativo, vita notturna autentica" },
                { name: "Hotel Lavapiés", why: "Multiculturale, economico, vero Madrid" }
              ]
            },
            SVQ: {
              name: "Siviglia", emoji: "💃",
              bg: "linear-gradient(135deg,#8B4513,#D2691E)",
              hidden_gems: [
                { name: "Triana alle 7 di mattina", desc: "Il quartiere del flamenco autentico. La mattina presto le tortillerías aprono con churros appena fritti. Nessun turista sveglio." },
                { name: "Metropol Parasol (Las Setas)", desc: "La struttura lignea più grande al mondo. Sul tetto al tramonto: 2€ di ingresso, vista impareggiabile." },
                { name: "Bodega El Tamboril", desc: "Bodega storica, Barrio Santa Cruz. Il vino si versa direttamente dalla botte. Tapas gratis con ogni consumazione." }
              ],
              food: {
                dishes: ["Gazpacho autentico (non in brick)", "Espinacas con garbanzos", "Montaditos de pringá", "Pescaíto frito"],
                spots: ["Bar El Comercio — tapas gratis, frequentato da operai e anziani", "La Azotea — cucina moderna sivigliana, prenota"]
              },
              cultural_pill: "A Siviglia si vive in strada. Le 5 del pomeriggio sono il momento della 'sobremesa': conversazione post-pranzo che dura ore. Non avere fretta.",
              weather: { estate: "🔥 38-44°C", inverno: "🌤️ 12-16°C", primavera: "🌸 20-26°C", autunno: "☀️ 18-24°C" },
              weather_tags: ["extreme_heat_summer", "warm_winter", "perfect_spring", "warm_autumn"],
              affiliates_amazon: [
                { item: "Ventaglio artigianale (abanicos)", why: "Estate in Andalusia: non è folklore, è necessità fisica", asin: "B07FANSPAI" },
                { item: "Sandali comfort walking", why: "Siviglia si visita a piedi: le pietre del centro rovinano le scarpe", asin: "B09SANDALS" }
              ],
              affiliates_booking: [
                { name: "Pensión Triana", why: "Quartiere flamenco autentico, non Santa Cruz (troppo turistico)" },
                { name: "Casa Rural Aljarafe", why: "Fuori città, vista sulle olive grove, silenzio assoluto" }
              ]
            }
          }
        }
      }
    },
    AS: {
      name: "Asia", emoji: "🌏", countryCount: 49,
      countries: {
        JP: {
          name: "Giappone", emoji: "🇯🇵",
          cities: {
            TYO: {
              name: "Tokyo", emoji: "🏙️",
              bg: "linear-gradient(135deg,#1a1a2e,#e94560)",
              hidden_gems: [
                { name: "Yanaka Ginza", desc: "Il quartiere shitamachi (Edo vecchio) sopravvissuto ai bombardamenti. Carciofieri, gatti randagi, Japan pre-moderno. Zero neon." },
                { name: "Koenji — Ura-Harajuku", desc: "La Tokyo alternativa: vinili rari, vintage anni '70, bar jazz sotterranei. I giovani creativi vivono qui." },
                { name: "Shimokitazawa Market", desc: "Mercato vintage ogni fine settimana. Vinili, kimono di seconda mano, caffè indipendenti. Impossibile non trovare qualcosa." }
              ],
              food: {
                dishes: ["Tonkotsu Ramen (Shinjuku Golden Gai)", "Taiyaki (pesce caldo ripieno)", "Gyudon (Yoshinoya alle 3:00)", "Yakitori sotto i binari di Yurakucho"],
                spots: ["Tsukiji Outer Market — breakfast tuna sashimi alle 7:00", "Standing ramen Ichiran — mangia solo, in silenzio, concentrato"]
              },
              cultural_pill: "In Giappone il silenzio è rispetto, non imbarazzo. Non mangiare in movimento, non parlare al telefono in metro. Osserva e imita.",
              weather: { estate: "🌡️ 32-38°C (umidità 90%)", inverno: "❄️ 3-8°C (secco)", primavera: "🌸 15-22°C (sakura)", autunno: "🍁 16-22°C (momiji)" },
              weather_tags: ["hot_humid_summer", "cold_dry_winter", "cherry_blossom_spring", "foliage_autumn"],
              affiliates_amazon: [
                { item: "Pocket WiFi / SIM Docomo", why: "Il Wi-Fi pubblico in Giappone è limitato. Pocket WiFi è essenziale", asin: "B08WIFIJP1" },
                { item: "IC Card Suica (precaricata)", why: "Per treni, bus, convenience store, distributori: tutto con tap", asin: "B07SUICA11" }
              ],
              affiliates_booking: [
                { name: "Capsule Hotel Ginza", why: "Esperienza unica giapponese, economica, centrale" },
                { name: "Ryokan Yanaka", why: "Inn tradizionale nel quartiere storico: futon, yukata, onsen" }
              ]
            },
            KIX: {
              name: "Osaka", emoji: "🍜",
              bg: "linear-gradient(135deg,#2d1b69,#11998e)",
              hidden_gems: [
                { name: "Shinsekai District", desc: "Il quartiere dimenticato di Osaka: tower billards, kushikatsu da 80yen, anziani che giocano a shogi. Autentico e un po' bizzarro." },
                { name: "Nakazakicho", desc: "Cafè indie, gallerie micro, vintage shop anni '60. La Osaka bohémienne che i turisti non cercano." },
                { name: "Tempozan Marketplace alle 8:00", desc: "Prima che apra l'Acquario, il mercato del pesce sul porto è attivissimo. Tuna auction in miniatura, sashimi freschissimo." }
              ],
              food: {
                dishes: ["Takoyaki originale (Dotonbori non vale)", "Kushikatsu Shinsekai", "Okonomiyaki con maionese Kewpie", "Horumon (frattaglie grigliate)"],
                spots: ["Juhachiban — takoyaki da 8 generazioni, Namba", "Daruma — kushikatsu originale del 1929, Shinsekai"]
              },
              cultural_pill: "Osaka vive di 'kuidaore': mangiare fino a rovinarsi. L'orgoglio è nel cibo, non nell'eleganza. I locali adorano chi mangia con entusiasmo.",
              weather: { estate: "🌡️ 33-37°C", inverno: "❄️ 4-9°C", primavera: "🌸 14-20°C", autunno: "🍁 15-21°C" },
              weather_tags: ["hot_summer", "cold_winter", "mild_spring", "mild_autumn"],
              affiliates_amazon: [
                { item: "Bottiglia takoyaki fridge magnet", why: "Il souvenir più onesto di Osaka", asin: "B07TAKOOSAK" },
                { item: "Guida Kansai in italiano", why: "Osaka + Kyoto + Nara: ottimizza i tuoi spostamenti in treno", asin: "B09KANSAI22" }
              ],
              affiliates_booking: [
                { name: "Guesthouse Shinsekai", why: "Nel cuore del quartiere autentico, prezzi minimi" },
                { name: "Business Hotel Namba", why: "Posizione centrale, clean, economico" }
              ]
            },
            UKY: {
              name: "Kyoto", emoji: "⛩️",
              bg: "linear-gradient(135deg,#1a4a2e,#a8e063)",
              hidden_gems: [
                { name: "Fushimi Inari alle 5:30", desc: "Il sentiero dei 10.000 torii si percorre vuoto solo all'alba. I turisti arrivano alle 9. Porta una torcia e silenzio." },
                { name: "Nishiki Market dopo le 17:00", desc: "Quando i turisti tornano agli hotel, i fornitori locali tirano fuori i prezzi veri. Assaggi gratis, conversazioni autentiche." },
                { name: "Arashiyama — Foresta di Bambù alle 6:00", desc: "Alle 6 la foresta è nebbiosa e deserta. Un'esperienza trascendentale. Alle 10 è un corridoio di selfie stick." }
              ],
              food: {
                dishes: ["Kaiseki (menu degustazione a 10 portate)", "Yudofu (tofu bolito in dashi)", "Matcha everything (autentico, non Starbucks)", "Obanzai (cucina casalinga kiotense)"],
                spots: ["Nishiki Market — mangia camminando ogni tipo di street food kyotoese", "Ippudo Kyoto — ramen con ingredienti locali"]
              },
              cultural_pill: "A Kyoto esiste il concetto di 'uraomote': faccia pubblica vs privata. I locali sono riservati ma profondi. Guadagna la loro fiducia gradualmente.",
              weather: { estate: "☀️ 34-38°C (molto umido)", inverno: "❄️ 2-7°C (possibile neve sui templi)", primavera: "🌸 13-20°C (sakura 2 settimane)", autunno: "🍁 14-22°C (momiji 3 settimane)" },
              weather_tags: ["hot_humid_summer", "cold_winter_snow", "sakura_spring", "foliage_autumn"],
              affiliates_amazon: [
                { item: "Taccuino Muji (A6 blank)", why: "Kyoto ispira: i giapponesi scrivono tutto. Unisciti a loro", asin: "B08MUJI100" },
                { item: "Ombrello pieghevole ultralight", why: "Le stagioni di pioggia (tsuyu) colpiscono senza preavviso", asin: "B07KASA222" }
              ],
              affiliates_booking: [
                { name: "Ryokan Gion", why: "Notte in ryokan tradizionale nel distretto geisha" },
                { name: "Machiya (casa townhouse)", why: "Vivere in una casa di legno tradizionale Edo-era" }
              ]
            }
          }
        }
      }
    },
    AM: {
      name: "Americhe", emoji: "🌎", countryCount: 35,
      countries: {
        US: { name: "USA", emoji: "🇺🇸", cities: {} },
        MX: { name: "Messico", emoji: "🇲🇽", cities: {} },
        BR: { name: "Brasile", emoji: "🇧🇷", cities: {} }
      }
    },
    AF: {
      name: "Africa", emoji: "🌍", countryCount: 54,
      countries: {
        MA: { name: "Marocco", emoji: "🇲🇦", cities: {} },
        ZA: { name: "Sud Africa", emoji: "🇿🇦", cities: {} },
        TZ: { name: "Tanzania", emoji: "🇹🇿", cities: {} }
      }
    },
    OC: {
      name: "Oceania", emoji: "🗺️", countryCount: 14,
      countries: {
        AU: { name: "Australia", emoji: "🇦🇺", cities: {} },
        NZ: { name: "Nuova Zelanda", emoji: "🇳🇿", cities: {} }
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════
// PREDICTIVE SEARCH
// ═══════════════════════════════════════════════════════════════════════

// Build a flat, searchable index from the DB at runtime
function buildSearchIndex() {
  const index = [];
  Object.entries(DB.continents).forEach(([contCode, cont]) => {
    Object.entries(cont.countries).forEach(([countryCode, country]) => {
      // Index country itself (if it has cities)
      const cityCount = Object.keys(country.cities || {}).length;
      if (cityCount > 0) {
        index.push({
          type: 'country',
          label: country.name,
          sub: `${cont.name} · ${cityCount} città`,
          emoji: country.emoji,
          contCode, countryCode, cityCode: null,
        });
      }
      // Index every city
      Object.entries(country.cities || {}).forEach(([cityCode, city]) => {
        index.push({
          type: 'city',
          label: city.name,
          sub: `${country.emoji} ${country.name} · ${cont.name}`,
          emoji: city.emoji,
          contCode, countryCode, cityCode,
        });
      });
    });
  });
  return index;
}

const SEARCH_INDEX = buildSearchIndex();
let searchFocusIndex = -1;

function highlightMatch(text, query) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

function handleSearch(query) {
  const dropdown = document.getElementById('searchDropdown');
  const clearBtn = document.getElementById('searchClear');
  const q = query.trim();

  clearBtn.classList.toggle('visible', q.length > 0);
  searchFocusIndex = -1;

  if (q.length < 2) {
    dropdown.style.display = 'none';
    return;
  }

  const lower = q.toLowerCase();
  const results = SEARCH_INDEX.filter(item =>
    item.label.toLowerCase().includes(lower)
  ).slice(0, 8); // cap at 8 results

  dropdown.style.display = 'block';

  if (results.length === 0) {
    // Se API key disponibile: mostra messaggio leggero e avvia auto-generazione dopo 600ms
    // Proxy sempre disponibile: avvia sempre AI generation
    if (true) {
      dropdown.innerHTML = `
        <div class="search-ai-loading" style="padding:16px 20px">
          <div class="spinner"></div>
          <span style="color:var(--cream-dim);font-size:12px">Cercando <strong style="color:var(--cream)">${q}</strong> nel database di viaggio…</span>
        </div>
      `;
      // Debounce: aspetta 700ms dopo l'ultima lettera prima di chiamare AI
      clearTimeout(window._aiSearchTimer);
      window._aiSearchTimer = setTimeout(() => {
        // Verifica che la query non sia cambiata nel frattempo
        const currentVal = document.getElementById('globalSearch')?.value?.trim();
        if (currentVal === q) aiGenerateCity(q);
      }, 700);
    } else {
      // Fallback senza AI key
      const safeQ = q.replace(/'/g, "\\'");
      dropdown.innerHTML = `
        <div class="search-empty-state">
          <div class="empty-state-globe">🌐</div>
          <div class="empty-state-title">Non ancora nel database</div>
          <div class="empty-state-sub"><strong>${q}</strong> non è tra le destinazioni curate.</div>
          <button class="empty-state-cta" onclick="voteDestination('${safeQ}')">✈️ Vota questa meta</button>
        </div>
      `;
    }
    return;
  }

  dropdown.innerHTML = results.map((r, i) => `
    <div
      class="search-result-item"
      data-index="${i}"
      onclick="selectSearchResult(${JSON.stringify(r).replace(/"/g,'&quot;')})"
    >
      <div class="search-result-emoji">${r.emoji}</div>
      <div class="search-result-info">
        <div class="search-result-name">${highlightMatch(r.label, q)}</div>
        <div class="search-result-sub">${r.sub}</div>
      </div>
      <span class="search-result-type ${r.type}">${r.type === 'city' ? 'Città' : 'Nazione'}</span>
    </div>
  `).join('');
}

function handleSearchKey(e) {
  const dropdown = document.getElementById('searchDropdown');
  if (dropdown.style.display === 'none') return;
  const items = dropdown.querySelectorAll('.search-result-item');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    searchFocusIndex = Math.min(searchFocusIndex + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    searchFocusIndex = Math.max(searchFocusIndex - 1, 0);
  } else if (e.key === 'Enter' && searchFocusIndex >= 0) {
    e.preventDefault();
    items[searchFocusIndex].click();
    return;
  } else if (e.key === 'Escape') {
    clearSearch();
    return;
  }

  items.forEach((el, i) => {
    el.style.background = i === searchFocusIndex ? 'rgba(232,162,40,0.1)' : '';
  });
}

function selectSearchResult(result) {
  clearSearch();

  // Update state
  selectedContinent = result.contCode;
  selectedCountry   = result.countryCode;

  // Update breadcrumb steps visually
  document.getElementById('step-continent').className = 'drill-step done';
  document.getElementById('step-country').className   = 'drill-step done';

  if (result.type === 'city') {
    selectedCity = result.cityCode;
    document.getElementById('step-city').className = 'drill-step done';

    // Hydrate the drill-down grids silently so back-navigation works
    renderContinents();
    renderCountries(result.contCode);
    renderCities(result.contCode, result.countryCode);
    goToLevel('city');

    const city    = DB.continents[result.contCode].countries[result.countryCode].cities[result.cityCode];
    const country = DB.continents[result.contCode].countries[result.countryCode];
    renderCityDetail(result.cityCode, city, country);
    document.getElementById('city-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } else {
    // Country selected: jump to city picker
    selectedCity = null;
    document.getElementById('step-city').className = 'drill-step active';

    renderContinents();
    renderCountries(result.contCode);
    renderCities(result.contCode, result.countryCode);
    goToLevel('city');

    document.getElementById('explorer').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function clearSearch() {
  clearTimeout(window._aiSearchTimer);
  const input = document.getElementById('globalSearch');
  const dropdown = document.getElementById('searchDropdown');
  const clearBtn = document.getElementById('searchClear');
  input.value = '';
  dropdown.style.display = 'none';
  clearBtn.classList.remove('visible');
  searchFocusIndex = -1;
}

async function voteDestination(dest) {
  document.getElementById('searchDropdown').style.display = 'none';
  const user = firebaseAuth.currentUser;
  if (user) {
    try {
      await updateDoc(doc(firestoreDb, 'users', user.uid), {
        votedMete: arrayUnion({ dest, votedAt: new Date().toISOString() }),
      });
      showToast(`🗺️ Grazie! "${dest}" registrata nel tuo profilo.`);
    } catch {
      showToast(`🗺️ Grazie! Abbiamo registrato la tua preferenza per "${dest}"`);
    }
  } else {
    showToast(`🗺️ Grazie! Abbiamo registrato la tua preferenza per "${dest}"`);
  }
}

// ─── AI UNIVERSAL SEARCH: genera qualsiasi città al volo ───────────────
const AI_CITY_CACHE = {}; // cache sessione — evita ri-chiamate sulla stessa città

async function aiGenerateCity(cityName) {
  // Controlla ancora che la query sia quella attuale (debounce check)
  const currentVal = document.getElementById('globalSearch')?.value?.trim();
  if (currentVal?.toLowerCase() !== cityName.toLowerCase()) return;

  // Cache hit — apri subito senza chiamate
  const cacheKey = cityName.toLowerCase().trim();
  if (AI_CITY_CACHE[cacheKey]) {
    clearSearch();
    _injectAndOpenAICity(AI_CITY_CACHE[cacheKey], cityName);
    return;
  }

  // Chiudi search e mostra toast di caricamento leggero
  clearSearch();
  const toastId = _showPersistentToast(`🌍 Cercando ${cityName} nel database di viaggio…`);

  const systemPrompt = `Sei un esperto di viaggi e culture locali. Rispondi SOLO con JSON valido, nessun testo fuori dal JSON.`;
  const userPrompt = `Genera una scheda destinazione per "${cityName}" in questo formato JSON esatto:
{
  "name": "Nome città",
  "emoji": "emoji bandiera o simbolo",
  "country": "paese",
  "continent": "continente",
  "bg": "linear-gradient(135deg,#colore1,#colore2)",
  "weather": {"estate":"emoji temp","inverno":"emoji temp","primavera":"emoji temp","autunno":"emoji temp"},
  "weather_tags": ["tag1","tag2","tag3"],
  "hidden_gems": [
    {"name":"nome gemma 1","desc":"descrizione autentica 1-2 frasi"},
    {"name":"nome gemma 2","desc":"descrizione autentica 1-2 frasi"},
    {"name":"nome gemma 3","desc":"descrizione autentica 1-2 frasi"}
  ],
  "food": {
    "dishes": ["piatto1","piatto2","piatto3","piatto4"],
    "spots": ["locale1 — descrizione breve","locale2 — descrizione breve"]
  },
  "cultural_pill": "frase culturale autentica e poetica di 1-2 frasi",
  "affiliates_amazon": [
    {"item":"prodotto consigliato","why":"motivo specifico","asin":"B000000000"},
    {"item":"prodotto consigliato 2","why":"motivo specifico 2","asin":"B000000001"}
  ],
  "affiliates_booking": [
    {"name":"tipo alloggio consigliato","why":"motivo autentico"},
    {"name":"tipo alloggio 2","why":"motivo 2"}
  ]
}
Sii specifico, autentico, evita cliché turistici. Per bg usa colori ispirati alla città.`;

  try {
    const raw = await claudeAsk(systemPrompt, userPrompt, 1000);
    _dismissPersistentToast(toastId);
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const cityData = JSON.parse(clean);
    const cityObj = {
      name:               cityData.name || cityName,
      emoji:              cityData.emoji || '🌍',
      bg:                 cityData.bg || 'linear-gradient(135deg,#1a1a2e,#16213e)',
      weather:            cityData.weather || {},
      weather_tags:       cityData.weather_tags || [],
      hidden_gems:        cityData.hidden_gems || [],
      food:               cityData.food || { dishes: [], spots: [] },
      cultural_pill:      cityData.cultural_pill || '',
      affiliates_amazon:  cityData.affiliates_amazon || [],
      affiliates_booking: cityData.affiliates_booking || [],
      _aiGenerated:       true,
      _country:           cityData.country || 'Generato da AI',
      _continent:         cityData.continent || '',
    };
    AI_CITY_CACHE[cacheKey] = cityObj;
    _injectAndOpenAICity(cityObj, cityName);
  } catch (err) {
    _dismissPersistentToast(toastId);
    showToast(`❌ Non riesco a trovare "${cityName}". Riprova.`);
  }
}

// Toast persistente (non sparisce da solo) — ritorna id per rimuoverlo
function _showPersistentToast(msg) {
  const id = '_pt_' + Date.now();
  const t = document.createElement('div');
  t.className = 'toast'; t.id = id;
  t.style.cssText = 'display:flex;align-items:center;gap:10px;';
  t.innerHTML = `<div style="width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.2);border-top-color:var(--amber);animation:spin 0.7s linear infinite;flex-shrink:0"></div><span>${msg}</span>`;
  document.body.appendChild(t);
  return id;
}
function _dismissPersistentToast(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.opacity = '0'; el.style.transition = 'opacity .3s';
  setTimeout(() => el.remove(), 300);
}

function _injectAndOpenAICity(cityObj, cityName) {
  // Inject into a virtual AI continent in DB so all existing functions work
  if (!DB.continents._AI) {
    DB.continents._AI = {
      name: 'Scoperte', emoji: '🤖', countryCount: 0,
      countries: { _AI: { name: cityObj._country || 'AI', emoji: '🌐', cities: {} } }
    };
  }
  const cityCode = '_' + cityName.replace(/\s+/g, '_').toLowerCase().slice(0, 12);
  DB.continents._AI.countries._AI.cities[cityCode] = cityObj;

  // Close dropdown and navigate
  clearSearch();
  selectedContinent = '_AI';
  selectedCountry   = '_AI';
  selectedCity      = cityCode;

  document.getElementById('step-continent').className = 'drill-step done';
  document.getElementById('step-country').className   = 'drill-step done';
  document.getElementById('step-city').className      = 'drill-step done';

  const fakeCountry = { name: cityObj._country, emoji: '🌐' };
  renderCityDetail(cityCode, cityObj, fakeCountry);
  document.getElementById('city-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });

  setTimeout(() => calcBudget(cityCode), 80);
  showToast(`✨ "${cityObj.name}" aggiunta all'esploratore`);
}

// Close dropdown on outside click
document.addEventListener('click', e => {
  if (!document.getElementById('searchWrap').contains(e.target)) {
    const dd = document.getElementById('searchDropdown');
    if (dd) dd.style.display = 'none';
  }
});

// ═══════════════════════════════════════════════════════════════════════
// DRILL-DOWN EXPLORER
// ═══════════════════════════════════════════════════════════════════════
let selectedContinent = null;
let selectedCountry = null;
let selectedCity = null;

async function renderContinents() {
  const grid = document.getElementById('continentGrid');
  grid.innerHTML = '<div class="grid-spinner"><div class="spinner"></div><span>Caricamento continenti…</span></div>';
  try {
    const snapshot = await getDocs(collection(firestoreDb, 'continents'));
    if (!snapshot.empty) {
      snapshot.forEach(docSnap => {
        if (!DB.continents[docSnap.id]) DB.continents[docSnap.id] = { countries: {} };
        const d = docSnap.data();
        DB.continents[docSnap.id].name         = d.name         ?? DB.continents[docSnap.id].name;
        DB.continents[docSnap.id].emoji        = d.emoji        ?? DB.continents[docSnap.id].emoji;
        DB.continents[docSnap.id].countryCount = d.countryCount ?? DB.continents[docSnap.id].countryCount;
      });
      SEARCH_INDEX.splice(0); SEARCH_INDEX.push(...buildSearchIndex());
    }
  } catch (err) {
    console.warn('[WQ] Firestore continents — fallback locale:', err.message);
  }
  grid.innerHTML = Object.entries(DB.continents).map(([code, c]) => `
    <div class="continent-card ${selectedContinent === code ? 'selected' : ''}" onclick="selectContinent('${code}')">
      <div class="continent-emoji">${c.emoji}</div>
      <div class="continent-name">${c.name}</div>
      <div class="continent-count">${c.countryCount || Object.keys(c.countries).length} paesi</div>
    </div>
  `).join('');
}

async function selectContinent(code) {
  selectedContinent = code;
  selectedCountry = null;
  selectedCity = null;
  renderContinents();
  await renderCountries(code);
  goToLevel('country');
  document.getElementById('step-continent').className = 'drill-step done';
  document.getElementById('step-country').className = 'drill-step active';
  document.getElementById('step-city').className = 'drill-step';
}

async function renderCountries(continentCode) {
  const countries = DB.continents[continentCode].countries;
  const grid = document.getElementById('countryGrid');
  grid.innerHTML = '<div class="grid-spinner"><div class="spinner"></div><span>Caricamento paesi…</span></div>';

  try {
    const snapshot = await getDocs(collection(firestoreDb, `continents/${continentCode}/countries`));
    if (!snapshot.empty) {
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        if (!countries[docSnap.id]) countries[docSnap.id] = { cities: {} };
        countries[docSnap.id].name  = d.name  ?? countries[docSnap.id].name;
        countries[docSnap.id].emoji = d.emoji ?? countries[docSnap.id].emoji;
      });
      SEARCH_INDEX.splice(0); SEARCH_INDEX.push(...buildSearchIndex());
    }
  } catch (err) {
    console.warn('[WQ] Firestore countries — fallback locale:', err.message);
  }

  const active = [];
  const comingSoon = [];
  Object.entries(countries).forEach(([code, c]) => {
    const cityCount = Object.keys(c.cities || {}).length;
    if (cityCount > 0) active.push({ code, c, cityCount });
    else comingSoon.push({ code, c });
  });

  const activeHTML = active.map(({ code, c, cityCount }) => `
    <div class="country-card" onclick="selectCountry('${code}')">
      <div class="country-flag">${c.emoji}</div>
      <div class="country-name">${c.name}</div>
      <div class="country-cities">${cityCount} città disponibili</div>
    </div>
  `).join('');

  const comingSoonHTML = comingSoon.length === 0 ? '' : `
    <div class="coming-soon-divider">
      <div class="coming-soon-divider-line"></div>
      <div class="coming-soon-label">🔜 Prossime aperture</div>
      <div class="coming-soon-divider-line"></div>
    </div>
    <div class="country-grid">
      ${comingSoon.map(({ c }) => `
        <div class="country-card disabled">
          <div class="country-flag">${c.emoji}</div>
          <div class="country-name">${c.name}</div>
          <div class="country-cities">In arrivo</div>
        </div>
      `).join('')}
    </div>
  `;
  grid.innerHTML = activeHTML + comingSoonHTML;
}

async function selectCountry(code) {
  selectedCountry = code;
  selectedCity = null;
  await renderCities(selectedContinent, code);
  goToLevel('city');
  document.getElementById('step-country').className = 'drill-step done';
  document.getElementById('step-city').className = 'drill-step active';
}

async function renderCities(continentCode, countryCode) {
  const grid = document.getElementById('cityGrid');
  grid.innerHTML = '<div class="grid-spinner"><div class="spinner"></div><span>Caricamento città…</span></div>';

  try {
    const snapshot = await getDocs(
      collection(firestoreDb, `continents/${continentCode}/countries/${countryCode}/cities`)
    );
    if (!snapshot.empty) {
      const countryObj = DB.continents[continentCode].countries[countryCode];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        countryObj.cities[docSnap.id] = { ...countryObj.cities[docSnap.id], ...d };
      });
      SEARCH_INDEX.splice(0); SEARCH_INDEX.push(...buildSearchIndex());
    }
  } catch (err) {
    console.warn('[WQ] Firestore cities — fallback locale:', err.message);
  }

  const cities = DB.continents[continentCode].countries[countryCode].cities;
  grid.innerHTML = Object.entries(cities).map(([code, city]) => `
    <div class="city-card ${selectedCity === code ? 'selected' : ''}" onclick="selectCity('${code}')">
      <div class="city-thumb" style="background:${city.bg};position:relative">
        <span style="position:relative;z-index:1;font-size:52px">${city.emoji}</span>
        <button class="city-wish-btn ${isWishlisted(code) ? 'wished' : ''}"
          data-wishcode="${code}"
          onclick="event.stopPropagation();toggleWishlist('${code}','${city.name}','${city.emoji}')"
          title="Aggiungi ai desideri">${isWishlisted(code) ? '❤️' : '🤍'}</button>
      </div>
      <div class="city-body">
        <div class="city-name">${city.name}</div>
        <div class="city-tags">
          ${city.weather_tags.slice(0,3).map(t => `<div class="city-tag">${t.replace(/_/g,' ')}</div>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function selectCity(code) {
  selectedCity = code;
  const city = DB.continents[selectedContinent].countries[selectedCountry].cities[code];
  const countryData = DB.continents[selectedContinent].countries[selectedCountry];
  document.getElementById('step-city').className = 'drill-step done';
  renderCityDetail(code, city, countryData);
  // Track recently viewed
  addToRecentlyViewed(code, city, selectedCountry);
  // Trigger initial budget calculation after render
  setTimeout(() => calcBudget(code), 50);
  setTimeout(() => loadLiveWeather(city.name, code), 400);
  document.getElementById('city-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderCityDetail(code, city, country) {
  const detail = document.getElementById('city-detail');
  detail.className = 'show';

  const gemsHTML = city.hidden_gems.map(g => `
    <div class="gem-item">
      <div class="gem-dot"></div>
      <div><div class="gem-name">${g.name}</div><div class="gem-desc">${g.desc}</div></div>
    </div>
  `).join('');

  const dishesHTML = city.food.dishes.map(d => `<div class="food-dish">🍽️ ${d}</div>`).join('');
  const spotsHTML = city.food.spots.map(s => `<div class="food-spot">📍 ${s}</div>`).join('');

  const climateHTML = Object.entries(city.weather).map(([season, info]) => `
    <div class="climate-badge">
      <div class="climate-season">${season.toUpperCase()}</div>
      <div class="climate-temp">${info}</div>
    </div>
  `).join('');

  const amazonAff = city.affiliates_amazon.map(a => `
    <div class="affiliate-card">
      <div class="aff-img-placeholder amazon-bg">
        <span class="aff-img-emoji">🛍️</span>
      </div>
      <div class="aff-body">
        <span class="aff-badge amazon">⚡ Amazon</span>
        <div class="aff-title">${a.item}</div>
        <div class="aff-why">${a.why}</div>
      </div>
      <a class="aff-cta amazon-cta" href="https://amazon.it/dp/${a.asin}?tag=wanderquest-21" target="_blank">
        🛒 Vedi su Amazon →
      </a>
    </div>
  `).join('');

  const bookingAff = city.affiliates_booking.map(b => `
    <div class="affiliate-card">
      <div class="aff-img-placeholder booking-bg">
        <span class="aff-img-emoji">🏨</span>
      </div>
      <div class="aff-body">
        <span class="aff-badge booking">🏨 Booking.com</span>
        <div class="aff-title">${b.name}</div>
        <div class="aff-why">${b.why}</div>
      </div>
      <a class="aff-cta booking-cta" href="https://booking.com/searchresults.html?ss=${encodeURIComponent(city.name)}" target="_blank">
        Cerca disponibilità →
      </a>
    </div>
  `).join('');

  detail.innerHTML = `
    <div class="city-detail-inner">
      <div class="detail-header">
        <div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap">
          <div style="flex:1;min-width:0">
            <div class="detail-title">
              <span class="dest-country">${country.emoji} ${country.name}</span>
              ${city.emoji} ${city.name}
            </div>
          </div>
          <button class="wish-btn-detail ${isWishlisted(code) ? 'wished' : ''}"
            id="wish-detail-${code}"
            onclick="toggleWishlist('${code}','${city.name}','${city.emoji}')">${isWishlisted(code) ? '❤️ Nei Desideri' : '🤍 Aggiungi ai Desideri'}</button>
        </div>
        <div class="detail-climate" style="margin-top:12px">${climateHTML}</div>
        <div id="liveweather-${code}"></div>
      </div>

      <div class="detail-grid">
        <div class="detail-card">
          <div class="detail-card-icon">💎</div>
          <div class="detail-card-title">Gemme Nascoste</div>
          ${gemsHTML}
        </div>
        <div class="detail-card">
          <div class="detail-card-icon">🍽️</div>
          <div class="detail-card-title">Cibo & Ristoranti</div>
          <div style="margin-bottom:10px">${dishesHTML}</div>
          ${spotsHTML}
        </div>
        <div class="detail-card">
          <div class="detail-card-icon">🌐</div>
          <div class="detail-card-title">Pillola Culturale</div>
          <div class="cultural-pill">${city.cultural_pill}</div>
          <div style="margin-top:14px;font-size:11px;color:var(--cream-dim)">📏 ${city.cultural_pill.length} / 200 caratteri</div>
        </div>
      </div>

      <div class="affiliate-section">
        <div class="affiliate-title">🛒 Amazon <span style="font-size:14px;font-weight:400;color:var(--cream-dim)">— Essenziali consigliati</span></div>
        <div class="affiliate-grid">${amazonAff}</div>
        <div class="affiliate-title" style="margin-top:24px">🏨 Booking.com <span style="font-size:14px;font-weight:400;color:var(--cream-dim)">— Dove dormire davvero</span></div>
        <div class="affiliate-grid">${bookingAff}</div>
        <div class="affiliate-disclaimer">🔗 Link affiliati: WanderQuest riceve una commissione se acquisti o prenoti tramite questi link. Il prezzo per te rimane identico. Grazie per supportare il progetto.</div>
      </div>

      <div style="margin-top:24px;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;width:100%">
        <button class="generate-btn" style="flex:1;min-width:200px" onclick="precompilePacking('${code}');document.getElementById('packing').scrollIntoView({behavior:'smooth'})">
          🧳 Genera Valigia
        </button>
        <button class="share-btn" style="flex:0 0 auto" onclick="shareCity('${code}','${city.name}','${city.emoji}')">
          🔗 Condividi
        </button>
      </div>

      <!-- Budget Calculator -->
      <div class="budget-strip" id="budget-${code}">
        <div class="budget-strip-label">💰 Budget Stimato</div>
        <div class="budget-inputs">
          <div class="budget-input-wrap">
            <label>Giorni</label>
            <input type="number" id="budget-days-${code}" value="5" min="1" max="60"
              oninput="calcBudget('${code}')" style="appearance:none;-webkit-appearance:none">
          </div>
          <div class="budget-input-wrap">
            <label>Stile</label>
            <select id="budget-style-${code}" onchange="calcBudget('${code}')">
              <option value="budget">🎒 Budget</option>
              <option value="mid" selected>🏨 Comfort</option>
              <option value="luxury">✨ Luxury</option>
            </select>
          </div>
          <div class="budget-input-wrap">
            <label>Persone</label>
            <input type="number" id="budget-pax-${code}" value="2" min="1" max="10"
              oninput="calcBudget('${code}')" style="appearance:none;-webkit-appearance:none">
          </div>
        </div>
        <div class="budget-result" id="budget-result-${code}">
          <div class="budget-result-val">—</div>
          <div class="budget-result-lbl">totale stimato</div>
        </div>
      </div>

      <!-- Weather AI Analysis -->
      <div style="margin-top:16px">
        <button class="weather-ai-btn" onclick="askWeatherAI('${code}','${city.name}')">
          🌤️ Quando è il momento giusto?
        </button>
        <div class="weather-ai-result" id="weather-ai-${code}"></div>
      </div>

      <!-- Frasebook AI -->
      <div style="margin-top:4px">
        <button class="frasebook-btn" id="frase-btn-${code}"
          onclick="generateFrasebook('${code}','${city.name}','${country.name}')">
          🗣️ Frasi Essenziali per ${country.name}
        </button>
        <div class="frasebook-result" id="frase-result-${code}"></div>
      </div>

      <!-- AI City Chat -->
      <div class="ai-chat-section" id="chat-section-${code}">
        <div class="ai-chat-header">
          <div class="ai-chat-avatar">🤖</div>
          <div>
            <div class="ai-chat-title">Chiedi all'esperto su ${city.name}</div>
            <div class="ai-chat-subtitle">
              <span class="ai-badge">✦ Esperto Locale</span>
              &nbsp;Esperto locale virtuale
            </div>
          </div>
        </div>
        <div class="ai-chat-messages" id="chat-msgs-${code}">
          <div class="chat-msg ai">
            <div class="chat-msg-avatar">🤖</div>
            <div class="chat-bubble">Ciao! Sono il tuo esperto virtuale di <strong>${city.name}</strong>. Chiedimi qualsiasi cosa: i migliori periodi per visitarla, cosa non fare, dove mangiare come un locale, quanto spendere… 🗺️</div>
          </div>
        </div>
        <div class="ai-chat-suggestions">
          <div class="ai-suggestion-chip" onclick="sendChatSuggestion('${code}','${city.name}','Qual è il quartiere più autentico?')">🏘️ Quartiere autentico</div>
          <div class="ai-suggestion-chip" onclick="sendChatSuggestion('${code}','${city.name}','Cosa assolutamente evitare?')">🚫 Da evitare</div>
          <div class="ai-suggestion-chip" onclick="sendChatSuggestion('${code}','${city.name}','Il miglior periodo per visitarla?')">📅 Miglior periodo</div>
          <div class="ai-suggestion-chip" onclick="sendChatSuggestion('${code}','${city.name}','Come muoversi senza sembrare turisti?')">🚇 Trasporti locali</div>
        </div>
        <div class="ai-chat-input-row">
          <input
            type="text"
            class="ai-chat-input"
            id="chat-input-${code}"
            placeholder="Scrivi una domanda su ${city.name}…"
            onkeydown="if(event.key==='Enter')sendCityChat('${code}','${city.name}')"
          >
          <button class="ai-chat-send" id="chat-send-${code}" onclick="sendCityChat('${code}','${city.name}')">➤</button>
        </div>
      </div>

      <!-- City inline accordions -->
      <div class="city-acc accordion">

        <div class="acc-item" id="acc-q-${code}">
          <button class="acc-trigger" onclick="toggleAcc('acc-q-${code}')">
            <span class="acc-icon">🏘️</span>
            <span class="acc-label">Quartieri di ${city.name} — Dove stare</span>
            <span class="acc-tag">Alloggio</span>
            <span class="acc-arrow">▾</span>
          </button>
          <div class="acc-body" id="accbody-q-${code}">
            <div class="tip-list" style="padding-top:4px">
              <div class="tip-row"><div class="tip-dot"></div><strong>Centro storico</strong> — massima accessibilità, massimo rumore notturno e prezzi alti. Consigliato per soggiorni brevi (1-2 notti).</div>
              <div class="tip-row"><div class="tip-dot"></div><strong>Quartieri residenziali</strong> — dove vivono i locali. Metro + 2 fermate dal centro. Prezzi -30%, autenticità +100%.</div>
              <div class="tip-row"><div class="tip-dot"></div><strong>Periferica collegata</strong> — ideale per famiglie o soggiorni lunghi. Cerca "neighbourhood guide ${city.name}" per mappe specifiche.</div>
              <div class="tip-row"><div class="tip-dot"></div>Controlla sempre la distanza in minuti di cammino dai trasporti pubblici, non solo in km. Una fermata metro vale più di 10 km di distanza dal centro.</div>
            </div>
          </div>
        </div>

        <div class="acc-item" id="acc-t-${code}">
          <button class="acc-trigger" onclick="toggleAcc('acc-t-${code}');initTransit('${code}')">
            <span class="acc-icon">🚇</span>
            <span class="acc-label">Mezzi di Trasporto a ${city.name}</span>
            <span class="acc-tag">Trasporti</span>
            <span class="acc-arrow">▾</span>
          </button>
          <div class="acc-body" id="accbody-t-${code}">
            <div id="transit-widget-${code}">
              <div style="color:var(--cream-dim);font-size:13px;padding:8px 0">⏳ Caricamento dati trasporti…</div>
            </div>
          </div>
        </div>

        <div class="acc-item" id="acc-food-${code}">
          <button class="acc-trigger" onclick="toggleAcc('acc-food-${code}')">
            <span class="acc-icon">🍷</span>
            <span class="acc-label">Mangiare come un locale a ${city.name}</span>
            <span class="acc-tag">Gastronomia</span>
            <span class="acc-arrow">▾</span>
          </button>
          <div class="acc-body" id="accbody-food-${code}">
            <div class="tip-list" style="padding-top:4px">
              <div class="tip-row"><div class="tip-dot"></div><strong>Orari reali:</strong> i ristoranti aperti alle 12 esatte sono una trappola turistica. I locali mangiano tra le 13:30 e le 15, poi cena dalle 20:30.</div>
              <div class="tip-row"><div class="tip-dot"></div><strong>Mercati coperti:</strong> sono la versione locale dei food court. Freschi, economici, e frequentati da chi vive lì. Cerca "Mercado Central" o "Mercato Centrale" nella città.</div>
              <div class="tip-row"><div class="tip-dot"></div><strong>Menù del giorno:</strong> il pranzo è quasi sempre la pasto più conveniente. In Spagna il "menú del día" offre 3 portate + bevanda a €10-14.</div>
              <div class="tip-row"><div class="tip-dot"></div><strong>Segnale di qualità:</strong> se il menù ha foto plastificate e 6 lingue, gira i tacchi. Se c'è solo un foglio manoscritto in lingua locale, siediti.</div>
              <div class="tip-row"><div class="tip-dot"></div><strong>Colazione:</strong> mai farla in hotel se non inclusa. Un bar locale costa 1/3 del prezzo e il caffè è sempre migliore.</div>
            </div>
          </div>
        </div>

      </div><!-- /city-acc -->
    </div>
  \`;
}

function goToLevel(level) {
  document.getElementById('level-continent').classList.toggle('hidden', level !== 'continent');
  document.getElementById('level-country').classList.toggle('hidden', level !== 'country');
  document.getElementById('level-city').classList.toggle('hidden', level !== 'city');
}

// ═══════════════════════════════════════════════════════════════════════
// TRANSIT DB — dati trasporti per città
// ═══════════════════════════════════════════════════════════════════════
const TRANSIT_DB = {
  ROM: { city:'Roma', coords:{lat:41.9028,lng:12.4964},
    systems:[{icon:'🟠',name:'Metro A',color:'#FF6600'},{icon:'🔵',name:'Metro B/B1',color:'#0070C0'},{icon:'🟢',name:'Tram 2/3/8/19',color:'#2EC57A'},{icon:'⚫',name:'Bus Notte (N)',color:'#888'}],
    dayPass:'€7.00', weekPass:'€24.00', mainHub:'Termini',
    tips:['Obliterare sempre il biglietto — controlli frequenti','Metro chiude all'1:30 (ven/sab alle 2:30)','Bus notturni 24h — fermata "N"'],
    apps:[{icon:'🗺️',name:'Moovit',url:'https://moovitapp.com/rome'},{icon:'🚍',name:'ATAC Roma',url:'https://www.atac.roma.it'},{icon:'🗺️',name:'Google Maps',url:'https://maps.google.com/maps?q=Roma+Termini&output=embed'}],
    landmarks:['Colosseo','Vaticano','Piazza Navona','Trastevere'],
    mapQ:'Roma+trasporti+metro', mapCenter:'41.8902,12.4922'},
  FLR: { city:'Firenze', coords:{lat:43.7696,lng:11.2558},
    systems:[{icon:'🟠',name:'Tramvia T1',color:'#FF6600'},{icon:'🟢',name:'Tramvia T2',color:'#2EC57A'},{icon:'🔵',name:'ATAF Bus',color:'#0070C0'}],
    dayPass:'€5.00', weekPass:'€16.00', mainHub:'Santa Maria Novella',
    tips:['Centro storico quasi tutto a piedi (ZTL auto vietate)','T2: aeroporto ↔ centro in 22 minuti','Mobike bike sharing diffuso — €1/30min'],
    apps:[{icon:'🗺️',name:'Moovit',url:'https://moovitapp.com/florence'},{icon:'🚍',name:'ATAF',url:'https://www.ataf.net'},{icon:'🗺️',name:'Google Maps',url:'https://maps.google.com/maps?q=Firenze+SMN&output=embed'}],
    landmarks:['Duomo','Uffizi','Ponte Vecchio','Oltrarno'],
    mapQ:'Firenze+tramvia', mapCenter:'43.7696,11.2558'},
  VCE: { city:'Venezia', coords:{lat:45.4408,lng:12.3155},
    systems:[{icon:'🚢',name:'Vaporetto ACTV',color:'#0070C0'},{icon:'🛥️',name:'Alilaguna (aeroporto)',color:'#FF6600'},{icon:'🚶',name:'A Piedi',color:'#2EC57A'}],
    dayPass:'€25.00', weekPass:'€65.00', mainHub:'Piazzale Roma / Santa Lucia',
    tips:['Vaporetto unico trasporto motorizzato — niente taxi in città','Linea 1: lenta e panoramica lungo il Canal Grande','Mappa offline obbligatoria — i calli non hanno segnali'],
    apps:[{icon:'🗺️',name:'Moovit',url:'https://moovitapp.com/venice'},{icon:'🚢',name:'ACTV',url:'https://actv.avmspa.it'},{icon:'🗺️',name:'Google Maps',url:'https://maps.google.com/maps?q=Venezia+Rialto&output=embed'}],
    landmarks:['Piazza San Marco','Rialto','Accademia','Cannaregio'],
    mapQ:'Venezia+vaporetto', mapCenter:'45.4408,12.3155'},
  BCN: { city:'Barcellona', coords:{lat:41.3851,lng:2.1734},
    systems:[{icon:'🔴',name:'Metro (L1-L12)',color:'#E30613'},{icon:'🟡',name:'Bus TMB',color:'#DAA520'},{icon:'🟢',name:'Nitbus (Notte)',color:'#2EC57A'},{icon:'🟣',name:'FGC',color:'#9B59B6'}],
    dayPass:'€11.35', weekPass:'€42.50', mainHub:'Plaça Catalunya / Sants',
    tips:['T-Casual (10 viaggi €12.15) la scelta migliore','Metro aperta fino alle 5:00 venerdì/sabato','Aerobus: aeroporto ↔ Plaça Catalunya ogni 5 min — €6.75'],
    apps:[{icon:'🗺️',name:'Moovit',url:'https://moovitapp.com/barcelona'},{icon:'🚇',name:'TMB',url:'https://www.tmb.cat'},{icon:'🗺️',name:'Google Maps',url:'https://maps.google.com/maps?q=Barcelona+Placa+Catalunya&output=embed'}],
    landmarks:['Sagrada Família','Barceloneta','Gràcia','El Born'],
    mapQ:'Barcelona+metro+TMB', mapCenter:'41.3851,2.1734'},
  MAD: { city:'Madrid', coords:{lat:40.4168,lng:-3.7038},
    systems:[{icon:'🔵',name:'Metro (12 linee)',color:'#0070C0'},{icon:'🔴',name:'Cercanías',color:'#E30613'},{icon:'🟡',name:'EMT Bus',color:'#DAA520'},{icon:'🌙',name:'Bus Nocturnos',color:'#555'}],
    dayPass:'€8.40', weekPass:'€12.20', mainHub:'Atocha / Sol / Nuevos Ministerios',
    tips:['Metro dall'aeroporto: Línea 8 → Nuevos Ministerios (20 min, +€3)','Abono mensile €54.60 — conveniente per soggiorni lunghi','Bus Búhos (notte): hub a Plaza de Cibeles'],
    apps:[{icon:'🗺️',name:'Moovit',url:'https://moovitapp.com/madrid'},{icon:'🚇',name:'Metro Madrid',url:'https://www.metromadrid.es'},{icon:'🗺️',name:'Google Maps',url:'https://maps.google.com/maps?q=Madrid+Sol&output=embed'}],
    landmarks:['Prado','Gran Vía','Retiro','Malasaña'],
    mapQ:'Madrid+metro+EMT', mapCenter:'40.4168,-3.7038'},
  SVQ: { city:'Siviglia', coords:{lat:37.3891,lng:-5.9845},
    systems:[{icon:'🟠',name:'Metro (1 linea)',color:'#FF6600'},{icon:'🔵',name:'Tussam Bus',color:'#0070C0'},{icon:'🟢',name:'SEVICI Bici',color:'#2EC57A'}],
    dayPass:'€5.00', weekPass:'€18.00', mainHub:'Santa Justa',
    tips:['Centro storico tutto a piedi (ZTL ampliata)','SEVICI bici: 1 settimana €13.33, prime 30min gratis','Metro limitata — utile solo per alcune zone'],
    apps:[{icon:'🗺️',name:'Moovit',url:'https://moovitapp.com/seville'},{icon:'🚍',name:'Tussam',url:'https://www.tussam.es'},{icon:'🗺️',name:'Google Maps',url:'https://maps.google.com/maps?q=Sevilla+Giralda&output=embed'}],
    landmarks:['Alcázar','Catedral','Triana','Barrio Santa Cruz'],
    mapQ:'Sevilla+metro+tussam', mapCenter:'37.3891,-5.9845'},
  TYO: { city:'Tokyo', coords:{lat:35.6762,lng:139.6503},
    systems:[{icon:'🔴',name:'JR Yamanote & altri',color:'#E30613'},{icon:'🔵',name:'Tokyo Metro (9 linee)',color:'#0070C0'},{icon:'🟤',name:'Toei Subway',color:'#8B5E3C'},{icon:'⚡',name:'Shinkansen',color:'#DAA520'}],
    dayPass:'€6.50 (Suica)', weekPass:'JR Pass €290 (7gg)',
    mainHub:'Shinjuku / Shibuya / Tokyo Station',
    tips:['Suica/Pasmo: IC card ricaricabile — comprala all'aeroporto','JR Pass solo per turisti — acquistalo in Italia prima di partire','Metro chiude a mezzanotte — pianifica l'ultima corsa'],
    apps:[{icon:'🗺️',name:'Moovit',url:'https://moovitapp.com/tokyo'},{icon:'🚇',name:'JR East',url:'https://www.jreast.co.jp/e/'},{icon:'🗺️',name:'Hyperdia',url:'https://hyperdia.com'}],
    landmarks:['Shinjuku','Shibuya','Asakusa','Harajuku'],
    mapQ:'Tokyo+metro+JR+rail', mapCenter:'35.6762,139.6503'},
  KIX: { city:'Osaka', coords:{lat:34.6937,lng:135.5023},
    systems:[{icon:'🔴',name:'Osaka Metro (9 linee)',color:'#E30613'},{icon:'🔵',name:'JR West',color:'#0070C0'},{icon:'🟢',name:'Hankyu / Hanshin',color:'#2EC57A'}],
    dayPass:'€6.80 (Icoca/Suica)', weekPass:'Osaka Amazing Pass 2gg €25',
    mainHub:'Umeda / Namba / Shin-Osaka',
    tips:['Osaka Amazing Pass: trasporti + ingressi gratuiti a 50 attrazioni','Suica funziona anche a Osaka','Da Osaka a Kyoto: Hankyu €2.50 (45 min)'],
    apps:[{icon:'🗺️',name:'Moovit',url:'https://moovitapp.com/osaka'},{icon:'🚇',name:'Osaka Metro',url:'https://www.osakametro.co.jp/en/'},{icon:'🗺️',name:'Hyperdia',url:'https://hyperdia.com'}],
    landmarks:['Dotonbori','Namba','Umeda','Osaka Castle'],
    mapQ:'Osaka+metro+namba', mapCenter:'34.6937,135.5023'},
  UKY: { city:'Kyoto', coords:{lat:35.0116,lng:135.7681},
    systems:[{icon:'🔴',name:'Bus Kyoto (206 e altri)',color:'#E30613'},{icon:'🔵',name:'Subway (2 linee)',color:'#0070C0'},{icon:'🚲',name:'Bici noleggio',color:'#2EC57A'}],
    dayPass:'€4.50 (Bus Day Pass)', weekPass:'Kyoto-Osaka Pass €30',
    mainHub:'Kyoto Station (JR)',
    tips:['Bus Day Pass €4.50: illimitato su tutti i bus città','Bus 100/101: collega siti principali — evita ore 10-17','Noleggio bici ideale per Arashiyama e Higashiyama'],
    apps:[{icon:'🗺️',name:'Moovit',url:'https://moovitapp.com/kyoto'},{icon:'🚍',name:'Kyoto Bus',url:'https://www.city.kyoto.lg.jp/kotsu/'},{icon:'🗺️',name:'Google Maps',url:'https://maps.google.com/maps?q=Kyoto+Station&output=embed'}],
    landmarks:['Fushimi Inari','Arashiyama','Gion','Kinkaku-ji'],
    mapQ:'Kyoto+bus+transit', mapCenter:'35.0116,135.7681'},
};

// ═══════════════════════════════════════════════════════════════════════
// FLIGHT BANNER
// ═══════════════════════════════════════════════════════════════════════
const FLIGHTS = {
  'FR1234': { airline: 'Ryanair', from: 'MXP', to: 'BCN', fromCity: 'Milano', toCity: 'Barcellona', countryCode: 'ES', cityCode: 'BCN' },
  'IB3456': { airline: 'Iberia', from: 'FCO', to: 'MAD', fromCity: 'Roma', toCity: 'Madrid', countryCode: 'ES', cityCode: 'MAD' },
  'AZ610':  { airline: 'ITA Airways', from: 'FCO', to: 'TYO', fromCity: 'Roma', toCity: 'Tokyo', countryCode: 'JP', cityCode: 'TYO' },
  'NH204':  { airline: 'ANA', from: 'MXP', to: 'UKY', fromCity: 'Milano', toCity: 'Kyoto', countryCode: 'JP', cityCode: 'UKY' },
  'VY6250': { airline: 'Vueling', from: 'MXP', to: 'SVQ', fromCity: 'Milano', toCity: 'Siviglia', countryCode: 'ES', cityCode: 'SVQ' },
  'AZ300':  { airline: 'ITA Airways', from: 'NAP', to: 'TYO', fromCity: 'Napoli', toCity: 'Tokyo', countryCode: 'JP', cityCode: 'TYO' },
};

function searchFlight() {
  const code = document.getElementById('flightInput').value.trim().toUpperCase();
  const result = document.getElementById('flight-result');
  if (!code) return;
  const f = FLIGHTS[code];
  if (!f) {
    result.innerHTML = `<div class="flight-card" style="border-color:rgba(232,64,64,0.2);background:rgba(232,64,64,0.06)"><span>⚠️ Volo <b>${code}</b> non trovato nel database — prova FR1234, AZ610, IB3456</span></div>`;
    return;
  }
  result.innerHTML = `
    <div class="flight-card">
      <div style="font-size:22px">✈️</div>
      <div>
        <div class="flight-airline">${f.airline} · ${code}</div>
        <div class="flight-route">${f.from} → ${f.to}</div>
        <div class="flight-city-hint">${f.fromCity} → ${f.toCity} · <span style="cursor:pointer;text-decoration:underline" onclick="quickJumpCity('${f.countryCode}','${f.cityCode}')">Vedi info città →</span></div>
      </div>
    </div>
  `;
}

function quickJumpCity(countryCode, cityCode) {
  // Find continent
  for (const [contCode, cont] of Object.entries(DB.continents)) {
    if (cont.countries[countryCode]) {
      selectedContinent = contCode;
      selectedCountry = countryCode;
      selectedCity = cityCode;
      const city = cont.countries[countryCode].cities[cityCode];
      if (city) {
        renderCityDetail(cityCode, city, cont.countries[countryCode]);
        document.getElementById('city-detail').scrollIntoView({ behavior: 'smooth' });
        showToast(`✈️ Info su ${city.name} caricate dal codice volo!`);
      }
      break;
    }
  }
}

document.getElementById('flightInput').addEventListener('keydown', e => { if(e.key==='Enter') searchFlight(); });

// ═══════════════════════════════════════════════════════════════════════
// PACKING ALGORITHM
// ═══════════════════════════════════════════════════════════════════════
const PACKING_DB = {
  base: [
    { item: "Passaporto / Carta d'identità", aff: null },
    { item: "Assicurazione viaggio", aff: null },
    { item: "Power bank 20.000mAh", aff: "B07PB20000" },
    { item: "Adattatore universale", aff: "B08ADAPT99" },
    { item: "Kit primo soccorso mini", aff: "B07FIRSTAID" },
    { item: "Farmaci personali", aff: null },
  ],
  seasonal: {
    estate:    [{ item: "Protezione solare SPF50+", aff: "B09SPF5050" }, { item: "Occhiali da sole", aff: "B08SUNGL22" }, { item: "T-shirt traspiranti ×5", aff: null }, { item: "Shorts ×3", aff: null }, { item: "Sandali comfort", aff: "B09SANDALS" }, { item: "Cappello a tesa larga", aff: "B07HATHAT1" }],
    autunno:   [{ item: "Giacca impermeabile leggera", aff: "B08RAIN77" }, { item: "Felpe/maglioni ×2", aff: null }, { item: "Scarpe chiuse impermeabili", aff: "B09SHOES55" }, { item: "Sciarpa leggera", aff: null }],
    inverno:   [{ item: "Giacca termica", aff: "B07JACKET9" }, { item: "Guanti e berretto", aff: "B08GLOVES2" }, { item: "Maglioni ×3", aff: null }, { item: "Calze termiche ×3", aff: "B07THERMO3" }, { item: "Stivali waterproof", aff: "B09BOOTS88" }],
    primavera: [{ item: "Giacca a vento leggera", aff: "B08WIND55" }, { item: "Layering mix (t-shirt + felpa)", aff: null }, { item: "Scarpe comode da walking", aff: "B07SHOES22" }, { item: "Ombrello ultralight", aff: "B08OMBR33" }],
  },
  tripType: {
    vacanza:   [{ item: "Costume da bagno ×2", aff: null }, { item: "Asciugamano microfibra", aff: "B08TOWEL11" }, { item: "Libro / e-reader", aff: "B09KINDLE5" }, { item: "Borsa da spiaggia", aff: null }],
    cultura:   [{ item: "Guida cartacea / offline", aff: "B09GUIDE55" }, { item: "Taccuino + penna", aff: "B08MUJI100" }, { item: "Foulard per chiese", aff: "B07SCARF99" }, { item: "Scarpe comodissime walking", aff: "B07WALK99" }],
    avventura: [{ item: "Zaino trekking 40L", aff: "B08TREK40L" }, { item: "Scarpe trekking impermeabili", aff: "B07TREK88" }, { item: "Crema antizanzare DEET", aff: "B09DEET555" }, { item: "Bastoncini trekking", aff: "B08POLES33" }, { item: "Lampada frontale", aff: "B07HEAD22" }],
    business:  [{ item: "Abito formale / blazer", aff: null }, { item: "Camicie ×3 stirate", aff: null }, { item: "Scarpe formali", aff: null }, { item: "Borsa laptop 15\"", aff: "B08LAPTOP9" }, { item: "Biglietti da visita", aff: null }],
    luxury:    [{ item: "Abito/vestito da sera", aff: null }, { item: "Profumo da viaggio", aff: "B09PERF55" }, { item: "Accessori formali", aff: null }, { item: "Cosmetici premium", aff: null }],
  },
  citySpecific: {
    TYO: [{ item: "IC Card Suica ricaricabile", aff: "B07SUICA11" }, { item: "Pocket WiFi prenotato", aff: "B08WIFIJP1" }, { item: "Biglietti Shinkansen (prenotare)", aff: null }],
    UKY: [{ item: "Yukata leggero (da portare)", aff: "B07YUKATA1" }, { item: "Ombrello pieghevole", aff: "B08KASA222" }],
    KIX: [{ item: "Yen in contanti (molti locali no card)", aff: null }, { item: "Guida Kansai Pass", aff: null }],
    BCN: [{ item: "Borsa antifurto crossbody", aff: "B08ANTITHEFT" }, { item: "Foulard per luoghi sacri", aff: "B07SCARF99" }],
    MAD: [{ item: "Borraccia termica 750ml", aff: "B08THERMOS7" }, { item: "Mappe metro offline", aff: null }],
    SVQ: [{ item: "Ventaglio (abanicos)", aff: "B07FANSPAI" }, { item: "Scarpe comode per sampietrini", aff: null }],
    VCE: [{ item: "Stivali di gomma (ottobre-marzo)", aff: "B09BOOTS01" }],
    ROM: [{ item: "Scarpe comode antiscivolo (sampietrini)", aff: "B07XQM3VFF" }],
    FLR: [{ item: "Zaino day-pack per musei", aff: "B08XYZ1234" }],
  }
};

// Stato valigia corrente — letto da savePackingList()
let currentPacking = null;

function precompilePacking(cityCode) {
  document.getElementById('packCity').value = cityCode;
}

function generatePacking() {
  const city = document.getElementById('packCity').value;
  const season = document.getElementById('packSeason').value;
  const tripType = document.getElementById('packType').value;

  if (!city) { showToast('⚠️ Seleziona una destinazione!'); return; }

  // Find city name
  let cityName = city;
  for (const cont of Object.values(DB.continents)) {
    for (const country of Object.values(cont.countries)) {
      if (country.cities && country.cities[city]) {
        cityName = country.cities[city].name;
        break;
      }
    }
  }

  const essentials = PACKING_DB.base;
  const seasonal = PACKING_DB.seasonal[season] || [];
  const typeItems = PACKING_DB.tripType[tripType] || [];
  const cityItems = PACKING_DB.citySpecific[city] || [];

  const categories = [
    { title: 'Documenti & Essenziali', icon: '📋', iconClass: 'cat-green', items: essentials },
    { title: `Abbigliamento — ${season.charAt(0).toUpperCase()+season.slice(1)}`, icon: '👕', iconClass: 'cat-amber', items: seasonal },
    { title: `Tipo Viaggio — ${tripType.charAt(0).toUpperCase()+tripType.slice(1)}`, icon: '🎯', iconClass: 'cat-teal', items: typeItems },
    { title: `Specifico per ${cityName}`, icon: '📍', iconClass: 'cat-purple', items: cityItems.length ? cityItems : [{ item: 'Nessun extra specifico per questa città', aff: null }] },
  ];

  const totalItems = categories.reduce((s,c) => s + c.items.length, 0);

  const catHTML = categories.map(cat => `
    <div class="pack-cat">
      <div class="pack-cat-header">
        <div class="pack-cat-icon ${cat.iconClass}">${cat.icon}</div>
        <div>
          <div class="pack-cat-title">${cat.title}</div>
          <div class="pack-cat-count">${cat.items.length} oggetti</div>
        </div>
      </div>
      ${cat.items.map((item, i) => `
        <div class="pack-item">
          <div class="pack-check" onclick="toggleCheck(this)" id="check-${cat.title.replace(/\s/g,'')}-${i}"></div>
          <div class="pack-item-label">${item.item}</div>
          ${item.aff ? `<a class="pack-aff-btn" href="https://amazon.it/dp/${item.aff}?tag=wanderquest-21" target="_blank" onclick="showToast('🛒 Commissione Amazon per WanderQuest!')">🛒 Amazon</a>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('');

  // Salva stato per il bottone cloud
  currentPacking = { city, cityName, season, tripType, totalItems };

  const result = document.getElementById('packing-result');
  result.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <div>
        <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700">Lista Valigia: ${cityName}</div>
        <div style="font-size:13px;color:var(--cream-dim);margin-top:4px">📅 ${season} · 🎯 ${tripType} · ${totalItems} oggetti totali</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="packing-save-btn" id="packingSaveBtn" onclick="savePackingList()">☁️ Salva su Cloud</button>
        <button onclick="printPacking()" style="background:rgba(255,255,255,0.06);border:1px solid var(--glass-border);color:var(--cream);padding:10px 18px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;">🖨️ Stampa / Salva PDF</button>
      </div>
    </div>
    <div class="packing-categories">${catHTML}</div>
    <div class="affiliate-disclaimer" style="margin-top:16px">🔗 I pulsanti 🛒 Amazon aprono link affiliati: stesso prezzo per te, piccola commissione per WanderQuest. Grazie!</div>
  `;
  result.className = 'show';
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function toggleCheck(el) {
  el.classList.toggle('checked');
}

function printPacking() {
  // Give browser a tick to render before printing
  setTimeout(() => window.print(), 80);
}

// ═══════════════════════════════════════════════════════════════════════
// PREMIUM TABLE
// ═══════════════════════════════════════════════════════════════════════
const FEATURES = [
  { name: 'Destinazioni disponibili', free: '12 paesi', pro: { label: 'Tutti i paesi', highlight: true } },
  { name: 'Gemme Nascoste per città', free: '1 su 3 visibile', pro: { label: 'Tutte e 3', highlight: true } },
  { name: 'Lista Valigia automatica', free: true, pro: { label: true } },
  { name: 'Link affiliati Amazon/Booking', free: '3 link/mese', pro: { label: 'Illimitati', highlight: true } },
  { name: 'Contest Foto — moltiplicatore voti', free: '×1 (base)', pro: { label: '×2 voti ricevuti', highlight: true } },
  { name: 'Annunci pubblicitari', free: 'Presenti', pro: { label: 'Zero pubblicità', highlight: true } },
  { name: 'Notifiche volo in tempo reale', free: '3 notifiche/mese', pro: { label: 'Illimitate', highlight: true } },
  { name: 'Download PDF itinerari', free: false, pro: { label: true } },
  { name: 'Classifica foto — Badge Verified', free: false, pro: { label: true } },
  { name: 'Pillola Culturale completa', free: '50 caratteri', pro: { label: '200 caratteri', highlight: true } },
  { name: 'Supporto prioritario', free: false, pro: { label: true } },
  { name: 'Early access nuove destinazioni', free: false, pro: { label: true } },
];

function renderPremiumTable() {
  document.getElementById('compareTableBody').innerHTML = FEATURES.map(f => {
    const freeVal = f.free === true ? '<span class="feature-icon yes">✓</span>' :
                    f.free === false ? '<span class="feature-icon no">—</span>' :
                    `<span style="font-size:13px;color:var(--cream-dim)">${f.free}</span>`;
    const proVal = f.pro.label === true ? '<span class="feature-icon yes">✓</span>' :
                   f.pro.highlight ? `<span class="pro-highlight">${f.pro.label}</span>` :
                   `<span style="font-size:13px;color:var(--cream)">${f.pro.label}</span>`;
    return `
      <tr>
        <td>${f.name}</td>
        <td class="plan-free">${freeVal}</td>
        <td class="plan-pro">${proVal}</td>
      </tr>
    `;
  }).join('');
}

const INCOME_STREAMS = [
  { val: '€6.99', label: 'per utente Pro/mese — abbonamento ricorrente' },
  { val: '3-8%', label: 'commissione Amazon su ogni acquisto affiliato' },
  { val: '4%', label: 'commissione Booking.com per notte prenotata' },
  { val: '€0.5-2', label: 'CPM pubblicità contestuale (utenti Free)' },
];

function renderIncomeStreams() {
  document.getElementById('incomeStreams').innerHTML = INCOME_STREAMS.map(s => `
    <div class="income-stream">
      <div class="income-stream-val">${s.val}</div>
      <div class="income-stream-label">${s.label}</div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════════════
// PHOTO CONTEST LEADERBOARDS
// ═══════════════════════════════════════════════════════════════════════
const LEADERBOARD_DATA = {
  IT: [
    { user: '@marco_scatta', dest: 'Venezia — Cannaregio', photo: '🏛️', votes: 1247, rank: 1 },
    { user: '@lucia_lens', dest: 'Roma — Pigneto', photo: '🏟️', votes: 1089, rank: 2 },
    { user: '@giovanna_ph', dest: 'Firenze — Oltrarno', photo: '🌉', votes: 891, rank: 3 },
    { user: '@andrea_snap', dest: 'Roma — Aventino', photo: '🌅', votes: 744, rank: 4 },
    { user: '@federica_click', dest: 'Venezia — Torcello', photo: '🚤', votes: 612, rank: 5 },
  ],
  ES: [
    { user: '@carlos_photo', dest: 'Barcellona — Gràcia', photo: '🎨', votes: 2103, rank: 1 },
    { user: '@ana_cataluña', dest: 'Siviglia — Triana', photo: '💃', votes: 1876, rank: 2 },
    { user: '@pablo_shots', dest: 'Madrid — Lavapiés', photo: '🎭', votes: 1540, rank: 3 },
    { user: '@isabella_es', dest: 'Barcellona — Bunkers', photo: '🌆', votes: 1201, rank: 4 },
    { user: '@rafaela_foto', dest: 'Siviglia — Setas', photo: '🏗️', votes: 987, rank: 5 },
  ],
  JP: [
    { user: '@yuki_tabi', dest: 'Kyoto — Fushimi (alba)', photo: '⛩️', votes: 3421, rank: 1 },
    { user: '@hiroshi_photo', dest: 'Tokyo — Yanaka', photo: '🏘️', votes: 2987, rank: 2 },
    { user: '@sakura_lens', dest: 'Osaka — Shinsekai', photo: '🌃', votes: 2654, rank: 3 },
    { user: '@kenji_snap', dest: 'Kyoto — Bamboo alba', photo: '🎋', votes: 2103, rank: 4 },
    { user: '@mika_frame', dest: 'Tokyo — Koenji', photo: '🎵', votes: 1876, rank: 5 },
  ],
};

const GLOBAL_LB = [
  { user: '@yuki_tabi', dest: '🇯🇵 Kyoto — Fushimi Inari', photo: '⛩️', votes: 8921, rank: 1 },
  { user: '@carlos_photo', dest: '🇪🇸 Barcellona — Bunkers del Carmel', photo: '🌆', votes: 7645, rank: 2 },
  { user: '@hiroshi_photo', dest: '🇯🇵 Tokyo — Yanaka Ginza', photo: '🏘️', votes: 6543, rank: 3 },
  { user: '@marco_scatta', dest: '🇮🇹 Venezia — Cannaregio alba', photo: '🏛️', votes: 5211, rank: 4 },
  { user: '@ana_cataluña', dest: '🇪🇸 Siviglia — Triana mattina', photo: '💃', votes: 4891, rank: 5 },
  { user: '@sakura_lens', dest: '🇯🇵 Osaka — Shinsekai', photo: '🌃', votes: 4102, rank: 6 },
  { user: '@lucia_lens', dest: '🇮🇹 Roma — Pigneto', photo: '🏟️', votes: 3876, rank: 7 },
];

function renderLBRow(row) {
  const rankClass = row.rank === 1 ? 'gold' : row.rank === 2 ? 'silver' : row.rank === 3 ? 'bronze' : '';
  return `
    <div class="lb-row">
      <div class="lb-rank ${rankClass}">${row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}</div>
      <div class="lb-photo" style="background:rgba(255,255,255,0.05)">${row.photo}</div>
      <div class="lb-info">
        <div class="lb-user">${row.user}</div>
        <div class="lb-dest">${row.dest}</div>
      </div>
      <div class="lb-votes">
        <div class="lb-vote-count">${row.votes.toLocaleString('it-IT')}</div>
        <div class="lb-vote-label">voti</div>
      </div>
    </div>
  `;
}

function renderCountryLeaderboard(country) {
  const rows = LEADERBOARD_DATA[country] || [];
  document.getElementById('countryLeaderboard').innerHTML = rows.map(renderLBRow).join('');
}

function renderGlobalLeaderboard() {
  document.getElementById('globalLeaderboard').innerHTML = GLOBAL_LB.map(renderLBRow).join('');
}


// ═══════════════════════════════════════════════════════════════════════
// MOBILE DRAWER
// ═══════════════════════════════════════════════════════════════════════
function toggleMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  const btn    = document.getElementById('navHamburger');
  const open   = drawer.classList.toggle('open');
  btn.classList.toggle('open', open);
  // Prevent body scroll when drawer is open
  document.body.style.overflow = open ? 'hidden' : '';
}

function closeMobileDrawer() {
  document.getElementById('mobileDrawer').classList.remove('open');
  document.getElementById('navHamburger').classList.remove('open');
  document.body.style.overflow = '';
}

// Close drawer on outside click
document.addEventListener('click', e => {
  const drawer = document.getElementById('mobileDrawer');
  const btn    = document.getElementById('navHamburger');
  if (drawer.classList.contains('open') && !drawer.contains(e.target) && !btn.contains(e.target)) {
    closeMobileDrawer();
  }
});

// ═══════════════════════════════════════════════════════════════════════
// SCROLL-SPY — active nav link
// ═══════════════════════════════════════════════════════════════════════
const NAV_SECTIONS = ['hero','explorer','how-it-works','packing','social-proof','premium','contest'];
const NAV_MAP = {
  'hero':         '#explorer',    // hero scrolls into explorer link
  'explorer':     '#explorer',
  'how-it-works': '#how-it-works',
  'packing':      '#packing',
  'social-proof': '#premium',
  'premium':      '#premium',
  'contest':      '#contest',
};

function updateScrollSpy(activeId) {
  document.querySelectorAll('.nav-links a, .mobile-drawer a').forEach(a => {
    const target = NAV_MAP[activeId];
    a.classList.toggle('active', a.getAttribute('href') === target);
  });
}

const scrollObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) updateScrollSpy(entry.target.id);
  });
}, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });

NAV_SECTIONS.forEach(id => {
  const el = document.getElementById(id);
  if (el) scrollObserver.observe(el);
});

// ═══════════════════════════════════════════════════════════════════════
// BACK TO TOP
// ═══════════════════════════════════════════════════════════════════════
window.addEventListener('scroll', () => {
  const btn = document.getElementById('backToTop');
  if (btn) btn.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });

// ═══════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(),300); }, 3500);
}

function openUpgrade() {
  // If user is not logged in, prompt login first, then open upgrade
  const user = firebaseAuth.currentUser;
  if (!user) {
    showToast('🔒 Accedi prima per procedere con l\'upgrade!');
    openAuthModal('login');
    return;
  }
  document.getElementById('upgradeOverlay').classList.remove('hidden');
}

function closeUpgradeModal() {
  document.getElementById('upgradeOverlay').classList.add('hidden');
}

function handleUpgradeOverlayClick(e) {
  if (e.target === document.getElementById('upgradeOverlay')) closeUpgradeModal();
}

async function handleUpgradeCheckout() {
  const user = firebaseAuth.currentUser;
  // Simulate checkout — in production replace with Stripe/Paddle redirect
  const btn = document.querySelector('.upgrade-modal-cta');
  btn.disabled = true;
  btn.textContent = '⏳ Reindirizzamento…';
  await new Promise(r => setTimeout(r, 1200));
  // Simulate successful upgrade (write to Firestore)
  if (user) {
    try {
      await updateDoc(doc(firestoreDb, 'users', user.uid), { plan: 'pro' });
      closeUpgradeModal();
      showToast('🎉 Benvenuto in Explorer Plus! Tutte le funzionalità sono ora sbloccate.');
    } catch (err) {
      closeUpgradeModal();
      showToast('✅ Upgrade simulato! (Integra Stripe per il pagamento reale)');
    }
  } else {
    closeUpgradeModal();
    showToast('✅ Upgrade simulato! Effettua il login per salvare il piano.');
  }
  btn.disabled = false;
  btn.textContent = 'Inizia ora — €6,99/mese →';
}

// ═══════════════════════════════════════════════════════════════════════
// FIREBASE AUTH — UI & LOGICA
// ═══════════════════════════════════════════════════════════════════════

function openAuthModal(tab = 'login') {
  document.getElementById('authOverlay').classList.remove('hidden');
  switchAuthTab(tab);
  setTimeout(() => {
    const id = tab === 'login' ? 'loginEmail' : 'regEmail';
    document.getElementById(id)?.focus();
  }, 80);
}

function closeAuthModal() {
  document.getElementById('authOverlay').classList.add('hidden');
  ['loginError','regError'].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = ''; el.classList.remove('show');
  });
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('authOverlay')) closeAuthModal();
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabRegister').classList.toggle('active', !isLogin);
  document.getElementById('formLogin').classList.toggle('hidden', !isLogin);
  document.getElementById('formRegister').classList.toggle('hidden', isLogin);
}

function setAuthLoading(formId, loading) {
  const btn = document.getElementById(formId === 'login' ? 'loginSubmit' : 'regSubmit');
  btn.disabled = loading;
  btn.textContent = loading ? 'Caricamento…' : (formId === 'login' ? 'Accedi →' : 'Crea Account →');
}

function showAuthError(formId, msg) {
  const el = document.getElementById(formId === 'login' ? 'loginError' : 'regError');
  el.textContent = msg; el.classList.add('show');
}

async function loginUser() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  errEl.classList.remove('show');
  if (!email || !password) { showAuthError('login', 'Inserisci email e password.'); return; }
  setAuthLoading('login', true);
  try {
    await signInWithEmailAndPassword(firebaseAuth, email, password);
    closeAuthModal();
    showToast('👋 Bentornato!');
  } catch (err) {
    const msgs = {
      'auth/user-not-found':  'Nessun account trovato con questa email.',
      'auth/wrong-password':  'Password errata. Riprova.',
      'auth/invalid-email':   'Formato email non valido.',
      'auth/too-many-requests': 'Troppi tentativi. Attendi qualche minuto.',
      'auth/invalid-credential': 'Email o password non corretti.',
    };
    showAuthError('login', msgs[err.code] || `Errore: ${err.message}`);
  } finally {
    setAuthLoading('login', false);
  }
}

async function registerUser() {
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regPasswordConfirm').value;
  document.getElementById('regError').classList.remove('show');
  if (!email || !password) { showAuthError('reg', 'Compila tutti i campi.'); return; }
  if (password.length < 6)  { showAuthError('reg', 'La password deve avere almeno 6 caratteri.'); return; }
  if (password !== confirm)  { showAuthError('reg', 'Le password non coincidono.'); return; }
  setAuthLoading('reg', true);
  try {
    // 1. Crea l'account su Firebase Auth
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const uid = credential.user.uid;

    // 2. Crea il documento profilo in Firestore: users/{uid}
    await setDoc(doc(firestoreDb, 'users', uid), {
      email,
      plan:       'free',           // 'free' | 'pro'
      createdAt:  new Date().toISOString(),
      valigie:    [],               // array di oggetti { nome, città, stagione, items[] }
      votedMete:  [],               // destinazioni votate tramite "Vota questa meta"
    });

    closeAuthModal();
    showToast('🎉 Account creato! Benvenuto in WanderQuest.');
  } catch (err) {
    const msgs = {
      'auth/email-already-in-use': 'Questa email è già registrata.',
      'auth/invalid-email':        'Formato email non valido.',
      'auth/weak-password':        'Password troppo debole.',
    };
    showAuthError('reg', msgs[err.code] || `Errore: ${err.message}`);
  } finally {
    setAuthLoading('reg', false);
  }
}

async function logoutUser() {
  hideUserMenu();
  await signOut(firebaseAuth);
  showToast('👋 Hai effettuato il logout.');
}

async function updateNavAuth(user) {
  const loggedOut = document.getElementById('navLoggedOut');
  const loggedIn  = document.getElementById('navLoggedIn');
  const drawerAuth = document.getElementById('mobileDrawerAuth');

  if (user) {
    loggedOut.classList.add('hidden');
    loggedIn.classList.remove('hidden');
    const initial = (user.email || '?')[0].toUpperCase();
    document.getElementById('navAvatar').textContent    = initial;
    document.getElementById('navUserLabel').textContent = user.displayName || user.email.split('@')[0];
    document.getElementById('navUserEmail').textContent = user.email;

    // Update mobile drawer: replace auth buttons with user info
    if (drawerAuth) {
      drawerAuth.innerHTML = `
        <button class="mobile-drawer-btn secondary" onclick="closeMobileDrawer();openMyProfile()" style="flex:1">👤 Profilo</button>
        <button class="mobile-drawer-btn secondary" onclick="closeMobileDrawer();openMyValigie()" style="flex:1">🧳 Valigie</button>
      `;
    }

    // Fetch valigie count for badge (non-blocking)
    try {
      const snap = await getDoc(doc(firestoreDb, 'users', user.uid));
      if (snap.exists()) {
        const count = (snap.data().valigie || []).length;
        const badge = document.getElementById('navValigieBadge');
        if (badge) {
          badge.textContent = count;
          badge.classList.toggle('hidden', count === 0);
        }
      }
    } catch { /* silently fail — badge is cosmetic */ }

  } else {
    loggedOut.classList.remove('hidden');
    loggedIn.classList.add('hidden');
    // Restore mobile drawer auth buttons
    if (drawerAuth) {
      drawerAuth.innerHTML = `
        <button class="mobile-drawer-btn secondary" onclick="closeMobileDrawer();openAuthModal('login')">Accedi</button>
        <button class="mobile-drawer-btn primary"   onclick="closeMobileDrawer();openAuthModal('register')">Registrati</button>
      `;
    }
    const badge = document.getElementById('navValigieBadge');
    if (badge) badge.classList.add('hidden');
  }
}

function showUserMenu() {
  document.getElementById('userDropdown').classList.toggle('hidden');
}
function hideUserMenu() {
  document.getElementById('userDropdown').classList.add('hidden');
}

// Close user menu on outside click
document.addEventListener('click', e => {
  const wrap = document.getElementById('navLoggedIn');
  if (wrap && !wrap.contains(e.target)) hideUserMenu();
});

// Auth state observer
onAuthStateChanged(firebaseAuth, user => updateNavAuth(user));

// ═══════════════════════════════════════════════════════════════════════
// FIRESTORE MIGRATION SCRIPT
// Run migrateDB() once in the browser console to seed Firestore.
// Comment out or delete after migration is complete.
// ═══════════════════════════════════════════════════════════════════════
async function migrateDB() {
  console.log('[WQ Migration] Avvio migrazione DB → Firestore…');
  let written = 0;
  for (const [contCode, cont] of Object.entries(DB.continents)) {
    // continents/{contCode}
    await setDoc(doc(firestoreDb, 'continents', contCode), {
      name:         cont.name,
      emoji:        cont.emoji,
      countryCount: cont.countryCount ?? Object.keys(cont.countries).length,
    });
    for (const [countryCode, country] of Object.entries(cont.countries)) {
      // continents/{contCode}/countries/{countryCode}
      await setDoc(
        doc(firestoreDb, `continents/${contCode}/countries`, countryCode),
        { name: country.name, emoji: country.emoji }
      );
      for (const [cityCode, city] of Object.entries(country.cities || {})) {
        // continents/{contCode}/countries/{countryCode}/cities/{cityCode}
        const cityPayload = {
          name:               city.name,
          emoji:              city.emoji,
          bg:                 city.bg,
          weather:            city.weather,
          weather_tags:       city.weather_tags,
          cultural_pill:      city.cultural_pill,
          hidden_gems:        city.hidden_gems,
          food:               city.food,
          affiliates_amazon:  city.affiliates_amazon,
          affiliates_booking: city.affiliates_booking,
        };
        await setDoc(
          doc(firestoreDb, `continents/${contCode}/countries/${countryCode}/cities`, cityCode),
          cityPayload
        );
        written++;
        console.log(`[WQ Migration] ✅ ${city.name} (${cityCode}) scritta`);
      }
    }
  }
  console.log(`[WQ Migration] ✅ Completata — ${written} città migrate su Firestore.`);
  showToast(`✅ Migrazione completata: ${written} città su Firestore!`);
}

// ═══════════════════════════════════════════════════════════════════════
// SALVA VALIGIA — Firestore
// ═══════════════════════════════════════════════════════════════════════
async function savePackingList() {
  const user = firebaseAuth.currentUser;
  if (!user) {
    showToast('🔒 Accedi per salvare la valigia sul cloud!');
    openAuthModal('login');
    return;
  }
  if (!currentPacking) { showToast('⚠️ Genera prima una lista valigia.'); return; }

  const btn = document.getElementById('packingSaveBtn');
  if (btn) { btn.disabled = true; btn.textContent = '☁️ Salvataggio…'; }

  const valigia = {
    nome:      `${currentPacking.cityName} — ${currentPacking.season}`,
    città:     currentPacking.city,
    cityName:  currentPacking.cityName,
    stagione:  currentPacking.season,
    tipo:      currentPacking.tripType,
    totale:    currentPacking.totalItems,
    savedAt:   new Date().toISOString(),
  };

  try {
    await updateDoc(doc(firestoreDb, 'users', user.uid), {
      valigie: arrayUnion(valigia),
    });
    showToast(`✅ "${valigia.nome}" salvata su cloud!`);
    if (btn) { btn.textContent = '✅ Salvata!'; btn.style.color = 'var(--green)'; }
  } catch (err) {
    console.error('[WQ] savePackingList:', err);
    showToast('❌ Errore nel salvataggio. Riprova.');
    if (btn) { btn.disabled = false; btn.textContent = '☁️ Salva su Cloud'; }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// LE MIE VALIGIE — Modal
// ═══════════════════════════════════════════════════════════════════════
async function openMyValigie() {
  hideUserMenu();
  const user = firebaseAuth.currentUser;
  if (!user) { showToast('🔒 Accedi per vedere le tue valigie!'); openAuthModal('login'); return; }

  document.getElementById('valigieOverlay').classList.remove('hidden');
  document.getElementById('valigieBody').innerHTML =
    '<div class="grid-spinner"><div class="spinner"></div><span>Caricamento valigie…</span></div>';

  try {
    const snap = await getDoc(doc(firestoreDb, 'users', user.uid));
    const data = snap.exists() ? snap.data() : {};
    const valigie = data.valigie || [];

    document.getElementById('valigieCountBadge').textContent = valigie.length;

    if (valigie.length === 0) {
      document.getElementById('valigieBody').innerHTML = `
        <div class="valigie-empty">
          <div class="valigie-empty-icon">🧳</div>
          <div style="font-size:18px;font-weight:700;color:var(--cream);margin-bottom:8px;">Nessuna valigia salvata</div>
          <div>Genera una lista dal Packing Planner e premi <strong style="color:var(--teal)">Salva su Cloud</strong> per ritrovarla qui su qualsiasi dispositivo.</div>
          <button class="valigie-empty-cta" onclick="closeValigieModal();document.getElementById('packing').scrollIntoView({behavior:'smooth'})">
            🧳 Vai al Packing Planner
          </button>
        </div>
      `;
      return;
    }

    // Render in reverse order (più recente prima)
    const sorted = [...valigie].reverse();
    document.getElementById('valigieBody').innerHTML = sorted.map((v, i) => {
      const realIdx = valigie.length - 1 - i; // indice originale per eliminazione
      const date = v.savedAt ? new Date(v.savedAt).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' }) : '—';
      return `
        <div class="valigia-card" id="valigia-card-${realIdx}">
          <div class="valigia-card-left">
            <div class="valigia-card-name">🧳 ${v.nome || v.cityName}</div>
            <div class="valigia-card-meta">
              <span class="valigia-meta-tag">📍 ${v.cityName}</span>
              <span class="valigia-meta-tag season">📅 ${v.stagione}</span>
              <span class="valigia-meta-tag">🎯 ${v.tipo}</span>
              <span class="valigia-meta-tag">${v.totale} oggetti</span>
            </div>
            <div class="valigia-card-date">Salvata il ${date}</div>
          </div>
          <div class="valigia-card-actions">
            <button class="valigia-action-btn" onclick="reloadValiglia('${v.città}','${v.stagione}','${v.tipo}')">↩ Ricarica</button>
            <button class="valigia-action-btn delete" onclick="deleteValiglia(${realIdx})">🗑</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('[WQ] openMyValigie:', err);
    document.getElementById('valigieBody').innerHTML =
      '<div class="valigie-empty"><div class="valigie-empty-icon">⚠️</div><div>Errore nel caricamento. Riprova.</div></div>';
  }
}

function closeValigieModal() {
  document.getElementById('valigieOverlay').classList.add('hidden');
}
function handleValigieOverlayClick(e) {
  if (e.target === document.getElementById('valigieOverlay')) closeValigieModal();
}

async function deleteValiglia(index) {
  const user = firebaseAuth.currentUser;
  if (!user) return;
  try {
    const snap = await getDoc(doc(firestoreDb, 'users', user.uid));
    const valigie = snap.exists() ? (snap.data().valigie || []) : [];
    const toDelete = valigie[index];
    if (!toDelete) return;
    await updateDoc(doc(firestoreDb, 'users', user.uid), {
      valigie: arrayRemove(toDelete),
    });
    showToast('🗑️ Valigia eliminata.');
    openMyValigie(); // ricarica il modal
  } catch (err) {
    console.error('[WQ] deleteValiglia:', err);
    showToast('❌ Errore nell\'eliminazione.');
  }
}

function reloadValiglia(city, season, tipo) {
  closeValigieModal();
  document.getElementById('packCity').value   = city;
  document.getElementById('packSeason').value = season;
  document.getElementById('packType').value   = tipo;
  generatePacking();
  document.getElementById('packing').scrollIntoView({ behavior: 'smooth' });
}

// ═══════════════════════════════════════════════════════════════════════
// IL MIO PROFILO — Modal
// ═══════════════════════════════════════════════════════════════════════
async function openMyProfile() {
  hideUserMenu();
  const user = firebaseAuth.currentUser;
  if (!user) { showToast('🔒 Accedi per vedere il tuo profilo!'); openAuthModal('login'); return; }

  document.getElementById('profileOverlay').classList.remove('hidden');
  document.getElementById('profileHeaderSub').textContent = user.email;
  document.getElementById('profileBody').innerHTML =
    '<div class="grid-spinner"><div class="spinner"></div><span>Caricamento profilo…</span></div>';

  try {
    const snap = await getDoc(doc(firestoreDb, 'users', user.uid));
    const data = snap.exists() ? snap.data() : {};
    const plan       = data.plan || 'free';
    const valigie    = data.valigie || [];
    const votedMete  = data.votedMete || [];
    const initial    = (user.email || '?')[0].toUpperCase();
    const joinDate   = data.createdAt
      ? new Date(data.createdAt).toLocaleDateString('it-IT', { day:'2-digit', month:'long', year:'numeric' })
      : 'Data non disponibile';

    document.getElementById('profileBody').innerHTML = `
      <div class="profile-hero">
        <div class="profile-avatar-lg">${initial}</div>
        <div>
          <div class="profile-info-email">${user.email}</div>
          <div class="profile-info-joined">Membro dal ${joinDate}</div>
          <div class="plan-badge ${plan}">${plan === 'pro' ? '⭐ Explorer Plus' : '🆓 Piano Free'}</div>
        </div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat">
          <div class="profile-stat-val">${valigie.length}</div>
          <div class="profile-stat-lbl">Valigie<br>salvate</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-val">${votedMete.length}</div>
          <div class="profile-stat-lbl">Mete<br>votate</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-val">${plan === 'pro' ? '∞' : '3'}</div>
          <div class="profile-stat-lbl">Link affiliati<br>disponibili</div>
        </div>
      </div>

      ${plan === 'free' ? `
      <div class="profile-upgrade-banner">
        <div class="profile-upgrade-text">Passa a <strong>Explorer Plus</strong> per valigie illimitate, zero pubblicità e ×2 voti contest.</div>
        <button class="profile-upgrade-btn" onclick="closeProfileModal();openUpgrade()">Upgrade €6,99/mese</button>
      </div>
      ` : `
      <div style="background:rgba(46,197,122,0.08);border:1px solid rgba(46,197,122,0.15);border-radius:12px;padding:16px 20px;font-size:13px;color:var(--green);">
        ✅ Sei su <strong>Explorer Plus</strong> — hai accesso a tutte le funzionalità premium.
      </div>
      `}
    `;
  } catch (err) {
    console.error('[WQ] openMyProfile:', err);
    document.getElementById('profileBody').innerHTML =
      '<div style="color:var(--cream-dim);padding:40px;text-align:center">⚠️ Errore nel caricamento del profilo.</div>';
  }
}

function closeProfileModal() {
  document.getElementById('profileOverlay').classList.add('hidden');
}
function handleProfileOverlayClick(e) {
  if (e.target === document.getElementById('profileOverlay')) closeProfileModal();
}

// ═══════════════════════════════════════════════════════════════════════
// INFO MODAL — Chi siamo, Privacy, Terms, ecc.
// ═══════════════════════════════════════════════════════════════════════
const INFO_CONTENT = {
  about: {
    title: '🌍 Chi siamo',
    sub: 'Il team dietro WanderQuest',
    html: `
      <p style="margin-bottom:16px">WanderQuest nasce nel 2024 da un'idea semplice: <strong style="color:var(--cream)">le migliori esperienze di viaggio non si trovano su TripAdvisor</strong>. Si trovano parlando con chi ci vive.</p>
      <p style="margin-bottom:16px">Siamo un piccolo team di viaggiatori, sviluppatori e fotografi convinti che il turismo di massa stia distruggendo ciò che rende speciali le destinazioni. WanderQuest è la nostra risposta: un ecosistema che premia chi esplora davvero, non chi si limita a scattare selfie davanti ai monumenti.</p>
      <div style="background:rgba(232,162,40,0.08);border:1px solid rgba(232,162,40,0.15);border-radius:12px;padding:16px 20px;margin:20px 0">
        <div style="font-size:12px;font-weight:700;color:var(--amber);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px">La nostra missione</div>
        <p>Costruire la community globale dei viaggiatori autentici — e premiarla per il valore che crea.</p>
      </div>
      <p style="margin-bottom:8px"><strong style="color:var(--cream)">Contatti:</strong> hello@wanderquest.app</p>
      <p><strong style="color:var(--cream)">Sede:</strong> Remoto — team distribuito in Europa</p>
    `
  },
  partner: {
    title: '🤝 Diventa Partner',
    sub: 'Collabora con WanderQuest',
    html: `
      <p style="margin-bottom:16px">WanderQuest offre diverse opportunità di partnership per brand, agenzie di viaggio, hotel e creator.</p>
      <div style="display:flex;flex-direction:column;gap:12px;margin:20px 0">
        ${[
          ['🏨','Hotel & Strutture ricettive','Inserimento nella nostra lista curata con badge verificato e visibilità diretta nelle schede città.'],
          ['📸','Content Creator','Collaborazioni editoriali per la produzione di gemme nascoste, foto e video autentici.'],
          ['🛒','Brand & E-commerce','Posizionamento nei consigli valigia con link affiliati integrati nei consigli personalizzati.'],
          ['✈️','Compagnie aeree & Tour Operator','Co-marketing su destinazioni specifiche con accesso alla community dei viaggiatori autentici.'],
        ].map(([icon,title,desc]) => `
          <div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:12px;padding:14px 16px;display:flex;gap:12px">
            <span style="font-size:22px;flex-shrink:0">${icon}</span>
            <div><div style="font-weight:700;color:var(--cream);margin-bottom:4px">${title}</div><div style="font-size:12px">${desc}</div></div>
          </div>`).join('')}
      </div>
      <p>Scrivici a <strong style="color:var(--amber)">partners@wanderquest.app</strong> con il soggetto "Partnership" per ricevere il media kit completo.</p>
    `
  },
  blog: {
    title: '✍️ Blog di Viaggio',
    sub: 'Storie dal campo — prossimamente',
    html: `
      <p style="margin-bottom:20px">Il blog di WanderQuest sarà uno spazio per <strong style="color:var(--cream)">storie autentiche scritte da chi viaggia davvero</strong> — non recensioni pagate, non guide ottimizzate per SEO.</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
        ${[
          ['🌅','Alba a Fushimi Inari','Come arrivare prima dei turisti e vivere un momento trascendentale — guida pratica.'],
          ['🍽️','Mangiare a Roma come un romano','I bacari nascosti, le trattorie senza insegna, i mercati all\'alba.'],
          ['🎒','Il minimalismo in viaggio','Come viaggiare con un solo zaino da 20L per 2 settimane — testato davvero.'],
        ].map(([icon,title,desc]) => `
          <div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:12px;padding:14px 16px">
            <div style="display:flex;gap:10px;align-items:flex-start">
              <span style="font-size:20px">${icon}</span>
              <div>
                <div style="font-weight:700;color:var(--cream);margin-bottom:3px">${title}</div>
                <div style="font-size:12px">${desc}</div>
                <div style="font-size:10px;color:var(--teal);margin-top:6px;font-weight:600">IN ARRIVO</div>
              </div>
            </div>
          </div>`).join('')}
      </div>
      <p>Vuoi scrivere per noi? Contattaci: <strong style="color:var(--amber)">blog@wanderquest.app</strong></p>
    `
  },
  press: {
    title: '📰 Press & Media',
    sub: 'Kit stampa e contatti media',
    html: `
      <p style="margin-bottom:20px">Per richieste di interviste, collaborazioni editoriali o accesso al media kit completo, contatta il nostro ufficio stampa.</p>
      <div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:14px;padding:20px;margin-bottom:20px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          ${[['📧 Email','press@wanderquest.app'],['📱 Telegram','@wanderquest_press'],['📊 Utenti attivi','12.400+'],['🌍 Paesi coperti','38'],['⭐ Valutazione media','4.8/5'],['📸 Foto nel contest','2.100+']].map(([k,v]) => `<div><div style="font-size:10px;color:var(--amber);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px">${k}</div><div style="font-weight:600;color:var(--cream);font-size:13px">${v}</div></div>`).join('')}
        </div>
      </div>
      <p style="font-size:12px">Il media kit include: logo in alta risoluzione, screenshot dell'app, scheda prodotto, dati di crescita e bio del team fondatore.</p>
    `
  },
  terms: {
    title: '📄 Termini e Condizioni',
    sub: 'Ultimo aggiornamento: Marzo 2025',
    html: `
      <p style="margin-bottom:16px">Utilizzando WanderQuest accetti i seguenti termini. Se non sei d\'accordo, ti preghiamo di non utilizzare il servizio.</p>
      ${[
        ['1. Accettazione','L\'uso dell\'app implica l\'accettazione integrale di questi termini. WanderQuest si riserva il diritto di modificarli con preavviso di 30 giorni via email.'],
        ['2. Account utente','Sei responsabile della sicurezza del tuo account. Non condividere le credenziali. WanderQuest non sarà responsabile per accessi non autorizzati derivanti da negligenza dell\'utente.'],
        ['3. Contenuti utente','Caricando foto o contenuti accetti che WanderQuest possa utilizzarli per promuovere il servizio, con attribuzione. Mantieni tutti i diritti sulle tue opere.'],
        ['4. Piano Premium','L\'abbonamento Explorer Plus si rinnova automaticamente. Puoi cancellare in qualsiasi momento dalla sezione Profilo. Nessun rimborso per periodi parziali.'],
        ['5. Link affiliati','WanderQuest utilizza link affiliati Amazon e Booking.com. Il prezzo per l\'utente rimane invariato. Le commissioni ci permettono di mantenere il servizio gratuito.'],
        ['6. Limitazione di responsabilità','Le informazioni sulle destinazioni sono fornite a scopo informativo. WanderQuest non è responsabile per decisioni di viaggio basate sui contenuti dell\'app.'],
      ].map(([t,c]) => `<div style="margin-bottom:16px"><div style="font-weight:700;color:var(--cream);margin-bottom:6px">${t}</div><p>${c}</p></div>`).join('')}
    `
  },
  privacy: {
    title: '🔒 Privacy Policy',
    sub: 'GDPR compliant · Firebase Auth · Ultimo aggiornamento: Marzo 2025',
    html: `
      <p style="margin-bottom:16px">WanderQuest rispetta la tua privacy. Questa policy descrive quali dati raccogliamo e come li utilizziamo.</p>
      ${[
        ['Dati raccolti','Email e password (tramite Firebase Auth, mai accessibili a noi in chiaro). Dati di utilizzo anonimi (pagine visitate, funzionalità usate). Valigie salvate e preferenze di viaggio (Firestore, accessibili solo a te).'],
        ['Come usiamo i tuoi dati','Per fornirti il servizio, personalizzare i contenuti, inviare notifiche di servizio (non marketing senza consenso esplicito).'],
        ['Firebase & Google','Utilizziamo Firebase di Google per autenticazione e database. Google tratta i dati secondo la propria Privacy Policy. I server sono in Europa (region: europe-west1).'],
        ['Link affiliati','Amazon e Booking.com possono ricevere dati tecnici anonimi (IP, browser) quando clicchi sui link. Non trasmettiamo mai il tuo nome o email a terze parti.'],
        ['I tuoi diritti (GDPR)','Diritto di accesso, rettifica, cancellazione e portabilità dei dati. Per richieste: privacy@wanderquest.app. Risposta garantita entro 30 giorni.'],
        ['Cancellazione account','Puoi richiedere la cancellazione completa di tutti i tuoi dati inviando email a privacy@wanderquest.app con oggetto "Cancellazione account".'],
      ].map(([t,c]) => `<div style="margin-bottom:16px"><div style="font-weight:700;color:var(--cream);margin-bottom:6px">${t}</div><p>${c}</p></div>`).join('')}
    `
  },
  cookies: {
    title: '🍪 Cookie Policy',
    sub: 'Ultimo aggiornamento: Marzo 2025',
    html: `
      <p style="margin-bottom:20px">WanderQuest è una <strong style="color:var(--cream)">Single Page Application</strong>. Utilizziamo un numero minimo di cookie, tutti necessari al funzionamento del servizio.</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
        ${[
          ['🔐','Cookie di autenticazione','firebase:authUser:*','Sessione','Necessario per mantenerti loggato. Rimosso al logout.'],
          ['⚙️','Preferenze locali','wq_prefs','Persistente','Salva preferenze UI (tema, lingua). Non contiene dati personali.'],
        ].map(([icon,name,key,dur,desc]) => `
          <div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:12px;padding:14px 16px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span>${icon}</span>
              <strong style="color:var(--cream);font-size:13px">${name}</strong>
              <code style="font-size:10px;background:rgba(255,255,255,0.08);padding:2px 7px;border-radius:4px;color:var(--teal)">${key}</code>
              <span style="font-size:10px;color:var(--cream-dim);margin-left:auto">${dur}</span>
            </div>
            <p style="font-size:12px">${desc}</p>
          </div>`).join('')}
      </div>
      <p style="font-size:12px">Non utilizziamo cookie di tracking, profilazione o pubblicitari. Non vendiamo dati a terze parti.</p>
    `
  },
  affiliates: {
    title: '⚖️ Note sulle Affiliazioni',
    sub: 'Trasparenza completa sui link affiliati',
    html: `
      <p style="margin-bottom:16px">WanderQuest utilizza programmi di affiliazione per sostenere il servizio gratuito. Ecco come funziona in totale trasparenza.</p>
      <div style="display:flex;flex-direction:column;gap:12px;margin:20px 0">
        ${[
          ['🛒','Amazon Associates','Quando clicchi su un link prodotto Amazon e acquisti, WanderQuest riceve una commissione del 3-8% sul valore dell\'ordine. Il prezzo che paghi rimane identico — non c\'è nessun costo aggiuntivo per te.'],
          ['🏨','Booking.com Partner','Quando prenoti un alloggio tramite i nostri link, WanderQuest riceve una commissione di circa il 4% sul valore della prenotazione. Il prezzo finale è identico a quello che troveresti su Booking.com direttamente.'],
        ].map(([icon,title,desc]) => `
          <div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:12px;padding:16px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <span style="font-size:22px">${icon}</span>
              <strong style="color:var(--cream)">${title}</strong>
            </div>
            <p style="font-size:13px">${desc}</p>
          </div>`).join('')}
      </div>
      <div style="background:rgba(24,197,168,0.08);border:1px solid rgba(24,197,168,0.15);border-radius:10px;padding:14px 16px;font-size:13px">
        <strong style="color:var(--teal)">Principio editoriale:</strong> I prodotti e gli alloggi consigliati sono selezionati esclusivamente per il loro valore per l\'utente. Non accettiamo pagamenti per inserire link — solo commissioni sulle transazioni effettive.
      </div>
    `
  },
};

function openInfoModal(page) {
  const content = INFO_CONTENT[page];
  if (!content) return;
  document.getElementById('infoModalTitle').textContent  = content.title;
  document.getElementById('infoModalSub').textContent    = content.sub;
  document.getElementById('infoModalBody').innerHTML     = content.html;
  document.getElementById('infoOverlay').classList.remove('hidden');
}

function closeInfoModal() {
  document.getElementById('infoOverlay').classList.add('hidden');
}

function handleInfoOverlayClick(e) {
  if (e.target === document.getElementById('infoOverlay')) closeInfoModal();
}

// ═══════════════════════════════════════════════════════════════════════
// KEYBOARD — Escape chiude tutti i modali aperti
// ═══════════════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const modals = [
    { id: 'infoOverlay',     close: closeInfoModal },
    { id: 'upgradeOverlay',  close: closeUpgradeModal },
    { id: 'profileOverlay',  close: closeProfileModal },
    { id: 'valigieOverlay',  close: closeValigieModal },
    { id: 'authOverlay',     close: closeAuthModal },
  ];
  for (const { id, close } of modals) {
    const el = document.getElementById(id);
    if (el && !el.classList.contains('hidden')) { close(); break; }
  }
  // Also close search dropdown
  const dd = document.getElementById('searchDropdown');
  if (dd && dd.style.display !== 'none') clearSearch();
});

// ═══════════════════════════════════════════════════════════════════════
// BUDGET CALCULATOR
// ═══════════════════════════════════════════════════════════════════════
const BUDGET_COSTS = {
  // [budget, mid, luxury] — costo giornaliero medio per persona (€)
  ROM: [65,  130, 280], FLR: [60, 120, 250], VCE: [75, 160, 340],
  BCN: [70,  140, 300], MAD: [60, 120, 260], SVQ: [50, 100, 220],
  TYO: [80,  160, 350], KIX: [70, 140, 310], UKY: [65, 130, 280],
  _default: [60, 130, 280],
};

function calcBudget(cityCode) {
  const days  = parseInt(document.getElementById(`budget-days-${cityCode}`)?.value)  || 5;
  const style = document.getElementById(`budget-style-${cityCode}`)?.value || 'mid';
  const pax   = parseInt(document.getElementById(`budget-pax-${cityCode}`)?.value)   || 2;
  const costs = BUDGET_COSTS[cityCode] || BUDGET_COSTS._default;
  const styleIdx = { budget: 0, mid: 1, luxury: 2 }[style] ?? 1;
  const daily = costs[styleIdx];
  const total = daily * days * pax;
  const el = document.getElementById(`budget-result-${cityCode}`);
  if (!el) return;
  el.innerHTML = `
    <div class="budget-result-val">€${total.toLocaleString('it-IT')}</div>
    <div class="budget-result-lbl">${days}g · ${pax} ${pax === 1 ? 'persona' : 'persone'} · ~€${daily}/g</div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════
// SHARE CITY
// ═══════════════════════════════════════════════════════════════════════
async function shareCity(code, name, emoji) {
  const url  = `${location.origin}${location.pathname}?city=${code}`;
  const text = `${emoji} Scopri ${name} su WanderQuest — gemme nascoste, cibo autentico e niente folla.`;
  if (navigator.share) {
    try {
      await navigator.share({ title: `${emoji} ${name} — WanderQuest`, text, url });
      return;
    } catch { /* user cancelled */ }
  }
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    showToast(`📋 Link per ${name} copiato negli appunti!`);
  } catch {
    showToast(`🔗 ${url}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// RECENTLY VIEWED CITIES
// ═══════════════════════════════════════════════════════════════════════
const RV_KEY = 'wq_recently_viewed';
const RV_MAX = 5;

function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem(RV_KEY) || '[]'); }
  catch { return []; }
}

function addToRecentlyViewed(code, city, countryCode) {
  const entry = {
    code,
    cityCode: code,
    countryCode,
    continentCode: selectedContinent,
    name:  city.name,
    emoji: city.emoji,
  };
  let rv = getRecentlyViewed().filter(r => r.code !== code);
  rv.unshift(entry);
  rv = rv.slice(0, RV_MAX);
  try { localStorage.setItem(RV_KEY, JSON.stringify(rv)); } catch {}
  renderRecentlyViewed();
updateWishBadge();
buildSwipeQueue();
renderSwipeDeck();
}

function renderRecentlyViewed() {
  const rv   = getRecentlyViewed();
  const wrap = document.getElementById('recentlyViewedWrap');
  const container = document.getElementById('recentlyViewedChips');
  if (!wrap || !container) return;
  if (rv.length === 0) { wrap.classList.add('hidden'); return; }
  wrap.classList.remove('hidden');
  container.innerHTML = rv.map(r => `
    <div class="rv-chip" onclick="jumpToRecentCity('${r.continentCode}','${r.countryCode}','${r.code}')">
      <span class="rv-chip-emoji">${r.emoji}</span>
      <span>${r.name}</span>
    </div>
  `).join('');
}

async function jumpToRecentCity(continentCode, countryCode, cityCode) {
  selectedContinent = continentCode;
  selectedCountry   = countryCode;
  selectedCity      = cityCode;
  // Update breadcrumbs
  document.getElementById('step-continent').className = 'drill-step done';
  document.getElementById('step-country').className   = 'drill-step done';
  document.getElementById('step-city').className      = 'drill-step done';
  // Hydrate grids silently for back-navigation
  renderContinents();
  await renderCountries(continentCode);
  await renderCities(continentCode, countryCode);
  goToLevel('city');
  const city    = DB.continents[continentCode]?.countries[countryCode]?.cities[cityCode];
  const country = DB.continents[continentCode]?.countries[countryCode];
  if (city && country) {
    renderCityDetail(cityCode, city, country);
    document.getElementById('city-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CLAUDE AI — Core helper
// ═══════════════════════════════════════════════════════════════════════
async function claudeAsk(systemPrompt, userMessage, maxTokens = 600) {
  const res = await fetch(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

// ═══════════════════════════════════════════════════════════════════════
// AI CITY CHAT — conversazione multi-turno (cronologia in memoria per sessione)
// ═══════════════════════════════════════════════════════════════════════
const chatHistories = {}; // { cityCode: [{role, content}] }

function appendChatMessage(cityCode, role, text) {
  const container = document.getElementById(`chat-msgs-${cityCode}`);
  if (!container) return;
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  const avatarChar = role === 'ai' ? '🤖' : '👤';
  div.innerHTML = `
    <div class="chat-msg-avatar">${avatarChar}</div>
    <div class="chat-bubble">${text.replace(/\n/g, '<br>')}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping(cityCode) {
  const container = document.getElementById(`chat-msgs-${cityCode}`);
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'chat-msg ai';
  div.id = `typing-${cityCode}`;
  div.innerHTML = `
    <div class="chat-msg-avatar">🤖</div>
    <div class="chat-typing">
      <div class="chat-typing-dot"></div>
      <div class="chat-typing-dot"></div>
      <div class="chat-typing-dot"></div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTyping(cityCode) {
  document.getElementById(`typing-${cityCode}`)?.remove();
}

async function sendCityChat(cityCode, cityName) {
  const inputEl = document.getElementById(`chat-input-${cityCode}`);
  const sendBtn = document.getElementById(`chat-send-${cityCode}`);
  const question = inputEl?.value?.trim();
  if (!question) return;

  inputEl.value = '';
  sendBtn.disabled = true;
  appendChatMessage(cityCode, 'user', question);
  showTyping(cityCode);

  // Build history
  if (!chatHistories[cityCode]) chatHistories[cityCode] = [];
  chatHistories[cityCode].push({ role: 'user', content: question });

  const systemPrompt = `Sei un esperto di viaggi autentico specializzato in ${cityName}. 
Conosci la città come un residente: quartieri nascosti, locali senza insegne, mercati mattutini, trasporti locali, cultura reale.
Rispondi sempre in italiano. Sii conciso (max 3 paragrafi), pratico e specifico — evita generalità turistiche.
Usa occasionalmente emoji per rendere il testo più leggibile. Tono: amichevole ma esperto.`;

  try {
    // Multi-turn: send full history
    const res = await fetch(CLAUDE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 500,
        system: systemPrompt,
        messages: chatHistories[cityCode],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const answer = data.content?.[0]?.text || '…';
    chatHistories[cityCode].push({ role: 'assistant', content: answer });
    removeTyping(cityCode);
    appendChatMessage(cityCode, 'ai', answer);
  } catch (err) {
    removeTyping(cityCode);
    appendChatMessage(cityCode, 'ai', `❌ Errore: ${err.message}`);
  }
  sendBtn.disabled = false;
  inputEl.focus();
}

function sendChatSuggestion(cityCode, cityName, text) {
  const inputEl = document.getElementById(`chat-input-${cityCode}`);
  if (inputEl) { inputEl.value = text; }
  sendCityChat(cityCode, cityName);
}

// ═══════════════════════════════════════════════════════════════════════
// AI WEATHER ANALYSIS — consiglio AI sul periodo migliore
// ═══════════════════════════════════════════════════════════════════════
async function askWeatherAI(cityCode, cityName) {
  const btn = document.querySelector(`[onclick*="askWeatherAI('${cityCode}'"]`);
  const resultEl = document.getElementById(`weather-ai-${cityCode}`);
  if (!resultEl) return;

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Analizzando…'; }
  resultEl.classList.remove('show');
  resultEl.textContent = '';

  const city = DB.continents[selectedContinent]?.countries[selectedCountry]?.cities[cityCode];
  const weatherInfo = city ? JSON.stringify(city.weather) : '';

  try {
    const answer = await claudeAsk(
      `Sei un esperto meteo e viaggi. Rispondi in italiano, in modo conciso e pratico (max 120 parole). Usa emoji.`,
      `Città: ${cityName}. Dati meteo disponibili: ${weatherInfo}.
Dammi 3 consigli: 1) Il mese/stagione MIGLIORE per visitarla e perché. 2) Il periodo da EVITARE assolutamente. 3) Un pro-tip meteo che i turisti non sanno.`,
      250
    );
    resultEl.textContent = answer;
    resultEl.classList.add('show');
  } catch (err) {
    resultEl.textContent = `❌ ${err.message}`;
    resultEl.classList.add('show');
  }
  if (btn) { btn.disabled = false; btn.textContent = '🌤️ Quando è il momento giusto?'; }
}

// ═══════════════════════════════════════════════════════════════════════
// AI ITINERARY GENERATOR
// ═══════════════════════════════════════════════════════════════════════
async function generateItinerary() {
  const dest   = document.getElementById('itin-dest')?.value?.trim();
  const days   = document.getElementById('itin-days')?.value   || '5';
  const style  = document.getElementById('itin-style')?.value  || 'autentico';
  const season = document.getElementById('itin-season')?.value || 'estate';
  if (!dest) { showToast('✍️ Inserisci una destinazione!'); document.getElementById('itin-dest').focus(); return; }

  const btn     = document.getElementById('itinBtn');
  const spinner = document.getElementById('itinSpinner');
  const output  = document.getElementById('itinOutput');

  btn.disabled = true;
  btn.textContent = '⏳ Generando…';
  spinner.classList.add('show');
  output.classList.remove('show');
  output.innerHTML = '';

  const systemPrompt = `Sei un travel planner esperto che conosce le destinazioni come un residente locale.
Crei itinerari AUTENTICI che evitano le trappole turistiche e privilegiano esperienze reali.
Rispondi SEMPRE in italiano. Usa questo formato esatto per ogni giorno:
**Giorno N — Titolo evocativo**
🌅 Mattina: [attività specifica con nome luogo]
🌞 Pomeriggio: [attività specifica con nome luogo]  
🌙 Sera: [cena/attività serale con nome locale]
💡 Tip del giorno: [consiglio pratico che solo i residenti conoscono]
Alla fine aggiungi una sezione "🎒 Cosa portare" con 3-4 elementi specifici per questo viaggio.`;

  const userPrompt = `Crea un itinerario da ${days} giorni per ${dest}.
Stile: ${style}. Stagione: ${season}.
Includi SOLO luoghi specifici con nome, non generici. Privilegia esperienze locali e autentiche su quelle turistiche di massa.`;

  try {
    const itinerary = await claudeAsk(systemPrompt, userPrompt, 1200);
    // Format markdown-like syntax
    const formatted = itinerary
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^(🌅|🌞|🌙|💡|🎒)/gm, '<br>$1')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    output.innerHTML = `<p>${formatted}</p>`;
    output.classList.add('show');
    output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // Save to user's Firestore if logged in
    const user = firebaseAuth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(firestoreDb, 'users', user.uid), {
          itinerari: arrayUnion({
            dest, days, style, season,
            createdAt: new Date().toISOString(),
            preview: itinerary.slice(0, 100),
          }),
        });
      } catch { /* non bloccante */ }
    }
  } catch (err) {
    output.innerHTML = `<p style="color:var(--red)">❌ Errore: ${err.message}</p>`;
    output.classList.add('show');
  }
  btn.disabled = false;
  btn.textContent = '✨ Genera Itinerario';
  spinner.classList.remove('show');
}



// ═══════════════════════════════════════════════════════════════════════
// TRANSIT EXPLORER
// ═══════════════════════════════════════════════════════════════════════
const _transitInit = {};

function initTransit(cityCode) {
  if (_transitInit[cityCode]) return; // already rendered
  _transitInit[cityCode] = true;
  const t = TRANSIT_DB[cityCode];
  const container = document.getElementById('transit-widget-' + cityCode);
  if (!container) return;

  if (!t) {
    container.innerHTML = '<div class="tip-list" style="padding-top:4px">' +
      '<div class="tip-row"><div class="tip-dot"></div>Dati trasporti non ancora disponibili per questa città. Usa Google Maps in modalità trasporti pubblici per pianificare i tuoi spostamenti.</div>' +
      '<div class="tip-row"><div class="tip-dot"></div><a href="https://moovitapp.com" target="_blank" style="color:var(--teal)">Apri Moovit</a> per orari in tempo reale.</div>' +
      '</div>';
    return;
  }

  // Lines
  const linesHTML = t.systems.map(s =>
    '<span class="transit-line" style="background:' + s.color + '22;border:1.5px solid ' + s.color + '55;color:' + s.color + '">' + s.icon + ' ' + s.name + '</span>'
  ).join('');

  // Tips
  const tipsHTML = t.tips.map(tip =>
    '<div class="tip-row"><div class="tip-dot"></div>' + tip + '</div>'
  ).join('');

  // Apps
  const appsHTML = t.apps.map(a =>
    '<a class="transit-app" href="' + a.url + '" target="_blank"><span class="transit-app-icon">' + a.icon + '</span>' + a.name + '</a>'
  ).join('');

  // Landmark suggestions for "to" field
  const landmarkOpts = t.landmarks.map(l =>
    '<option value="' + l + '">' + l + '</option>'
  ).join('');

  // Map embed (free, no API key needed)
  const mapSrc = 'https://maps.google.com/maps?q=' + encodeURIComponent(t.city + ' metro trasporti') + '&output=embed&hl=it';
  const mapsFullUrl = 'https://www.google.com/maps/search/' + encodeURIComponent(t.city + ' trasporti pubblici');

  container.innerHTML =
    '<div class="transit-shell">' +

    // Lines strip
    '<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--cream-dim);margin-bottom:8px">Reti disponibili</div>' +
    '<div class="transit-lines">' + linesHTML + '</div></div>' +

    // Info chips
    '<div class="transit-info-row">' +
    '<div class="transit-chip">🎫 Giornaliero <span class="transit-chip-val">' + t.dayPass + '</span></div>' +
    '<div class="transit-chip">📅 Settimanale <span class="transit-chip-val">' + t.weekPass + '</span></div>' +
    '<div class="transit-chip">🏢 Hub <span class="transit-chip-val">' + t.mainHub + '</span></div>' +
    '</div>' +

    // Route planner
    '<div class="transit-planner">' +
    '<div class="transit-planner-header">🗺️ Pianifica il percorso in <strong>' + t.city + '</strong></div>' +
    '<div class="transit-planner-body">' +
    '<div class="transit-field-row">' +
    '<span class="transit-field-icon">📍</span>' +
    '<input class="transit-input" id="transit-from-' + cityCode + '" placeholder="Da dove parti? (o usa la tua posizione →)" />' +
    '</div>' +
    '<div class="transit-field-row">' +
    '<span class="transit-field-icon">🏁</span>' +
    '<select class="transit-input" id="transit-to-' + cityCode + '" style="cursor:pointer">' +
    '<option value="">Dove vuoi andare?</option>' +
    '<optgroup label="Luoghi principali">' + landmarkOpts + '</optgroup>' +
    '<option value="__custom">✏️ Scrivi destinazione…</option>' +
    '</select>' +
    '</div>' +
    '<div id="transit-custom-wrap-' + cityCode + '" style="display:none">' +
    '<div class="transit-field-row">' +
    '<span class="transit-field-icon">✏️</span>' +
    '<input class="transit-input" id="transit-to-custom-' + cityCode + '" placeholder="Scrivi destinazione libera…" />' +
    '</div></div>' +
    '<div class="transit-input-actions">' +
    '<button class="transit-locate-btn" id="transit-loc-' + cityCode + '" onclick="useMyLocation('' + cityCode + '')">' +
    '📡 Usa la mia posizione</button>' +
    '<button class="transit-go-btn" onclick="openTransitRoute('' + cityCode + '')">' +
    '🚇 Apri percorso in Maps</button>' +
    '</div>' +
    '</div></div>' +

    // Map embed
    '<div class="transit-map-wrap">' +
    '<iframe src="' + mapSrc + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>' +
    '<div class="transit-map-overlay">' +
    '<span class="transit-map-label">Mappa trasporti ' + t.city + '</span>' +
    '<button class="transit-fullmap-btn" onclick="window.open('' + mapsFullUrl + '','_blank')">Apri in Maps ↗</button>' +
    '</div></div>' +

    // Tips
    '<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--amber);margin-bottom:8px">💡 Consigli pratici</div>' +
    '<div class="tip-list">' + tipsHTML + '</div></div>' +

    // Apps
    '<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--teal);margin-bottom:8px">📲 App consigliate</div>' +
    '<div class="transit-apps">' + appsHTML + '</div></div>' +

    '</div>'; // /transit-shell

  // Wire up custom destination toggle
  const sel = document.getElementById('transit-to-' + cityCode);
  if (sel) {
    sel.onchange = () => {
      const wrap = document.getElementById('transit-custom-wrap-' + cityCode);
      if (wrap) wrap.style.display = sel.value === '__custom' ? 'block' : 'none';
    };
  }
}

function useMyLocation(cityCode) {
  const btn = document.getElementById('transit-loc-' + cityCode);
  if (!navigator.geolocation) { showToast('⚠️ Geolocalizzazione non supportata dal browser'); return; }
  if (btn) { btn.disabled = true; btn.textContent = '📡 Rilevamento posizione…'; }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const fromInput = document.getElementById('transit-from-' + cityCode);
      if (fromInput) fromInput.value = pos.coords.latitude.toFixed(5) + ',' + pos.coords.longitude.toFixed(5);
      if (btn) { btn.disabled = false; btn.textContent = '✅ Posizione rilevata!'; setTimeout(() => { btn.textContent = '📡 Usa la mia posizione'; }, 2500); }
      showToast('📍 Posizione rilevata con successo');
    },
    err => {
      if (btn) { btn.disabled = false; btn.textContent = '📡 Usa la mia posizione'; }
      showToast('⚠️ Impossibile rilevare la posizione. Controlla i permessi del browser.');
    },
    { timeout: 8000, enableHighAccuracy: true }
  );
}

function openTransitRoute(cityCode) {
  const t = TRANSIT_DB[cityCode];
  const fromEl = document.getElementById('transit-from-' + cityCode);
  const toEl   = document.getElementById('transit-to-' + cityCode);
  const toCustomEl = document.getElementById('transit-to-custom-' + cityCode);

  let from = fromEl ? fromEl.value.trim() : '';
  let to   = toEl   ? toEl.value.trim()   : '';
  if (to === '__custom') to = toCustomEl ? toCustomEl.value.trim() : '';

  const cityName = t ? t.city : 'Città';
  if (!from) from = cityName; // fallback to city
  if (!to || to === '__custom') { showToast('⚠️ Seleziona o scrivi una destinazione'); return; }

  // Google Maps transit URL (no API key needed)
  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  const origin  = encodeURIComponent(from.includes(',') ? from : from + ', ' + cityName);
  const dest    = encodeURIComponent(to + ', ' + cityName);
  const url     = baseUrl + '&origin=' + origin + '&destination=' + dest + '&travelmode=transit&dir_action=navigate';

  window.open(url, '_blank');
  showToast('🚇 Apertura percorso in Google Maps…');
}


// ═══════════════════════════════════════════════════════════════════════
// SWIPE VOTING ENGINE
// ═══════════════════════════════════════════════════════════════════════
const SWIPE_PHOTOS = [
  { id:'p1', city:'Roma', country:'IT', user:'@marco_scatta', emoji:'🏛️', caption:'Colosseo alle 5:30 — nessun turista, solo piccioni e me.', bg:'linear-gradient(135deg,#8B0000,#C0392B)', votes:1247 },
  { id:'p2', city:'Barcellona', country:'ES', user:'@carlos_photo', emoji:'🎨', caption:'El Born prima dell'apertura dei bar. Luce perfetta.', bg:'linear-gradient(135deg,#2C3E50,#E74C3C)', votes:2103 },
  { id:'p3', city:'Kyoto', country:'JP', user:'@yuki_tabi', emoji:'⛩️', caption:'Fushimi Inari all'alba — 4.000 torii e zero persone.', bg:'linear-gradient(135deg,#C0392B,#8E44AD)', votes:3421 },
  { id:'p4', city:'Venezia', country:'IT', user:'@lucia_lens', emoji:'🚤', caption:'Cannaregio alle 7:00 — la Venezia che non esiste sulle riviste.', bg:'linear-gradient(135deg,#1A5276,#21618C)', votes:1089 },
  { id:'p5', city:'Tokyo', country:'JP', user:'@hiroshi_photo', emoji:'🏘️', caption:'Yanaka — il quartiere che Tokyo dimentica di avere.', bg:'linear-gradient(135deg,#1C1C2E,#2E4057)', votes:2987 },
  { id:'p6', city:'Siviglia', country:'ES', user:'@ana_cataluña', emoji:'💃', caption:'Triana al tramonto. L'unico posto dove il flamenco ha senso.', bg:'linear-gradient(135deg,#7D6608,#D4AC0D)', votes:1876 },
  { id:'p7', city:'Firenze', country:'IT', user:'@giovanna_ph', emoji:'🌉', caption:'Oltrarno alle 6:00 — Ponte Vecchio senza selfie stick.', bg:'linear-gradient(135deg,#641E16,#922B21)', votes:891 },
  { id:'p8', city:'Osaka', country:'JP', user:'@sakura_lens', emoji:'🌃', caption:'Shinsekai di notte — neon e solitudine giapponese.', bg:'linear-gradient(135deg,#1B2631,#2C3E50)', votes:2654 },
  { id:'p9', city:'Madrid', country:'ES', user:'@pablo_shots', emoji:'🎭', caption:'Lavapiés alle 23:00 — il Madrid che batte a Malasaña.', bg:'linear-gradient(135deg,#4A235A,#7D3C98)', votes:1540 },
  { id:'p10', city:'Roma', country:'IT', user:'@andrea_snap', emoji:'🌅', caption:'Giardino degli Aranci — la vista che i romani si tengono per sé.', bg:'linear-gradient(135deg,#1A5276,#117864)', votes:744 },
  { id:'p11', city:'Kyoto', country:'JP', user:'@kenji_snap', emoji:'🎋', caption:'Bamboo Grove alle 5:00 — silenzio assoluto.', bg:'linear-gradient(135deg,#145A32,#1E8449)', votes:2103 },
  { id:'p12', city:'Barcellona', country:'ES', user:'@isabella_es', emoji:'🌆', caption:'Bunkers del Carmel all'alba — la vista proibita di BCN.', bg:'linear-gradient(135deg,#154360,#1A5276)', votes:1201 },
];

let swipeQueue = [];
let swipeCurrent = null;
let swipeFilter = 'all';
let swipeStats = { liked:0, skipped:0, super:0 };
let swipeLog = [];
let _isDragging = false;
let _startX = 0, _startY = 0, _currentX = 0;
let _swipeAnimating = false;

function setSwipeFilter(filter, el) {
  swipeFilter = filter;
  document.querySelectorAll('.swipe-filter-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  buildSwipeQueue();
  renderSwipeDeck();
}

function buildSwipeQueue() {
  let pool = swipeFilter === 'all'
    ? [...SWIPE_PHOTOS]
    : SWIPE_PHOTOS.filter(p => p.country === swipeFilter);
  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  swipeQueue = pool;
}

function renderSwipeDeck() {
  const deck = document.getElementById('swipeDeck');
  const empty = document.getElementById('swipeEmpty');
  const actions = document.getElementById('swipeActions');
  const hint = document.getElementById('swipeHint');
  if (!deck) return;

  // Remove old cards
  deck.querySelectorAll('.swipe-card').forEach(el => el.remove());

  if (swipeQueue.length === 0) {
    empty.classList.add('show');
    if (actions) actions.style.opacity = '0.3';
    if (hint) hint.style.opacity = '0';
    return;
  }
  empty.classList.remove('show');
  if (actions) actions.style.opacity = '1';
  if (hint) hint.style.opacity = '1';

  // Render top 2 cards (front + behind)
  const toRender = swipeQueue.slice(0, 2).reverse();
  toRender.forEach((photo, i) => {
    const isFront = (i === toRender.length - 1);
    const card = buildSwipeCard(photo, isFront);
    deck.insertBefore(card, empty);
  });

  // Wire drag on front card
  const front = deck.querySelector('.swipe-card.front');
  if (front) wireDrag(front);
  swipeCurrent = swipeQueue[0];
}

function buildSwipeCard(photo, isFront) {
  const card = document.createElement('div');
  card.className = 'swipe-card ' + (isFront ? 'front' : 'behind');
  card.dataset.id = photo.id;
  card.innerHTML =
    '<div class="swipe-stamp like" id="stamp-like-' + photo.id + '">❤️ LIKE</div>' +
    '<div class="swipe-stamp nope" id="stamp-nope-' + photo.id + '">✕ NOPE</div>' +
    '<div class="swipe-photo" style="background:' + photo.bg + '">' +
    '<div class="swipe-photo-inner"><span style="font-size:90px;filter:drop-shadow(0 4px 24px rgba(0,0,0,0.6))">' + photo.emoji + '</span></div>' +
    '</div>' +
    '<div class="swipe-card-info">' +
    '<div class="swipe-card-city">📍 ' + photo.city + '</div>' +
    '<div class="swipe-card-user">' + photo.user + '</div>' +
    '<div class="swipe-card-caption">' + photo.caption + '</div>' +
    '<div class="swipe-card-votes"><span class="swipe-card-vote-count">' + photo.votes.toLocaleString('it-IT') + '</span><span class="swipe-card-vote-label"> voti questo mese</span></div>' +
    '</div>';
  return card;
}

function wireDrag(card) {
  // Mouse
  card.addEventListener('mousedown', onDragStart);
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  // Touch
  card.addEventListener('touchstart', onDragStart, {passive:true});
  document.addEventListener('touchmove', onDragMove, {passive:false});
  document.addEventListener('touchend', onDragEnd);
}

function getClientX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }
function getClientY(e) { return e.touches ? e.touches[0].clientY : e.clientY; }

function onDragStart(e) {
  if (_swipeAnimating) return;
  _isDragging = true;
  _startX = getClientX(e);
  _startY = getClientY(e);
  _currentX = 0;
  const card = e.currentTarget;
  card.style.transition = 'none';
}

function onDragMove(e) {
  if (!_isDragging) return;
  if (e.cancelable) e.preventDefault();
  _currentX = getClientX(e) - _startX;
  const _currentY = getClientY(e) - _startY;
  const rotate = _currentX * 0.08;
  const front = document.querySelector('.swipe-card.front');
  if (!front) return;
  front.style.transform = 'translate(' + _currentX + 'px,' + (_currentY * 0.3) + 'px) rotate(' + rotate + 'deg)';
  // Show stamps
  const likeStamp = front.querySelector('.swipe-stamp.like');
  const nopeStamp = front.querySelector('.swipe-stamp.nope');
  if (likeStamp) likeStamp.style.opacity = Math.min(_currentX / 80, 1) > 0 ? Math.min(_currentX / 80, 1) : 0;
  if (nopeStamp) nopeStamp.style.opacity = Math.min(-_currentX / 80, 1) > 0 ? Math.min(-_currentX / 80, 1) : 0;
}

function onDragEnd() {
  if (!_isDragging) return;
  _isDragging = false;
  const front = document.querySelector('.swipe-card.front');
  if (!front) return;
  const threshold = 90;
  if (_currentX > threshold) {
    animateSwipe(front, 'like');
  } else if (_currentX < -threshold) {
    animateSwipe(front, 'skip');
  } else {
    // Snap back
    front.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    front.style.transform = '';
    const likeStamp = front.querySelector('.swipe-stamp.like');
    const nopeStamp = front.querySelector('.swipe-stamp.nope');
    if (likeStamp) likeStamp.style.opacity = 0;
    if (nopeStamp) nopeStamp.style.opacity = 0;
  }
}

function doSwipe(action) {
  if (_swipeAnimating) return;
  const front = document.querySelector('.swipe-card.front');
  if (!front) return;
  animateSwipe(front, action);
}

function animateSwipe(card, action) {
  _swipeAnimating = true;
  const dir = action === 'like' || action === 'super' ? 1 : -1;
  const tx  = dir * (window.innerWidth * 0.8);
  const rot = dir * 25;
  card.style.transition = 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s ease';
  card.style.transform   = 'translate(' + tx + 'px, -40px) rotate(' + rot + 'deg)';
  card.style.opacity     = '0';

  // Update stats
  if (action === 'like')  { swipeStats.liked++;   swipeQueue[0].votes++; }
  if (action === 'skip')  { swipeStats.skipped++; }
  if (action === 'super') { swipeStats.super++;   swipeQueue[0].votes += 3; }

  document.getElementById('swipeCountLiked').textContent   = swipeStats.liked;
  document.getElementById('swipeCountSkipped').textContent = swipeStats.skipped;
  document.getElementById('swipeCountSuper').textContent   = swipeStats.super;

  // Log
  const photo = swipeQueue[0];
  const logClass = action === 'skip' ? 'skipped' : action === 'super' ? 'starred' : 'liked';
  const logIcon  = action === 'like' ? '❤️' : action === 'super' ? '⭐' : '✕';
  swipeLog.unshift({ icon: logIcon, city: photo.city, user: photo.user, cls: logClass });
  renderSwipeLog();

  setTimeout(() => {
    swipeQueue.shift();
    renderSwipeDeck();
    _swipeAnimating = false;
  }, 420);
}

function renderSwipeLog() {
  const log = document.getElementById('swipeLog');
  if (!log) return;
  if (swipeLog.length === 0) return;
  log.innerHTML = swipeLog.slice(0, 8).map(l =>
    '<div class="swipe-log-row ' + l.cls + '">' +
    '<span class="swipe-log-emoji">' + l.icon + '</span>' +
    '<div><div style="font-size:12px;color:var(--cream);font-weight:600">' + l.user + '</div>' +
    '<div class="swipe-log-city">📍 ' + l.city + '</div></div>' +
    '</div>'
  ).join('');
}

function restartSwipe() {
  swipeStats = { liked:0, skipped:0, super:0 };
  swipeLog = [];
  document.getElementById('swipeCountLiked').textContent   = '0';
  document.getElementById('swipeCountSkipped').textContent = '0';
  document.getElementById('swipeCountSuper').textContent   = '0';
  renderSwipeLog();
  buildSwipeQueue();
  renderSwipeDeck();
}

// ═══════════════════════════════════════════════════════════════════════
// ACCORDION
// ═══════════════════════════════════════════════════════════════════════
function toggleAcc(id) {
  const item = document.getElementById(id);
  if (!item) return;
  item.classList.toggle('open');
}

function showSeason(name) {
  ['estate','autunno','inverno','primavera'].forEach(s => {
    const tab   = document.getElementById('st-' + s);
    const panel = document.getElementById('season-panel-' + s);
    if (tab)   tab.classList.toggle('active', s === name);
    if (panel) panel.classList.toggle('show',  s === name);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// WISHLIST — localStorage
// ═══════════════════════════════════════════════════════════════════════
function getWishlist() {
  try { return JSON.parse(localStorage.getItem('wq_wishlist') || '[]'); }
  catch { return []; }
}
function saveWishlist(list) {
  localStorage.setItem('wq_wishlist', JSON.stringify(list));
  updateWishBadge();
}
function isWishlisted(code) {
  return getWishlist().some(w => w.code === code);
}
function toggleWishlist(code, name, emoji) {
  let list = getWishlist();
  const idx = list.findIndex(w => w.code === code);
  if (idx === -1) {
    list.push({ code, name, emoji });
    showToast('❤️ ' + name + ' aggiunta ai desideri!');
  } else {
    list.splice(idx, 1);
    showToast('💔 ' + name + ' rimossa dai desideri');
  }
  saveWishlist(list);
  document.querySelectorAll('[data-wishcode="' + code + '"]').forEach(btn => {
    const w = isWishlisted(code);
    btn.textContent = w ? '❤️' : '🤍';
    btn.classList.toggle('wished', w);
  });
  const db = document.getElementById('wish-detail-' + code);
  if (db) {
    const w = isWishlisted(code);
    db.textContent = w ? '❤️ Nei Desideri' : '🤍 Aggiungi ai Desideri';
    db.classList.toggle('wished', w);
  }
}
function updateWishBadge() {
  const count = getWishlist().length;
  const badge = document.getElementById('wishNavCount');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}
function openWishlistModal() {
  const overlay = document.getElementById('wishlistOverlay');
  const body    = document.getElementById('wishlistBody');
  if (!overlay) return;
  const list = getWishlist();
  if (list.length === 0) {
    body.innerHTML = '<div class="wishlist-empty"><div class="wishlist-empty-icon">🤍</div><div>Ancora nessuna destinazione salvata.</div><div style="margin-top:8px;font-size:13px">Premi il cuore ❤️ sulle schede città per aggiungerle qui.</div></div>';
  } else {
    body.innerHTML = list.map(w =>
      '<div class="wish-city-card"><div class="wish-city-emoji">' + w.emoji + '</div>' +
      '<div class="wish-city-name">' + w.name + '</div>' +
      '<button class="wish-city-remove" onclick="toggleWishlist(\'' + w.code + '\',\'' + w.name + '\',\'' + w.emoji + '\');openWishlistModal()" title="Rimuovi">✕</button></div>'
    ).join('');
  }
  overlay.classList.remove('hidden');
}
function closeWishlistModal() {
  document.getElementById('wishlistOverlay')?.classList.add('hidden');
}

// ═══════════════════════════════════════════════════════════════════════
// SPIN THE GLOBE
// ═══════════════════════════════════════════════════════════════════════
async function spinTheGlobe() {
  const btn    = document.getElementById('spinBtn');
  const orb    = document.getElementById('globeOrb');
  const result = document.getElementById('spinResult');
  btn.disabled = true;
  orb.classList.remove('spinning');
  void orb.offsetWidth;
  orb.classList.add('spinning');
  setTimeout(() => orb.classList.remove('spinning'), 700);
  const all = [];
  for (const [contCode, cont] of Object.entries(DB.continents)) {
    for (const [countryCode, country] of Object.entries(cont.countries)) {
      if (!country.cities) continue;
      for (const [cityCode, city] of Object.entries(country.cities)) {
        all.push({ contCode, countryCode, country, cityCode, city });
      }
    }
  }
  if (!all.length) { btn.disabled = false; return; }
  const pick = all[Math.floor(Math.random() * all.length)];
  const { contCode, countryCode, country, cityCode, city } = pick;
  document.getElementById('spinCityEmoji').textContent   = city.emoji;
  document.getElementById('spinCityName').textContent    = city.name;
  document.getElementById('spinCityCountry').textContent = country.emoji + ' ' + country.name;
  const pitch = document.getElementById('spinAIPitch');
  pitch.innerHTML = '<span style="color:rgba(196,181,253,0.6);font-size:13px">✨ Pitch in preparazione…</span>';
  result.classList.add('show');
  document.getElementById('spinGoBtn').onclick = () => {
    selectContinent(contCode);
    setTimeout(async () => {
      await renderCountries(contCode);
      goToLevel('country');
      setTimeout(async () => {
        selectedCountry = countryCode;
        await renderCities(contCode, countryCode);
        goToLevel('city');
        setTimeout(() => {
          selectCity(cityCode);
          document.getElementById('city-detail').scrollIntoView({ behavior:'smooth' });
        }, 300);
      }, 300);
    }, 300);
    document.getElementById('explorer').scrollIntoView({ behavior:'smooth' });
  };
  try {
    const answer = await claudeAsk(
      'Sei un copywriter di viaggio brillante. Scrivi in italiano, massimo 3 frasi brevi e vivide. Niente frasi banali. Usa dettagli sensoriali specifici. Tono: amico entusiasta appena tornato.',
      'Convinci in 3 frasi a visitare ' + city.name + ', ' + country.name + '. Includi: un dettaglio sensoriale preciso, una cosa inaspettata non sulle guide, e un motivo urgente per andarci.',
      180
    );
    pitch.textContent = answer;
  } catch {
    pitch.textContent = '✈️ ' + city.name + ' è una di quelle destinazioni che cambiano il modo in cui guardi il mondo. Vai.';
  }
  btn.disabled = false;
}

// ═══════════════════════════════════════════════════════════════════════
// AI BUDGET ESTIMATOR
// ═══════════════════════════════════════════════════════════════════════
async function generateBudgetAI() {
  const dest  = document.getElementById('bai-dest')?.value?.trim();
  const days  = document.getElementById('bai-days')?.value || '5';
  const pax   = document.getElementById('bai-pax')?.value  || '2';
  const style = document.getElementById('bai-style')?.value || 'comfort';
  if (!dest) { showToast('✍️ Inserisci una destinazione!'); document.getElementById('bai-dest').focus(); return; }
  const btn     = document.getElementById('baiBtn');
  const spinner = document.getElementById('baiSpinner');
  const result  = document.getElementById('baiResult');
  btn.disabled = true;
  spinner.classList.add('show');
  result.classList.remove('show');
  const sys = 'Sei un esperto di budget di viaggio con dati precisi sui costi locali reali. Rispondi SOLO con JSON valido, senza testo fuori dal JSON, senza backtick. Formato: {"categories":[{"icon":"🏨","name":"Alloggio","daily":50,"total":250,"tip":"consiglio specifico"},{"icon":"🍽️","name":"Cibo & Drink","daily":35,"total":175,"tip":"..."},{"icon":"🚇","name":"Trasporti locali","daily":10,"total":50,"tip":"..."},{"icon":"🎭","name":"Attività & Ingressi","daily":20,"total":100,"tip":"..."},{"icon":"🛍️","name":"Shopping & Extra","daily":15,"total":75,"tip":"..."}],"grandTotal":650,"savingTip":"modo pratico per risparmiare il 15-20%","bestValue":"la spesa che vale ogni euro"} — tutti EUR per persona stile ' + style + '.';
  const usr = 'Budget per: ' + dest + ', ' + days + ' giorni, ' + pax + ' persone, stile ' + style + '. Il "total" di ogni categoria = daily × ' + days + '. "grandTotal" = somma di tutti i total.';
  try {
    const raw   = await claudeAsk(sys, usr, 700);
    const clean = raw.replace(/```json|```/g,'').trim();
    const data  = JSON.parse(clean);
    const catsHTML = data.categories.map(c =>
      '<div class="budget-ai-card">' +
      '<div class="budget-ai-card-icon">' + c.icon + '</div>' +
      '<div class="budget-ai-card-cat">' + c.name + '</div>' +
      '<div class="budget-ai-card-val">€' + c.daily + '<span style="font-size:12px;color:var(--cream-dim)">/giorno</span></div>' +
      '<div class="budget-ai-card-sub">Totale ' + days + 'gg: ~€' + c.total + '</div>' +
      '<div style="margin-top:9px;font-size:11px;color:var(--cream-dim);line-height:1.55">' + c.tip + '</div></div>'
    ).join('');
    result.innerHTML =
      '<div class="budget-ai-cards">' + catsHTML + '</div>' +
      '<div class="budget-ai-total"><div><div class="budget-ai-total-label">' + dest + ' · ' + days + ' giorni · ' + pax + ' ' + (parseInt(pax)===1?'persona':'persone') + ' · stile ' + style + '</div><div style="font-size:11px;color:var(--cream-dim);margin-top:3px">stima per persona</div></div>' +
      '<div><div class="budget-ai-total-val">€' + Math.round(data.grandTotal / parseInt(pax)) + '</div><div style="font-size:10px;color:var(--green);margin-top:2px">totale ' + days + ' giorni</div></div></div>' +
      '<div class="budget-ai-tips">💡 <strong>Come risparmiare:</strong> ' + data.savingTip + '<br><br>✨ <strong>Vale ogni euro:</strong> ' + data.bestValue + '</div>';
    result.classList.add('show');
    result.scrollIntoView({ behavior:'smooth', block:'nearest' });
  } catch(err) {
    result.innerHTML = '<div style="color:var(--red);padding:20px;font-size:13px">❌ Errore: ' + err.message + '. Riprova con una destinazione più specifica.</div>';
    result.classList.add('show');
  }
  btn.disabled = false;
  spinner.classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════════════
// FRASEBOOK AI
// ═══════════════════════════════════════════════════════════════════════
async function generateFrasebook(cityCode, cityName, countryName) {
  const btn    = document.getElementById('frase-btn-' + cityCode);
  const result = document.getElementById('frase-result-' + cityCode);
  if (!btn || !result) return;
  btn.disabled = true;
  btn.textContent = '⏳ Generando…';
  result.innerHTML = '<div style="color:var(--amber);font-size:12px;padding:8px 0">🗣️ Frasi in elaborazione…</div>';
  result.classList.add('show');
  const sys = 'Sei un esperto linguistico. Rispondi SOLO con JSON valido, senza testo fuori dal JSON, senza backtick. Formato: {"phrases":[{"it":"testo italiano","local":"testo in lingua locale","pronounce":"pronuncia fonetica semplice","tip":"nota culturale breve"}]} — esattamente 10 frasi.';
  const usr = 'Genera 10 frasi essenziali per un turista italiano a ' + cityName + ', ' + countryName + '. Includi: saluto informale, grazie, scusi, vorrei ordinare X, il conto per favore, dove si trova X, quanto costa, parla inglese, aiuto, e una frase da vero locale. Usa la lingua locale esatta parlata a ' + cityName + '.';
  try {
    const raw   = await claudeAsk(sys, usr, 800);
    const clean = raw.replace(/```json|```/g,'').trim();
    const data  = JSON.parse(clean);
    result.innerHTML = '<div class="frasebook-grid">' +
      data.phrases.map(p =>
        '<div class="phrase-card">' +
        '<div class="phrase-it">🇮🇹 ' + p.it + '</div>' +
        '<div class="phrase-local">💬 ' + p.local + '</div>' +
        '<div class="phrase-tip">🔊 ' + p.pronounce + (p.tip ? ' · ' + p.tip : '') + '</div></div>'
      ).join('') + '</div>';
  } catch(err) {
    result.innerHTML = '<div style="color:var(--red);font-size:12px;padding:8px 0">❌ ' + err.message + '</div>';
  }
  btn.disabled = false;
  btn.textContent = '🗣️ Frasi Essenziali';
}

// ═══════════════════════════════════════════════════════════════════════
// LIVE WEATHER — wttr.in
// ═══════════════════════════════════════════════════════════════════════
async function loadLiveWeather(cityName, code) {
  const container = document.getElementById('liveweather-' + code);
  if (!container) return;
  const WI = {'Sunny':'☀️','Clear':'🌙','Partly cloudy':'⛅','Overcast':'☁️','Mist':'🌫️','Fog':'🌫️','Light rain':'🌦️','Moderate rain':'🌧️','Heavy rain':'🌧️','Rain':'🌧️','Drizzle':'🌦️','Snow':'❄️','Thunder':'⛈️','Cloudy':'☁️'};
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch('https://wttr.in/' + encodeURIComponent(cityName) + '?format=j1', { signal: ctrl.signal });
    if (!res.ok) return;
    const data = await res.json();
    const cur  = data.current_condition[0];
    const temp = cur.temp_C;
    const feels = cur.FeelsLikeC;
    const desc  = cur.weatherDesc[0].value;
    let icon = '🌡️';
    for (const [k,v] of Object.entries(WI)) { if (desc.toLowerCase().includes(k.toLowerCase())) { icon=v; break; } }
    container.innerHTML =
      '<div class="live-weather-card">' +
      '<div class="lw-icon">' + icon + '</div>' +
      '<div><div class="lw-temp">' + temp + '°C</div><div class="lw-desc">' + desc + '</div><div class="lw-feels">Percepita: ' + feels + '°C</div></div>' +
      '<div style="margin-left:auto;text-align:right"><div style="font-size:9px;color:var(--cream-dim);text-transform:uppercase;letter-spacing:0.08em">Meteo Ora</div><div style="font-size:10px;color:var(--teal);margin-top:2px">🔴 live</div></div>' +
      '</div>';
  } catch { /* silent fail */ }
}

// ═══════════════════════════════════════════════════════════════════════
// WINDOW EXPORTS — necessari per onclick="" con type="module"
// ═══════════════════════════════════════════════════════════════════════
window.openAuthModal        = openAuthModal;
window.closeAuthModal       = closeAuthModal;
window.handleOverlayClick   = handleOverlayClick;
window.switchAuthTab        = switchAuthTab;
window.loginUser            = loginUser;
window.registerUser         = registerUser;
window.logoutUser           = logoutUser;
window.showUserMenu         = showUserMenu;
window.toggleMobileDrawer   = toggleMobileDrawer;
window.closeMobileDrawer    = closeMobileDrawer;
window.openMyProfile        = openMyProfile;
window.closeProfileModal    = closeProfileModal;
window.handleProfileOverlayClick = handleProfileOverlayClick;
window.openMyValigie        = openMyValigie;
window.closeValigieModal    = closeValigieModal;
window.handleValigieOverlayClick = handleValigieOverlayClick;
window.deleteValiglia       = deleteValiglia;
window.reloadValiglia       = reloadValiglia;
window.savePackingList      = savePackingList;
window.selectContinent      = selectContinent;
window.selectCountry        = selectCountry;
window.selectCity           = selectCity;
window.goToLevel            = goToLevel;
window.renderCountryLeaderboard = renderCountryLeaderboard;
window.handleSearch         = handleSearch;
window.handleSearchKey      = handleSearchKey;
window.clearSearch          = clearSearch;
window.voteDestination      = voteDestination;
window.aiGenerateCity       = aiGenerateCity;
window.selectSearchResult   = selectSearchResult;
window.searchFlight         = searchFlight;
window.quickJumpCity        = quickJumpCity;
window.generatePacking      = generatePacking;
window.precompilePacking    = precompilePacking;
window.toggleCheck          = toggleCheck;
window.printPacking         = printPacking;
window.openUpgrade          = openUpgrade;
window.closeUpgradeModal    = closeUpgradeModal;
window.handleUpgradeOverlayClick = handleUpgradeOverlayClick;
window.handleUpgradeCheckout = handleUpgradeCheckout;
window.openInfoModal        = openInfoModal;
window.closeInfoModal       = closeInfoModal;
window.handleInfoOverlayClick = handleInfoOverlayClick;
window.calcBudget           = calcBudget;
window.shareCity            = shareCity;
window.jumpToRecentCity     = jumpToRecentCity;
window.sendCityChat         = sendCityChat;
window.sendChatSuggestion   = sendChatSuggestion;
window.askWeatherAI         = askWeatherAI;
window.generateItinerary    = generateItinerary;
window.showToast            = showToast;
window.migrateDB            = migrateDB;
window.spinTheGlobe         = spinTheGlobe;
window.generateBudgetAI     = generateBudgetAI;
window.generateFrasebook    = generateFrasebook;
window.loadLiveWeather      = loadLiveWeather;
window.isWishlisted         = isWishlisted;
window.toggleWishlist       = toggleWishlist;
window.openWishlistModal    = openWishlistModal;
window.closeWishlistModal   = closeWishlistModal;
window.toggleAcc            = toggleAcc;
window.setSwipeFilter       = setSwipeFilter;
window.doSwipe              = doSwipe;
window.restartSwipe         = restartSwipe;
window.initTransit          = initTransit;
window.useMyLocation        = useMyLocation;
window.openTransitRoute     = openTransitRoute;
window.showSeason           = showSeason;

// ═══════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════
renderContinents();
renderPremiumTable();
renderIncomeStreams();
renderCountryLeaderboard('IT');
renderGlobalLeaderboard();
renderRecentlyViewed();
updateWishBadge();
buildSwipeQueue();
renderSwipeDeck();