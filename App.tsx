import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatsScreen from './src/screens/StatsScreen';
import GrowthScreen from './src/screens/GrowthScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [refresh, setRefresh] = useState(0);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#748FFC',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: { paddingBottom: 8, height: 60 },
          }}
        >
          <Tab.Screen
            name="Home"
            options={{ title: '홈', tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text> }}
          >
            {() => <HomeScreen onRecordAdded={() => setRefresh((n) => n + 1)} />}
          </Tab.Screen>
          <Tab.Screen
            name="History"
            options={{ title: '기록', tabBarIcon: () => <Text style={{ fontSize: 22 }}>📋</Text> }}
          >
            {() => <HistoryScreen refresh={refresh} />}
          </Tab.Screen>
          <Tab.Screen
            name="Stats"
            options={{ title: '분석', tabBarIcon: () => <Text style={{ fontSize: 22 }}>📊</Text> }}
          >
            {() => <StatsScreen refresh={refresh} />}
          </Tab.Screen>
          <Tab.Screen
            name="Growth"
            options={{ title: '성장', tabBarIcon: () => <Text style={{ fontSize: 22 }}>📏</Text> }}
          >
            {() => <GrowthScreen />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
