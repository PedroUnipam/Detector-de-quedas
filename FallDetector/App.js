import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Importações das telas (vamos criar em seguida)
import HomeScreen from './src/screens/HomeScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import DeviceScreen from './src/screens/DeviceScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AdminScreen from './src/screens/AdminScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Tela temporária para testar
function TemporaryScreen({ title }) {
  return (
    <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <h1>{title}</h1>
      <p>Tela em desenvolvimento</p>
    </div>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Início') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Contatos') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Dispositivo') {
              iconName = focused ? 'watch' : 'watch-outline';
            } else if (route.name === 'Histórico') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'Admin') {
              iconName = focused ? 'shield' : 'shield-outline';
            } else if (route.name === 'Ajustes') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen name="Início" component={HomeScreen} />
        <Tab.Screen name="Contatos" component={ContactsScreen} />
        <Tab.Screen name="Dispositivo" component={DeviceScreen} />
        <Tab.Screen name="Histórico" component={HistoryScreen} />
        <Tab.Screen name="Admin" component={AdminScreen} />
        <Tab.Screen name="Ajustes" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}