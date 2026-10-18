import { Injectable, computed, effect, signal } from '@angular/core';
import { CartItem, OrderItemRecord, OrderStatus, StoreOrder } from '../models/store.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly STORAGE_KEY = 'beetle_mart_orders';

  readonly orders = signal<StoreOrder[]>(this.loadInitialOrders());

  readonly totalOrders = computed<number>(() => this.orders().length);

  readonly totalRevenue = computed<number>(() => {
    return this.orders()
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  });

  readonly pendingOrders = computed<number>(() => {
    return this.orders().filter(o => o.status === 'pending').length;
  });

  readonly processingOrders = computed<number>(() => {
    return this.orders().filter(o => o.status === 'processing').length;
  });

  readonly deliveredOrders = computed<number>(() => {
    return this.orders().filter(o => o.status === 'delivered').length;
  });

  readonly cancelledOrders = computed<number>(() => {
    return this.orders().filter(o => o.status === 'cancelled').length;
  });

  constructor() {
    effect(() => {
      const data = this.orders();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
          console.error('Failed to save orders to localStorage:', err);
        }
      }
    });
  }

  private loadInitialOrders(): StoreOrder[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load orders from localStorage:', err);
    }
    return [];
  }

  recordOrder(
    cartItems: CartItem[],
    subtotal: number,
    deliveryCharge: number,
    grandTotal: number,
    customerLocationUrl?: string
  ): StoreOrder {
    const orderItems: OrderItemRecord[] = cartItems.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      total: item.product.price * item.quantity
    }));

    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const orderId = `BM-${dateStr}-${randCode}`;

    const newOrder: StoreOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customerLocationUrl,
      items: orderItems,
      subtotal,
      deliveryCharge,
      grandTotal,
      status: 'pending'
    };

    this.orders.update(prev => [newOrder, ...prev]);
    return newOrder;
  }

  updateOrderStatus(orderId: string, status: OrderStatus): void {
    this.orders.update(list =>
      list.map(order => (order.id === orderId ? { ...order, status } : order))
    );
  }

  deleteOrder(orderId: string): void {
    this.orders.update(list => list.filter(order => order.id !== orderId));
  }

  clearAllOrders(): void {
    this.orders.set([]);
  }

  exportToCsv(): void {
    const list = this.orders();
    if (!list.length) return;

    const headers = [
      'Order ID',
      'Date & Time',
      'Status',
      'Subtotal (INR)',
      'Delivery Charge (INR)',
      'Grand Total (INR)',
      'Items Detail',
      'Total Item Count',
      'Customer Google Maps Link'
    ];

    const escapeCsv = (str: string | number | undefined | null) => {
      const text = String(str ?? '').replace(/"/g, '""');
      return `"${text}"`;
    };

    const rows = list.map(order => {
      const itemsDetail = order.items
        .map(i => `${i.quantity}x ${i.name} (Rs.${i.price})`)
        .join('; ');

      const totalItemCount = order.items.reduce((s, i) => s + i.quantity, 0);
      const dateFormatted = new Date(order.createdAt).toLocaleString('en-IN');

      return [
        escapeCsv(order.id),
        escapeCsv(dateFormatted),
        escapeCsv(order.status.toUpperCase()),
        escapeCsv(order.subtotal),
        escapeCsv(order.deliveryCharge),
        escapeCsv(order.grandTotal),
        escapeCsv(itemsDetail),
        escapeCsv(totalItemCount),
        escapeCsv(order.customerLocationUrl || 'Not provided')
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const todayStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `beetle-mart-orders-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
