import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/theme/useThemeColors';

export default function TabsLayout() {
  const colors = useThemeColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Echoes', tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'My', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
