/**
 * Reference city labels for the visitor map. `minZoom` is the zoom level at
 * which a label appears, so the map stays legible when zoomed out and gains
 * context as you zoom in.
 */
export interface RefCity {
  name: string;
  lat: number;
  lng: number;
  minZoom: number;
}

export const REFERENCE_CITIES: RefCity[] = [
  // Tier 1 — always visible
  { name: 'New York', lat: 40.71, lng: -74.01, minZoom: 1 },
  { name: 'Los Angeles', lat: 34.05, lng: -118.24, minZoom: 1 },
  { name: 'London', lat: 51.51, lng: -0.13, minZoom: 1 },
  { name: 'Tokyo', lat: 35.68, lng: 139.69, minZoom: 1 },
  { name: 'São Paulo', lat: -23.55, lng: -46.63, minZoom: 1 },
  { name: 'Sydney', lat: -33.87, lng: 151.21, minZoom: 1 },
  { name: 'Mumbai', lat: 19.08, lng: 72.88, minZoom: 1 },
  { name: 'Lagos', lat: 6.52, lng: 3.38, minZoom: 1 },
  // Tier 2 — zoom >= 2
  { name: 'Paris', lat: 48.86, lng: 2.35, minZoom: 2 },
  { name: 'Beijing', lat: 39.90, lng: 116.40, minZoom: 2 },
  { name: 'Cairo', lat: 30.04, lng: 31.24, minZoom: 2 },
  { name: 'Chicago', lat: 41.88, lng: -87.63, minZoom: 2 },
  { name: 'San Francisco', lat: 37.77, lng: -122.42, minZoom: 2 },
  { name: 'Mexico City', lat: 19.43, lng: -99.13, minZoom: 2 },
  { name: 'Moscow', lat: 55.76, lng: 37.62, minZoom: 2 },
  { name: 'Singapore', lat: 1.35, lng: 103.82, minZoom: 2 },
  { name: 'Johannesburg', lat: -26.20, lng: 28.05, minZoom: 2 },
  { name: 'Buenos Aires', lat: -34.60, lng: -58.38, minZoom: 2 },
  // Tier 3 — zoom >= 4
  { name: 'Houston', lat: 29.76, lng: -95.37, minZoom: 4 },
  { name: 'Seattle', lat: 47.61, lng: -122.33, minZoom: 4 },
  { name: 'Miami', lat: 25.76, lng: -80.19, minZoom: 4 },
  { name: 'Toronto', lat: 43.65, lng: -79.38, minZoom: 4 },
  { name: 'Berlin', lat: 52.52, lng: 13.41, minZoom: 4 },
  { name: 'Dubai', lat: 25.20, lng: 55.27, minZoom: 4 },
  { name: 'Madrid', lat: 40.42, lng: -3.70, minZoom: 4 },
  { name: 'Rome', lat: 41.90, lng: 12.50, minZoom: 4 },
  { name: 'Istanbul', lat: 41.01, lng: 28.98, minZoom: 4 },
  { name: 'Seoul', lat: 37.57, lng: 126.98, minZoom: 4 },
  { name: 'Bangkok', lat: 13.76, lng: 100.50, minZoom: 4 },
  { name: 'Jakarta', lat: -6.21, lng: 106.85, minZoom: 4 },
  { name: 'Nairobi', lat: -1.29, lng: 36.82, minZoom: 4 },
  { name: 'Shanghai', lat: 31.23, lng: 121.47, minZoom: 4 },
  { name: 'Bengaluru', lat: 12.97, lng: 77.59, minZoom: 4 },
  { name: 'Amsterdam', lat: 52.37, lng: 4.90, minZoom: 4 },
  { name: 'Stockholm', lat: 59.33, lng: 18.07, minZoom: 4 },
  { name: 'Warsaw', lat: 52.23, lng: 21.01, minZoom: 4 },
  // Tier 4 — zoom >= 8
  { name: 'Denver', lat: 39.74, lng: -104.99, minZoom: 8 },
  { name: 'Atlanta', lat: 33.75, lng: -84.39, minZoom: 8 },
  { name: 'Dallas', lat: 32.78, lng: -96.80, minZoom: 8 },
  { name: 'Boston', lat: 42.36, lng: -71.06, minZoom: 8 },
  { name: 'Phoenix', lat: 33.45, lng: -112.07, minZoom: 8 },
  { name: 'Detroit', lat: 42.33, lng: -83.05, minZoom: 8 },
  { name: 'Minneapolis', lat: 44.98, lng: -93.27, minZoom: 8 },
  { name: 'Portland', lat: 45.52, lng: -122.68, minZoom: 8 },
  { name: 'Vancouver', lat: 49.28, lng: -123.12, minZoom: 8 },
  { name: 'Montreal', lat: 45.50, lng: -73.57, minZoom: 8 },
  { name: 'Munich', lat: 48.14, lng: 11.58, minZoom: 8 },
  { name: 'Lyon', lat: 45.76, lng: 4.84, minZoom: 8 },
  { name: 'Manchester', lat: 53.48, lng: -2.24, minZoom: 8 },
  { name: 'Osaka', lat: 34.69, lng: 135.50, minZoom: 8 },
  { name: 'Melbourne', lat: -37.81, lng: 144.96, minZoom: 8 },
  { name: 'Hyderabad', lat: 17.39, lng: 78.49, minZoom: 8 },
  // Tier 5 — zoom >= 16
  { name: 'San Diego', lat: 32.72, lng: -117.16, minZoom: 16 },
  { name: 'San Jose', lat: 37.34, lng: -121.89, minZoom: 16 },
  { name: 'Austin', lat: 30.27, lng: -97.74, minZoom: 16 },
  { name: 'Nashville', lat: 36.16, lng: -86.78, minZoom: 16 },
  { name: 'Charlotte', lat: 35.23, lng: -80.84, minZoom: 16 },
  { name: 'Las Vegas', lat: 36.17, lng: -115.14, minZoom: 16 },
  { name: 'Salt Lake City', lat: 40.76, lng: -111.89, minZoom: 16 },
  { name: 'Raleigh', lat: 35.78, lng: -78.64, minZoom: 16 },
  { name: 'Pittsburgh', lat: 40.44, lng: -79.99, minZoom: 16 },
  { name: 'Columbus', lat: 39.96, lng: -82.99, minZoom: 16 },
  { name: 'Cambridge', lat: 42.37, lng: -71.11, minZoom: 16 },
  { name: 'Brooklyn', lat: 40.68, lng: -73.94, minZoom: 16 },
  { name: 'Sacramento', lat: 38.58, lng: -121.49, minZoom: 16 },
  { name: 'Tampa', lat: 27.95, lng: -82.46, minZoom: 16 },
  { name: 'Orlando', lat: 28.54, lng: -81.38, minZoom: 16 },
  { name: 'New Orleans', lat: 29.95, lng: -90.07, minZoom: 16 },
  { name: 'Milwaukee', lat: 43.04, lng: -87.91, minZoom: 16 },
  { name: 'Kansas City', lat: 39.10, lng: -94.58, minZoom: 16 },
  { name: 'Indianapolis', lat: 39.77, lng: -86.16, minZoom: 16 },
];
