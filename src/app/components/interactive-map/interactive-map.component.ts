import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  output,
  ElementRef,
  viewChild,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface MapMarker {
  id: string;
  city: string;
  country: string;
  x: number; // longitude-like (0-100 percentage, mapped to real coords)
  y: number; // latitude-like (0-100 percentage, mapped to real coords)
  description: string;
}

@Component({
  selector: 'app-interactive-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './interactive-map.component.html',
  styleUrls: ['./interactive-map.component.css'],
})
export class InteractiveMapComponent implements AfterViewInit, OnDestroy {
  /** Array of map markers to display */
  markers = input<MapMarker[]>([]);

  /** Emitted when a marker is selected */
  markerSelected = output<MapMarker>();

  /** Currently selected marker */
  selectedMarker = signal<MapMarker | null>(null);

  /** Reference to the map container div */
  mapContainerRef = viewChild<ElementRef>('mapContainer');

  private map: any = null;
  private leafletMarkers: any[] = [];
  private activeMarkerEl: HTMLElement | null = null;
  private isBrowser: boolean;
  private resizeObserver: ResizeObserver | null = null;
  private L: any = null;
  private destroyed = false;


  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;

    // Load Leaflet only in the browser
    const leaflet: any = await import('leaflet');
    this.L = leaflet.default ?? leaflet;

    // The component may have been destroyed while Leaflet was loading
    if (this.destroyed) return;

    const container = this.mapContainerRef()?.nativeElement;
    if (!container) return;

    // Use ResizeObserver to init map only when container has real dimensions
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          if (!this.map) {
            this.initMap();
          } else {
            // Container resized (e.g. card expand animation) — recalculate tiles
            this.map.invalidateSize();
          }
        }
      }
    });
    this.resizeObserver.observe(container);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap(): void {
    const container = this.mapContainerRef()?.nativeElement;
    if (!container) return;

    // Create map centered on the world
    this.map = this.L.map(container, {
      center: [25, 10],
      zoom: 2,
      minZoom: 1,
      maxZoom: 6,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    });

    // Dark CARTO tile layer (matching the reference image)
    this.L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(this.map);

    // Add markers
    this.addMarkers();

    // Ensure tiles load correctly after init
    setTimeout(() => this.map?.invalidateSize(), 300);
  }

  private addMarkers(): void {
    if (!this.map) return;

    const markersData = this.markers();
    this.leafletMarkers = [];

    for (const markerData of markersData) {
      // Convert percentage coordinates to lat/lng
      const lat = 90 - (markerData.y / 100) * 180;
      const lng = (markerData.x / 100) * 360 - 180;

      // Create custom div icon
      const icon = this.L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-pin" data-id="${markerData.id}"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const leafletMarker = this.L.marker([lat, lng], { icon }).addTo(this.map);

      leafletMarker.on('click', (e: any) => {
        this.L.DomEvent.stopPropagation(e);
        this.onMarkerClick(markerData, leafletMarker);
      });

      this.leafletMarkers.push(leafletMarker);
    }
  }

  private onMarkerClick(marker: MapMarker, leafletMarker: any): void {
    // Remove active from previous
    if (this.activeMarkerEl) {
      this.activeMarkerEl.classList.remove('active');
    }

    if (this.selectedMarker()?.id === marker.id) {
      this.selectedMarker.set(null);
      this.activeMarkerEl = null;
    } else {
      this.selectedMarker.set(marker);
      this.markerSelected.emit(marker);

      // Set active class on clicked marker
      const el = leafletMarker.getElement();
      const pinEl = el?.querySelector('.marker-pin') as HTMLElement | null;
      if (pinEl) {
        pinEl.classList.add('active');
        this.activeMarkerEl = pinEl;
      }
    }
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    if (this.activeMarkerEl) {
      this.activeMarkerEl.classList.remove('active');
      this.activeMarkerEl = null;
    }
    this.selectedMarker.set(null);
  }
}
