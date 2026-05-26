import { Pressable } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/theme/useThemeColors';

export default function TabsLayout() {
  const colors = useThemeColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: 'transparent', height: 76, paddingTop: 8 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: '#FFFFFF',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color }) => <Ionicons name="home" color={color} size={30} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color }) => <Ionicons name="search-outline" color={color} size={32} /> }} />
      <Tabs.Screen
        name="create"
        options={{
          href: null,
          tabBarButton: () => (
            <Pressable onPress={() => router.push('/post/create')} style={{ height: 56, width: 70, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add-outline" color={colors.accent} size={42} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="notifications" options={{ title: 'Echoes', tabBarIcon: ({ color }) => <Ionicons name="bookmark-outline" color={color} size={31} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'My', tabBarIcon: ({ color }) => <Ionicons name="person-outline" color={color} size={31} /> }} />
    </Tabs>
  );
}
