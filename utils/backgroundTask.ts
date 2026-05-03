import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

export const BACKGROUND_TASK = 'background-zone-check';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

TaskManager.defineTask(BACKGROUND_TASK, async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const saved = await AsyncStorage.getItem('customZones');
    const customZones = saved ? JSON.parse(saved) : [];

    const fallbackZones = [
      { id: 1, name: "Allied Hospital FSD", latitude: 31.4180, longitude: 73.0790, radius: 200 },
      { id: 2, name: "DHQ Hospital FSD", latitude: 31.4089, longitude: 73.0658, radius: 200 },
      { id: 3, name: "GC University FSD", latitude: 31.4180, longitude: 73.0791, radius: 150 },
      { id: 4, name: "Jamia Masjid FSD", latitude: 31.4154, longitude: 73.0797, radius: 150 },
    ];

    const allZones = [...fallbackZones, ...customZones];

    for (const zone of allZones) {
      const distance = getDistance(
        location.coords.latitude, location.coords.longitude,
        zone.latitude, zone.longitude
      );
      if (distance <= zone.radius) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔕 Quiet Zone Alert!',
            body: `You entered ${zone.name}. Please keep your phone silent 🔕`,
          },
          trigger: null,
        });
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (e) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTask() {
  try {
    await Notifications.requestPermissionsAsync();
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') return;

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK, {
        minimumInterval: 60 * 5,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch (e) {
    console.log('Background task error:', e);
  }
}