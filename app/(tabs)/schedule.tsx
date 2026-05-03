import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../utils/ThemeContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_SCHEDULES = [
  { id: 1, name: 'University Hours', icon: 'school', startTime: '08:00', endTime: '14:00', days: [1,2,3,4,5], enabled: false },
  { id: 2, name: 'Prayer Times', icon: 'moon', startTime: '12:00', endTime: '13:00', days: [0,1,2,3,4,5,6], enabled: false },
  { id: 3, name: 'Hospital Visit', icon: 'medical', startTime: '09:00', endTime: '17:00', days: [1,2,3,4,5], enabled: false },
  { id: 4, name: 'Night Mode', icon: 'moon-outline', startTime: '22:00', endTime: '06:00', days: [0,1,2,3,4,5,6], enabled: false },
];

export default function ScheduleScreen() {
  const { theme } = useAppTheme();
  const [schedules, setSchedules] = useState(DEFAULT_SCHEDULES);
  const [activeNow, setActiveNow] = useState<any>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start'|'end'>('start');
  const [editingId, setEditingId] = useState<number|null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());

  useEffect(() => { loadSchedules(); checkActiveSchedule(); }, []);

  async function loadSchedules() {
    try {
      const saved = await AsyncStorage.getItem('schedules');
      if (saved) setSchedules(JSON.parse(saved));
    } catch(e) {}
  }

  async function saveSchedules(updated: any[]) {
    setSchedules(updated);
    await AsyncStorage.setItem('schedules', JSON.stringify(updated));
  }

  function toggleSchedule(id: number) {
    const updated = schedules.map(s => s.id === id ? {...s, enabled: !s.enabled} : s);
    saveSchedules(updated);
    checkActiveSchedule(updated);
  }

  function toggleDay(scheduleId: number, dayIndex: number) {
    const updated = schedules.map(s => {
      if (s.id !== scheduleId) return s;
      const days = s.days.includes(dayIndex) ? s.days.filter((d: number) => d !== dayIndex) : [...s.days, dayIndex];
      return {...s, days};
    });
    saveSchedules(updated);
  }

  function openTimePicker(id: number, mode: 'start'|'end') {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return;
    const timeStr = mode === 'start' ? schedule.startTime : schedule.endTime;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    setPickerDate(date);
    setEditingId(id);
    setPickerMode(mode);
    setShowPicker(true);
  }

  function onTimeChange(_: any, selectedDate?: Date) {
    if (!selectedDate) { setShowPicker(false); return; }
    const hours = String(selectedDate.getHours()).padStart(2, '0');
    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    const updated = schedules.map(s => {
      if (s.id !== editingId) return s;
      return pickerMode === 'start' ? {...s, startTime: timeStr} : {...s, endTime: timeStr};
    });
    saveSchedules(updated);
    setShowPicker(false);
  }

  function checkActiveSchedule(list = schedules) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
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
        <View style={styles.header}>
          <Ionicons name="alarm" size={45} color={theme.green} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Schedule Mode</Text>
          <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>Set custom silence times</Text>
        </View>

        <View style={[styles.activeBadge, { backgroundColor: activeNow ? theme.safeCard : theme.card }]}>
          <Ionicons name={activeNow ? 'checkmark-circle' : 'time-outline'} size={20} color={activeNow ? theme.green : theme.subtext} />
          <Text style={[styles.activeBadgeText, { color: theme.text }]}>{activeNow ? `  Active: ${activeNow.name}` : '  No schedule active right now'}</Text>
        </View>

        {schedules.map((schedule) => (
          <View key={schedule.id} style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { backgroundColor: theme.background }]}>
                <Ionicons name={schedule.icon as any} size={22} color={schedule.enabled ? theme.green : theme.subtext} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: theme.text }]}>{schedule.name}</Text>
                <View style={styles.timeRow}>
                  <TouchableOpacity style={[styles.timeBtn, { backgroundColor: theme.background }]} onPress={() => openTimePicker(schedule.id, 'start')}>
                    <Ionicons name="time-outline" size={14} color={theme.green} />
                    <Text style={[styles.timeText, { color: theme.text }]}> {schedule.startTime}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.timeSeparator, { color: theme.subtext }]}>→</Text>
                  <TouchableOpacity style={[styles.timeBtn, { backgroundColor: theme.background }]} onPress={() => openTimePicker(schedule.id, 'end')}>
                    <Ionicons name="time" size={14} color={theme.red} />
                    <Text style={[styles.timeText, { color: theme.text }]}> {schedule.endTime}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Switch value={schedule.enabled} onValueChange={() => toggleSchedule(schedule.id)} trackColor={{ false: '#555', true: theme.green }} thumbColor={schedule.enabled ? '#fff' : '#ccc'} />
            </View>

            <View style={styles.daysRow}>
              {DAYS.map((day, index) => (
                <TouchableOpacity key={index}
                  style={[styles.dayBadge, { backgroundColor: schedule.days.includes(index) ? theme.green : theme.background }]}
                  onPress={() => toggleDay(schedule.id, index)}>
                  <Text style={[styles.dayText, { color: schedule.days.includes(index) ? '#fff' : theme.subtext }]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={[styles.infoBox, { backgroundColor: theme.card }]}>
          <Ionicons name="information-circle" size={20} color={theme.green} />
          <Text style={[styles.infoText, { color: theme.subtext }]}>  Tap time to change it. Tap days to toggle. Enable switch to activate schedule.</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {showPicker && (
        <DateTimePicker value={pickerDate} mode="time" is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 30, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  activeBadge: { marginHorizontal: 20, marginBottom: 16, padding: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  activeBadgeText: { fontSize: 14, fontWeight: '600' },
  card: { marginHorizontal: 20, marginBottom: 14, borderRadius: 20, padding: 16, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  timeText: { fontSize: 13, fontWeight: '600' },
  timeSeparator: { fontSize: 14 },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  dayText: { fontSize: 11, fontWeight: '600' },
  infoBox: { marginHorizontal: 20, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'flex-start' },
  infoText: { fontSize: 13, lineHeight: 20, flex: 1 },
});