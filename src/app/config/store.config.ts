import { StoreConfig } from '../models/store.model';

export const STORE_CONFIG: StoreConfig = {
  storeName: 'Beetle Mart',
  currency: '₹',
  sheetCsvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQo7AanFyLSRSX6w6Qfwqg4_tHl3rBxV-P-3DXyW-oY3EPwijT-7GR5vIeH0agS5trBk5SwlYAvYRA0/pub?output=csv',
  webhookUrl: '',
  orderUrl: 'https://wa.me/918589823676?text={text}',
  maxQtyPerItem: 20,
  defaultLang: 'en',
  deliveryCharge: 25,
  allowedPincodes: [673602],
  deliveryArea: {
    lat: 11.299358,
    lng: 76.001202,
    radiusKm: 5,
    requireLocation: true,
  },
  email: '',
  address: '',
  instagram: '',
  showSheetWarnings: true,
  adminPin: 'admin@123',
};
