import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { opcoesAbas } from '@/theme/navegacao';

export default function LayoutAbas() {
  return (
    <Tabs screenOptions={opcoesAbas}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Fila do dia',
          tabBarLabel: 'Fila',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="resumo"
        options={{
          title: 'Resumo do dia',
          tabBarLabel: 'Resumo',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
