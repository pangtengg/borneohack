import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'VoiceBridge',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} isActive={color === Colors.accent} />,
          headerTitle: '🌏 VoiceBridge',
        }}
      />
      <Tabs.Screen
        name="bridge"
        options={{
          title: 'Voice Bridge',
          tabBarLabel: 'Bridge',
          tabBarIcon: ({ color }) => <TabIcon icon="🎙️" color={color} isActive={color === Colors.accent} />,
        }}
      />
      <Tabs.Screen
        name="phrases"
        options={{
          title: 'Phrase Bank',
          tabBarLabel: 'Phrases',
          tabBarIcon: ({ color }) => <TabIcon icon="⚡" color={color} isActive={color === Colors.accent} />,
        }}
      />
      <Tabs.Screen
        name="dialect"
        options={{
          title: 'Dialect',
          tabBarLabel: 'Dialect',
          tabBarActiveTintColor: '#7C3AED',
          tabBarIcon: ({ color }) => <TabIcon icon="🗣️" color={color} isActive={color === '#7C3AED'} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} isActive={color === Colors.accent} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ icon, color, isActive }: { icon: string; color: string; isActive?: boolean }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22, opacity: isActive ? 1 : 0.5 }}>{icon}</Text>;
}
