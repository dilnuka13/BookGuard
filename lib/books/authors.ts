/**
 * Curated preset authors and author matching helper for BookGuard.
 * Supports both Sinhala script and Latin/English script author names.
 */

export interface AuthorSuggestion {
  name: string;
  bookCount?: number;
  source: "library" | "community" | "preset";
}

export const PRESET_AUTHORS: string[] = [
  // Renowned Sri Lankan Authors (Sinhala & English)
  "Martin Wickramasinghe",
  "මාර්ටින් වික්‍රමසිංහ",
  "K. Jayatillake",
  "කේ. ජයතිලක",
  "Mahagama Sekera",
  "මහගම සේකර",
  "W. A. Silva",
  "ඩබ්ලිව්. ඒ. සිල්වා",
  "T. B. Ilangaratne",
  "ටී. බී. ඉලංගරත්න",
  "Ediriweera Sarachchandra",
  "එදිරිවීර සරච්චන්ද්‍ර",
  "Kumaratunga Munidasa",
  "කුමාරතුංග මුනිදාස",
  "Sybil Wettasinghe",
  "සිබිල් වෙත්තසිංහ",
  "Karunasena Jayalath",
  "කරුණාසේන ජයලත්",
  "Gunadasa Amarasekara",
  "ගුණදාස අමරසේකර",
  "Chandana Mendis",
  "චන්දන මෙන්ඩිස්",
  "K. G. Karunathilake",
  "කේ. ජී. කරුණාතිලක",
  "Jackson Anthony",
  "ජැක්සන් ඇන්තනී",
  "Madawala S. Rathnayake",
  "මඩවල එස්. රත්නායක",
  "Arisen Ahubudu",
  "අරිසෙන් අහුබුදු",
  "Siri Gunasinghe",
  "සිරි ගුණසිංහ",
  "Simon Nawagattegama",
  "සයිමන් නවගත්තේගම",
  "Sunethra Rajakarunanayake",
  "සුනේත්‍රා රාජකරුණානායක",
  "Jayasena Jayakody",
  "ජයසේන ජයකොඩි",
  "Ananda Samarakoon",
  "ආනන්ද සමරකෝන්",
  "Upali Leelarathna",
  "උපාලි ලීලාරත්න",
  "Piyadasa Sirisena",
  "පියදාස සිරිසේන",
  "Sujeewa Prasanna Arachchi",
  "සුජීව ප්‍රසන්න ආරච්චි",
  "Mohan Raj Madawala",
  "මොහාන් රාජ් මඩවල",
  "Daya Rohana Athukorala",
  "දයා රෝහණ අතුකෝරාල",
  "Shanthi Dissanayake",
  "ශාන්ති දිසානායක",
  "Sarath Wijesooriya",
  "සරත් විජේසූරිය",
  "Somadasa Abeywickrama",
  "සෝමදාස අබේවික්‍රම",
  "G. B. Senanayake",
  "ජී. බී. සේනානායක",
  "Sugathapala de Silva",
  "සුගතපාල ද සිල්වා",
  "Kathleen Jayawardena",
  "කැත්ලීන් ජයවර්ධන",
  "Tennyson Perera",
  "ටෙනිසන් පෙරේරා",
  "Eric Illayapparachchi",
  "එරික් ඉලයප්පආරච්චි",

  // International Authors
  "Arthur C. Clarke",
  "J. K. Rowling",
  "George Orwell",
  "Agatha Christie",
  "Stephen King",
  "Enid Blyton",
  "Roald Dahl",
  "Dan Brown",
  "J. R. R. Tolkien",
  "Charles Dickens",
  "Leo Tolstoy",
  "Ernest Hemingway",
  "Mark Twain",
  "Jane Austen",
  "William Shakespeare",
  "Paulo Coelho",
  "Gabriel García Márquez",
  "C. S. Lewis",
  "Haruki Murakami",
  "Isaac Asimov",
  "Jules Verne",
  "H. G. Wells",
  "Arthur Conan Doyle",
  "Oscar Wilde",
  "Franz Kafka",
  "Fyodor Dostoevsky",
  "Victor Hugo",
  "Alexandre Dumas",
  "Virginia Woolf",
  "George R. R. Martin",
  "Rick Riordan",
  "Yuval Noah Harari",
  "Dale Carnegie",
  "Robert Kiyosaki",
  "James Clear",
  "Malcolm Gladwell",
  "Chimamanda Ngozi Adichie",
  "Khaled Hosseini",
  "Walter Isaacson",
  "Robin Sharma",
];

/**
 * Filter preset authors against query string.
 */
export function filterPresetAuthors(query: string, limit = 10): AuthorSuggestion[] {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return PRESET_AUTHORS.slice(0, limit).map((name) => ({
      name,
      source: "preset",
    }));
  }

  const matches: AuthorSuggestion[] = [];

  for (const name of PRESET_AUTHORS) {
    const lowerName = name.toLowerCase();
    if (lowerName.startsWith(clean)) {
      matches.push({ name, source: "preset" });
    } else if (lowerName.includes(clean)) {
      matches.push({ name, source: "preset" });
    }
    if (matches.length >= limit) break;
  }

  return matches;
}
