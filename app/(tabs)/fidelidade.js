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
import { getAppointments, saveAppointments } from '../../src/services/storage';
import { fetchDealerByCep } from '../../src/services/api';
import { getVehicleSummary } from '../../src/services/vinData';

const BENEFITS = [
  { id: '1', title: '10% em revisão', points: 500, desc: 'Concessionária parceira' },
  { id: '2', title: 'Lavagem grátis', points: 300, desc: 'Após 3 revisões' },
  { id: '3', title: 'Check-up digital', points: 150, desc: 'Diagnóstico remoto Ford' },
];

export default function FidelidadeScreen() {
  const { user } = useAuth();
  const summary = user?.vinHash ? getVehicleSummary(user.vinHash) : null;
  const points = summary?.loyaltyPoints ?? 0;

  const [cep, setCep] = useState('');
  const [dealer, setDealer] = useState(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  async function buscarConcessionaria() {
    setLoadingCep(true);
    try {
      const result = await fetchDealerByCep(cep);
      setDealer(result);
    } catch (e) {
      Alert.alert('CEP', e.message);
    } finally {
      setLoadingCep(false);
    }
  }

  async function agendarRevisao() {
    if (!date.trim()) {
      Alert.alert('Atenção', 'Informe a data desejada (ex: 15/06/2026).');
      return;
    }
    const list = await getAppointments();
    list.push({
      id: Date.now().toString(),
      userId: user.id,
      date: date.trim(),
      note: note.trim(),
      dealer: dealer?.label || 'A definir',
      createdAt: new Date().toISOString(),
    });
    await saveAppointments(list);
    Alert.alert('Agendado', 'Solicitação salva localmente. A concessionária entrará em contato.');
    setDate('');
    setNote('');
  }

  function resgatar(item) {
    if (points < item.points) {
      Alert.alert('Pontos insuficientes', `Você tem ${points} pts. Necessário: ${item.points}.`);
      return;
    }
    Alert.alert('Resgate simulado', `Benefício "${item.title}" reservado com sucesso!`);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.pointsLabel}>Saldo de fidelidade</Text>
        <Text style={styles.points}>{points} pontos</Text>
        <Text style={styles.tier}>Nível {summary?.tier ?? 'Bronze'}</Text>
      </Card>

      <Text style={styles.section}>Benefícios</Text>
      {BENEFITS.map((b) => (
        <Card key={b.id}>
          <Text style={styles.benefitTitle}>{b.title}</Text>
          <Text style={styles.benefitDesc}>{b.desc} · {b.points} pts</Text>
          <Button title="Resgatar" variant="outline" onPress={() => resgatar(b)} />
        </Card>
      ))}

      <Text style={styles.section}>Agendar revisão (local)</Text>
      <Card>
        <Input label="CEP da concessionária" value={cep} onChangeText={setCep} placeholder="00000-000" />
        <Button title="Buscar via ViaCEP (API)" onPress={buscarConcessionaria} loading={loadingCep} variant="outline" />
        {dealer ? (
          <Text style={styles.dealerInfo}>
            {dealer.label}
            {'\n'}
            {dealer.street}, {dealer.neighborhood} — {dealer.city}/{dealer.state}
          </Text>
        ) : null}
        <Input label="Data preferida" value={date} onChangeText={setDate} placeholder="DD/MM/AAAA" />
        <Input label="Observação" value={note} onChangeText={setNote} placeholder="Opcional" multiline />
        <Button title="Confirmar agendamento" onPress={agendarRevisao} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  pointsLabel: { color: colors.textMuted, fontSize: 14 },
  points: { fontSize: 36, fontWeight: '800', color: colors.primary },
  tier: { color: colors.primaryDark, fontWeight: '600', marginTop: 4 },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginVertical: spacing.md,
  },
  benefitTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  benefitDesc: { color: colors.textMuted, marginVertical: spacing.sm },
  dealerInfo: { color: colors.text, marginBottom: spacing.md, lineHeight: 22 },
});
