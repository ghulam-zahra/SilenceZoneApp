import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import MapView, { Circle, Marker, UrlTile } from 'react-native-maps';
import {
  fetchNearbyQuietZones,
  getCurrentLocation,
  getDistance,
  requestLocationPermission
} from '../../utils/locationHelper';
import { darkTheme, lightTheme } from '../../utils/theme';

export default function MapScreen() {
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? darkTheme : lightTheme;

  const [userLocation, setUserLocation] = useState<any>(null);
  const [nearbyZones, setNearbyZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeZone, setActiveZone] = useState<any>(null);

  useEffect(() => {
    loadMap();
  }, []);

  async function loadMap() {
    const granted = await requestLocationPermission();
    if (!granted) return;
    const coords = await getCurrentLocation();
    setUserLocation(coords);
    const zones = await fetchNearbyQuietZones(coords.latitude, coords.longitude, 10000);
    setNearbyZones(zones);
    setLoading(false);
    for (const zone of zones) {
      const distance = getDistance(
        coords.latitude, coords.longitude,
        zone.latitude, zone.longitude
      );
      if (distance <= zone.radius) {
        setActiveZone(zone);
        break;
      }
    }
  }

  function getZoneIcon(type: string) {
    switch (type) {
      case 'hospital': return 'medical';
      case 'place_of_worship': return 'moon';
      case 'library': return 'library';
      case 'university': return 'school';
      case 'school': return 'school-outline';
      default: return 'location';
    }
  }

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

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Live Map</Text>
        <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>
          {nearbyZones.length} quiet zones found nearby
        </Text>
      </View>

      {/* Status Badge */}
      <View style={[styles.badge,
        activeZone
          ? { backgroundColor: theme.alertCard }
          : { backgroundColor: theme.safeCard }
      ]}>
        <Ionicons
          name={activeZone ? 'warning' : 'checkmark-circle'}
          size={16}
          color={activeZone ? theme.red : theme.green}
        />
        <Text style={[styles.badgeText, { color: theme.text }]}>
          {activeZone
            ? `  You are in ${activeZone.name}`
            : '  You are in a normal zone'}
        </Text>
      </View>

      {/* Map */}
      {userLocation && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          mapType="none"
        >
          {/* OpenStreetMap Tiles — Free! */}
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />

          {/* Zone Markers */}
          {nearbyZones.map((zone) => (
            <React.Fragment key={zone.id}>
              <Marker
                coordinate={{
                  latitude: zone.latitude,
                  longitude: zone.longitude,
                }}
                title={zone.name}
                description={`Quiet Zone — ${zone.type}`}
                pinColor={activeZone?.id === zone.id ? 'red' : 'blue'}
              />
              <Circle
                center={{
                  latitude: zone.latitude,
                  longitude: zone.longitude,
                }}
                radius={zone.radius}
                fillColor={
                  activeZone?.id === zone.id
                    ? 'rgba(244,67,54,0.2)'
                    : 'rgba(33,150,243,0.15)'
                }
                strokeColor={
                  activeZone?.id === zone.id ? '#F44336' : '#2196F3'
                }
                strokeWidth={2}
              />
            </React.Fragment>
          ))}
        </MapView>
      )}

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: theme.card }]}>
        <View style={styles.legendItem}>
          <Ionicons name="ellipse" size={12} color="#2196F3" />
          <Text style={[styles.legendText, { color: theme.text }]}> Quiet Zone</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="ellipse" size={12} color="#F44336" />
          <Text style={[styles.legendText, { color: theme.text }]}> Active Zone</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="ellipse" size={12} color="#4CAF50" />
          <Text style={[styles.legendText, { color: theme.text }]}> You</Text>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center'
  },
  loadingText: { marginTop: 10, fontSize: 14 },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  badge: {
    marginHorizontal: 20, padding: 10,
    borderRadius: 12, alignItems: 'center',
    marginBottom: 10, flexDirection: 'row',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 14, fontWeight: '600' },
  map: { flex: 1 },
  legend: {
    flexDirection: 'row', justifyContent: 'center',
    padding: 12, gap: 20,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendText: { fontSize: 13 },
});