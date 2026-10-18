import { Injectable, signal } from '@angular/core';
import { STORE_CONFIG } from '../config/store.config';
import { Product } from '../models/store.model';

export const TRANSLATIONS: Record<'en' | 'ml', Record<string, string>> = {
  en: {
    search: "Search products",
    sort: "Sort",
    sortLo: "Price: low to high",
    sortHi: "Price: high to low",
    sortAz: "Name: A to Z",
    categories: "Categories",
    all: "All",
    cart: "Cart",
    openCart: "Open cart",
    yourCart: "Your cart",
    close: "Close",
    add: "Add to cart",
    added: "Added ✓",
    unavailable: "Unavailable",
    out: "Out of stock",
    only: "Only {n} left",
    each: "each",
    total: "Total",
    empty: "Your cart is empty.",
    yourName: "Your name",
    order: "Order on WhatsApp",
    sending: "Sending...",
    less: "Less",
    more: "More",
    sale: "Sale",
    view: "View",
    countOne: "{n} product",
    countMany: "{n} products",
    noMatch: "No products match. Try another word or category.",
    loadFail: "Could not load products. Check the sheet is published as CSV.",
    thanks: "Thank you! Your order is ready in WhatsApp. Tap Send there to confirm.",
    errSetup: "Ordering is not set up yet. Please contact the store.",
    errSend: "Could not send the order. Please try again.",
    announce: "Order easily on WhatsApp. We confirm every order personally.",
    heroTitle: "Quality picks for everyday life",
    heroSub: "Shop clothing, footwear, electronics and more. Add to cart and confirm your order on WhatsApp in a minute.",
    shopNow: "Shop now",
    chatUs: "Chat on WhatsApp",
    trust1: "WhatsApp ordering",
    trust1s: "Quick and personal",
    trust2: "Safe checkout",
    trust2s: "No card details on this site",
    trust3: "Live stock",
    trust3s: "Updated as items sell",
    trust4: "Wide range",
    trust4s: "Clothing to electronics",
    shopByCategory: "Shop by category",
    bestSellers: "Best sellers",
    newArrivals: "New arrivals",
    offers: "Offers",
    allProducts: "All products",
    home: "Home",
    shop: "Shop",
    chat: "Chat",
    share: "Share on WhatsApp",
    about: "Quality products, simple ordering. Browse, add to cart and confirm on WhatsApp.",
    contact: "Contact",
    quickLinks: "Quick links",
    rights: "All rights reserved.",
    pincode: "Delivery pincode",
    subtotal: "Subtotal",
    delivery: "Delivery charge",
    pinInvalid: "Enter a valid 6-digit pincode.",
    pinNo: "Sorry, we don't deliver to this pincode yet.",
    pinOk: "Delivery is available to this pincode.",
    locBtn: "📍 Share my location",
    locWait: "Finding your location...",
    locOk: "Your location is inside our delivery area.",
    locOut: "You are about {d} km from our delivery centre. We deliver within {r} km.",
    locNeed: "Please share your location so we can check delivery.",
    locDenied: "Location permission is blocked. Allow it in your browser settings and try again.",
    locFail: "Could not get your location. Please try again.",
    locNone: "Your browser cannot share location."
  },
  ml: {
    search: "ഉൽപ്പന്നങ്ങൾ തിരയുക",
    sort: "ക്രമീകരിക്കുക",
    sortLo: "വില: കുറവ് മുതൽ കൂടുതൽ",
    sortHi: "വില: കൂടുതൽ മുതൽ കുറവ്",
    sortAz: "പേര്: A മുതൽ Z",
    categories: "വിഭാഗങ്ങൾ",
    all: "എല്ലാം",
    cart: "കാർട്ട്",
    openCart: "കാർട്ട് തുറക്കുക",
    yourCart: "നിങ്ങളുടെ കാർട്ട്",
    close: "അടയ്ക്കുക",
    add: "കാർട്ടിൽ ചേർക്കുക",
    added: "ചേർത്തു ✓",
    unavailable: "ലഭ്യമല്ല",
    out: "സ്റ്റോക്ക് തീർന്നു",
    only: "{n} എണ്ണം മാത്രം ബാക്കി",
    each: "ഒന്നിന്",
    total: "ആകെ",
    empty: "നിങ്ങളുടെ കാർട്ട് ശൂന്യമാണ്.",
    yourName: "നിങ്ങളുടെ പേര്",
    order: "വാട്സ്ആപ്പിൽ ഓർഡർ ചെയ്യുക",
    sending: "അയയ്ക്കുന്നു...",
    less: "കുറയ്ക്കുക",
    more: "കൂട്ടുക",
    sale: "ഓഫർ",
    view: "കാണുക",
    countOne: "{n} ഉൽപ്പന്നം",
    countMany: "{n} ഉൽപ്പന്നങ്ങൾ",
    noMatch: "ഒന്നും കണ്ടെത്തിയില്ല. മറ്റൊരു വാക്കോ വിഭാഗമോ നോക്കുക.",
    loadFail: "ഉൽപ്പന്നങ്ങൾ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല. ഷീറ്റ് CSV ആയി പ്രസിദ്ധീകരിച്ചിട്ടുണ്ടോ എന്ന് പരിശോധിക്കുക.",
    thanks: "നന്ദി! നിങ്ങളുടെ ഓർഡർ വാട്സ്ആപ്പിൽ തയ്യാറാണ്. സ്ഥിരീകരിക്കാൻ അവിടെ Send അമർത്തുക.",
    errSetup: "ഓർഡർ സംവിധാനം ഇതുവരെ സജ്ജമാക്കിയിട്ടില്ല. ദയവായി സ്റ്റോറുമായി ബന്ധപ്പെടുക.",
    errSend: "ഓർഡർ അയയ്ക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.",
    announce: "വാട്സ്ആപ്പിൽ എളുപ്പത്തിൽ ഓർഡർ ചെയ്യൂ. ഓരോ ഓർഡറും ഞങ്ങൾ നേരിട്ട് സ്ഥിരീകരിക്കും.",
    heroTitle: "ദൈനംദിന ജീവിതത്തിനുള്ള മികച്ച തിരഞ്ഞെടുപ്പുകൾ",
    heroSub: "വസ്ത്രങ്ങൾ, പാദരക്ഷകൾ, ഇലക്ട്രോണിക്സ് എന്നിവയും കൂടുതലും വാങ്ങൂ. കാർട്ടിൽ ചേർത്ത് ഒരു മിനിറ്റിനുള്ളിൽ വാട്സ്ആപ്പിൽ ഓർഡർ സ്ഥിരീകരിക്കൂ.",
    shopNow: "ഇപ്പോൾ വാങ്ങൂ",
    chatUs: "വാട്സ്ആപ്പിൽ സംസാരിക്കൂ",
    trust1: "വാട്സ്ആപ്പ് ഓർഡർ",
    trust1s: "വേഗത്തിൽ, നേരിട്ട്",
    trust2: "സുരക്ഷിത ചെക്ക്ഔട്ട്",
    trust2s: "ഈ സൈറ്റിൽ കാർഡ് വിവരങ്ങൾ ഇല്ല",
    trust3: "തത്സമയ സ്റ്റോക്ക്",
    trust3s: "വിൽക്കുന്നതനുസരിച്ച് അപ്ഡേറ്റ് ചെയ്യും",
    trust4: "വിപുലമായ ശേഖരം",
    trust4s: "വസ്ത്രം മുതൽ ഇലക്ട്രോണിക്സ് വരെ",
    shopByCategory: "വിഭാഗം അനുസരിച്ച് വാങ്ങൂ",
    bestSellers: "ബെസ്റ്റ് സെല്ലറുകൾ",
    newArrivals: "പുതിയ ഉൽപ്പന്നങ്ങൾ",
    offers: "ഓഫറുകൾ",
    allProducts: "എല്ലാ ഉൽപ്പന്നങ്ങളും",
    home: "ഹോം",
    shop: "ഷോപ്പ്",
    chat: "ചാറ്റ്",
    share: "വാട്സ്ആപ്പിൽ പങ്കിടുക",
    about: "ഗുണമേന്മയുള്ള ഉൽപ്പന്നങ്ങൾ, എളുപ്പത്തിലുള്ള ഓർഡർ. തിരഞ്ഞെടുക്കൂ, കാർട്ടിൽ ചേർക്കൂ, വാട്സ്ആപ്പിൽ സ്ഥിരീകരിക്കൂ.",
    contact: "ബന്ധപ്പെടുക",
    quickLinks: "ലിങ്കുകൾ",
    rights: "എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.",
    pincode: "ഡെലിവറി പിൻകോഡ്",
    subtotal: "ഉപമൊത്തം",
    delivery: "ഡെലിവറി ചാർജ്",
    pinInvalid: "ശരിയായ 6 അക്ക പിൻകോഡ് നൽകുക.",
    pinNo: "ക്ഷമിക്കണം, ഈ പിൻകോഡിലേക്ക് ഇപ്പോൾ ഡെലിവറി ഇല്ല.",
    pinOk: "ഈ പിൻകോഡിലേക്ക് ഡെലിവറി ലഭ്യമാണ്.",
    locBtn: "📍 എന്റെ ലൊക്കേഷൻ പങ്കിടുക",
    locWait: "ലൊക്കേഷൻ കണ്ടെത്തുന്നു...",
    locOk: "നിങ്ങളുടെ ലൊക്കേഷൻ ഞങ്ങളുടെ ഡെലിവറി പ്രദേശത്താണ്.",
    locOut: "നിങ്ങൾ ഞങ്ങളുടെ ഡെലിവറി കേന്ദ്രത്തിൽ നിന്ന് ഏകദേശം {d} കിമീ അകലെയാണ്. {r} കിമീയ്ക്കുള്ളിൽ മാത്രമേ ഡെലിവറി ഉള്ളൂ.",
    locNeed: "ഡെലിവറി പരിശോധിക്കാൻ നിങ്ങളുടെ ലൊക്കേഷൻ പങ്കിടുക.",
    locDenied: "ലൊക്കേഷൻ അനുമതി തടഞ്ഞിരിക്കുന്നു. ബ്രൗസർ സെറ്റിംഗ്സിൽ അനുവദിച്ച് വീണ്ടും ശ്രമിക്കുക.",
    locFail: "ലൊക്കേഷൻ ലഭിച്ചില്ല. വീണ്ടും ശ്രമിക്കുക.",
    locNone: "നിങ്ങളുടെ ബ്രൗസറിന് ലൊക്കേഷൻ പങ്കിടാൻ കഴിയില്ല."
  }
};

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  readonly currentLang = signal<'en' | 'ml'>(this.getInitialLang());

  private getInitialLang(): 'en' | 'ml' {
    try {
      const saved = localStorage.getItem('lang');
      if (saved === 'en' || saved === 'ml') {
        return saved;
      }
    } catch {
      // Ignore localStorage error
    }
    return STORE_CONFIG.defaultLang;
  }

  toggleLang(): void {
    const next = this.currentLang() === 'en' ? 'ml' : 'en';
    this.setLang(next);
  }

  setLang(lang: 'en' | 'ml'): void {
    this.currentLang.set(lang);
    try {
      localStorage.setItem('lang', lang);
    } catch {
      // Ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }

  t(key: string, n?: string | number): string {
    const lang = this.currentLang();
    const str = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en?.[key] ?? key;
    if (n !== undefined) {
      return str.replace('{n}', String(n));
    }
    return str;
  }

  getField(p: Product, field: 'name' | 'category' | 'badge' | 'description'): string {
    const lang = this.currentLang();
    if (lang === 'ml') {
      const mlVal = p[`${field}_ml` as keyof Product] as string | undefined;
      if (mlVal && mlVal.trim()) {
        return mlVal;
      }
    }
    return (p[field] as string) || '';
  }

  getCategoryLabel(c: string, products: Product[]): string {
    if (c === 'All') {
      return this.t('all');
    }
    if (this.currentLang() === 'ml') {
      const p = products.find(x => x.category === c && x.category_ml);
      if (p?.category_ml) return p.category_ml;
    }
    return c;
  }
}
