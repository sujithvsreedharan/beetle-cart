export interface Product {
  id: string;
  name: string;
  name_ml?: string;
  category: string;
  category_ml?: string;
  price: number;
  oldprice?: number;
  badge?: string;
  badge_ml?: string;
  description: string;
  description_ml?: string;
  image: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DeliveryArea {
  lat: number;
  lng: number;
  radiusKm: number;
  requireLocation: boolean;
}

export interface StoreConfig {
  storeName: string;
  currency: string;
  sheetCsvUrl: string;
  webhookUrl: string;
  orderUrl: string;
  maxQtyPerItem: number;
  defaultLang: 'en' | 'ml';
  deliveryCharge: number;
  allowedPincodes: (string | number)[];
  deliveryArea: DeliveryArea;
  email: string;
  address: string;
  instagram: string;
  showSheetWarnings: boolean;
  adminPin?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled';

export interface OrderItemRecord {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface StoreOrder {
  id: string;
  createdAt: string;
  customerLocationUrl?: string;
  items: OrderItemRecord[];
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  status: OrderStatus;
  notes?: string;
}

export interface UserCoordinates {
  lat: number;
  lng: number;
}

export type LocationCheckStatus = 'idle' | 'locating' | 'inside' | 'outside' | 'denied' | 'error' | 'unsupported';
