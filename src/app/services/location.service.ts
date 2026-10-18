import { Injectable, computed, inject, signal } from '@angular/core';
import { STORE_CONFIG } from '../config/store.config';
import { LocationCheckStatus, UserCoordinates } from '../models/store.model';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly i18n = inject(I18nService);

  readonly userLoc = signal<UserCoordinates | null>(null);
  readonly status = signal<LocationCheckStatus>('idle');
  readonly errorMessage = signal<string>('');

  readonly areaConfig = STORE_CONFIG.deliveryArea;
  readonly isAreaActive = computed(() => {
    return (
      !!this.areaConfig &&
      Number.isFinite(Number(this.areaConfig.lat)) &&
      Number.isFinite(Number(this.areaConfig.lng))
    );
  });

  readonly distanceKm = computed<number | null>(() => {
    const loc = this.userLoc();
    if (!loc || !this.isAreaActive()) return null;
    return this.calculateDistance(
      this.areaConfig.lat,
      this.areaConfig.lng,
      loc.lat,
      loc.lng
    );
  });

  readonly isInsideDeliveryArea = computed<boolean>(() => {
    const dist = this.distanceKm();
    if (dist === null) return false;
    return dist <= (this.areaConfig.radiusKm || 5);
  });

  readonly locationFeedbackMessage = computed<string>(() => {
    const st = this.status();
    if (st === 'locating') {
      return this.i18n.t('locWait');
    }
    if (st === 'unsupported') {
      return this.i18n.t('locNone');
    }
    if (st === 'denied') {
      return this.i18n.t('locDenied');
    }
    if (st === 'error') {
      return this.i18n.t('locFail');
    }
    if (this.userLoc()) {
      if (this.isInsideDeliveryArea()) {
        return this.i18n.t('locOk');
      } else {
        const d = (this.distanceKm() || 0).toFixed(1);
        const r = this.areaConfig.radiusKm || 5;
        return this.i18n.t('locOut').replace('{d}', d).replace('{r}', String(r));
      }
    }
    return '';
  });

  requestLocation(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.status.set('unsupported');
      return;
    }

    this.status.set('locating');
    this.errorMessage.set('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: UserCoordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        this.userLoc.set(loc);

        const dist = this.calculateDistance(
          this.areaConfig.lat,
          this.areaConfig.lng,
          loc.lat,
          loc.lng
        );

        if (dist <= (this.areaConfig.radiusKm || 5)) {
          this.status.set('inside');
        } else {
          this.status.set('outside');
        }
      },
      (err) => {
        if (err.code === 1) {
          this.status.set('denied');
        } else {
          this.status.set('error');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  validatePincode(pincode: string): 'empty' | 'invalid' | 'no' | 'ok' {
    const clean = (pincode || '').trim();
    if (!clean) return 'empty';
    if (!/^\d{6}$/.test(clean)) return 'invalid';

    const allowed = (STORE_CONFIG.allowedPincodes || []).map(String);
    if (allowed.length && !allowed.includes(clean)) {
      return 'no';
    }
    return 'ok';
  }
}
