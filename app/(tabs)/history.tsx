import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { darkTheme, lightTheme } from '../../utils/theme';

export default function HistoryScreen() {
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? darkTheme : lightTheme;
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    try {
      const saved = await AsyncStorage.getItem('zoneHistory');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {}
  }

  async function clearHistory() {
    Alert.alert('Clear History', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('zoneHistory');
          setHistory([]);
        }
      }
    ]);
  }

  function formatDate(timestamp: number) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Ionicons name="time" size={45} color={theme.green} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Zone History</Text>
          <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>
            {history.length} zones visited
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{history.length}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Total Visits</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {new Set(history.map(h => h.name)).size}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Unique Zones</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {history.filter(h => h.type === 'hospital' || h.type === 'Hospital').length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Hospitals</Text>
          </View>
        </View>

        {/* History List */}
        <View style={[styles.listBox, { backgroundColor: theme.card }]}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: theme.text }]}>Recent Visits</Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={clearHistory}>
                <Ionicons name="trash" size={20} color={theme.red} />
              </TouchableOpacity>
            )}
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="location-outline" size={50} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.text }]}>No history yet!</Text>
              <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                Visit a quiet zone to see history here
              </Text>
            </View>
          ) : (
            [...history].reverse().map((item, index) => (
              <View key={index} style={[styles.historyRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: theme.background }]}>
                  <Ionicons
                    name={getZoneIcon(item.type) as any}
                    size={22}
                    color={theme.green}
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.historyDate, { color: theme.subtext }]}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: theme.background }]}>
                  <Text style={[styles.typeBadgeText, { color: theme.subtext }]}>
                    {item.type || 'Zone'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

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
  statsRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', elevation: 3 },
  statNumber: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 4 },
  listBox: { marginHorizontal: 20, borderRadius: 20, padding: 20, elevation: 3 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listTitle: { fontSize: 16, fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  emptySubtext: { fontSize: 13, marginTop: 6, textAlign: 'center' },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 14, fontWeight: '600' },
  historyDate: { fontSize: 12, marginTop: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
});