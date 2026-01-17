import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Start',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>&#x1F3E0;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Kontakte',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>&#x1F465;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>&#x2699;</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    height: 85,
    paddingTop: 8,
    paddingBottom: 25,
  },
  tabBarLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
  tabIcon: {
    fontSize: 24,
  },
});
