import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { STORE_CONFIG } from '../config/store.config';
import { CartItem, Product } from '../models/store.model';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly productService = inject(ProductService);

  readonly isCartOpen = signal<boolean>(false);
  readonly cartMap = signal<Record<string, number>>(this.loadInitialCart());

  readonly items = computed<CartItem[]>(() => {
    const map = this.cartMap();
    const productList = this.productService.products();
    const result: CartItem[] = [];

    for (const [id, qty] of Object.entries(map)) {
      if (qty > 0) {
        const prod = productList.find(p => p.id === id);
        if (prod) {
          result.push({
            product: prod,
            quantity: qty
          });
        }
      }
    }
    return result;
  });

  readonly totalCount = computed<number>(() => {
    return this.items().reduce((sum, item) => sum + item.quantity, 0);
  });

  readonly subtotal = computed<number>(() => {
    return this.items().reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  });

  readonly deliveryCharge = computed<number>(() => {
    if (!this.items().length) return 0;
    return Math.max(0, Number(STORE_CONFIG.deliveryCharge) || 0);
  });

  readonly grandTotal = computed<number>(() => {
    return this.subtotal() + this.deliveryCharge();
  });

  constructor() {
    // Automatically save to localStorage when cartMap changes
    effect(() => {
      const current = this.cartMap();
      try {
        localStorage.setItem('cart', JSON.stringify(current));
      } catch {
        // Ignore
      }
    });

    // When products arrive, clean up any cart items exceeding stock
    effect(() => {
      const prods = this.productService.products();
      if (prods.length > 0) {
        this.cleanCart();
      }
    });
  }

  private loadInitialCart(): Record<string, number> {
    try {
      const raw = localStorage.getItem('cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return {};
  }

  openCart(): void {
    this.isCartOpen.set(true);
  }

  closeCart(): void {
    this.isCartOpen.set(false);
  }

  toggleCart(): void {
    this.isCartOpen.update(v => !v);
  }

  getMaxForProduct(p: Product): number {
    return Math.max(0, Math.min(p.stock, STORE_CONFIG.maxQtyPerItem));
  }

  setQuantity(productId: string, qty: number): void {
    const prod = this.productService.byId(productId);
    if (!prod) return;

    const max = this.getMaxForProduct(prod);
    const target = Math.max(0, Math.min(Math.floor(qty) || 0, max));

    this.cartMap.update(current => {
      const next = { ...current };
      if (target > 0) {
        next[productId] = target;
      } else {
        delete next[productId];
      }
      return next;
    });
  }

  addItem(productId: string, delta = 1): void {
    const currentQty = this.cartMap()[productId] || 0;
    this.setQuantity(productId, currentQty + delta);
  }

  removeItem(productId: string): void {
    this.cartMap.update(current => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  clearCart(): void {
    this.cartMap.set({});
  }

  cleanCart(): void {
    const current = this.cartMap();
    let hasChanges = false;
    const next: Record<string, number> = {};

    for (const [id, qty] of Object.entries(current)) {
      const p = this.productService.byId(id);
      const n = Math.floor(Number(qty));
      if (p && n > 0) {
        const max = this.getMaxForProduct(p);
        if (max > 0) {
          next[id] = Math.min(n, max);
          if (next[id] !== qty) hasChanges = true;
          continue;
        }
      }
      hasChanges = true;
    }

    if (hasChanges) {
      this.cartMap.set(next);
    }
  }

  formatMoney(n: number): string {
    return STORE_CONFIG.currency + Number(n).toLocaleString('en-IN');
  }
}
