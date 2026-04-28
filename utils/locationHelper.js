import * as Location from 'expo-location';

export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation() {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return location.coords;
}

export async function fetchNearbyQuietZones(latitude, longitude, radiusMeters = 10000) {
  try {
    const query = `
      [out:json][timeout:10];
      (
        node["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="place_of_worship"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="library"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="university"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="school"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="college"](around:${radiusMeters},${latitude},${longitude});
      );
      out body;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.elements && data.elements.length > 0) {
      return data.elements.map((el, index) => ({
        id: el.id || index,
        name: el.tags?.name || getDefaultName(el.tags?.amenity),
        latitude: el.lat,
        longitude: el.lon,
        radius: getRadius(el.tags?.amenity),
        icon: getIcon(el.tags?.amenity),
        type: el.tags?.amenity,
      }));
    }
    return getFallbackZones();
  } catch (error) {
    return getFallbackZones();
  }
}

function getFallbackZones() {
  return [
    { id: 1, name: "Allied Hospital FSD", latitude: 31.4180, longitude: 73.0790, radius: 200, icon: "🏥", type: "hospital" },
    { id: 2, name: "DHQ Hospital FSD", latitude: 31.4089, longitude: 73.0658, radius: 200, icon: "🏥", type: "hospital" },
    { id: 3, name: "GC University FSD", latitude: 31.4180, longitude: 73.0791, radius: 150, icon: "🎓", type: "university" },
    { id: 4, name: "Jamia Masjid FSD", latitude: 31.4154, longitude: 73.0797, radius: 150, icon: "🕌", type: "place_of_worship" },
    { id: 5, name: "Lyallpur Museum Library", latitude: 31.4167, longitude: 73.0811, radius: 100, icon: "📚", type: "library" },
    { id: 6, name: "Chiniot Hospital", latitude: 31.7199, longitude: 72.9787, radius: 200, icon: "🏥", type: "hospital" },
    { id: 7, name: "Jhang Hospital", latitude: 31.2681, longitude: 72.3181, radius: 200, icon: "🏥", type: "hospital" },
    { id: 8, name: "My Current Location Test", latitude: 31.4336, longitude: 73.0683, radius: 5000, icon: "📍", type: "other" }
  ];

}

export async function sendQuietZoneNotification(zone) {
  console.log('Zone detected:', zone.name);
}

function getIcon(amenity) {
  const icons = {
    hospital: '🏥', clinic: '🏥',
    place_of_worship: '🕌', library: '📚',
    university: '🎓', school: '🏫', college: '🎓',
  };
  return icons[amenity] || '📍';
}

function getRadius(amenity) {
  const radii = {
    hospital: 200, clinic: 100,
    place_of_worship: 150, library: 100,
    university: 300, school: 150, college: 200,
  };
  return radii[amenity] || 100;
}

function getDefaultName(amenity) {
  const names = {
    hospital: 'Hospital', clinic: 'Clinic',
    place_of_worship: 'Mosque / Worship Place',
    library: 'Library', university: 'University',
    school: 'School', college: 'College',
  };
  return names[amenity] || 'Quiet Zone';
}