import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { colors, spacing } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { findByVinHash, searchRecords } from '../../src/services/vinData';

function ServiceItem({ item }) {
  return (
    <Card>
      <Text style={styles.order}>OS #{item.ServiceOrder}</Text>
      <Text style={styles.type}>{item.ServiceType}</Text>
      <Text style={styles.date}>{item.ServiceDate}</Text>
      <Text style={styles.detail}>
        {item.MainSource} · Dealer {item.DealerCode}
      </Text>
      <Text style={styles.status}>{item.StatusUSA}</Text>
      {item.MaintenanceNumber ? (
        <Text style={styles.detail}>Revisão nº {item.MaintenanceNumber}</Text>
      ) : null}
    </Card>
  );
}

export default function HistoricoScreen() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const data = useMemo(() => {
    if (user?.vinHash) return findByVinHash(user.vinHash);
    if (query.trim()) return searchRecords(query).slice(0, 30);
    return [];
  }, [user?.vinHash, query]);

  return (
    <View style={styles.screen}>
      {!user?.vinHash && (
        <View style={styles.search}>
          <Input
            label="Buscar na base Ford"
            value={query}
            onChangeText={setQuery}
            placeholder="VIN_Hash, modelo ou dealer"
            hint="Vincule o VIN no Perfil ou busque manualmente"
          />
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(item, i) =>
          `${item.MaintenanceID}-${item.ServiceOrder}-${i}`
        }
        renderItem={({ item }) => <ServiceItem item={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {user?.vinHash
              ? 'Nenhum serviço encontrado para este VIN_Hash.'
              : 'Digite um termo para buscar ou cadastre seu VIN_Hash.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  search: { padding: spacing.md, paddingBottom: 0 },
  list: { padding: spacing.md },
  order: { fontWeight: '800', color: colors.primaryDark, fontSize: 16 },
  type: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 4 },
  date: { color: colors.primary, marginTop: 4, fontWeight: '600' },
  detail: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  status: { color: colors.success, fontSize: 12, marginTop: 6, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
