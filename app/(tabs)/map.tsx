import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAppTheme } from '../../utils/ThemeContext';
import { fetchNearbyQuietZones, getCurrentLocation, getDistance, requestLocationPermission } from '../../utils/locationHelper';

export default function MapScreen() {
  const { theme } = useAppTheme();
  const [userLocation, setUserLocation] = useState<any>(null);
  const [nearbyZones, setNearbyZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeZone, setActiveZone] = useState<any>(null);

  useEffect(() => { loadMap(); }, []);

  async function loadMap() {
    const granted = await requestLocationPermission();
    if (!granted) return;
    const coords = await getCurrentLocation();
    setUserLocation(coords);
    const zones = await fetchNearbyQuietZones(coords.latitude, coords.longitude, 10000);
    setNearbyZones(zones);
    setLoading(false);
    for (const zone of zones) {
      const distance = getDistance(coords.latitude, coords.longitude, zone.latitude, zone.longitude);
      if (distance <= zone.radius) { setActiveZone(zone); break; }
    }
  }

  const getMapHTML = () => {
    if (!userLocation) return '';
    const markers = nearbyZones.map(zone => `
      L.circle([${zone.latitude}, ${zone.longitude}], {
        color: '${activeZone?.id === zone.id ? '#EF4444' : '#2196F3'}',
        fillColor: '${activeZone?.id === zone.id ? '#EF4444' : '#2196F3'}',
        fillOpacity: 0.2,
        radius: ${zone.radius}
      }).addTo(map).bindPopup('${zone.name}');
      L.marker([${zone.latitude}, ${zone.longitude}]).addTo(map).bindPopup('<b>${zone.name}</b>');
    `).join('');

    return `
      <!DOCTYPE html><html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>body{margin:0;padding:0;}#map{width:100vw;height:100vh;}</style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${userLocation.latitude}, ${userLocation.longitude}], 14);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OpenStreetMap' }).addTo(map);
          L.marker([${userLocation.latitude}, ${userLocation.longitude}], {
            icon: L.divIcon({ html: '<div style="background:#10B981;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5)"></div>', iconSize: [16,16] })
          }).addTo(map).bindPopup('You are here');
          ${markers}
        </script>
      </body></html>
    `;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.green} />
        <Text style={[styles.loadingText, { color: theme.subtext }]}>Loading map...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Live Map</Text>
        <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>{nearbyZones.length} quiet zones nearby</Text>
      </View>

      <View style={[styles.badge, activeZone ? { backgroundColor: theme.alertCard } : { backgroundColor: theme.safeCard }]}>
        <Ionicons name={activeZone ? 'warning' : 'checkmark-circle'} size={16} color={activeZone ? theme.red : theme.green} />
        <Text style={[styles.badgeText, { color: theme.text }]}>{activeZone ? `  You are in ${activeZone.name}` : '  You are in a normal zone'}</Text>
      </View>

      <WebView style={styles.map} source={{ html: getMapHTML() }} javaScriptEnabled={true} domStorageEnabled={true} />

      <View style={[styles.legend, { backgroundColor: theme.card }]}>
        <View style={styles.legendItem}><Ionicons name="ellipse" size={12} color="#2196F3" /><Text style={[styles.legendText, { color: theme.text }]}> Quiet Zone</Text></View>
        <View style={styles.legendItem}><Ionicons name="ellipse" size={12} color="#EF4444" /><Text style={[styles.legendText, { color: theme.text }]}> Active Zone</Text></View>
        <View style={styles.legendItem}><Ionicons name="ellipse" size={12} color="#10B981" /><Text style={[styles.legendText, { color: theme.text }]}> You</Text></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14 },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  badge: { marginHorizontal: 20, padding: 10, borderRadius: 12, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center' },
  badgeText: { fontSize: 14, fontWeight: '600' },
  map: { flex: 1 },
  legend: { flexDirection: 'row', justifyContent: 'center', padding: 12, gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendText: { fontSize: 13 },
});