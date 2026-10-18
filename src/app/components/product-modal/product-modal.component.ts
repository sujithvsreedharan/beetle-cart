import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/store.model';
import { I18nService } from '../../services/i18n.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (product) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <dialog id="pop" open>
          <button 
            class="x" 
            type="button" 
            (click)="close.emit()" 
            [attr.aria-label]="i18n.t('close')">
            ×
          </button>
          <div id="popIn">
            <div class="in">
              <div class="img">
                @if (currentImageSrc && !imgFailed) {
                  <img 
                    [src]="currentImageSrc" 
                    [alt]="productName" 
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    (error)="onImgError()" />
                } @else {
                  <span>🛍️</span>
                }
              </div>
              <div class="txt">
                <span class="cat">{{ categoryName }}</span>
                <h2 class="pop-title">{{ productName }}</h2>
                <div class="pr">
                  <span class="price">{{ cartService.formatMoney(product.price) }}</span>
                  @if (product.oldprice && product.oldprice > product.price) {
                    <span class="old">{{ cartService.formatMoney(product.oldprice) }}</span>
                  }
                </div>
                <p class="pop-desc">{{ descriptionText }}</p>

                @if (product.stock === 0) {
                  <span class="out">{{ i18n.t('out') }}</span>
                } @else if (product.stock <= 5) {
                  <span class="out">{{ i18n.t('only', product.stock) }}</span>
                }

                <button 
                  class="btn" 
                  type="button"
                  (click)="onAdd()" 
                  [disabled]="product.stock === 0">
                  {{ justAdded ? i18n.t('added') : (product.stock === 0 ? i18n.t('unavailable') : i18n.t('add')) }}
                </button>

                <a 
                  class="btn alt" 
                  target="_blank" 
                  rel="noopener" 
                  [href]="shareUrl">
                  {{ i18n.t('share') }}
                </a>
              </div>
            </div>
          </div>
        </dialog>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    dialog#pop {
      position: relative;
      margin: auto;
      z-index: 101;
    }
  `]
})
export class ProductModalComponent {
  private _product: Product | null = null;

  @Input()
  set product(val: Product | null) {
    this._product = val;
    this.imgFailed = false;
    this.fallbackTried = false;
    this.fallbackSrc = '';
  }
  get product(): Product | null {
    return this._product;
  }

  @Output() close = new EventEmitter<void>();

  readonly i18n = inject(I18nService);
  readonly cartService = inject(CartService);

  imgFailed = false;
  justAdded = false;
  fallbackTried = false;
  fallbackSrc = '';

  get currentImageSrc(): string {
    return this.fallbackSrc || this.product?.image || '';
  }

  onImgError(): void {
    if (!this.fallbackTried && this.product?.image) {
      this.fallbackTried = true;
      const img = this.product.image;
      if (img.includes('/products/')) {
        this.fallbackSrc = img.replace('/products/', '/');
        return;
      } else {
        const clean = img.replace(/^\/+/, '');
        this.fallbackSrc = `/products/${clean}`;
        return;
      }
    }
    this.imgFailed = true;
  }

  get productName(): string {
    return this.product ? this.i18n.getField(this.product, 'name') : '';
  }

  get categoryName(): string {
    return this.product ? this.i18n.getField(this.product, 'category') : '';
  }

  get descriptionText(): string {
    return this.product ? this.i18n.getField(this.product, 'description') : '';
  }

  get shareUrl(): string {
    if (!this.product || typeof window === 'undefined') return '#';
    const text = `${this.productName} ${window.location.origin}${window.location.pathname}?product=${this.product.id}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  onAdd(): void {
    if (!this.product || this.product.stock === 0) return;
    this.cartService.addItem(this.product.id, 1);
    this.justAdded = true;
    setTimeout(() => {
      this.justAdded = false;
      this.close.emit();
    }, 400);
  }
}
