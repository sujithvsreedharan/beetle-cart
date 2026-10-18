import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/store.model';
import { I18nService } from '../../services/i18n.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="card" [class.hl]="isHighlighted" [id]="'p-' + product.id">
      @if (badgeText) {
        <span class="tag">{{ badgeText }}</span>
      }
      <button 
        class="img" 
        type="button"
        (click)="open.emit(product)" 
        [attr.aria-label]="i18n.t('view') + ' ' + productName">
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
      </button>

      <div class="body">
        <span class="cat">{{ categoryName }}</span>
        <button class="name" type="button" (click)="open.emit(product)">
          {{ productName }}
        </button>
        <p class="desc">{{ descriptionText }}</p>

        <div class="pr">
          <span class="price">{{ cartService.formatMoney(product.price) }}</span>
          @if (product.oldprice && product.oldprice > product.price) {
            <span class="old">{{ cartService.formatMoney(product.oldprice) }}</span>
          }
        </div>

        <div class="stock-status">
          @if (isOutOfStock) {
            <span class="out">{{ i18n.t('out') }}</span>
          }
        </div>

        <button 
          class="btn" 
          type="button"
          (click)="onAdd()" 
          [disabled]="isOutOfStock">
          {{ justAdded ? i18n.t('added') : (isOutOfStock ? i18n.t('unavailable') : i18n.t('add')) }}
        </button>
      </div>
    </article>
  `,
})
export class ProductCardComponent {
  private _product!: Product;

  @Input({ required: true })
  set product(val: Product) {
    this._product = val;
    this.imgFailed = false;
    this.fallbackTried = false;
    this.fallbackSrc = '';
  }
  get product(): Product {
    return this._product;
  }

  @Input() isHighlighted = false;
  @Output() open = new EventEmitter<Product>();

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
    return this.i18n.getField(this.product, 'name');
  }

  get categoryName(): string {
    return this.i18n.getField(this.product, 'category');
  }

  get descriptionText(): string {
    return this.i18n.getField(this.product, 'description');
  }

  get badgeText(): string {
    return (
      this.i18n.getField(this.product, 'badge') ||
      (this.product.oldprice && this.product.oldprice > this.product.price ? this.i18n.t('sale') : '')
    );
  }

  get isOutOfStock(): boolean {
    return this.product.stock === 0;
  }

  onAdd(): void {
    if (this.isOutOfStock) return;
    this.cartService.addItem(this.product.id, 1);
    this.justAdded = true;
    setTimeout(() => {
      this.justAdded = false;
    }, 900);
  }
}
