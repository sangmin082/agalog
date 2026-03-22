import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatsScreen from './src/screens/StatsScreen';
import GrowthScreen from './src/screens/GrowthScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import { getAuthUser, AuthUser } from './src/storage/auth';
import { DS } from './src/theme';

const Tab = createBottomTabNavigator();

type TabIconName = 'home' | 'home-outline' | 'list' | 'list-outline' | 'bar-chart' | 'bar-chart-outline' | 'trending-up' | 'trending-up-outline';

function MainApp({ onLogout }: { onLogout: () => void }) {
  const [refresh, setRefresh] = useState(0);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: DS.primary,
          tabBarInactiveTintColor: DS.textLight,
          tabBarStyle: {
            paddingBottom: 10,
            paddingTop: 8,
            height: 72,
            backgroundColor: DS.surface,
            borderTopWidth: 1,
            borderTopColor: DS.border,
            shadowOpacity: 0,
            elevation: 0,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 0 },
        }}
      >
        <Tab.Screen
          name="Home"
          options={{
            title: '홈',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            ),
          }}
        >
          {() => <HomeScreen onRecordAdded={() => setRefresh((n) => n + 1)} />}
        </Tab.Screen>
        <Tab.Screen
          name="History"
          options={{
            title: '기록',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'list' : 'list-outline'} size={22} color={color} />
            ),
          }}
        >
          {() => <HistoryScreen refresh={refresh} />}
        </Tab.Screen>
        <Tab.Screen
          name="Stats"
          options={{
            title: '분석',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={22} color={color} />
            ),
          }}
        >
          {() => <StatsScreen refresh={refresh} />}
        </Tab.Screen>
        <Tab.Screen
          name="Growth"
          options={{
            title: '성장',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={22} color={color} />
            ),
          }}
        >
          {() => <GrowthScreen />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null | undefined>(undefined);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    getAuthUser().then((u) => setAuthUser(u));
  }, []);

  function handleAuth() {
    getAuthUser().then((u) => setAuthUser(u));
  }

  // Loading
  if (authUser === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: DS.bg }}>
        <ActivityIndicator size="large" color={DS.primary} />
      </View>
    );
  }

  // Not logged in
  if (!authUser) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {authView === 'login' ? (
          <LoginScreen onLogin={handleAuth} onGoSignup={() => setAuthView('signup')} />
        ) : (
          <SignupScreen onSignup={handleAuth} onGoLogin={() => setAuthView('login')} />
        )}
      </SafeAreaProvider>
    );
  }

  // Logged in
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <MainApp onLogout={() => setAuthUser(null)} />
    </SafeAreaProvider>
  );
}
