import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    useColorScheme,
    View
} from 'react-native';
import { darkTheme, lightTheme } from '../../utils/theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_SCHEDULES = [
  {
    id: 1,
    name: 'University Hours',
    icon: 'school',
    startTime: '08:00',
    endTime: '14:00',
    days: [1, 2, 3, 4, 5],
    enabled: false,
  },
  {
    id: 2,
    name: 'Prayer Times',
    icon: 'moon',
    startTime: '12:00',
    endTime: '13:00',
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: false,
  },
  {
    id: 3,
    name: 'Hospital Visit',
    icon: 'medical',
    startTime: '09:00',
    endTime: '17:00',
    days: [1, 2, 3, 4, 5],
    enabled: false,
  },
  {
    id: 4,
    name: 'Night Mode',
    icon: 'moon-outline',
    startTime: '22:00',
    endTime: '06:00',
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: false,
  },
];

export default function ScheduleScreen() {
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? darkTheme : lightTheme;
  const [schedules, setSchedules] = useState(DEFAULT_SCHEDULES);
  const [activeNow, setActiveNow] = useState<any>(null);

  useEffect(() => {
    loadSchedules();
    checkActiveSchedule();
  }, []);

  async function loadSchedules() {
    try {
      const saved = await AsyncStorage.getItem('schedules');
      if (saved) setSchedules(JSON.parse(saved));
    } catch (e) {}
  }

  async function saveSchedules(updated: any[]) {
    setSchedules(updated);
    await AsyncStorage.setItem('schedules', JSON.stringify(updated));
  }

  function toggleSchedule(id: number) {
    const updated = schedules.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    saveSchedules(updated);
    checkActiveSchedule(updated);
  }

  function checkActiveSchedule(list = schedules) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const active = list.find(s => {
      if (!s.enabled) return false;
      if (!s.days.includes(currentDay)) return false;
      return currentTime >= s.startTime && currentTime <= s.endTime;
    });

    setActiveNow(active || null);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="alarm" size={45} color={theme.green} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Schedule Mode</Text>
          <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>
            Auto-silence at specific times
          </Text>
        </View>

        {/* Active Now Badge */}
        <View style={[styles.activeBadge,
          { backgroundColor: activeNow ? theme.safeCard : theme.card }
        ]}>
          <Ionicons
            name={activeNow ? 'checkmark-circle' : 'time-outline'}
            size={20}
            color={activeNow ? theme.green : theme.subtext}
          />
          <Text style={[styles.activeBadgeText, { color: theme.text }]}>
            {activeNow
              ? ` Active: ${activeNow.name}`
              : ' No schedule active right now'}
          </Text>
        </View>

        {/* Schedule Cards */}
        {schedules.map((schedule) => (
          <View key={schedule.id} style={[styles.card, { backgroundColor: theme.card }]}>

            {/* Top Row */}
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { backgroundColor: theme.background }]}>
                <Ionicons
                  name={schedule.icon as any}
                  size={24}
                  color={schedule.enabled ? theme.green : theme.subtext}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: theme.text }]}>
                  {schedule.name}
                </Text>
                <Text style={[styles.cardTime, { color: theme.subtext }]}>
                  {schedule.startTime} — {schedule.endTime}
                </Text>
              </View>
              <Switch
                value={schedule.enabled}
                onValueChange={() => toggleSchedule(schedule.id)}
                trackColor={{ false: '#555', true: theme.green }}
                thumbColor={schedule.enabled ? '#fff' : '#ccc'}
              />
            </View>

            {/* Days Row */}
            <View style={styles.daysRow}>
              {DAYS.map((day, index) => (
                <View
                  key={index}
                  style={[
                    styles.dayBadge,
                    {
                      backgroundColor: schedule.days.includes(index)
                        ? theme.green
                        : theme.background
                    }
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    { color: schedule.days.includes(index) ? '#fff' : theme.subtext }
                  ]}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

          </View>
        ))}

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: theme.card }]}>
          <Ionicons name="information-circle" size={20} color={theme.green} />
          <Text style={[styles.infoText, { color: theme.subtext }]}>
            {"  "}When a schedule is active, app will automatically remind you to silence your phone during those hours.
          </Text>
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
  activeBadge: {
    marginHorizontal: 20, marginBottom: 16,
    padding: 12, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  activeBadgeText: { fontSize: 14, fontWeight: '600' },
  card: {
    marginHorizontal: 20, marginBottom: 14,
    borderRadius: 20, padding: 16, elevation: 3,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: 'bold' },
  cardTime: { fontSize: 13, marginTop: 2 },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  dayText: { fontSize: 11, fontWeight: '600' },
  infoBox: {
    marginHorizontal: 20, borderRadius: 14,
    padding: 14, flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: { fontSize: 13, lineHeight: 20, flex: 1 },
});