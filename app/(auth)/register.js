import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { colors, spacing } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { getSampleVinHashes } from '../../src/services/vinData';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vinHash, setVinHash] = useState('');
  const [loading, setLoading] = useState(false);

  const samples = getSampleVinHashes(3);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || password.length < 4) {
      Alert.alert('Atenção', 'Preencha nome, e-mail e senha (mín. 4 caracteres).');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, vinHash });
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.desc}>
          Vincule seu VIN_Hash (dados Ford) para ver histórico de serviços e
          pontos de fidelidade.
        </Text>

        <Input label="Nome completo" value={name} onChangeText={setName} placeholder="Seu nome" autoCapitalize="words" />
        <Input label="E-mail" value={email} onChangeText={setEmail} placeholder="seu@email.com" />
        <Input label="Senha" value={password} onChangeText={setPassword} placeholder="Mínimo 4 caracteres" secureTextEntry />
        <Input
          label="VIN_Hash (opcional)"
          value={vinHash}
          onChangeText={setVinHash}
          placeholder="Hash do veículo na base Ford"
          hint="Toque em um exemplo da base Ford:"
          multiline
        />
        <View style={styles.samples}>
          {samples.map((s) => (
            <Pressable
              key={s.vinHash}
              style={styles.chip}
              onPress={() => setVinHash(s.vinHash)}
            >
              <Text style={styles.chipText}>{s.model}</Text>
            </Pressable>
          ))}
        </View>

        <Button title="Cadastrar" onPress={handleRegister} loading={loading} />
        <Text style={styles.footer}>
          Já tem conta?{' '}
          <Link href="/(auth)/login" style={styles.link}>
            Entrar
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  desc: { color: colors.textMuted, marginVertical: spacing.md, lineHeight: 22 },
  footer: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.lg },
  link: { color: colors.primary, fontWeight: '700' },
  samples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: {
    backgroundColor: colors.lightBlue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontSize: 12, color: colors.primaryDark, fontWeight: '600' },
});
