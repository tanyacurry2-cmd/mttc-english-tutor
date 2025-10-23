import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "flashcards_viewed_ids";

export async function loadViewedIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(KEY);
  return new Set(raw ? JSON.parse(raw) as string[] : []);
}

export async function saveViewedIds(ids: Set<string>) {
  await AsyncStorage.setItem(KEY, JSON.stringify(Array.from(ids)));
}
