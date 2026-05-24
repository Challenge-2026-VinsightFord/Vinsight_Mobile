import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { colors, spacing } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { getAppointments } from '../../src/services/storage';
import { getDatabaseMeta, getSampleVinHashes } from '../../src/services/vinData';

export default function PerfilScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [vinHash, setVinHash] = useState(user?.vinHash || '');
  const [saving, setSaving] = useState(false);

  const meta = getDatabaseMeta();
  const samples = getSampleVinHashes(2);

  async function salvarVin() {
    setSaving(true);
    try {
      await updateProfile({ vinHash: vinHash.trim() });
      Alert.alert('Sucesso', 'VIN_Hash atualizado.');
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function verAgendamentos() {
    const all = await getAppointments();
    const mine = all.filter((a) => a.userId === user?.id);
    if (!mine.length) {
      Alert.alert('Agendamentos', 'Nenhum agendamento salvo.');
      return;
    }
    Alert.alert(
      'Agendamentos',
      mine.map((a) => `${a.date} — ${a.dealer}`).join('\n')
    );
  }

  async function sair() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </Card>

      <Card>
        <Text style={styles.section}>VIN_Hash (base Ford)</Text>
        <Input
          value={vinHash}
          onChangeText={setVinHash}
          placeholder="Cole o hash do dataset"
          hint={`Fonte: ${meta.source}\nEx: ${samples[0]?.vinHash?.slice(0, 20)}...`}
          multiline
        />
        <Button title="Salvar VIN" onPress={salvarVin} loading={saving} />
      </Card>

      <Card>
        <Text style={styles.section}>Dados locais</Text>
        <Text style={styles.meta}>
          Usuários e sessão: AsyncStorage{'\n'}
          Base veículos: {meta.sampleSize} registros (amostra do Excel com{' '}
          {meta.totalInFile.toLocaleString()} linhas)
        </Text>
        <Button title="Ver meus agendamentos" variant="outline" onPress={verAgendamentos} />
      </Card>

      <Button title="Sair da conta" onPress={sair} variant="outline" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  email: { color: colors.textMuted, marginTop: 4 },
  section: { fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  meta: { color: colors.textMuted, lineHeight: 22, fontSize: 13 },
});
