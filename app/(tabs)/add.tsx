import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAppTheme } from '../../utils/ThemeContext';
import { getCurrentLocation, requestLocationPermission } from '../../utils/locationHelper';

const ZONE_TYPES = [
  { label: 'Hospital', icon: 'medical', color: '#F44336' },
  { label: 'Mosque', icon: 'moon', color: '#4CAF50' },
  { label: 'Library', icon: 'library', color: '#2196F3' },
  { label: 'School', icon: 'school-outline', color: '#FF9800' },
  { label: 'University', icon: 'school', color: '#9C27B0' },
  { label: 'Other', icon: 'location', color: '#607D8B' },
];

export default function AddZoneScreen() {
  const { theme } = useAppTheme();
  const [name, setName] = useState('');
  const [radius, setRadius] = useState('100');
  const [selectedType, setSelectedType] = useState(ZONE_TYPES[0]);
  const [savedZones, setSavedZones] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => { loadSavedZones(); getLocation(); }, []);

  async function getLocation() {
    const granted = await requestLocationPermission();
    if (granted) { const coords = await getCurrentLocation(); setUserLocation(coords); }
  }

  async function loadSavedZones() {
    try {
      const existing = await AsyncStorage.getItem('customZones');
      if (existing) setSavedZones(JSON.parse(existing));
    } catch (e) {}
  }

  async function saveZone() {
    if (!name) { Alert.alert('Error', 'Please enter zone name!'); return; }
    if (!selectedLocation) { Alert.alert('Error', 'Please select location on map!'); return; }

    const newZone = {
      id: Date.now(), name,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      radius: parseInt(radius),
      icon: selectedType.icon,
      type: selectedType.label,
    };

    try {
      const existing = await AsyncStorage.getItem('customZones');
      const zones = existing ? JSON.parse(existing) : [];
      zones.push(newZone);
      await AsyncStorage.setItem('customZones', JSON.stringify(zones));
      setSavedZones(zones);
      Alert.alert('✅ Saved!', `${name} zone added!`);
      setName(''); setSelectedLocation(null); setRadius('100'); setShowMap(false);
    } catch (e) { Alert.alert('Error', 'Could not save zone!'); }
  }

  async function deleteZone(id: number) {
    const updated = savedZones.filter(z => z.id !== id);
    await AsyncStorage.setItem('customZones', JSON.stringify(updated));
    setSavedZones(updated);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="add-circle" size={45} color={theme.green} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Add Custom Zone</Text>
          <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>Tap on map to select location</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Zone Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {ZONE_TYPES.map((type) => (
              <TouchableOpacity key={type.label}
                style={[styles.typeBtn, { backgroundColor: theme.card }, selectedType.label === type.label && { backgroundColor: type.color }]}
                onPress={() => setSelectedType(type)}>
                <Ionicons name={type.icon as any} size={24} color={selectedType.label === type.label ? '#fff' : type.color} />
                <Text style={[styles.typeLabel, { color: selectedType.label === type.label ? '#fff' : theme.text }]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Zone Name</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="pencil" size={18} color={theme.subtext} />
            <TextInput style={[styles.input, { color: theme.text }]} placeholder="e.g. My University Library" placeholderTextColor={theme.subtext} value={name} onChangeText={setName} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Radius (meters)</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="radio-button-on" size={18} color={theme.subtext} />
            <TextInput style={[styles.input, { color: theme.text }]} placeholder="e.g. 100" placeholderTextColor={theme.subtext} value={radius} onChangeText={setRadius} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Select Location on Map</Text>
          {selectedLocation && (
            <View style={[styles.locationBadge, { backgroundColor: theme.safeCard }]}>
              <Ionicons name="checkmark-circle" size={18} color={theme.green} />
              <Text style={[styles.locationText, { color: theme.text }]}>  {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}</Text>
            </View>
          )}
          <TouchableOpacity style={[styles.mapToggleBtn, { backgroundColor: theme.card }]} onPress={() => setShowMap(!showMap)}>
            <Ionicons name={showMap ? "chevron-up" : "map"} size={20} color={theme.green} />
            <Text style={[styles.mapToggleText, { color: theme.text }]}>  {showMap ? "Hide Map" : "Open Map to Select Location"}</Text>
          </TouchableOpacity>

          {showMap && userLocation && (
            <View style={styles.mapContainer}>
              <Text style={[styles.mapHint, { color: theme.subtext }]}>👆 Tap anywhere on map to select location</Text>
              <MapView style={styles.map}
                initialRegion={{ latitude: userLocation.latitude, longitude: userLocation.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
                showsUserLocation={true}
                onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}>
                {selectedLocation && <Marker coordinate={selectedLocation} title={name || "Selected Zone"} pinColor="green" />}
              </MapView>
              {selectedLocation && (
                <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.green }]} onPress={() => setShowMap(false)}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.confirmBtnText}>  Confirm Location</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={[styles.tipBox, { backgroundColor: theme.safeCard }]}>
          <Ionicons name="information-circle" size={18} color={theme.green} />
          <Text style={[styles.tipText, { color: theme.text }]}>  Tip: Open Google Maps → Long press your location → Copy the coordinates</Text>
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.green }]} onPress={saveZone}>
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>  Save Zone</Text>
        </TouchableOpacity>

        {savedZones.length > 0 && (
          <View style={[styles.savedBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.savedTitle, { color: theme.text }]}>My Custom Zones ({savedZones.length})</Text>
            {savedZones.map((zone) => (
              <View key={zone.id} style={[styles.savedRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.savedIconCircle, { backgroundColor: theme.background }]}>
                  <Ionicons name={zone.icon as any} size={18} color={theme.green} />
                </View>
                <View style={styles.savedInfo}>
                  <Text style={[styles.savedName, { color: theme.text }]}>{zone.name}</Text>
                  <Text style={[styles.savedCoords, { color: theme.subtext }]}>{zone.latitude?.toFixed(3)}, {zone.longitude?.toFixed(3)} • {zone.radius}m</Text>
                </View>
                <TouchableOpacity onPress={() => deleteZone(zone.id)}>
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 30, paddingBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  section: { marginHorizontal: 20, marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, elevation: 2 },
  input: { flex: 1, fontSize: 15, marginLeft: 10 },
  typeBtn: { alignItems: 'center', borderRadius: 14, padding: 12, marginRight: 10, minWidth: 85, elevation: 2 },
  typeLabel: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  locationBadge: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, marginBottom: 10 },
  locationText: { fontSize: 13, fontWeight: '600' },
  mapToggleBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, elevation: 2 },
  mapToggleText: { fontSize: 14, fontWeight: '600' },
  mapContainer: { marginTop: 10, borderRadius: 16, overflow: 'hidden' },
  mapHint: { fontSize: 12, textAlign: 'center', marginBottom: 8 },
  map: { width: '100%', height: 280 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, marginTop: 8 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  tipBox: { marginHorizontal: 20, borderRadius: 14, padding: 14, marginBottom: 20, flexDirection: 'row', alignItems: 'flex-start' },
  tipText: { fontSize: 13, lineHeight: 20, flex: 1 },
  saveBtn: { marginHorizontal: 20, borderRadius: 16, padding: 18, alignItems: 'center', elevation: 4, flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  savedBox: { marginHorizontal: 20, borderRadius: 20, padding: 20, elevation: 3 },
  savedTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  savedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  savedIconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  savedInfo: { flex: 1 },
  savedName: { fontSize: 14, fontWeight: '600' },
  savedCoords: { fontSize: 11, marginTop: 2 },
});