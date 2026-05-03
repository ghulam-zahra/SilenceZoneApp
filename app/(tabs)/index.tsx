import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../utils/ThemeContext';
import { fetchNearbyQuietZones, getCurrentLocation, getDistance, requestLocationPermission } from '../../utils/locationHelper';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function HomeScreen() {
  const { theme, isDark, setIsDark } = useAppTheme();
  const [currentZone, setCurrentZone] = useState<any>(null);
  const [nearbyZones, setNearbyZones] = useState<any[]>([]);
  const [status, setStatus] = useState("Checking your location...");
  const [loading, setLoading] = useState(true);

  useEffect(() => { setupApp(); }, []);

  async function setupApp() {
    const locGranted = await requestLocationPermission();
    if (!locGranted) { setStatus("Location permission denied!"); setLoading(false); return; }
    await Notifications.requestPermissionsAsync();
    checkZone();
    const interval = setInterval(checkZone, 15000);
    return () => clearInterval(interval);
  }

  async function checkZone() {
    try {
      const coords = await getCurrentLocation();
      const apiZones = await fetchNearbyQuietZones(coords.latitude, coords.longitude, 10000);
      const saved = await AsyncStorage.getItem('customZones');
      const customZones = saved ? JSON.parse(saved) : [];
      const allZones = [...apiZones, ...customZones];
      setNearbyZones(allZones);
      setLoading(false);

      for (const zone of allZones) {
        const distance = getDistance(coords.latitude, coords.longitude, zone.latitude, zone.longitude);
        if (distance <= zone.radius) {
          setCurrentZone(zone);
          setStatus("You have entered a quiet zone!");

          const historyItem = { name: zone.name, icon: zone.icon, type: zone.type, timestamp: Date.now() };
          const existingHistory = await AsyncStorage.getItem('zoneHistory');
          const historyArr = existingHistory ? JSON.parse(existingHistory) : [];
          historyArr.push(historyItem);
          await AsyncStorage.setItem('zoneHistory', JSON.stringify(historyArr));

          Alert.alert(`${zone.icon} Quiet Zone!`, `You entered ${zone.name}.\nPlease keep your phone silent 🔕`, [{ text: 'OK' }]);

          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${zone.icon} Quiet Zone Alert!`,
              body: `You entered ${zone.name}. Please keep your phone silent 🔕`,
            },
            trigger: null,
          });
          return;
        }
      }
      setCurrentZone(null);
      setStatus("You are in a normal zone");
    } catch (error) {
      setStatus("Could not fetch zones. Check internet!");
      setLoading(false);
    }
  }

  function getZoneIcon(type: string) {
    switch (type) {
      case 'hospital': return 'medical';
      case 'clinic': return 'medical-outline';
      case 'place_of_worship': return 'moon';
      case 'library': return 'library';
      case 'university': return 'school';
      case 'school': return 'school-outline';
      default: return 'location';
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Silence Zone</Text>
            <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: theme.card }]} onPress={() => setIsDark(!isDark)}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={22} color={isDark ? '#FFD700' : '#555'} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>Auto-detecting nearby quiet zones</Text>
        </View>

        <View style={[styles.card, currentZone ? { backgroundColor: theme.alertCard, borderLeftColor: theme.red } : { backgroundColor: theme.safeCard, borderLeftColor: theme.green }]}>
          {loading ? <ActivityIndicator size="large" color={theme.green} /> : (
            <>
              <Ionicons name={currentZone ? getZoneIcon(currentZone.type) : 'location'} size={55} color={currentZone ? theme.red : theme.green} style={{ marginBottom: 10 }} />
              <Text style={[styles.zoneStatus, { color: theme.text }]}>{currentZone ? currentZone.name : "No Quiet Zone Nearby"}</Text>
              <Text style={[styles.zoneMessage, { color: theme.subtext }]}>{status}</Text>
            </>
          )}
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>Nearby Quiet Zones ({nearbyZones.length} found)</Text>
          {nearbyZones.length === 0 && !loading ? (
            <Text style={[styles.noZones, { color: theme.subtext }]}>No zones found in 10km range</Text>
          ) : (
            nearbyZones.slice(0, 6).map((zone) => (
              <View key={zone.id} style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: theme.background }]}>
                  <Ionicons name={getZoneIcon(zone.type)} size={20} color={theme.green} />
                </View>
                <Text style={[styles.infoText, { color: theme.text }]}>{zone.name}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.footerRow}>
          <Ionicons name={loading ? 'sync' : 'checkmark-circle'} size={14} color={theme.subtext} />
          <Text style={[styles.footer, { color: theme.subtext }]}>{loading ? " Fetching nearby zones..." : " Live — updates every 15 sec"}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginTop: 40, marginBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  toggleBtn: { padding: 10, borderRadius: 20, elevation: 3 },
  headerSubtitle: { fontSize: 14 },
  card: { marginHorizontal: 20, borderRadius: 24, padding: 30, alignItems: 'center', marginBottom: 20, elevation: 6, borderLeftWidth: 5 },
  zoneStatus: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  zoneMessage: { fontSize: 14, marginTop: 6, textAlign: 'center' },
  infoBox: { marginHorizontal: 20, borderRadius: 20, padding: 20, elevation: 3 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoText: { fontSize: 14 },
  noZones: { fontSize: 14, textAlign: 'center' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 30 },
  footer: { fontSize: 12 },
});