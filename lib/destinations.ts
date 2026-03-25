/**
 * World destinations for the Smart Pack Agent autocomplete.
 * ~400 major cities / tourist destinations worldwide.
 */

export interface Destination {
  city: string;
  country: string;
  flag: string;
  continent: string;
}

export const WORLD_DESTINATIONS: Destination[] = [
  // ── Europe ──────────────────────────────────────────────────────────────────
  { city: "Roma", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Milano", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Venezia", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Firenze", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Napoli", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Torino", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Bologna", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Palermo", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Catania", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Verona", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Bari", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Genova", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Amalfi", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Positano", country: "Italia", flag: "🇮🇹", continent: "Europa" },
  { city: "Cinque Terre", country: "Italia", flag: "🇮🇹", continent: "Europa" },

  { city: "Parigi", country: "Francia", flag: "🇫🇷", continent: "Europa" },
  { city: "Nizza", country: "Francia", flag: "🇫🇷", continent: "Europa" },
  { city: "Lione", country: "Francia", flag: "🇫🇷", continent: "Europa" },
  { city: "Marsiglia", country: "Francia", flag: "🇫🇷", continent: "Europa" },
  { city: "Bordeaux", country: "Francia", flag: "🇫🇷", continent: "Europa" },
  { city: "Strasburgo", country: "Francia", flag: "🇫🇷", continent: "Europa" },
  { city: "Montpellier", country: "Francia", flag: "🇫🇷", continent: "Europa" },
  { city: "Cannes", country: "Francia", flag: "🇫🇷", continent: "Europa" },
  { city: "Monaco", country: "Principato di Monaco", flag: "🇲🇨", continent: "Europa" },

  { city: "Barcellona", country: "Spagna", flag: "🇪🇸", continent: "Europa" },
  { city: "Madrid", country: "Spagna", flag: "🇪🇸", continent: "Europa" },
  { city: "Siviglia", country: "Spagna", flag: "🇪🇸", continent: "Europa" },
  { city: "Malaga", country: "Spagna", flag: "🇪🇸", continent: "Europa" },
  { city: "Valencia", country: "Spagna", flag: "🇪🇸", continent: "Europa" },
  { city: "Granada", country: "Spagna", flag: "🇪🇸", continent: "Europa" },
  { city: "Bilbao", country: "Spagna", flag: "🇪🇸", continent: "Europa" },
  { city: "San Sebastián", country: "Spagna", flag: "🇪🇸", continent: "Europa" },
  { city: "Palma di Maiorca", country: "Spagna", flag: "🇪🇸", continent: "Europa" },
  { city: "Ibiza", country: "Spagna", flag: "🇪🇸", continent: "Europa" },
  { city: "Tenerife", country: "Spagna", flag: "🇪🇸", continent: "Europa" },
  { city: "Gran Canaria", country: "Spagna", flag: "🇪🇸", continent: "Europa" },

  { city: "Londra", country: "Regno Unito", flag: "🇬🇧", continent: "Europa" },
  { city: "Edimburgo", country: "Regno Unito", flag: "🇬🇧", continent: "Europa" },
  { city: "Manchester", country: "Regno Unito", flag: "🇬🇧", continent: "Europa" },
  { city: "Liverpool", country: "Regno Unito", flag: "🇬🇧", continent: "Europa" },
  { city: "Birmingham", country: "Regno Unito", flag: "🇬🇧", continent: "Europa" },
  { city: "Dublino", country: "Irlanda", flag: "🇮🇪", continent: "Europa" },

  { city: "Berlino", country: "Germania", flag: "🇩🇪", continent: "Europa" },
  { city: "Monaco di Baviera", country: "Germania", flag: "🇩🇪", continent: "Europa" },
  { city: "Amburgo", country: "Germania", flag: "🇩🇪", continent: "Europa" },
  { city: "Francoforte", country: "Germania", flag: "🇩🇪", continent: "Europa" },
  { city: "Colonia", country: "Germania", flag: "🇩🇪", continent: "Europa" },
  { city: "Dresda", country: "Germania", flag: "🇩🇪", continent: "Europa" },

  { city: "Amsterdam", country: "Paesi Bassi", flag: "🇳🇱", continent: "Europa" },
  { city: "Rotterdam", country: "Paesi Bassi", flag: "🇳🇱", continent: "Europa" },
  { city: "L'Aia", country: "Paesi Bassi", flag: "🇳🇱", continent: "Europa" },

  { city: "Bruxelles", country: "Belgio", flag: "🇧🇪", continent: "Europa" },
  { city: "Bruges", country: "Belgio", flag: "🇧🇪", continent: "Europa" },
  { city: "Gand", country: "Belgio", flag: "🇧🇪", continent: "Europa" },

  { city: "Vienna", country: "Austria", flag: "🇦🇹", continent: "Europa" },
  { city: "Salisburgo", country: "Austria", flag: "🇦🇹", continent: "Europa" },
  { city: "Innsbruck", country: "Austria", flag: "🇦🇹", continent: "Europa" },

  { city: "Zurigo", country: "Svizzera", flag: "🇨🇭", continent: "Europa" },
  { city: "Ginevra", country: "Svizzera", flag: "🇨🇭", continent: "Europa" },
  { city: "Berna", country: "Svizzera", flag: "🇨🇭", continent: "Europa" },
  { city: "Lugano", country: "Svizzera", flag: "🇨🇭", continent: "Europa" },

  { city: "Praga", country: "Repubblica Ceca", flag: "🇨🇿", continent: "Europa" },
  { city: "Brno", country: "Repubblica Ceca", flag: "🇨🇿", continent: "Europa" },
  { city: "Varsavia", country: "Polonia", flag: "🇵🇱", continent: "Europa" },
  { city: "Cracovia", country: "Polonia", flag: "🇵🇱", continent: "Europa" },
  { city: "Danzica", country: "Polonia", flag: "🇵🇱", continent: "Europa" },
  { city: "Budapest", country: "Ungheria", flag: "🇭🇺", continent: "Europa" },
  { city: "Bucarest", country: "Romania", flag: "🇷🇴", continent: "Europa" },
  { city: "Bratislava", country: "Slovacchia", flag: "🇸🇰", continent: "Europa" },
  { city: "Lubiana", country: "Slovenia", flag: "🇸🇮", continent: "Europa" },
  { city: "Zagabria", country: "Croazia", flag: "🇭🇷", continent: "Europa" },
  { city: "Spalato", country: "Croazia", flag: "🇭🇷", continent: "Europa" },
  { city: "Dubrovnik", country: "Croazia", flag: "🇭🇷", continent: "Europa" },
  { city: "Sarajevo", country: "Bosnia ed Erzegovina", flag: "🇧🇦", continent: "Europa" },
  { city: "Belgrado", country: "Serbia", flag: "🇷🇸", continent: "Europa" },
  { city: "Sofia", country: "Bulgaria", flag: "🇧🇬", continent: "Europa" },
  { city: "Atene", country: "Grecia", flag: "🇬🇷", continent: "Europa" },
  { city: "Tessalonica", country: "Grecia", flag: "🇬🇷", continent: "Europa" },
  { city: "Mykonos", country: "Grecia", flag: "🇬🇷", continent: "Europa" },
  { city: "Santorini", country: "Grecia", flag: "🇬🇷", continent: "Europa" },
  { city: "Creta", country: "Grecia", flag: "🇬🇷", continent: "Europa" },
  { city: "Rodi", country: "Grecia", flag: "🇬🇷", continent: "Europa" },
  { city: "Istanbul", country: "Turchia", flag: "🇹🇷", continent: "Europa" },
  { city: "Ankara", country: "Turchia", flag: "🇹🇷", continent: "Europa" },
  { city: "Izmir", country: "Turchia", flag: "🇹🇷", continent: "Europa" },
  { city: "Antalya", country: "Turchia", flag: "🇹🇷", continent: "Europa" },
  { city: "Lisbona", country: "Portogallo", flag: "🇵🇹", continent: "Europa" },
  { city: "Porto", country: "Portogallo", flag: "🇵🇹", continent: "Europa" },
  { city: "Faro", country: "Portogallo", flag: "🇵🇹", continent: "Europa" },
  { city: "Funchal", country: "Portogallo", flag: "🇵🇹", continent: "Europa" },
  { city: "Copenaghen", country: "Danimarca", flag: "🇩🇰", continent: "Europa" },
  { city: "Stoccolma", country: "Svezia", flag: "🇸🇪", continent: "Europa" },
  { city: "Oslo", country: "Norvegia", flag: "🇳🇴", continent: "Europa" },
  { city: "Bergen", country: "Norvegia", flag: "🇳🇴", continent: "Europa" },
  { city: "Helsinki", country: "Finlandia", flag: "🇫🇮", continent: "Europa" },
  { city: "Reykjavik", country: "Islanda", flag: "🇮🇸", continent: "Europa" },
  { city: "Tallinn", country: "Estonia", flag: "🇪🇪", continent: "Europa" },
  { city: "Riga", country: "Lettonia", flag: "🇱🇻", continent: "Europa" },
  { city: "Vilnius", country: "Lituania", flag: "🇱🇹", continent: "Europa" },
  { city: "Mosca", country: "Russia", flag: "🇷🇺", continent: "Europa" },
  { city: "San Pietroburgo", country: "Russia", flag: "🇷🇺", continent: "Europa" },
  { city: "Kiev", country: "Ucraina", flag: "🇺🇦", continent: "Europa" },
  { city: "Valletta", country: "Malta", flag: "🇲🇹", continent: "Europa" },
  { city: "Nicosia", country: "Cipro", flag: "🇨🇾", continent: "Europa" },
  { city: "Limassol", country: "Cipro", flag: "🇨🇾", continent: "Europa" },
  { city: "Lussemburgo", country: "Lussemburgo", flag: "🇱🇺", continent: "Europa" },
  { city: "Tirana", country: "Albania", flag: "🇦🇱", continent: "Europa" },
  { city: "Skopje", country: "Macedonia del Nord", flag: "🇲🇰", continent: "Europa" },
  { city: "Podgorica", country: "Montenegro", flag: "🇲🇪", continent: "Europa" },
  { city: "Kotor", country: "Montenegro", flag: "🇲🇪", continent: "Europa" },

  // ── Medio Oriente & Africa ───────────────────────────────────────────────────
  { city: "Dubai", country: "Emirati Arabi Uniti", flag: "🇦🇪", continent: "Medio Oriente" },
  { city: "Abu Dhabi", country: "Emirati Arabi Uniti", flag: "🇦🇪", continent: "Medio Oriente" },
  { city: "Doha", country: "Qatar", flag: "🇶🇦", continent: "Medio Oriente" },
  { city: "Riyadh", country: "Arabia Saudita", flag: "🇸🇦", continent: "Medio Oriente" },
  { city: "Tel Aviv", country: "Israele", flag: "🇮🇱", continent: "Medio Oriente" },
  { city: "Gerusalemme", country: "Israele", flag: "🇮🇱", continent: "Medio Oriente" },
  { city: "Amman", country: "Giordania", flag: "🇯🇴", continent: "Medio Oriente" },
  { city: "Petra", country: "Giordania", flag: "🇯🇴", continent: "Medio Oriente" },
  { city: "Beirut", country: "Libano", flag: "🇱🇧", continent: "Medio Oriente" },
  { city: "Muscat", country: "Oman", flag: "🇴🇲", continent: "Medio Oriente" },
  { city: "Kuwait City", country: "Kuwait", flag: "🇰🇼", continent: "Medio Oriente" },
  { city: "Manama", country: "Bahrein", flag: "🇧🇭", continent: "Medio Oriente" },
  { city: "Teheran", country: "Iran", flag: "🇮🇷", continent: "Medio Oriente" },

  { city: "Il Cairo", country: "Egitto", flag: "🇪🇬", continent: "Africa" },
  { city: "Alessandria", country: "Egitto", flag: "🇪🇬", continent: "Africa" },
  { city: "Hurghada", country: "Egitto", flag: "🇪🇬", continent: "Africa" },
  { city: "Sharm el-Sheikh", country: "Egitto", flag: "🇪🇬", continent: "Africa" },
  { city: "Marrakech", country: "Marocco", flag: "🇲🇦", continent: "Africa" },
  { city: "Casablanca", country: "Marocco", flag: "🇲🇦", continent: "Africa" },
  { city: "Fes", country: "Marocco", flag: "🇲🇦", continent: "Africa" },
  { city: "Rabat", country: "Marocco", flag: "🇲🇦", continent: "Africa" },
  { city: "Agadir", country: "Marocco", flag: "🇲🇦", continent: "Africa" },
  { city: "Tunisi", country: "Tunisia", flag: "🇹🇳", continent: "Africa" },
  { city: "Djerba", country: "Tunisia", flag: "🇹🇳", continent: "Africa" },
  { city: "Nairobi", country: "Kenya", flag: "🇰🇪", continent: "Africa" },
  { city: "Mombasa", country: "Kenya", flag: "🇰🇪", continent: "Africa" },
  { city: "Zanzibar", country: "Tanzania", flag: "🇹🇿", continent: "Africa" },
  { city: "Dar es Salaam", country: "Tanzania", flag: "🇹🇿", continent: "Africa" },
  { city: "Cape Town", country: "Sudafrica", flag: "🇿🇦", continent: "Africa" },
  { city: "Johannesburg", country: "Sudafrica", flag: "🇿🇦", continent: "Africa" },
  { city: "Durban", country: "Sudafrica", flag: "🇿🇦", continent: "Africa" },
  { city: "Lagos", country: "Nigeria", flag: "🇳🇬", continent: "Africa" },
  { city: "Abidjan", country: "Costa d'Avorio", flag: "🇨🇮", continent: "Africa" },
  { city: "Accra", country: "Ghana", flag: "🇬🇭", continent: "Africa" },
  { city: "Dakar", country: "Senegal", flag: "🇸🇳", continent: "Africa" },
  { city: "Addis Abeba", country: "Etiopia", flag: "🇪🇹", continent: "Africa" },
  { city: "Kampala", country: "Uganda", flag: "🇺🇬", continent: "Africa" },
  { city: "Luanda", country: "Angola", flag: "🇦🇴", continent: "Africa" },
  { city: "Maputo", country: "Mozambico", flag: "🇲🇿", continent: "Africa" },
  { city: "Antananarivo", country: "Madagascar", flag: "🇲🇬", continent: "Africa" },
  { city: "Mauritius", country: "Mauritius", flag: "🇲🇺", continent: "Africa" },
  { city: "Seychelles", country: "Seychelles", flag: "🇸🇨", continent: "Africa" },
  { city: "Algeri", country: "Algeria", flag: "🇩🇿", continent: "Africa" },
  { city: "Tripoli", country: "Libia", flag: "🇱🇾", continent: "Africa" },

  // ── Asia ────────────────────────────────────────────────────────────────────
  { city: "Tokyo", country: "Giappone", flag: "🇯🇵", continent: "Asia" },
  { city: "Osaka", country: "Giappone", flag: "🇯🇵", continent: "Asia" },
  { city: "Kyoto", country: "Giappone", flag: "🇯🇵", continent: "Asia" },
  { city: "Hiroshima", country: "Giappone", flag: "🇯🇵", continent: "Asia" },
  { city: "Nara", country: "Giappone", flag: "🇯🇵", continent: "Asia" },
  { city: "Sapporo", country: "Giappone", flag: "🇯🇵", continent: "Asia" },
  { city: "Fukuoka", country: "Giappone", flag: "🇯🇵", continent: "Asia" },

  { city: "Pechino", country: "Cina", flag: "🇨🇳", continent: "Asia" },
  { city: "Shanghai", country: "Cina", flag: "🇨🇳", continent: "Asia" },
  { city: "Hong Kong", country: "Cina (SAR)", flag: "🇭🇰", continent: "Asia" },
  { city: "Guangzhou", country: "Cina", flag: "🇨🇳", continent: "Asia" },
  { city: "Chengdu", country: "Cina", flag: "🇨🇳", continent: "Asia" },
  { city: "Xi'an", country: "Cina", flag: "🇨🇳", continent: "Asia" },
  { city: "Guilin", country: "Cina", flag: "🇨🇳", continent: "Asia" },

  { city: "Seoul", country: "Corea del Sud", flag: "🇰🇷", continent: "Asia" },
  { city: "Busan", country: "Corea del Sud", flag: "🇰🇷", continent: "Asia" },
  { city: "Jeju", country: "Corea del Sud", flag: "🇰🇷", continent: "Asia" },

  { city: "Singapore", country: "Singapore", flag: "🇸🇬", continent: "Asia" },
  { city: "Bangkok", country: "Thailandia", flag: "🇹🇭", continent: "Asia" },
  { city: "Phuket", country: "Thailandia", flag: "🇹🇭", continent: "Asia" },
  { city: "Chiang Mai", country: "Thailandia", flag: "🇹🇭", continent: "Asia" },
  { city: "Pattaya", country: "Thailandia", flag: "🇹🇭", continent: "Asia" },
  { city: "Koh Samui", country: "Thailandia", flag: "🇹🇭", continent: "Asia" },

  { city: "Bali", country: "Indonesia", flag: "🇮🇩", continent: "Asia" },
  { city: "Giakarta", country: "Indonesia", flag: "🇮🇩", continent: "Asia" },
  { city: "Yogyakarta", country: "Indonesia", flag: "🇮🇩", continent: "Asia" },
  { city: "Lombok", country: "Indonesia", flag: "🇮🇩", continent: "Asia" },

  { city: "Kuala Lumpur", country: "Malesia", flag: "🇲🇾", continent: "Asia" },
  { city: "Penang", country: "Malesia", flag: "🇲🇾", continent: "Asia" },
  { city: "Langkawi", country: "Malesia", flag: "🇲🇾", continent: "Asia" },

  { city: "Manila", country: "Filippine", flag: "🇵🇭", continent: "Asia" },
  { city: "Cebu", country: "Filippine", flag: "🇵🇭", continent: "Asia" },
  { city: "Palawan", country: "Filippine", flag: "🇵🇭", continent: "Asia" },
  { city: "Boracay", country: "Filippine", flag: "🇵🇭", continent: "Asia" },

  { city: "Ho Chi Minh City", country: "Vietnam", flag: "🇻🇳", continent: "Asia" },
  { city: "Hanoi", country: "Vietnam", flag: "🇻🇳", continent: "Asia" },
  { city: "Hoi An", country: "Vietnam", flag: "🇻🇳", continent: "Asia" },
  { city: "Da Nang", country: "Vietnam", flag: "🇻🇳", continent: "Asia" },
  { city: "Ha Long Bay", country: "Vietnam", flag: "🇻🇳", continent: "Asia" },

  { city: "Siem Reap", country: "Cambogia", flag: "🇰🇭", continent: "Asia" },
  { city: "Phnom Penh", country: "Cambogia", flag: "🇰🇭", continent: "Asia" },
  { city: "Luang Prabang", country: "Laos", flag: "🇱🇦", continent: "Asia" },
  { city: "Vientiane", country: "Laos", flag: "🇱🇦", continent: "Asia" },
  { city: "Yangon", country: "Myanmar", flag: "🇲🇲", continent: "Asia" },
  { city: "Bagan", country: "Myanmar", flag: "🇲🇲", continent: "Asia" },

  { city: "Mumbai", country: "India", flag: "🇮🇳", continent: "Asia" },
  { city: "Delhi", country: "India", flag: "🇮🇳", continent: "Asia" },
  { city: "Jaipur", country: "India", flag: "🇮🇳", continent: "Asia" },
  { city: "Agra", country: "India", flag: "🇮🇳", continent: "Asia" },
  { city: "Goa", country: "India", flag: "🇮🇳", continent: "Asia" },
  { city: "Kerala", country: "India", flag: "🇮🇳", continent: "Asia" },
  { city: "Varanasi", country: "India", flag: "🇮🇳", continent: "Asia" },
  { city: "Bangalore", country: "India", flag: "🇮🇳", continent: "Asia" },
  { city: "Chennai", country: "India", flag: "🇮🇳", continent: "Asia" },
  { city: "Kolkata", country: "India", flag: "🇮🇳", continent: "Asia" },
  { city: "Udaipur", country: "India", flag: "🇮🇳", continent: "Asia" },

  { city: "Colombo", country: "Sri Lanka", flag: "🇱🇰", continent: "Asia" },
  { city: "Kandy", country: "Sri Lanka", flag: "🇱🇰", continent: "Asia" },
  { city: "Kathmandu", country: "Nepal", flag: "🇳🇵", continent: "Asia" },
  { city: "Pokhara", country: "Nepal", flag: "🇳🇵", continent: "Asia" },
  { city: "Thimphu", country: "Bhutan", flag: "🇧🇹", continent: "Asia" },
  { city: "Dhaka", country: "Bangladesh", flag: "🇧🇩", continent: "Asia" },
  { city: "Islamabad", country: "Pakistan", flag: "🇵🇰", continent: "Asia" },
  { city: "Karachi", country: "Pakistan", flag: "🇵🇰", continent: "Asia" },
  { city: "Lahore", country: "Pakistan", flag: "🇵🇰", continent: "Asia" },

  { city: "Taipei", country: "Taiwan", flag: "🇹🇼", continent: "Asia" },
  { city: "Macao", country: "Cina (SAR)", flag: "🇲🇴", continent: "Asia" },

  { city: "Tashkent", country: "Uzbekistan", flag: "🇺🇿", continent: "Asia" },
  { city: "Samarcanda", country: "Uzbekistan", flag: "🇺🇿", continent: "Asia" },
  { city: "Almaty", country: "Kazakhstan", flag: "🇰🇿", continent: "Asia" },
  { city: "Tbilisi", country: "Georgia", flag: "🇬🇪", continent: "Asia" },
  { city: "Batumi", country: "Georgia", flag: "🇬🇪", continent: "Asia" },
  { city: "Yerevan", country: "Armenia", flag: "🇦🇲", continent: "Asia" },
  { city: "Baku", country: "Azerbaigian", flag: "🇦🇿", continent: "Asia" },
  { city: "Ulaanbaatar", country: "Mongolia", flag: "🇲🇳", continent: "Asia" },
  { city: "Phnom Penh", country: "Cambogia", flag: "🇰🇭", continent: "Asia" },

  { city: "Maldive", country: "Maldive", flag: "🇲🇻", continent: "Asia" },
  { city: "Malé", country: "Maldive", flag: "🇲🇻", continent: "Asia" },
  { city: "Brunei", country: "Brunei", flag: "🇧🇳", continent: "Asia" },

  // ── Americhe ─────────────────────────────────────────────────────────────────
  { city: "New York", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Los Angeles", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Las Vegas", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Miami", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "San Francisco", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Chicago", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Washington DC", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Boston", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Seattle", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "New Orleans", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Nashville", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Austin", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Denver", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Orlando", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Honolulu", country: "USA (Hawaii)", flag: "🇺🇸", continent: "Americhe" },
  { city: "Anchorage", country: "USA (Alaska)", flag: "🇺🇸", continent: "Americhe" },
  { city: "Phoenix", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Portland", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Atlanta", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "Minneapolis", country: "USA", flag: "🇺🇸", continent: "Americhe" },
  { city: "San Diego", country: "USA", flag: "🇺🇸", continent: "Americhe" },

  { city: "Toronto", country: "Canada", flag: "🇨🇦", continent: "Americhe" },
  { city: "Vancouver", country: "Canada", flag: "🇨🇦", continent: "Americhe" },
  { city: "Montreal", country: "Canada", flag: "🇨🇦", continent: "Americhe" },
  { city: "Québec City", country: "Canada", flag: "🇨🇦", continent: "Americhe" },
  { city: "Ottawa", country: "Canada", flag: "🇨🇦", continent: "Americhe" },
  { city: "Calgary", country: "Canada", flag: "🇨🇦", continent: "Americhe" },

  { city: "Città del Messico", country: "Messico", flag: "🇲🇽", continent: "Americhe" },
  { city: "Cancún", country: "Messico", flag: "🇲🇽", continent: "Americhe" },
  { city: "Playa del Carmen", country: "Messico", flag: "🇲🇽", continent: "Americhe" },
  { city: "Tulum", country: "Messico", flag: "🇲🇽", continent: "Americhe" },
  { city: "Guadalajara", country: "Messico", flag: "🇲🇽", continent: "Americhe" },
  { city: "Oaxaca", country: "Messico", flag: "🇲🇽", continent: "Americhe" },

  { city: "L'Avana", country: "Cuba", flag: "🇨🇺", continent: "Americhe" },
  { city: "San José", country: "Costa Rica", flag: "🇨🇷", continent: "Americhe" },
  { city: "Panama City", country: "Panamá", flag: "🇵🇦", continent: "Americhe" },
  { city: "Cartagena", country: "Colombia", flag: "🇨🇴", continent: "Americhe" },
  { city: "Bogotá", country: "Colombia", flag: "🇨🇴", continent: "Americhe" },
  { city: "Medellín", country: "Colombia", flag: "🇨🇴", continent: "Americhe" },
  { city: "Lima", country: "Perù", flag: "🇵🇪", continent: "Americhe" },
  { city: "Cusco", country: "Perù", flag: "🇵🇪", continent: "Americhe" },
  { city: "Machu Picchu", country: "Perù", flag: "🇵🇪", continent: "Americhe" },
  { city: "Buenos Aires", country: "Argentina", flag: "🇦🇷", continent: "Americhe" },
  { city: "Mendoza", country: "Argentina", flag: "🇦🇷", continent: "Americhe" },
  { city: "Patagonia", country: "Argentina", flag: "🇦🇷", continent: "Americhe" },
  { city: "Santiago del Cile", country: "Cile", flag: "🇨🇱", continent: "Americhe" },
  { city: "Río de Janeiro", country: "Brasile", flag: "🇧🇷", continent: "Americhe" },
  { city: "San Paolo", country: "Brasile", flag: "🇧🇷", continent: "Americhe" },
  { city: "Salvador", country: "Brasile", flag: "🇧🇷", continent: "Americhe" },
  { city: "Florianópolis", country: "Brasile", flag: "🇧🇷", continent: "Americhe" },
  { city: "Manaus", country: "Brasile", flag: "🇧🇷", continent: "Americhe" },
  { city: "Quito", country: "Ecuador", flag: "🇪🇨", continent: "Americhe" },
  { city: "Galápagos", country: "Ecuador", flag: "🇪🇨", continent: "Americhe" },
  { city: "La Paz", country: "Bolivia", flag: "🇧🇴", continent: "Americhe" },
  { city: "Caracas", country: "Venezuela", flag: "🇻🇪", continent: "Americhe" },
  { city: "Montevideo", country: "Uruguay", flag: "🇺🇾", continent: "Americhe" },
  { city: "Asunción", country: "Paraguay", flag: "🇵🇾", continent: "Americhe" },
  { city: "Santo Domingo", country: "Repubblica Dominicana", flag: "🇩🇴", continent: "Americhe" },
  { city: "Punta Cana", country: "Repubblica Dominicana", flag: "🇩🇴", continent: "Americhe" },
  { city: "Kingston", country: "Giamaica", flag: "🇯🇲", continent: "Americhe" },
  { city: "Bridgetown", country: "Barbados", flag: "🇧🇧", continent: "Americhe" },

  // ── Oceania ──────────────────────────────────────────────────────────────────
  { city: "Sydney", country: "Australia", flag: "🇦🇺", continent: "Oceania" },
  { city: "Melbourne", country: "Australia", flag: "🇦🇺", continent: "Oceania" },
  { city: "Brisbane", country: "Australia", flag: "🇦🇺", continent: "Oceania" },
  { city: "Perth", country: "Australia", flag: "🇦🇺", continent: "Oceania" },
  { city: "Adelaide", country: "Australia", flag: "🇦🇺", continent: "Oceania" },
  { city: "Gold Coast", country: "Australia", flag: "🇦🇺", continent: "Oceania" },
  { city: "Cairns", country: "Australia", flag: "🇦🇺", continent: "Oceania" },
  { city: "Darwin", country: "Australia", flag: "🇦🇺", continent: "Oceania" },
  { city: "Auckland", country: "Nuova Zelanda", flag: "🇳🇿", continent: "Oceania" },
  { city: "Wellington", country: "Nuova Zelanda", flag: "🇳🇿", continent: "Oceania" },
  { city: "Queenstown", country: "Nuova Zelanda", flag: "🇳🇿", continent: "Oceania" },
  { city: "Christchurch", country: "Nuova Zelanda", flag: "🇳🇿", continent: "Oceania" },
  { city: "Bora Bora", country: "Polinesia Francese", flag: "🇵🇫", continent: "Oceania" },
  { city: "Tahiti", country: "Polinesia Francese", flag: "🇵🇫", continent: "Oceania" },
  { city: "Figi", country: "Figi", flag: "🇫🇯", continent: "Oceania" },
  { city: "Papeete", country: "Polinesia Francese", flag: "🇵🇫", continent: "Oceania" },
  { city: "Port Moresby", country: "Papua Nuova Guinea", flag: "🇵🇬", continent: "Oceania" },
];

/**
 * Search destinations by query with fuzzy matching.
 * Returns up to `limit` results, prioritising city name matches over country.
 */
export function searchDestinations(query: string, maxResults = 8): Destination[] {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 1) return [];

  const results: Array<{ dest: Destination; score: number }> = [];

  for (const dest of WORLD_DESTINATIONS) {
    const cityL = dest.city.toLowerCase();
    const countryL = dest.country.toLowerCase();

    if (cityL.startsWith(q)) {
      results.push({ dest, score: 100 });
    } else if (cityL.includes(q)) {
      results.push({ dest, score: 80 });
    } else if (countryL.startsWith(q)) {
      results.push({ dest, score: 60 });
    } else if (countryL.includes(q)) {
      results.push({ dest, score: 40 });
    }
  }

  return results
    .sort((a, b) => b.score - a.score || a.dest.city.localeCompare(b.dest.city))
    .slice(0, maxResults)
    .map((r) => r.dest);
}
