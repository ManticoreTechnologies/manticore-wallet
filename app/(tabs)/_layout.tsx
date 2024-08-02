/*
  Phoenix Campanile
  Manticore Technologies, LLC
  (c) 2024

  @/app/(tabs)/index.tsx
  This tab is the first one shown to the user.
  It should be simple yet informative.
*/

/* Imports */
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Tabs } from 'expo-router';
import React from 'react';
import ColorLogger from '@/components/ColorLogger';


// The layout of icons at the bottom of the app, the navbar if you will.
export default function TabLayout() {

  // Get the colorscheme we should use
  const colorScheme = useColorScheme();

  ColorLogger.log(["TabLayout", "yellow", "underscore"], [`Colorscheme is ${colorScheme}`, ])

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarActiveBackgroundColor: "#000",
        tabBarInactiveBackgroundColor: "#000"
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'wallet' : 'wallet-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="utxos"
        options={{
          title: 'UTXOs',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'cloud' : 'cloud-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="deltas"
        options={{
          title: 'Deltas',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'swap-vertical' : 'swap-vertical-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: 'Assets',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'briefcase' : 'briefcase-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
