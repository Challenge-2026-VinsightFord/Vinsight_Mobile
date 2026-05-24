import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card } from '../../src/components/Card';
import { colors, spacing } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { fetchFordRecalls } from '../../src/services/api';
import { getDatabaseMeta, getVehicleSummary } from '../../src/services/vinData';

export default function HomeScreen() {
  const { user } = useAuth();
  const [recalls, setRecalls] = useState([]);
  const [loadingRecalls, setLoadingRecalls] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const summary = user?.vinHash ? getVehicleSummary(user.vinHash) : null;
  const meta = getDatabaseMeta();

  const loadRecalls = useCallback(async () => {
    if (!summary?.modelName) return;
    setLoadingRecalls(true);
    try {
      const data = await fetchFordRecalls(summary.modelYear, summary.modelName);
      setRecalls(data);
    } catch {
      setRecalls([]);
    } finally {
      setLoadingRecalls(false);
    }
  }, [summary?.modelName, summary?.modelYear]);

  useEffect(() => {
    loadRecalls();
  }, [loadRecalls]);

  async function onRefresh() {
    setRefreshing(true);
    await loadRecalls();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}!</Text>
      <Text style={styles.tagline}>
        Programa de retenção pós-venda Ford — Desafio 2
      </Text>

      {summary ? (
        <Card>
          <Text style={styles.cardTitle}>Seu veículo</Text>
          <Text style={styles.vehicle}>
            {summary.modelName} {summary.modelYear}
          </Text>
          <View style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{summary.tier}</Text>
            </View>
            <Text style={styles.points}>{summary.loyaltyPoints} pts</Text>
          </View>
          <Text style={styles.meta}>
            {summary.totalServices} serviços · Último: {summary.lastServiceDate}
          </Text>
          <Text style={styles.meta}>KM: {summary.km || '—'} · Dealer {summary.dealerCode}</Text>
        </Card>
      ) : (
        <Card>
          <Text style={styles.cardTitle}>Vincule seu veículo</Text>
          <Text style={styles.meta}>
            Adicione o VIN_Hash no Perfil para ver dados da base Ford (
            {meta.sampleSize} registros na amostra / {meta.totalInFile.toLocaleString()}{' '}
            no dataset completo).
          </Text>
        </Card>
      )}

      <Card>
        <Text style={styles.cardTitle}>Recalls NHTSA (API externa)</Text>
        <Text style={styles.meta}>
          Consulta automática para Ford {summary?.modelName || '—'}
        </Text>
        {loadingRecalls ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
        ) : recalls.length ? (
          recalls.map((r) => (
            <View key={r.id} style={styles.recallItem}>
              <Text style={styles.recallTitle}>{r.component}</Text>
              <Text style={styles.recallText} numberOfLines={3}>
                {r.summary}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.meta}>Nenhum recall encontrado ou modelo indisponível.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text },
  tagline: { color: colors.textMuted, marginBottom: spacing.md },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  vehicle: { fontSize: 20, fontWeight: '600', color: colors.primaryDark },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.sm, gap: 12 },
  badge: {
    backgroundColor: colors.lightBlue,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: colors.primaryDark, fontWeight: '700' },
  points: { fontSize: 22, fontWeight: '800', color: colors.primary },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4, lineHeight: 20 },
  recallItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  recallTitle: { fontWeight: '700', color: colors.text, fontSize: 14 },
  recallText: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
});
