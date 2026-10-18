import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { ProductModalComponent } from './components/product-modal/product-modal.component';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer.component';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ProductService } from './services/product.service';
import { CartService } from './services/cart.service';
import { I18nService } from './services/i18n.service';
import { LocationService } from './services/location.service';
import { AdminAuthService } from './services/admin-auth.service';
import { STORE_CONFIG } from './config/store.config';
import { Product } from './models/store.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductCardComponent,
    ProductModalComponent,
    CartDrawerComponent,
    AdminLoginComponent,
    AdminDashboardComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  readonly productService = inject(ProductService);
  readonly cartService = inject(CartService);
  readonly i18n = inject(I18nService);
  readonly locationService = inject(LocationService);
  readonly adminAuth = inject(AdminAuthService);

  readonly config = STORE_CONFIG;

  currentView = signal<'store' | 'admin'>('store');
  showAdminLogin = signal<boolean>(false);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  selectedSort = signal<string>('');
  selectedProduct = signal<Product | null>(null);
  highlightedProductId = signal<string>('');

  readonly categories = computed<string[]>(() => {
    const list = this.productService.products();
    const cats = [...new Set(list.map(p => p.category).filter(Boolean))];
    return ['All', ...cats];
  });

  readonly isHome = computed<boolean>(() => {
    return this.selectedCategory() === 'All' && !this.searchQuery().trim();
  });

  readonly filteredProducts = computed<Product[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();
    const sort = this.selectedSort();
    const list = this.productService.products();

    let result = list.filter(p => {
      const matchCat = cat === 'All' || p.category === cat;
      const matchQuery =
        !q ||
        [p.name, p.name_ml, p.description, p.description_ml, p.category, p.category_ml]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);

      return matchCat && matchQuery;
    });

    if (sort === 'lo') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'hi') {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === 'az') {
      const lang = this.i18n.currentLang();
      result.sort((a, b) =>
        this.i18n.getField(a, 'name').localeCompare(this.i18n.getField(b, 'name'), lang)
      );
    }

    return result;
  });

  readonly bestSellers = computed<Product[]>(() => {
    return this.productService
      .products()
      .filter(p => (p.badge || '').toLowerCase().includes('best'))
      .slice(0, 10);
  });

  readonly newArrivals = computed<Product[]>(() => {
    return this.productService
      .products()
      .filter(p => (p.badge || '').toLowerCase().includes('new'))
      .slice(0, 10);
  });

  readonly offers = computed<Product[]>(() => {
    return this.productService
      .products()
      .filter(
        p =>
          (p.oldprice && p.oldprice > p.price) ||
          (p.badge || '').toLowerCase().includes('sale') ||
          (p.badge || '').toLowerCase().includes('offer')
      )
      .slice(0, 10);
  });

  readonly heroImages = computed<Product[]>(() => {
    return this.productService
      .products()
      .filter(p => !!p.image)
      .slice(0, 3);
  });

  readonly currentYear = new Date().getFullYear();

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      const cat = params.get('category');
      const prodId = params.get('product');

      if (q) this.searchQuery.set(q.slice(0, 60));
      if (cat) this.selectedCategory.set(cat);
      if (prodId) {
        this.highlightedProductId.set(prodId);
        // Delay opening modal slightly until products load
        const interval = setInterval(() => {
          const prod = this.productService.byId(prodId);
          if (prod) {
            this.selectedProduct.set(prod);
            clearInterval(interval);
          } else if (!this.productService.isLoading()) {
            clearInterval(interval);
          }
        }, 150);
      }
      if (params.get('admin') === 'true' || window.location.hash === '#admin') {
        if (this.adminAuth.isAuthenticated()) {
          this.currentView.set('admin');
        } else {
          this.showAdminLogin.set(true);
        }
      }
    }
  }

  openAdminPortal(): void {
    if (this.adminAuth.isAuthenticated()) {
      this.currentView.set('admin');
    } else {
      this.showAdminLogin.set(true);
    }
  }

  onAdminLoginSuccess(): void {
    this.showAdminLogin.set(false);
    this.currentView.set('admin');
  }

  closeAdminPortal(): void {
    this.currentView.set('store');
  }

  getCategoryPic(c: string): Product | undefined {
    return this.productService.products().find(p => p.category === c && p.image);
  }

  selectCategory(category: string, scroll = false): void {
    this.selectedCategory.set(category);
    if (scroll) {
      this.scrollTo('catalog');
    }
  }

  scrollTo(id: string): void {
    if (typeof window === 'undefined') return;
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  get whatsappNumber(): string {
    const m = String(this.config.orderUrl).match(/wa\.me\/(\d+)/);
    return m ? m[1] : '';
  }

  get whatsappChatUrl(): string {
    return this.whatsappNumber ? `https://wa.me/${this.whatsappNumber}` : '#';
  }
}
