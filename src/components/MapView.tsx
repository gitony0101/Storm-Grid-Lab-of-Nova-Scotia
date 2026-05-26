import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Zone, ZoneRiskResult } from '../engine/riskTypes';
import { riskToColor } from '../lib/colorScale';
import { formatPercent } from '../lib/format';
import { getDriverLabel, getDriverColor } from '../engine/explanationEngine';

interface MapViewProps {
  zones: Zone[];
  results: ZoneRiskResult[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
}

const HALIFAX_CENTER: [number, number] = [44.6460, -63.5760];

export default function MapView({ zones, results, selectedZoneId, onSelectZone }: MapViewProps) {
  return (
    <MapContainer
      center={HALIFAX_CENTER}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      className="rounded-l-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {results.map((result) => {
        const zone = zones.find((z) => z.id === result.zoneId);
        if (!zone) return null;

        const color = riskToColor(result.totalRisk);
        const radiusPx = 12 + result.totalRisk * 16;
        const isSelected = result.zoneId === selectedZoneId;

        return (
          <CircleMarker
            key={result.zoneId}
            center={zone.coordinates}
            radius={isSelected ? radiusPx + 4 : radiusPx}
            pathOptions={{
              color: isSelected ? '#FFFFFF' : color,
              fillColor: color,
              fillOpacity: 0.8,
              weight: isSelected ? 3 : 2,
            }}
            eventHandlers={{
              click: () => onSelectZone(result.zoneId),
            }}
          >
            <Popup>
              <div className="min-w-[200px] p-1">
                <h3 className="font-bold text-base mb-2">{result.zoneName}</h3>
                <div className="mb-2">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded inline-block"
                    style={{
                      backgroundColor: getDriverColor(result.dominantRisk),
                      color: 'white',
                    }}
                  >
                    {getDriverLabel(result.dominantRisk)} · {formatPercent(result.totalRisk)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mb-2">
                  <span className="text-blue-600 font-medium">Water</span>
                  <span className="text-right font-semibold">{formatPercent(result.waterRisk)}</span>
                  <span className="text-purple-600 font-medium">Air</span>
                  <span className="text-right font-semibold">{formatPercent(result.airRisk)}</span>
                  <span className="text-amber-800 font-medium">Earth</span>
                  <span className="text-right font-semibold">{formatPercent(result.earthRisk)}</span>
                  <span className="text-red-600 font-medium">Fire</span>
                  <span className="text-right font-semibold">{formatPercent(result.fireRisk)}</span>
                  <span className="text-orange-600 font-medium">Cascade</span>
                  <span className="text-right font-semibold">{formatPercent(result.cascadeRisk)}</span>
                </div>
                <p className="text-xs text-gray-700 font-medium leading-snug">{result.recommendedAction}</p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}