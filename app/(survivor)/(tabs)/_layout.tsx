import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../../constants/colors';
import { useT } from '@/lib/i18n';

export default function SurvivorTabLayout() {
  const t = useT();

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
          tabBarLabel: t('tab.home'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, opacity: color === Colors.accent ? 1 : 0.5 }}>🏠</Text>,
          headerTitle: '🌏 VoiceBridge',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab.profile'),
          tabBarLabel: t('tab.profile'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, opacity: color === Colors.accent ? 1 : 0.5 }}>👤</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tab.settings'),
          tabBarLabel: t('tab.settings'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, opacity: color === Colors.accent ? 1 : 0.5 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
