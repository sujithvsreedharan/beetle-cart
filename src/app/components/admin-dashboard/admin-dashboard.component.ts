import { Component, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { AdminAuthService } from '../../services/admin-auth.service';
import { CartService } from '../../services/cart.service';
import { STORE_CONFIG } from '../../config/store.config';
import { OrderStatus, Product, StoreOrder } from '../../models/store.model';

type AdminTab = 'overview' | 'orders' | 'inventory' | 'settings';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dash-wrap">
      <!-- Top Admin Navigation -->
      <header class="dash-header">
        <div class="dash-header-in">
          <div class="dash-brand">
            <span class="dash-logo">🛒</span>
            <div>
              <div class="dash-title">{{ config.storeName }} <span class="admin-tag">Admin Console</span></div>
              <small class="dash-subtitle">Order Tracking & Inventory Operations</small>
            </div>
          </div>

          <div class="dash-actions">
            <button type="button" class="btn-dash-action" (click)="close.emit()">
              🛍️ Storefront
            </button>
            <button type="button" class="btn-dash-action btn-logout" (click)="onLogout()">
              🔒 Lock & Logout
            </button>
          </div>
        </div>

        <!-- Dashboard Tabs -->
        <nav class="dash-nav" aria-label="Admin Sections">
          <button 
            type="button" 
            class="dash-tab" 
            [class.active]="activeTab() === 'overview'" 
            (click)="activeTab.set('overview')">
            📊 Overview
          </button>
          <button 
            type="button" 
            class="dash-tab" 
            [class.active]="activeTab() === 'orders'" 
            (click)="activeTab.set('orders')">
            📦 Orders 
            @if (orderService.pendingOrders() > 0) {
              <span class="tab-badge">{{ orderService.pendingOrders() }}</span>
            }
          </button>
          <button 
            type="button" 
            class="dash-tab" 
            [class.active]="activeTab() === 'inventory'" 
            (click)="activeTab.set('inventory')">
            🏷️ Inventory ({{ productService.products().length }})
          </button>
          <button 
            type="button" 
            class="dash-tab" 
            [class.active]="activeTab() === 'settings'" 
            (click)="activeTab.set('settings')">
            ⚙️ Settings & Security
          </button>
        </nav>
      </header>

      <main class="dash-body">
        <!-- ==================== OVERVIEW TAB ==================== -->
        @if (activeTab() === 'overview') {
          <section class="overview-section">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon rev-icon">💰</div>
                <div class="stat-content">
                  <div class="stat-label">Total Revenue</div>
                  <div class="stat-val">{{ cartService.formatMoney(orderService.totalRevenue()) }}</div>
                  <small class="stat-sub">From active orders</small>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon orders-icon">📋</div>
                <div class="stat-content">
                  <div class="stat-label">Total Orders</div>
                  <div class="stat-val">{{ orderService.totalOrders() }}</div>
                  <small class="stat-sub">Saved locally in browser</small>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon pending-icon">⏳</div>
                <div class="stat-content">
                  <div class="stat-label">Pending Action</div>
                  <div class="stat-val text-pending">{{ orderService.pendingOrders() }}</div>
                  <small class="stat-sub">{{ orderService.deliveredOrders() }} delivered so far</small>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon stock-icon">⚠️</div>
                <div class="stat-content">
                  <div class="stat-label">Low / Out of Stock</div>
                  <div class="stat-val text-danger">{{ lowStockProducts().length }}</div>
                  <small class="stat-sub">Products needing replenishment</small>
                </div>
              </div>
            </div>

            <!-- Quick Action & Recent Orders Preview -->
            <div class="overview-split">
              <div class="panel">
                <div class="panel-head">
                  <h3>Recent Orders</h3>
                  <button type="button" class="btn-link" (click)="activeTab.set('orders')">View All →</button>
                </div>

                @if (orderService.orders().length === 0) {
                  <div class="panel-empty">
                    <p>No orders recorded yet.</p>
                    <small>When customers tap "Order on WhatsApp", orders will appear here automatically.</small>
                  </div>
                } @else {
                  <div class="orders-table-wrapper">
                    <table class="dash-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (order of orderService.orders().slice(0, 5); track order.id) {
                          <tr>
                            <td><b class="order-id-badge">{{ order.id }}</b></td>
                            <td><small>{{ formatDate(order.createdAt) }}</small></td>
                            <td>{{ order.items.length }} item(s)</td>
                            <td><b>{{ cartService.formatMoney(order.grandTotal) }}</b></td>
                            <td>
                              <span class="status-pill status-{{ order.status }}">{{ order.status }}</span>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>

              <!-- Low Stock Alert Panel -->
              <div class="panel">
                <div class="panel-head">
                  <h3>Inventory Watchlist</h3>
                  <button type="button" class="btn-link" (click)="activeTab.set('inventory')">Manage →</button>
                </div>

                @if (lowStockProducts().length === 0) {
                  <div class="panel-empty ok">
                    <span>✅ All catalog items have healthy stock levels.</span>
                  </div>
                } @else {
                  <div class="stock-alerts-list">
                    @for (item of lowStockProducts().slice(0, 6); track item.id) {
                      <div class="stock-alert-item">
                        <div class="stock-alert-thumb">
                          @if (item.image) {
                            <img [src]="item.image" [alt]="item.name" />
                          } @else {
                            <span>🛍️</span>
                          }
                        </div>
                        <div class="stock-alert-info">
                          <b>{{ item.name }}</b>
                          <small>{{ item.category }} • {{ cartService.formatMoney(item.price) }}</small>
                        </div>
                        <span class="stock-count-badge" [class.danger]="item.stock === 0">
                          {{ item.stock === 0 ? 'Out of Stock' : item.stock + ' left' }}
                        </span>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </section>
        }

        <!-- ==================== ORDERS TAB ==================== -->
        @if (activeTab() === 'orders') {
          <section class="orders-section">
            <div class="toolbar">
              <div class="search-box">
                <input 
                  type="search" 
                  [(ngModel)]="orderSearchQuery" 
                  placeholder="Search by Order ID, product, or date..." 
                  aria-label="Search orders" />
              </div>

              <div class="status-filters">
                <button 
                  type="button" 
                  class="filter-chip" 
                  [class.active]="selectedOrderStatus() === 'all'"
                  (click)="selectedOrderStatus.set('all')">
                  All ({{ orderService.orders().length }})
                </button>
                <button 
                  type="button" 
                  class="filter-chip" 
                  [class.active]="selectedOrderStatus() === 'pending'"
                  (click)="selectedOrderStatus.set('pending')">
                  Pending ({{ orderService.pendingOrders() }})
                </button>
                <button 
                  type="button" 
                  class="filter-chip" 
                  [class.active]="selectedOrderStatus() === 'processing'"
                  (click)="selectedOrderStatus.set('processing')">
                  Processing ({{ orderService.processingOrders() }})
                </button>
                <button 
                  type="button" 
                  class="filter-chip" 
                  [class.active]="selectedOrderStatus() === 'delivered'"
                  (click)="selectedOrderStatus.set('delivered')">
                  Delivered ({{ orderService.deliveredOrders() }})
                </button>
                <button 
                  type="button" 
                  class="filter-chip" 
                  [class.active]="selectedOrderStatus() === 'cancelled'"
                  (click)="selectedOrderStatus.set('cancelled')">
                  Cancelled ({{ orderService.cancelledOrders() }})
                </button>
              </div>

              <div class="export-actions">
                <button 
                  type="button" 
                  class="btn-export" 
                  (click)="orderService.exportToCsv()"
                  [disabled]="orderService.orders().length === 0">
                  📥 Export to CSV
                </button>
              </div>
            </div>

            <!-- Orders Table List -->
            @if (filteredOrders().length === 0) {
              <div class="empty-state">
                <span class="empty-icon">📭</span>
                <h3>No Orders Found</h3>
                <p>No orders match the current filter or search criteria.</p>
              </div>
            } @else {
              <div class="orders-list">
                @for (order of filteredOrders(); track order.id) {
                  <article class="order-card">
                    <div class="order-card-head">
                      <div>
                        <div class="order-id-group">
                          <span class="order-id">{{ order.id }}</span>
                          <span class="status-pill status-{{ order.status }}">{{ order.status }}</span>
                        </div>
                        <small class="order-time">{{ formatDate(order.createdAt) }}</small>
                      </div>

                      <div class="order-total-group">
                        <div class="order-grand-total">{{ cartService.formatMoney(order.grandTotal) }}</div>
                        <small class="order-fee-note">
                          Subtotal: {{ cartService.formatMoney(order.subtotal) }} 
                          @if (order.deliveryCharge > 0) {
                            + Del: {{ cartService.formatMoney(order.deliveryCharge) }}
                          }
                        </small>
                      </div>
                    </div>

                    <!-- Items List -->
                    <div class="order-items-table">
                      @for (item of order.items; track item.productId) {
                        <div class="order-item-row">
                          <span class="item-qty">{{ item.quantity }}x</span>
                          <span class="item-name">{{ item.name }}</span>
                          <span class="item-price">{{ cartService.formatMoney(item.total) }}</span>
                        </div>
                      }
                    </div>

                    <!-- Order Footer -->
                    <div class="order-card-foot">
                      <div class="loc-link">
                        @if (order.customerLocationUrl) {
                          <a [href]="order.customerLocationUrl" target="_blank" rel="noopener" class="btn-loc">
                            📍 View Customer GPS Pin
                          </a>
                        } @else {
                          <span class="no-loc">📍 Location not shared</span>
                        }
                      </div>

                      <div class="status-modifier">
                        <label>Update Status:</label>
                        <select 
                          [ngModel]="order.status" 
                          (ngModelChange)="orderService.updateOrderStatus(order.id, $event)">
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        <button 
                          type="button" 
                          class="btn-delete-order" 
                          (click)="onDeleteOrder(order.id)" 
                          title="Delete Order">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </article>
                }
              </div>
            }
          </section>
        }

        <!-- ==================== INVENTORY TAB ==================== -->
        @if (activeTab() === 'inventory') {
          <section class="inventory-section">
            <div class="toolbar">
              <div class="search-box">
                <input 
                  type="search" 
                  [(ngModel)]="inventorySearchQuery" 
                  placeholder="Filter inventory by name, category, or ID..." 
                  aria-label="Search catalog" />
              </div>

              <div class="inventory-sync">
                <button type="button" class="btn-sync" (click)="onSyncCatalog()">
                  🔄 Refresh from Sheet
                </button>
              </div>
            </div>

            <!-- Categories Chips -->
            <div class="inv-category-chips">
              <button 
                type="button" 
                class="filter-chip" 
                [class.active]="selectedInvCategory() === 'All'"
                (click)="selectedInvCategory.set('All')">
                All ({{ productService.products().length }})
              </button>
              @for (cat of invCategories(); track cat) {
                @if (cat !== 'All') {
                  <button 
                    type="button" 
                    class="filter-chip" 
                    [class.active]="selectedInvCategory() === cat"
                    (click)="selectedInvCategory.set(cat)">
                    {{ cat }}
                  </button>
                }
              }
            </div>

            <div class="inv-table-wrapper">
              <table class="dash-table inv-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock Level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (prod of filteredInventory(); track prod.id) {
                    <tr>
                      <td>
                        <div class="inv-prod-cell">
                          <div class="inv-thumb">
                            @if (prod.image) {
                              <img [src]="prod.image" [alt]="prod.name" />
                            } @else {
                              <span>🛍️</span>
                            }
                          </div>
                          <div>
                            <b>{{ prod.name }}</b>
                            @if (prod.name_ml) {
                              <small class="malayalam-sub">{{ prod.name_ml }}</small>
                            }
                          </div>
                        </div>
                      </td>
                      <td><code>{{ prod.id }}</code></td>
                      <td><span class="cat-badge">{{ prod.category }}</span></td>
                      <td>
                        <b>{{ cartService.formatMoney(prod.price) }}</b>
                        @if (prod.oldprice && prod.oldprice > prod.price) {
                          <small class="old-price-sub">{{ cartService.formatMoney(prod.oldprice) }}</small>
                        }
                      </td>
                      <td>
                        <span class="stock-pill" [class.out]="prod.stock === 0" [class.low]="prod.stock > 0 && prod.stock <= 5">
                          {{ prod.stock }} units
                        </span>
                      </td>
                      <td>
                        @if (prod.stock === 0) {
                          <span class="status-pill status-cancelled">Out of Stock</span>
                        } @else if (prod.stock <= 5) {
                          <span class="status-pill status-pending">Low Stock</span>
                        } @else {
                          <span class="status-pill status-delivered">Available</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }

        <!-- ==================== SETTINGS TAB ==================== -->
        @if (activeTab() === 'settings') {
          <section class="settings-section">
            <div class="settings-grid">
              <!-- Change PIN Panel -->
              <div class="panel">
                <div class="panel-head">
                  <h3>Admin Security PIN</h3>
                </div>
                <form (submit)="onChangePin($event)" class="settings-form">
                  <p class="settings-desc">Update your 4+ digit PIN for locking and unlocking the admin portal.</p>

                  <div class="form-group">
                    <label for="currentPin">Current PIN</label>
                    <input 
                      type="password" 
                      id="currentPin" 
                      [(ngModel)]="currentPinInput" 
                      name="currentPin" 
                      maxlength="12" 
                      required />
                  </div>

                  <div class="form-group">
                    <label for="newPin">New PIN (min 4 digits)</label>
                    <input 
                      type="password" 
                      id="newPin" 
                      [(ngModel)]="newPinInput" 
                      name="newPin" 
                      maxlength="12" 
                      required />
                  </div>

                  <div class="form-group">
                    <label for="confirmPin">Confirm New PIN</label>
                    <input 
                      type="password" 
                      id="confirmPin" 
                      [(ngModel)]="confirmPinInput" 
                      name="confirmPin" 
                      maxlength="12" 
                      required />
                  </div>

                  @if (pinChangeMessage()) {
                    <div class="msg-box ok">{{ pinChangeMessage() }}</div>
                  }
                  @if (pinChangeError()) {
                    <div class="msg-box err">{{ pinChangeError() }}</div>
                  }

                  <button type="submit" class="btn-primary">
                    Update Security PIN
                  </button>
                </form>
              </div>

              <!-- Store Config Info -->
              <div class="panel">
                <div class="panel-head">
                  <h3>Connected Store Details</h3>
                </div>
                <div class="config-details">
                  <div class="config-row">
                    <span class="config-label">Store Name:</span>
                    <b>{{ config.storeName }}</b>
                  </div>
                  <div class="config-row">
                    <span class="config-label">Currency:</span>
                    <b>{{ config.currency }} (INR)</b>
                  </div>
                  <div class="config-row">
                    <span class="config-label">Delivery Fee:</span>
                    <b>{{ cartService.formatMoney(config.deliveryCharge) }}</b>
                  </div>
                  <div class="config-row">
                    <span class="config-label">Delivery Radius:</span>
                    <b>{{ config.deliveryArea.radiusKm }} km</b>
                  </div>
                  <div class="config-row">
                    <span class="config-label">Allowed Pincodes:</span>
                    <b>{{ config.allowedPincodes.join(', ') }}</b>
                  </div>
                  <div class="config-row">
                    <span class="config-label">Data Source:</span>
                    <a [href]="config.sheetCsvUrl" target="_blank" rel="noopener" class="link-small">
                      View Published Google Sheet CSV ↗
                    </a>
                  </div>
                </div>

                <div class="danger-zone">
                  <h4>Danger Zone</h4>
                  <p>Clear all recorded orders from this device's browser memory.</p>
                  <button type="button" class="btn-danger" (click)="onClearAllOrders()">
                    🗑️ Wipe All Orders History
                  </button>
                </div>
              </div>
            </div>
          </section>
        }
      </main>
    </div>
  `,
  styles: [`
    .dash-wrap {
      min-height: 100vh;
      background: var(--paper, #f2f6f3);
      color: var(--ink, #12302b);
      font-family: inherit;
    }

    .dash-header {
      background: var(--card, #fff);
      border-bottom: 1px solid var(--line, #d5e0da);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    }

    .dash-header-in {
      max-width: 1300px;
      margin: auto;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .dash-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .dash-logo {
      font-size: 28px;
    }

    .dash-title {
      font: 700 20px/1.2 "Bricolage Grotesque", sans-serif;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .admin-tag {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      background: var(--accent, #f2b138);
      color: #12302b;
      border-radius: 99px;
    }

    .dash-subtitle {
      color: var(--muted, #5d726c);
      font-size: 12px;
    }

    .dash-actions {
      display: flex;
      gap: 10px;
    }

    .btn-dash-action {
      background: var(--paper, #f2f6f3);
      border: 1.5px solid var(--line, #d5e0da);
      color: var(--ink, #12302b);
      padding: 8px 14px;
      border-radius: 99px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-dash-action:hover {
      background: var(--line, #d5e0da);
    }

    .btn-logout {
      background: #fdf2f2;
      border-color: #f8b4b4;
      color: #9b1c1c;
    }

    .btn-logout:hover {
      background: #fde8e8;
    }

    .dash-nav {
      max-width: 1300px;
      margin: auto;
      padding: 0 20px;
      display: flex;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .dash-tab {
      background: none;
      border: 0;
      padding: 12px 18px;
      font-weight: 700;
      font-size: 14px;
      color: var(--muted, #5d726c);
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 3px solid transparent;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .dash-tab:hover {
      color: var(--ink, #12302b);
    }

    .dash-tab.active {
      color: var(--ink, #12302b);
      border-bottom-color: var(--accent, #f2b138);
    }

    .tab-badge {
      background: #e02424;
      color: #fff;
      font-size: 11px;
      padding: 1px 7px;
      border-radius: 99px;
    }

    .dash-body {
      max-width: 1300px;
      margin: auto;
      padding: 24px 20px 60px;
    }

    /* STATS GRID */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--card, #fff);
      border: 1px solid var(--line, #d5e0da);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      font-size: 24px;
      flex-shrink: 0;
    }

    .rev-icon { background: #def7ec; }
    .orders-icon { background: #e1effe; }
    .pending-icon { background: #fef08a; }
    .stock-icon { background: #fee2e2; }

    .stat-label {
      font-size: 12.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted, #5d726c);
    }

    .stat-val {
      font: 700 24px/1.2 "Bricolage Grotesque", sans-serif;
      margin: 2px 0;
    }

    .stat-sub {
      font-size: 12px;
      color: var(--muted, #5d726c);
    }

    .text-pending { color: #b45309; }
    .text-danger { color: #dc2626; }

    /* PANELS */
    .overview-split {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 20px;
    }

    .panel {
      background: var(--card, #fff);
      border: 1px solid var(--line, #d5e0da);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }

    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .panel-head h3 {
      margin: 0;
      font: 700 18px "Bricolage Grotesque", sans-serif;
    }

    .btn-link {
      background: none;
      border: 0;
      color: var(--ink, #12302b);
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      text-decoration: underline;
    }

    .panel-empty {
      padding: 30px;
      text-align: center;
      color: var(--muted, #5d726c);
    }

    .panel-empty.ok {
      color: #046c4e;
      background: #def7ec;
      border-radius: 12px;
      padding: 16px;
      font-weight: 600;
      font-size: 13px;
    }

    /* TABLE */
    .orders-table-wrapper, .inv-table-wrapper {
      overflow-x: auto;
    }

    .dash-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13.5px;
    }

    .dash-table th {
      padding: 10px 12px;
      background: var(--paper, #f2f6f3);
      color: var(--muted, #5d726c);
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .dash-table td {
      padding: 12px;
      border-top: 1px solid var(--line, #d5e0da);
      vertical-align: middle;
    }

    .order-id-badge {
      background: var(--paper, #f2f6f3);
      padding: 3px 8px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 12px;
    }

    .status-pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .status-pending { background: #fef08a; color: #854d0e; }
    .status-processing { background: #dbeafe; color: #1e40af; }
    .status-delivered { background: #def7ec; color: #03543f; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }

    /* STOCK ALERTS LIST */
    .stock-alerts-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .stock-alert-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 10px;
      border-radius: 10px;
      background: var(--paper, #f2f6f3);
    }

    .stock-alert-thumb {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #fff;
      display: grid;
      place-items: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .stock-alert-thumb img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .stock-alert-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .stock-alert-info small {
      color: var(--muted, #5d726c);
    }

    .stock-count-badge {
      font-size: 12px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 99px;
      background: #fef3c7;
      color: #92400e;
    }

    .stock-count-badge.danger {
      background: #fee2e2;
      color: #b91c1c;
    }

    /* TOOLBAR */
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 18px;
      align-items: center;
    }

    .search-box input {
      min-width: 280px;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1.5px solid var(--line, #d5e0da);
      background: var(--card, #fff);
      color: var(--ink, #12302b);
      font-size: 13.5px;
    }

    .status-filters {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .filter-chip {
      background: var(--card, #fff);
      border: 1.5px solid var(--line, #d5e0da);
      padding: 7px 14px;
      border-radius: 99px;
      font-size: 13px;
      cursor: pointer;
      font-weight: 600;
      color: var(--muted, #5d726c);
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .filter-chip.active {
      background: var(--ink, #12302b);
      color: var(--paper, #f2f6f3);
      border-color: var(--ink, #12302b);
    }

    .btn-export, .btn-sync {
      background: var(--ink, #12302b);
      color: var(--paper, #f2f6f3);
      border: 0;
      padding: 9px 16px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      white-space: nowrap;
    }

    .btn-export:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    /* ORDERS CARDS LIST */
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .order-card {
      background: var(--card, #fff);
      border: 1px solid var(--line, #d5e0da);
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    }

    .order-card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--line, #d5e0da);
      padding-bottom: 10px;
    }

    .order-id-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .order-id {
      font-family: monospace;
      font-size: 16px;
      font-weight: 700;
    }

    .order-time {
      color: var(--muted, #5d726c);
      font-size: 12px;
    }

    .order-total-group {
      text-align: right;
    }

    .order-grand-total {
      font: 700 20px "Bricolage Grotesque", sans-serif;
    }

    .order-fee-note {
      font-size: 11.5px;
      color: var(--muted, #5d726c);
    }

    .order-items-table {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px 0 12px;
    }

    .order-item-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13.5px;
    }

    .item-qty {
      font-weight: 700;
      color: var(--muted, #5d726c);
      width: 24px;
    }

    .item-name {
      flex: 1;
    }

    .item-price {
      font-weight: 600;
    }

    .order-card-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      border-top: 1px solid var(--line, #d5e0da);
      padding-top: 12px;
      flex-wrap: wrap;
    }

    .btn-loc {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #e1effe;
      color: #1e429f;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      text-decoration: none;
    }

    .btn-loc:hover {
      background: #c3ddfd;
    }

    .no-loc {
      font-size: 12px;
      color: var(--muted, #5d726c);
    }

    .status-modifier {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-modifier label {
      font-size: 12px;
      color: var(--muted, #5d726c);
      font-weight: 600;
    }

    .status-modifier select {
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid var(--line, #d5e0da);
      font-size: 12.5px;
      font-weight: 600;
      background: var(--paper, #f2f6f3);
    }

    .btn-delete-order {
      background: none;
      border: 0;
      font-size: 16px;
      cursor: pointer;
      padding: 4px;
      opacity: 0.6;
    }

    .btn-delete-order:hover {
      opacity: 1;
    }

    /* INVENTORY TABLE */
    .inv-category-chips {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      margin-bottom: 14px;
      scrollbar-width: none;
    }

    .inv-prod-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .inv-thumb {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      background: #fff;
      display: grid;
      place-items: center;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid var(--line, #d5e0da);
    }

    .inv-thumb img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 4px;
    }

    .malayalam-sub {
      display: block;
      color: var(--muted, #5d726c);
      font-size: 12px;
    }

    .cat-badge {
      background: var(--paper, #f2f6f3);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 12px;
    }

    .old-price-sub {
      display: block;
      color: var(--muted, #5d726c);
      text-decoration: line-through;
      font-size: 11px;
    }

    .stock-pill {
      font-weight: 700;
      font-size: 13px;
      color: #03543f;
    }

    .stock-pill.low { color: #b45309; }
    .stock-pill.out { color: #b91c1c; }

    /* SETTINGS */
    .settings-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .settings-desc {
      font-size: 13.5px;
      color: var(--muted, #5d726c);
      margin-top: 0;
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 13px;
      font-weight: 600;
      color: var(--muted, #5d726c);
    }

    .form-group input {
      padding: 10px 14px;
      border-radius: 10px;
      border: 1.5px solid var(--line, #d5e0da);
      background: var(--paper, #f2f6f3);
      font-size: 15px;
      letter-spacing: 0.1em;
      outline: none;
    }

    .form-group input:focus {
      border-color: var(--accent, #f2b138);
      background: #fff;
    }

    .btn-primary {
      background: var(--ink, #12302b);
      color: var(--paper, #f2f6f3);
      padding: 12px;
      border-radius: 10px;
      border: 0;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
    }

    .config-details {
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 13.5px;
      margin-bottom: 24px;
    }

    .config-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--line, #d5e0da);
      padding-bottom: 6px;
    }

    .config-label {
      color: var(--muted, #5d726c);
    }

    .link-small {
      color: var(--ink, #12302b);
      font-weight: 600;
      font-size: 12px;
      text-decoration: underline;
    }

    .danger-zone {
      border-top: 2px dashed #f8b4b4;
      padding-top: 16px;
    }

    .danger-zone h4 {
      margin: 0 0 6px;
      color: #991b1b;
    }

    .danger-zone p {
      font-size: 12.5px;
      color: var(--muted, #5d726c);
      margin: 0 0 12px;
    }

    .btn-danger {
      background: #fee2e2;
      color: #991b1b;
      border: 1.5px solid #f8b4b4;
      padding: 8px 14px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }

    .btn-danger:hover {
      background: #fde8e8;
    }

    .msg-box {
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
    }

    .msg-box.ok { background: #def7ec; color: #03543f; }
    .msg-box.err { background: #fde8e8; color: #9b1c1c; }

    .empty-state {
      padding: 60px 20px;
      text-align: center;
      color: var(--muted, #5d726c);
      background: var(--card, #fff);
      border-radius: 14px;
      border: 1px solid var(--line, #d5e0da);
    }

    .empty-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 12px;
    }

    @media (max-width: 860px) {
      .overview-split, .settings-grid {
        grid-template-columns: 1fr;
      }
      .toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .search-box input {
        width: 100%;
        min-width: 0;
      }
    }
  `]
})
export class AdminDashboardComponent {
  @Output() close = new EventEmitter<void>();

  readonly orderService = inject(OrderService);
  readonly productService = inject(ProductService);
  readonly adminAuth = inject(AdminAuthService);
  readonly cartService = inject(CartService);

  readonly config = STORE_CONFIG;

  activeTab = signal<AdminTab>('overview');

  // Order filters
  orderSearchQuery = '';
  selectedOrderStatus = signal<'all' | OrderStatus>('all');

  // Inventory filters
  inventorySearchQuery = '';
  selectedInvCategory = signal<string>('All');

  // Security Form
  currentPinInput = '';
  newPinInput = '';
  confirmPinInput = '';
  pinChangeMessage = signal<string>('');
  pinChangeError = signal<string>('');

  readonly lowStockProducts = computed<Product[]>(() => {
    return this.productService.products().filter(p => p.stock <= 5);
  });

  readonly invCategories = computed<string[]>(() => {
    const cats = [...new Set(this.productService.products().map(p => p.category).filter(Boolean))];
    return ['All', ...cats];
  });

  readonly filteredOrders = computed<StoreOrder[]>(() => {
    const q = this.orderSearchQuery.trim().toLowerCase();
    const st = this.selectedOrderStatus();
    const list = this.orderService.orders();

    return list.filter(order => {
      const matchStatus = st === 'all' || order.status === st;
      const matchQuery =
        !q ||
        order.id.toLowerCase().includes(q) ||
        new Date(order.createdAt).toLocaleDateString().includes(q) ||
        order.items.some(i => i.name.toLowerCase().includes(q));

      return matchStatus && matchQuery;
    });
  });

  readonly filteredInventory = computed<Product[]>(() => {
    const q = this.inventorySearchQuery.trim().toLowerCase();
    const cat = this.selectedInvCategory();
    const list = this.productService.products();

    return list.filter(p => {
      const matchCat = cat === 'All' || p.category === cat;
      const matchQuery =
        !q ||
        [p.id, p.name, p.name_ml, p.category]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);

      return matchCat && matchQuery;
    });
  });

  formatDate(isoStr: string): string {
    try {
      return new Date(isoStr).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return isoStr;
    }
  }

  onDeleteOrder(id: string): void {
    if (confirm(`Are you sure you want to delete order ${id}?`)) {
      this.orderService.deleteOrder(id);
    }
  }

  onClearAllOrders(): void {
    if (confirm('Warning: This will permanently delete ALL orders recorded in this browser. Are you sure?')) {
      this.orderService.clearAllOrders();
    }
  }

  onSyncCatalog(): void {
    this.productService.loadProducts();
  }

  onChangePin(e: Event): void {
    e.preventDefault();
    this.pinChangeMessage.set('');
    this.pinChangeError.set('');

    if (this.newPinInput !== this.confirmPinInput) {
      this.pinChangeError.set('New PIN and confirmation PIN do not match.');
      return;
    }

    const res = this.adminAuth.changePin(this.currentPinInput, this.newPinInput);
    if (res.success) {
      this.pinChangeMessage.set('Admin PIN changed successfully!');
      this.currentPinInput = '';
      this.newPinInput = '';
      this.confirmPinInput = '';
    } else {
      this.pinChangeError.set(res.error || 'Failed to update PIN.');
    }
  }

  onLogout(): void {
    this.adminAuth.logout();
    this.close.emit();
  }
}
