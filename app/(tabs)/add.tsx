import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { darkTheme, lightTheme } from '../../utils/theme';

const ZONE_TYPES = [
  { label: 'Hospital', icon: 'medical', color: '#F44336' },
  { label: 'Mosque', icon: 'moon', color: '#4CAF50' },
  { label: 'Library', icon: 'library', color: '#2196F3' },
  { label: 'School', icon: 'school-outline', color: '#FF9800' },
  { label: 'University', icon: 'school', color: '#9C27B0' },
  { label: 'Other', icon: 'location', color: '#607D8B' },
];

export default function AddZoneScreen() {
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? darkTheme : lightTheme;

  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('100');
  const [selectedType, setSelectedType] = useState(ZONE_TYPES[0]);
  const [savedZones, setSavedZones] = useState<any[]>([]);

  useEffect(() => { loadSavedZones(); }, []);

  async function loadSavedZones() {
    try {
      const existing = await AsyncStorage.getItem('customZones');
      if (existing) setSavedZones(JSON.parse(existing));
    } catch (e) {}
  }

  async function saveZone() {
    if (!name || !latitude || !longitude) {
      Alert.alert('Error', 'Please fill all fields!');
      return;
    }
    const newZone = {
      id: Date.now(), name,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
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
      setName(''); setLatitude(''); setLongitude(''); setRadius('100');
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
          <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>Add your own quiet zones</Text>
        </View>

        {/* Zone Type */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Zone Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {ZONE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.label}
                style={[styles.typeBtn, { backgroundColor: theme.card },
                  selectedType.label === type.label && { backgroundColor: theme.green }
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={selectedType.label === type.label ? '#fff' : type.color}
                />
                <Text style={[styles.typeLabel,
                  { color: selectedType.label === type.label ? '#fff' : theme.text }
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Inputs */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Zone Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
            placeholder="e.g. My University Library"
            placeholderTextColor={theme.subtext}
            value={name} onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Latitude</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
            placeholder="e.g. 31.4180"
            placeholderTextColor={theme.subtext}
            value={latitude} onChangeText={setLatitude} keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Longitude</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
            placeholder="e.g. 73.0791"
            placeholderTextColor={theme.subtext}
            value={longitude} onChangeText={setLongitude} keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Radius (meters)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
            placeholder="e.g. 100"
            placeholderTextColor={theme.subtext}
            value={radius} onChangeText={setRadius} keyboardType="numeric"
          />
        </View>

        {/* Tip */}
        <View style={[styles.tipBox, { backgroundColor: theme.safeCard }]}>
          <Ionicons name="information-circle" size={18} color={theme.green} />
          <Text style={[styles.tipText, { color: theme.text }]}>
            {"  "}Tip: Open Google Maps → Long press your location → Copy the coordinates
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.green }]} onPress={saveZone}>
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>  Save Zone</Text>
        </TouchableOpacity>

        {/* Saved Zones */}
        {savedZones.length > 0 && (
          <View style={[styles.savedBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.savedTitle, { color: theme.text }]}>
              My Custom Zones ({savedZones.length})
            </Text>
            {savedZones.map((zone) => (
              <View key={zone.id} style={[styles.savedRow, { borderBottomColor: theme.border }]}>
                <Ionicons name={zone.icon as any} size={20} color={theme.green} />
                <Text style={[styles.savedName, { color: theme.text }]}>{zone.name}</Text>
                <TouchableOpacity onPress={() => deleteZone(zone.id)}>
                  <Ionicons name="trash" size={20} color={theme.red} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 30, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  section: { marginHorizontal: 20, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 14, padding: 14, fontSize: 15, elevation: 2 },
  typeBtn: {
    alignItems: 'center', borderRadius: 14,
    padding: 12, marginRight: 10, minWidth: 85, elevation: 2,
  },
  typeLabel: { fontSize: 11, marginTop: 4 },
  tipBox: {
    marginHorizontal: 20, borderRadius: 14,
    padding: 14, marginBottom: 20,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  tipText: { fontSize: 13, lineHeight: 20, flex: 1 },
  saveBtn: {
    marginHorizontal: 20, borderRadius: 16,
    padding: 18, alignItems: 'center',
    elevation: 4, flexDirection: 'row', justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  savedBox: { marginHorizontal: 20, marginTop: 24, borderRadius: 20, padding: 20, elevation: 3 },
  savedTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  savedRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1,
  },
  savedName: { flex: 1, fontSize: 14, marginLeft: 10 },
});