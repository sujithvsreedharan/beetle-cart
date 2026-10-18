import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { I18nService } from '../../services/i18n.service';
import { LocationService } from '../../services/location.service';
import { STORE_CONFIG } from '../../config/store.config';
import { CartItem } from '../../models/store.model';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (cartService.isCartOpen()) {
      <div class="cart-backdrop" (click)="onBackdropClick($event)">
        <dialog id="cart" open>
          <div class="in" id="cartIn">
            <div class="cart-head">
              <h2>{{ i18n.t('yourCart') }}</h2>
              <button 
                class="chip" 
                type="button" 
                (click)="cartService.closeCart()">
                {{ i18n.t('close') }}
              </button>
            </div>

            @if (orderSuccessMessage()) {
              <div class="msg">{{ orderSuccessMessage() }}</div>
            }

            @if (cartService.items().length === 0 && !orderSuccessMessage()) {
              <p class="empty sm">{{ i18n.t('empty') }}</p>
            }

            @if (cartService.items().length > 0) {
              <!-- Cart Items -->
              @for (item of cartService.items(); track item.product.id) {
                <div class="li">
                  <div class="t">
                    @if (item.product.image) {
                      <img 
                        [src]="item.product.image" 
                        [alt]="i18n.getField(item.product, 'name')" />
                    } @else {
                      <span>🛍️</span>
                    }
                  </div>
                  <div>
                    <b>{{ i18n.getField(item.product, 'name') }}</b>
                    <small>{{ cartService.formatMoney(item.product.price) }} {{ i18n.t('each') }}</small>
                  </div>
                  <div class="qty">
                    <button 
                      type="button" 
                      (click)="cartService.addItem(item.product.id, -1)" 
                      [attr.aria-label]="i18n.t('less')">
                      −
                    </button>
                    <span>{{ item.quantity }}</span>
                    <button 
                      type="button" 
                      (click)="cartService.addItem(item.product.id, 1)" 
                      [attr.aria-label]="i18n.t('more')">
                      +
                    </button>
                  </div>
                </div>
              }

              <!-- Price Summaries -->
              <div class="sum">
                <span>{{ i18n.t('subtotal') }}</span>
                <span>{{ cartService.formatMoney(cartService.subtotal()) }}</span>
              </div>

              @if (cartService.deliveryCharge() > 0) {
                <div class="sum">
                  <span>{{ i18n.t('delivery') }}</span>
                  <span>{{ cartService.formatMoney(cartService.deliveryCharge()) }}</span>
                </div>
              }

              <div class="total">
                <span>{{ i18n.t('total') }}</span>
                <span>{{ cartService.formatMoney(cartService.grandTotal()) }}</span>
              </div>

              <!-- Location & Checkout Form -->
              <form class="f" (submit)="onCheckout($event)">
                <button 
                  class="chip" 
                  type="button" 
                  (click)="locationService.requestLocation()">
                  {{ i18n.t('locBtn') }}
                </button>

                <div 
                  class="pin-msg" 
                  [class.ok]="locationService.status() === 'inside'"
                  [class.bad]="locationService.status() === 'outside' || locationService.status() === 'denied' || locationService.status() === 'error'"
                  aria-live="polite">
                  {{ locationFeedback() }}
                </div>

                @if (checkoutError()) {
                  <div class="err" role="alert">{{ checkoutError() }}</div>
                }

                <button 
                  class="btn alt" 
                  id="cb" 
                  type="submit" 
                  [disabled]="isSubmitting() || isBlockedByLocation()">
                  {{ isSubmitting() ? 'Opening WhatsApp...' : i18n.t('order') }}
                </button>
              </form>
            }
          </div>
        </dialog>
      </div>
    }
  `,
  styles: [`
    .cart-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
      z-index: 100;
    }
  `]
})
export class CartDrawerComponent {
  readonly cartService = inject(CartService);
  readonly orderService = inject(OrderService);
  readonly i18n = inject(I18nService);
  readonly locationService = inject(LocationService);

  readonly isSubmitting = signal<boolean>(false);
  readonly checkoutError = signal<string>('');
  readonly orderSuccessMessage = signal<string>('');

  readonly isBlockedByLocation = computed<boolean>(() => {
    if (this.locationService.isAreaActive() && STORE_CONFIG.deliveryArea.requireLocation) {
      if (this.locationService.userLoc() && !this.locationService.isInsideDeliveryArea()) {
        return true;
      }
    }
    return false;
  });

  locationFeedback(): string {
    const feedback = this.locationService.locationFeedbackMessage();
    if (feedback) return feedback;
    return 'Please share your location for delivery.';
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cart-backdrop')) {
      this.cartService.closeCart();
    }
  }

  async onCheckout(event: Event): Promise<void> {
    event.preventDefault();
    const items = this.cartService.items();
    if (!items.length) return;

    const userLoc = this.locationService.userLoc();

    if (!userLoc) {
      this.checkoutError.set('Please share your location first.');
      return;
    }

    if (
      this.locationService.isAreaActive() &&
      STORE_CONFIG.deliveryArea.requireLocation &&
      !this.locationService.isInsideDeliveryArea()
    ) {
      this.checkoutError.set('Sorry, your location is outside our delivery area.');
      return;
    }

    this.checkoutError.set('');
    this.isSubmitting.set(true);

    const makeText = (orderId?: string) => {
      const itemsText = items
        .map(
          i =>
            `${i.quantity} x ${i.product.name} (${i.product.id}) - ${this.cartService.formatMoney(
              i.product.price * i.quantity
            )}`
        )
        .join('\n');

      return (
        `New order${orderId ? ' ' + orderId : ''}\n` +
        itemsText +
        `\nSubtotal: ${this.cartService.formatMoney(this.cartService.subtotal())}` +
        `\nDelivery: ${this.cartService.formatMoney(this.cartService.deliveryCharge())}` +
        `\nTotal: ${this.cartService.formatMoney(this.cartService.grandTotal())}` +
        `\nCustomer location: https://maps.google.com/?q=${userLoc.lat},${userLoc.lng}`
      );
    };

    try {
      const locUrl = userLoc ? `https://maps.google.com/?q=${userLoc.lat},${userLoc.lng}` : undefined;
      const order = this.orderService.recordOrder(
        items,
        this.cartService.subtotal(),
        this.cartService.deliveryCharge(),
        this.cartService.grandTotal(),
        locUrl
      );

      const orderText = makeText(order.id);
      const encoded = encodeURIComponent(orderText);
      const url = STORE_CONFIG.orderUrl.replace('{text}', encoded);

      this.cartService.clearCart();
      this.orderSuccessMessage.set(this.i18n.t('thanks'));

      if (typeof window !== 'undefined') {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      this.checkoutError.set(this.i18n.t('errSend'));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
