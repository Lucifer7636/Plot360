import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  LocateFixed,
  Navigation,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Google Maps type mapping from app mapType values
const toGoogleMapType = (mapType, google) => {
  switch (mapType) {
    case 'satellite': return google.maps.MapTypeId.SATELLITE;
    case 'hybrid':    return google.maps.MapTypeId.HYBRID;
    case 'map':
    default:          return google.maps.MapTypeId.ROADMAP;
  }
};

export default function GoogleMapView() {
  const {
    activeParcel,
    selectParcel,
    mapType,
    setMapType,
    isFullscreen,
    setIsFullscreen,
    layers,
    toggleLayer,
    layersDrawerOpen,
    setLayersDrawerOpen,
    locationParcels,
    currentLocation,
    showLocationToast,
    locationToast,
    currentRole
  } = useApp();

  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletTileLayerRef = useRef(null);
  const leafletLabelLayerRef = useRef(null);
  const polygonRefs = useRef([]);        // Google Maps polygons [{id, poly}]
  const leafletPolygonsRef = useRef([]); // Leaflet polygons [{id, poly}]
  const loaderRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [useLeaflet, setUseLeaflet] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // ─── 1. Decide Engine: Google Maps if apiKey provided, Leaflet otherwise ────
  useEffect(() => {
    if (!apiKey || apiKey.trim() === '') {
      setUseLeaflet(true);
      return;
    }

    if (loaderRef.current) return;

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });

    loaderRef.current = loader;

    loader.load()
      .then((google) => {
        if (!mapRef.current) return;
        const loc = currentLocation || { lat: 18.5204, lng: 73.8567, zoom: 17 };
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: loc.lat, lng: loc.lng },
          zoom: loc.zoom || 17,
          mapTypeId: toGoogleMapType(mapType, google),
          disableDefaultUI: true,
          zoomControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy'
        });

        googleMapRef.current = map;
        setMapLoaded(true);
      })
      .catch((err) => {
        console.warn('Google Maps failed to load, seamlessly falling back to high-resolution GIS engine:', err);
        setUseLeaflet(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // ─── 2. Initialize Leaflet Map (High-Res GIS Engine) ────────────────────────
  useEffect(() => {
    if (!useLeaflet || !mapRef.current || leafletMapRef.current) return;

    const loc = currentLocation || { lat: 18.5204, lng: 73.8567, zoom: 17 };
    const map = L.map(mapRef.current, {
      center: [loc.lat, loc.lng],
      zoom: loc.zoom || 17,
      zoomControl: false,
      attributionControl: false
    });

    const getTileUrl = (type) => {
      if (type === 'map') {
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      }
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    };

    const tileLayer = L.tileLayer(getTileUrl(mapType), {
      maxZoom: 20,
      subdomains: 'abcd'
    }).addTo(map);

    leafletTileLayerRef.current = tileLayer;

    if (mapType === 'hybrid') {
      leafletLabelLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
        { maxZoom: 20, subdomains: 'abcd' }
      ).addTo(map);
    }

    leafletMapRef.current = map;
    setMapLoaded(true);

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useLeaflet]);

  // ─── 3. Leaflet: Basemap Type Changes ─────────────────────────────────────
  useEffect(() => {
    if (!leafletMapRef.current) return;

    if (leafletTileLayerRef.current) {
      leafletMapRef.current.removeLayer(leafletTileLayerRef.current);
    }
    if (leafletLabelLayerRef.current) {
      leafletMapRef.current.removeLayer(leafletLabelLayerRef.current);
      leafletLabelLayerRef.current = null;
    }

    const tileUrl = mapType === 'map'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    leafletTileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: 'abcd'
    }).addTo(leafletMapRef.current);

    if (mapType === 'hybrid') {
      leafletLabelLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
        { maxZoom: 20, subdomains: 'abcd' }
      ).addTo(leafletMapRef.current);
    }
  }, [mapType]);

  // ─── 4. Leaflet: Location Changes ─────────────────────────────────────────
  useEffect(() => {
    if (!leafletMapRef.current || !currentLocation) return;
    leafletMapRef.current.setView(
      [currentLocation.lat, currentLocation.lng],
      currentLocation.zoom || 17,
      { animate: true }
    );
  }, [currentLocation?.id]);

  const getParcelFillColor = useCallback((parcel, isSelected) => {
    if (isSelected) return '#0284c7';
    if (layers.zoning && parcel) {
      const lu = ((parcel.land_use || '') + ' ' + (parcel.zoning || '')).toLowerCase();
      if (lu.includes('commercial')) return '#9333ea';
      if (lu.includes('green') || lu.includes('agri') || lu.includes('park') || lu.includes('forest')) return '#16a34a';
      if (lu.includes('residential')) return '#0369a1';
      return '#475569';
    }
    return '#0f172a';
  }, [layers.zoning]);

  // ─── 5. Leaflet: Draw Cadastral Vector Overlay ─────────────────────────────
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Remove existing polygons
    leafletPolygonsRef.current.forEach(({ poly }) => {
      if (leafletMapRef.current) leafletMapRef.current.removeLayer(poly);
    });
    leafletPolygonsRef.current = [];

    if (!layers.parcels) return;

    const map = leafletMapRef.current;
    const isCitizen = currentRole === 'citizen';
    const currentZoom = map.getZoom ? map.getZoom() : 17;

    const created = locationParcels
      .filter((p) => p.polygon && p.polygon.length > 2)
      .map((parcel) => {
        const coords = parcel.polygon.map((pt) => [pt.lat, pt.lng]);
        const isSelected = activeParcel && parcel.parcel_id === activeParcel.parcel_id;
        const fillColor = getParcelFillColor(parcel, isSelected);

        const poly = L.polygon(coords, {
          color: isSelected ? '#38bdf8' : 'rgba(255,255,255,0.7)',
          weight: isSelected ? 3.5 : 1.2,
          fillColor: fillColor,
          fillOpacity: isSelected ? 0.48 : (layers.zoning ? 0.38 : 0.22)
        });

        poly.on('click', () => {
          selectParcel(parcel.parcel_id);
        });

        if (layers.labels) {
          const tooltipContent = `
            <div style="font-size: 11px; line-height: 1.35; padding: 2px 4px; text-align: center;">
              <div style="font-weight: 700; color: #ffffff;">${parcel.parcel_id}${!isCitizen && parcel.land_use ? ` • <span style="font-weight: 400; color: #94a3b8;">${parcel.land_use}</span>` : ''}</div>
              <div class="parcel-tooltip-ulpin">${parcel.ulpin || ''}</div>
              ${!isCitizen && parcel.area_display ? `<div style="font-size: 9.5px; color: #cbd5e1; margin-top: 1px;">Area: ${parcel.area_display}</div>` : ''}
            </div>
          `;

          poly.bindTooltip(tooltipContent, {
            permanent: currentZoom >= 17 || (currentZoom >= 15 && isSelected),
            direction: 'center',
            className: 'parcel-map-tooltip'
          });
        }

        poly.addTo(map);
        return { id: parcel.parcel_id, poly };
      });

    // Progressive zoom event handler
    const handleZoomProgressive = () => {
      if (!leafletMapRef.current) return;
      const z = leafletMapRef.current.getZoom();
      leafletPolygonsRef.current.forEach(({ id, poly }) => {
        const isSelected = activeParcel && id === activeParcel.parcel_id;
        if (!poly.getTooltip()) return;
        if (z < 15) {
          poly.closeTooltip();
        } else if (z < 17) {
          if (isSelected) poly.openTooltip();
          else poly.closeTooltip();
        } else {
          if (layers.labels) poly.openTooltip();
        }
      });
    };

    map.on('zoomend', handleZoomProgressive);

    leafletPolygonsRef.current = created;
    return () => {
      map.off('zoomend', handleZoomProgressive);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, useLeaflet, locationParcels, layers.parcels, layers.labels, layers.zoning, currentRole, getParcelFillColor]);

  // ─── 6. Leaflet: Update Polygon Selection State & Restrained Auto-Pan ──────
  useEffect(() => {
    if (!leafletMapRef.current) return;

    leafletPolygonsRef.current.forEach(({ id, poly }) => {
      const isSelected = activeParcel && id === activeParcel.parcel_id;
      const targetParcel = locationParcels.find(p => p.parcel_id === id);
      const fillColor = getParcelFillColor(targetParcel, isSelected);

      poly.setStyle({
        color: isSelected ? '#38bdf8' : 'rgba(255,255,255,0.7)',
        weight: isSelected ? 3.5 : 1.2,
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.48 : (layers.zoning ? 0.38 : 0.22)
      });

      if (poly.getTooltip()) {
        if (isSelected) {
          poly.openTooltip();
        } else {
          const z = leafletMapRef.current.getZoom ? leafletMapRef.current.getZoom() : 17;
          if (z < 17) poly.closeTooltip();
        }
      }
    });

    // Restrained auto-pan on selection (preserves spatial context without disruptive zoom)
    if (activeParcel && leafletMapRef.current) {
      const activeObj = leafletPolygonsRef.current.find(item => item.id === activeParcel.parcel_id);
      if (activeObj && activeObj.poly) {
        const bounds = activeObj.poly.getBounds();
        const mapBounds = leafletMapRef.current.getBounds();
        if (mapBounds && !mapBounds.contains(bounds)) {
          leafletMapRef.current.panTo(bounds.getCenter(), { animate: true, duration: 0.5 });
        }
      } else if (activeParcel.centroid_lat && activeParcel.centroid_lng) {
        const center = [activeParcel.centroid_lat, activeParcel.centroid_lng];
        const mapBounds = leafletMapRef.current.getBounds();
        if (mapBounds && !mapBounds.contains(center)) {
          leafletMapRef.current.panTo(center, { animate: true, duration: 0.5 });
        }
      }
    }
  }, [activeParcel, layers.zoning, getParcelFillColor, locationParcels]);

  // ─── 7. Google Maps: Draw / Redraw Cadastral Vector Overlay ────────────────
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current || !window.google) return;

    const google = window.google;
    const map = googleMapRef.current;

    polygonRefs.current.forEach(({ poly }) => poly.setMap(null));
    polygonRefs.current = [];

    if (!layers.parcels) return;

    const created = locationParcels
      .filter((p) => p.polygon && p.polygon.length > 2)
      .map((parcel) => {
        const isSelected = activeParcel && parcel.parcel_id === activeParcel.parcel_id;
        const fillColor = getParcelFillColor(parcel, isSelected);

        const poly = new google.maps.Polygon({
          paths: parcel.polygon,
          strokeColor: isSelected ? '#38bdf8' : 'rgba(255,255,255,0.6)',
          strokeOpacity: 0.9,
          strokeWeight: isSelected ? 3.5 : 1.2,
          fillColor: fillColor,
          fillOpacity: isSelected ? 0.45 : (layers.zoning ? 0.38 : 0.22),
          map,
          zIndex: isSelected ? 10 : 1,
          clickable: true
        });

        poly.addListener('click', () => {
          selectParcel(parcel.parcel_id);
        });

        if (layers.labels) {
          const bounds = new google.maps.LatLngBounds();
          parcel.polygon.forEach((pt) => bounds.extend(pt));
          const center = bounds.getCenter();

          const labelMarker = new google.maps.Marker({
            position: center,
            map: isSelected ? map : null,
            label: {
              text: parcel.parcel_id,
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '700',
              fontFamily: 'system-ui, sans-serif'
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 0,
              fillOpacity: 0,
              strokeOpacity: 0
            },
            clickable: false,
            zIndex: 20
          });

          poly._label = labelMarker;
          poly._isSelectedLabel = isSelected;
        }

        return { id: parcel.parcel_id, poly };
      });

    polygonRefs.current = created;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, locationParcels, layers.parcels, layers.labels, layers.zoning, getParcelFillColor]);

  // ─── 8. Google Maps: Selection Styling Updates & Restrained Auto-Pan ──────
  useEffect(() => {
    if (!mapLoaded || !window.google || !googleMapRef.current) return;
    const map = googleMapRef.current;

    polygonRefs.current.forEach(({ id, poly }) => {
      const isSelected = activeParcel && id === activeParcel.parcel_id;
      const targetParcel = locationParcels.find(p => p.parcel_id === id);
      const fillColor = getParcelFillColor(targetParcel, isSelected);

      poly.setOptions({
        strokeColor: isSelected ? '#38bdf8' : 'rgba(255,255,255,0.6)',
        strokeWeight: isSelected ? 3.5 : 1.2,
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.45 : (layers.zoning ? 0.38 : 0.22),
        zIndex: isSelected ? 10 : 1
      });

      if (poly._label) {
        if (isSelected) {
          poly._label.setMap(map);
          poly._isSelectedLabel = true;
        } else if (poly._isSelectedLabel) {
          poly._label.setMap(null);
          poly._isSelectedLabel = false;
        }
      }
    });

    if (activeParcel && map) {
      if (activeParcel.centroid_lat && activeParcel.centroid_lng) {
        const latLng = new window.google.maps.LatLng(activeParcel.centroid_lat, activeParcel.centroid_lng);
        if (map.getBounds() && !map.getBounds().contains(latLng)) {
          map.panTo(latLng);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParcel, mapLoaded, layers.zoning, getParcelFillColor, locationParcels]);

  // ─── 9. Google Maps: Location & MapType Updates ───────────────────────────
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current || !currentLocation) return;
    googleMapRef.current.panTo({ lat: currentLocation.lat, lng: currentLocation.lng });
    googleMapRef.current.setZoom(currentLocation.zoom || 17);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation?.id, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current || !window.google) return;
    googleMapRef.current.setMapTypeId(toGoogleMapType(mapType, window.google));
  }, [mapType, mapLoaded]);

  // ─── 10. Fullscreen Resize Trigger ────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => {
      if (googleMapRef.current && window.google) {
        window.google.maps.event.trigger(googleMapRef.current, 'resize');
        if (currentLocation) {
          googleMapRef.current.setCenter({ lat: currentLocation.lat, lng: currentLocation.lng });
        }
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
        if (currentLocation) {
          leafletMapRef.current.setView([currentLocation.lat, currentLocation.lng]);
        }
      }
    }, 150);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  // ─── Controls & Handlers ──────────────────────────────────────────────────
  const handleZoomIn = useCallback(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setZoom(googleMapRef.current.getZoom() + 1);
    } else if (leafletMapRef.current) {
      leafletMapRef.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setZoom(Math.max(googleMapRef.current.getZoom() - 1, 3));
    } else if (leafletMapRef.current) {
      leafletMapRef.current.zoomOut();
    }
  }, []);

  const handleReset = useCallback(() => {
    if (!currentLocation) return;
    if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat: currentLocation.lat, lng: currentLocation.lng });
      googleMapRef.current.setZoom(currentLocation.zoom || 17);
    } else if (leafletMapRef.current) {
      leafletMapRef.current.setView([currentLocation.lat, currentLocation.lng], currentLocation.zoom || 17);
    }
    if (currentLocation.defaultParcelId) {
      selectParcel(currentLocation.defaultParcelId);
    }
  }, [currentLocation, selectParcel]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      showLocationToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (googleMapRef.current) {
          googleMapRef.current.panTo({ lat, lng });
          googleMapRef.current.setZoom(16);
        } else if (leafletMapRef.current) {
          leafletMapRef.current.setView([lat, lng], 16);
        }
        showLocationToast('Map centered on your location.', 'info');
      },
      (err) => {
        let msg = 'Could not get your location.';
        if (err.code === 1) msg = 'Location access denied.';
        showLocationToast(msg, 'error');
      },
      { timeout: 8000 }
    );
  }, [showLocationToast]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className={`map-wrapper ${isFullscreen ? 'fullscreen-mode' : ''}`}
      id="land-explorer-gis-workspace"
      style={isFullscreen ? { position: 'fixed', inset: 0, zIndex: 9999, borderRadius: 0 } : {}}
    >
      <div className="map-canvas-container">
        {/* Map Canvas (Google Maps or High-Resolution Leaflet Engine) */}
        <div
          ref={mapRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />

        {/* Location Toast */}
        {locationToast && (
          <div
            style={{
              position: 'absolute',
              bottom: '48px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: locationToast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(2,132,199,0.9)',
              color: '#fff',
              fontSize: '11.5px',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              zIndex: 500,
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}
          >
            {locationToast.message}
          </div>
        )}

        {/* Floating Top Left Pill with Cadastral Status */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 10 }}>
          <div className="map-pill-top-left" style={{ position: 'static' }}>
            <span>Cadastral Parcels</span>
            <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleLayer('parcels')} />
          </div>
          <div
            title="Internal Cadastral Classification"
            className="badge-demo"
            style={{ width: 'fit-content' }}
          >
            ILLUSTRATIVE_DEMO_GEOMETRY
          </div>
        </div>

        {/* Basemap Switcher Pills */}
        <div className="map-basemap-toggle">
          <button
            className={`basemap-btn ${mapType === 'map' ? 'active' : ''}`}
            onClick={() => setMapType('map')}
          >
            Map
          </button>
          <button
            className={`basemap-btn ${mapType === 'satellite' ? 'active' : ''}`}
            onClick={() => setMapType('satellite')}
          >
            Satellite
          </button>
          <button
            className={`basemap-btn ${mapType === 'hybrid' ? 'active' : ''}`}
            onClick={() => setMapType('hybrid')}
          >
            Hybrid
          </button>
        </div>

        {/* Right Floating Toolbar */}
        <div className="map-toolbar">
          <button
            className="map-tool-btn"
            onClick={() => setLayersDrawerOpen(!layersDrawerOpen)}
            title="Toggle Layers"
          >
            <Layers size={16} />
          </button>
          <button
            className="map-tool-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button className="map-tool-btn" onClick={handleZoomIn} title="Zoom In">
            <Plus size={16} />
          </button>
          <button className="map-tool-btn" onClick={handleZoomOut} title="Zoom Out">
            <Minus size={16} />
          </button>
          <button
            className="map-tool-btn"
            onClick={handleReset}
            title="Reset to Location Default"
          >
            <Navigation size={16} />
          </button>
          <button
            className="map-tool-btn"
            onClick={handleLocate}
            title="Locate Me (device GPS)"
          >
            <LocateFixed size={16} />
          </button>
        </div>

        {/* Layers Drawer */}
        {layersDrawerOpen && (
          <div className="map-layers-drawer">
            <div className="layer-drawer-header">
              <span>Layers</span>
              <X size={14} style={{ cursor: 'pointer' }} onClick={() => setLayersDrawerOpen(false)} />
            </div>

            <div className="layer-group-title">Base Map</div>
            <label className="layer-checkbox-item">
              <input
                type="radio"
                name="basemap-radio"
                checked={mapType === 'satellite'}
                onChange={() => setMapType('satellite')}
              />
              <span>Satellite (Default)</span>
            </label>
            <label className="layer-checkbox-item">
              <input
                type="radio"
                name="basemap-radio"
                checked={mapType === 'map'}
                onChange={() => setMapType('map')}
              />
              <span>Roadmap</span>
            </label>
            <label className="layer-checkbox-item">
              <input
                type="radio"
                name="basemap-radio"
                checked={mapType === 'hybrid'}
                onChange={() => setMapType('hybrid')}
              />
              <span>Hybrid</span>
            </label>

            <div className="layer-group-title">Cadastral &amp; Parcels</div>
            <label className="layer-checkbox-item">
              <input
                type="checkbox"
                checked={layers.parcels}
                onChange={() => toggleLayer('parcels')}
              />
              <span>Parcel Boundaries</span>
            </label>
            <label className="layer-checkbox-item">
              <input
                type="checkbox"
                checked={layers.labels}
                onChange={() => toggleLayer('labels')}
              />
              <span>Parcel Labels</span>
            </label>

            <div className="layer-group-title">Planning &amp; Zoning</div>
            <label className="layer-checkbox-item">
              <input
                type="checkbox"
                checked={layers.zoning}
                onChange={() => toggleLayer('zoning')}
              />
              <span>Master Plan Zones (Cadastral Overlay)</span>
            </label>
            <div className="layer-checkbox-item" style={{ opacity: 0.6, cursor: 'default' }}>
              <input
                type="checkbox"
                checked={false}
                disabled
              />
              <div>
                <span>Administrative Boundaries</span>
                <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)' }}>State GIS WFS • External Feed Offline</span>
              </div>
            </div>

            <div className="layer-group-title">Infrastructure &amp; Protected</div>
            <div className="layer-checkbox-item" style={{ opacity: 0.6, cursor: 'default' }}>
              <input
                type="checkbox"
                checked={false}
                disabled
              />
              <div>
                <span>Utilities Network</span>
                <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)' }}>Municipal GIS • Inactive in Demo</span>
              </div>
            </div>
            <div className="layer-checkbox-item" style={{ opacity: 0.6, cursor: 'default' }}>
              <input
                type="checkbox"
                checked={false}
                disabled
              />
              <div>
                <span>Heritage &amp; Protected Zones</span>
                <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)' }}>ASI Registry • Standby</span>
              </div>
            </div>
          </div>
        )}

        {/* Legend - Synchronized with Active Layer Content */}
        <div className="map-legend">
          <div className="legend-title">GIS Legend</div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: 'var(--brand-accent-blue)', border: '1.5px solid #38bdf8' }}
            />
            <span>Selected Parcel</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.7)' }}
            />
            <span>Cadastral Boundary</span>
          </div>
          {layers.zoning && (
            <>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#0369a1' }} />
                <span>Residential Zone</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#9333ea' }} />
                <span>Commercial Zone</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#16a34a' }} />
                <span>Green Belt / Eco</span>
              </div>
            </>
          )}
        </div>

        {/* Scale Bar */}
        <div className="map-scale">
          <span>0</span>
          <div className="scale-ruler" />
          <span>200 m</span>
        </div>
      </div>
    </div>
  );
}
