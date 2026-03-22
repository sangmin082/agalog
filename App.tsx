import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatsScreen from './src/screens/StatsScreen';
import GrowthScreen from './src/screens/GrowthScreen';

const Tab = createBottomTabNavigator();

const PRIMARY = '#7C6FF7';
const INACTIVE = '#C5C9D6';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
      {focused && (
        <View style={{
          width: 5, height: 5, borderRadius: 3,
          backgroundColor: PRIMARY, marginTop: 3,
        }} />
      )}
    </View>
  );
}

export default function App() {
  const [refresh, setRefresh] = useState(0);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: PRIMARY,
            tabBarInactiveTintColor: INACTIVE,
            tabBarStyle: {
              paddingBottom: 10,
              paddingTop: 8,
              height: 72,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 0,
              shadowColor: '#1A1A2E',
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: -2 },
              shadowRadius: 16,
              elevation: 12,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              marginTop: 0,
            },
          }}
        >
          <Tab.Screen
            name="Home"
            options={{
              title: '홈',
              tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
            }}
          >
            {() => <HomeScreen onRecordAdded={() => setRefresh((n) => n + 1)} />}
          </Tab.Screen>
          <Tab.Screen
            name="History"
            options={{
              title: '기록',
              tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
            }}
          >
            {() => <HistoryScreen refresh={refresh} />}
          </Tab.Screen>
          <Tab.Screen
            name="Stats"
            options={{
              title: '분석',
              tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
            }}
          >
            {() => <StatsScreen refresh={refresh} />}
          </Tab.Screen>
          <Tab.Screen
            name="Growth"
            options={{
              title: '성장',
              tabBarIcon: ({ focused }) => <TabIcon emoji="📏" focused={focused} />,
            }}
          >
            {() => <GrowthScreen />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
