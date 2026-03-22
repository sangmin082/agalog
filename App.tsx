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

const PRIMARY = '#6C5CE7';
const INACTIVE = '#B2BEC3';

export default function App() {
  const [refresh, setRefresh] = useState(0);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: PRIMARY,
            tabBarInactiveTintColor: INACTIVE,
            tabBarStyle: {
              paddingBottom: 8,
              paddingTop: 6,
              height: 64,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 0,
              shadowColor: '#6C5CE7',
              shadowOpacity: 0.10,
              shadowRadius: 16,
              elevation: 12,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '700',
              marginTop: 1,
            },
          }}
        >
          <Tab.Screen
            name="Home"
            options={{
              title: '홈',
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>🏠</Text>
              ),
            }}
          >
            {() => <HomeScreen onRecordAdded={() => setRefresh((n) => n + 1)} />}
          </Tab.Screen>
          <Tab.Screen
            name="History"
            options={{
              title: '기록',
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>📋</Text>
              ),
            }}
          >
            {() => <HistoryScreen refresh={refresh} />}
          </Tab.Screen>
          <Tab.Screen
            name="Stats"
            options={{
              title: '분석',
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>📊</Text>
              ),
            }}
          >
            {() => <StatsScreen refresh={refresh} />}
          </Tab.Screen>
          <Tab.Screen
            name="Growth"
            options={{
              title: '성장',
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>📏</Text>
              ),
            }}
          >
            {() => <GrowthScreen />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
