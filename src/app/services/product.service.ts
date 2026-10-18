import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/store.model';
import { STORE_CONFIG } from '../config/store.config';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);

  readonly products = signal<Product[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly warning = signal<string>('');
  readonly errorMessage = signal<string>('');

  constructor() {
    this.loadProducts();
  }

  loadProducts(): void {
    if (!STORE_CONFIG.sheetCsvUrl) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const separator = STORE_CONFIG.sheetCsvUrl.includes('?') ? '&' : '?';
    const url = `${STORE_CONFIG.sheetCsvUrl}${separator}t=${Date.now()}`;

    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (csvText) => {
        try {
          const rows = this.parseCSV(csvText);
          if (!rows.length) {
            this.products.set([]);
            this.isLoading.set(false);
            return;
          }

          const cols = Object.keys(rows[0] || {});
          if (STORE_CONFIG.showSheetWarnings) {
            const missing = ['name_ml', 'description_ml', 'image'].filter(c => !cols.includes(c));
            if (missing.length) {
              this.warning.set(
                `Sheet notice: the published sheet is missing the column(s): ${missing.join(', ')}. ` +
                `Columns received: ${cols.join(', ') || 'none'}.`
              );
            } else {
              this.warning.set('');
            }
          }

          const seen = new Set<string>();
          const parsedProducts: Product[] = [];

          for (const row of rows) {
            const id = (row['id'] || '').trim();
            const name = (row['name'] || '').trim();
            const price = this.parseNum(row['price']);

            if (!id || !name || price <= 0 || seen.has(id)) {
              continue;
            }
            seen.add(id);

            const rawStock = Number(row['stock']);
            const stock = (row['stock'] === '' || row['stock'] == null || isNaN(rawStock))
              ? 99
              : Math.max(0, Math.floor(rawStock));

            parsedProducts.push({
              id,
              name,
              name_ml: (row['name_ml'] || '').trim(),
              category: (row['category'] || '').trim(),
              category_ml: (row['category_ml'] || '').trim(),
              price,
              oldprice: this.parseNum(row['oldprice']),
              badge: (row['badge'] || '').trim(),
              badge_ml: (row['badge_ml'] || '').trim(),
              description: (row['description'] || '').trim(),
              description_ml: (row['description_ml'] || '').trim(),
              image: this.fixImg(this.pickImage(row)),
              stock
            });
          }

          this.products.set(parsedProducts);
        } catch (err) {
          console.error('Error parsing sheet CSV:', err);
          this.errorMessage.set('Could not parse products from sheet.');
        } finally {
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load products CSV:', err);
        this.errorMessage.set('Could not load products. Check the sheet is published as CSV.');
        this.isLoading.set(false);
      }
    });
  }

  byId(id: string): Product | undefined {
    return this.products().find(p => p.id === id);
  }

  private parseNum(v: unknown): number {
    return Number(String(v ?? '').replace(/[^\d.]/g, '')) || 0;
  }

  private fixImg(u: string): string {
    let clean = String(u || '').trim();
    if (!clean) return '';
    const m = clean.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/);
    if (m) {
      return `https://lh3.googleusercontent.com/d/${m[1]}`;
    }
    if (/^https?:\/\//i.test(clean) || clean.startsWith('//') || clean.startsWith('data:')) {
      return clean;
    }
    clean = clean.replace(/^\/+/, '');
    const parts = clean.split('/').map(p => encodeURIComponent(decodeURIComponent(p)));
    return `/${parts.join('/')}`;
  }

  private looksLikeImage(v: string): boolean {
    return /\.(jpe?g|png|webp|gif|svg|avif)(\?.*)?$/i.test(String(v || '').trim());
  }

  private pickImage(p: Record<string, string>): string {
    return p['image'] || p['images'] || p['photo'] || p['img'] || p['image_url'] || p['picture'] ||
      Object.values(p).find(v => this.looksLikeImage(v)) || '';
  }

  private parseCSV(text: string): Record<string, string>[] {
    const rows: string[][] = [];
    let r: string[] = [];
    let f = '';
    let q = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') {
          f += '"';
          i++;
        } else if (c === '"') {
          q = false;
        } else {
          f += c;
        }
      } else if (c === '"') {
        q = true;
      } else if (c === ',') {
        r.push(f);
        f = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') {
          i++;
        }
        r.push(f);
        f = '';
        rows.push(r);
        r = [];
      } else {
        f += c;
      }
    }

    if (f || r.length) {
      r.push(f);
      rows.push(r);
    }

    if (!rows.length) return [];

    const h = rows.shift()!.map(x => x.replace(/^\ufeff/, '').trim().toLowerCase().replace(/\s+/g, '_'));
    return rows
      .filter(row => row.some(Boolean))
      .map(row => Object.fromEntries(h.map((k, i) => [k, (row[i] || '').trim()])));
  }
}
