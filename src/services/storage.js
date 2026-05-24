import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USERS: '@ford_care/users',
  SESSION: '@ford_care/session',
  APPOINTMENTS: '@ford_care/appointments',
};

export async function getUsers() {
  const raw = await AsyncStorage.getItem(KEYS.USERS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveUsers(users) {
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export async function getSession() {
  const raw = await AsyncStorage.getItem(KEYS.SESSION);
  return raw ? JSON.parse(raw) : null;
}

export async function setSession(user) {
  if (user) {
    await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(KEYS.SESSION);
  }
}

export async function getAppointments() {
  const raw = await AsyncStorage.getItem(KEYS.APPOINTMENTS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveAppointments(list) {
  await AsyncStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(list));
}
