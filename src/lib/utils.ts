import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fetch latitude and longitude from Google Maps Geocoding API.
 * @param addressFields Object with addressLine1, city, stateProvince, country, postalCode
 * @param apiKey Google Maps API key
 * @returns { lat: number, lng: number }
 */
export async function geocodeAddress({ addressLine1, city, stateProvince, country, postalCode }: {
  addressLine1?: string;
  city: string;
  stateProvince: string;
  country: string;
  postalCode?: string;
}, apiKey: string): Promise<{ lat: number; lng: number }> {
  const addressParts = [addressLine1, city, stateProvince, postalCode, country].filter(Boolean);
  const address = encodeURIComponent(addressParts.join(', '));
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Errore nella richiesta a Google Maps API');
  const data = await response.json();
  if (data.status !== 'OK' || !data.results.length) throw new Error('Indirizzo non trovato');
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}
