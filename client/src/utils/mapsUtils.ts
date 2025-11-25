export interface Coordinates {
    latitude: number;
    longitude: number;
}

/**
 * Extract latitude and longitude from a Google Maps URL.
 * Supports full URLs with @lat,lng, ?q=lat,lng, ?query=lat,lng.
 * Shortened URLs (maps.app.goo.gl) cannot be resolved client‑side; return null.
 */
export function extractCoordinatesFromMapsUrl(url: string): Coordinates | null {
    // Detect short URL (cannot be parsed client‑side)
    if (/maps\.app\.goo\.gl/.test(url)) {
        console.warn('Short Google Maps URL cannot be parsed client‑side.');
        return null;
    }

    // Decode in case URL is encoded
    const decoded = decodeURIComponent(url.trim());

    // Regex patterns for different URL formats
    const patterns = [
        /@([-+]?\d*\.?\d+),\s*([-+]?\d*\.?\d+)/, // @lat,lng
        /[?&]q=([-+]?\d*\.?\d+),\s*([-+]?\d*\.?\d+)/, // ?q=lat,lng
        /[?&]query=([-+]?\d*\.?\d+),\s*([-+]?\d*\.?\d+)/, // ?query=lat,lng
    ];

    for (const regex of patterns) {
        const match = decoded.match(regex);
        if (match) {
            const latitude = parseFloat(match[1]);
            const longitude = parseFloat(match[2]);
            if (!isNaN(latitude) && !isNaN(longitude)) {
                return { latitude, longitude };
            }
        }
    }

    return null;
}

/**
 * Simple validation to ensure coordinates are within realistic ranges.
 */
export function validateCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
