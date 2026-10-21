import { fetchRawStorms, normalizeStorm } from "./apiService";
import { DetailedStorm, OverviewMetrics, TRACKER_UPDATE_INTERVAL_MS } from "./types";

interface CacheState {
  storms: DetailedStorm[];
  lastFetchedAt: string | null;
}

const cache: CacheState = {
  storms: [],
  lastFetchedAt: null,
};

export async function getActiveStorms(forceRefresh = false): Promise<{
  storms: DetailedStorm[];
  metrics: OverviewMetrics;
  fetchedAt: string;
  nextUpdateAt: string;
}> {
  const now = Date.now();
  const isStale =
    forceRefresh ||
    !cache.lastFetchedAt ||
    now - new Date(cache.lastFetchedAt).getTime() >= TRACKER_UPDATE_INTERVAL_MS;

  if (isStale) {
    const rawData = await fetchRawStorms(forceRefresh);
    if (rawData !== null) {
      const rawList = Array.isArray(rawData?.activeStorms) ? rawData.activeStorms : [];
      if (rawList.length > 0) {
        cache.storms = await Promise.all(rawList.map(normalizeStorm));
      } else {
        cache.storms = [];
      }
      cache.lastFetchedAt = new Date().toISOString();
    } else if (!cache.lastFetchedAt) {
      cache.lastFetchedAt = new Date().toISOString();
    }
  }

  const fetchedAt = cache.lastFetchedAt || new Date().toISOString();
  const nextUpdateAt = new Date(
    new Date(fetchedAt).getTime() + TRACKER_UPDATE_INTERVAL_MS
  ).toISOString();

  const storms = cache.storms;
  const metrics: OverviewMetrics = {
    activeStormsCount: storms.length,
    hurricanesCount: storms.filter((s) => s.category.startsWith("Cat")).length,
    tropicalStormsCount: storms.filter((s) => s.category === "TS").length,
    depressionsCount: storms.filter((s) => s.category === "TD").length,
    disturbancesCount: 0,
    lastUpdated: fetchedAt,
    nextUpdateAt,
  };

  return {
    storms,
    metrics,
    fetchedAt,
    nextUpdateAt,
  };
}

export async function getStormById(id: string): Promise<DetailedStorm | null> {
  const { storms } = await getActiveStorms();
  const match = storms.find((s) => s.id.toLowerCase() === id.toLowerCase() || s.name.toLowerCase() === id.toLowerCase());
  return match || storms[0] || null;
}

export function generateStormGeoJSON(storm: DetailedStorm) {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [storm.longitude, storm.latitude],
        },
        properties: {
          id: storm.id,
          name: storm.name,
          category: storm.category,
          windSpeedMph: storm.maxSustainedWindMph,
          pressureMb: storm.minimumCentralPressureMb,
          status: storm.status,
        },
      },
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            ...storm.historicalTrack.map((pt) => [pt.longitude, pt.latitude]),
            [storm.longitude, storm.latitude],
            ...storm.forecastPoints.map((pt) => [pt.longitude, pt.latitude]),
          ],
        },
        properties: {
          trackType: "Full Track",
          stormName: storm.name,
        },
      },
    ],
  };
}

export function generateStormCSV(storm: DetailedStorm): string {
  const headers = "PointType,Hour,Timestamp,Latitude,Longitude,WindMph,PressureMb,Category\n";
  const current = `Current,0,${storm.lastUpdated},${storm.latitude},${storm.longitude},${storm.maxSustainedWindMph},${storm.minimumCentralPressureMb},${storm.category}\n`;
  const forecast = storm.forecastPoints
    .map((pt) => `Forecast,${pt.forecastHour},${pt.timestamp},${pt.latitude},${pt.longitude},${pt.windSpeedMph},${pt.pressureMb},${pt.category}`)
    .join("\n");

  return headers + current + forecast;
}

