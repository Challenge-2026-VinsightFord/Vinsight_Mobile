import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ErroApi, type FaixaRisco, type ItemFila } from '@/api';
import leadsExemplo from '@/api/mock/dados/leads.json';
import {
  Botao,
  CampoTexto,
  Cartao,
  CartaoLead,
  Chip,
  ChipPerfil,
  ChipRisco,
  ChipStatusLead,
  EstadoCarregando,
  EstadoErro,
  EstadoVazio,
  MedidorScore,
  Tela,
  Texto,
} from '@/components';
import { faixaRisco, perfilComportamental, statusLead } from '@/dominio/apresentacao';
import { cores, espaco, raio, tamanho, tipografia, type VarianteTexto } from '@/theme';

/**
 * Vitrine do design system (US-44): todos os componentes e estados num só lugar, consumindo
 * apenas o tema. Serve de referência para as telas e de evidência visual no README.
 */

const leads = leadsExemplo as unknown as ItemFila[];
const exemplos = [leads.find((l) => l.faixaRisco === 'ALTO'), leads.find((l) => l.faixaRisco === 'MEDIO')].filter(
  (l): l is ItemFila => !!l,
);

const coresExibidas: (keyof typeof cores)[] = [
  'primaria',
  'primariaEscura',
  'destaque',
  'primariaSuave',
  'fundo',
  'superficie',
  'borda',
  'texto',
  'textoSecundario',
  'textoSuave',
  'perigo',
  'alerta',
  'sucesso',
  'info',
];

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={estilos.secao}>
      <Texto variante="rotulo" cor="textoSuave" style={estilos.tituloSecao}>
        {titulo}
      </Texto>
      {children}
    </View>
  );
}

export default function Catalogo() {
  const [filtro, setFiltro] = useState<FaixaRisco | null>('ALTO');
  const [carregando, setCarregando] = useState(false);

  return (
    <Tela rolavel>
      <Secao titulo="Cores">
        <View style={estilos.grade}>
          {coresExibidas.map((nome) => (
            <View key={nome} style={estilos.amostra}>
              <View style={[estilos.cor, { backgroundColor: cores[nome] }]} />
              <Texto variante="legenda" numberOfLines={1}>
                {nome}
              </Texto>
            </View>
          ))}
        </View>
      </Secao>

      <Secao titulo="Tipografia">
        <Cartao style={estilos.pilha}>
          {(Object.keys(tipografia) as VarianteTexto[]).map((v) => (
            <Texto key={v} variante={v}>
              {v} — Ranger XLT 3.2
            </Texto>
          ))}
        </Cartao>
      </Secao>

      <Secao titulo="Botões">
        <View style={estilos.pilha}>
          <Botao titulo="Entrar" onPress={() => {}} />
          <Botao titulo="Ligar para o cliente" icone="call" variante="secundario" onPress={() => {}} />
          <Botao titulo="Ver histórico completo" variante="fantasma" onPress={() => {}} />
          <Botao titulo="Encerrar sessão" icone="log-out" variante="perigo" onPress={() => {}} />
          <View style={estilos.linha}>
            <Botao
              titulo="Carregar"
              compacto
              carregando={carregando}
              onPress={() => {
                setCarregando(true);
                setTimeout(() => setCarregando(false), 1500);
              }}
            />
            <Botao titulo="Desabilitado" compacto desabilitado onPress={() => {}} />
          </View>
        </View>
      </Secao>

      <Secao titulo="Campos">
        <CampoTexto rotulo="E-mail" icone="mail" placeholder="consultor@ford.com.br" keyboardType="email-address" />
        <CampoTexto rotulo="Senha" icone="lock-closed" senha defaultValue="consultor123" />
        <CampoTexto rotulo="Observação" dica="Opcional. Aparece no histórico do lead." multiline />
        <CampoTexto rotulo="Próximo contato" icone="calendar" defaultValue="2026-01-01" erro="deve ser uma data presente ou futura" />
      </Secao>

      <Secao titulo="Chips">
        <View style={estilos.linhaQuebra}>
          {(Object.keys(faixaRisco) as FaixaRisco[]).map((f) => (
            <ChipRisco key={f} faixa={f} />
          ))}
        </View>
        <View style={estilos.linhaQuebra}>
          {(Object.keys(perfilComportamental) as (keyof typeof perfilComportamental)[]).map((p) => (
            <ChipPerfil key={p} perfil={p} />
          ))}
        </View>
        <View style={estilos.linhaQuebra}>
          {(Object.keys(statusLead) as (keyof typeof statusLead)[]).map((s) => (
            <ChipStatusLead key={s} status={s} />
          ))}
        </View>
        <Texto variante="legenda" cor="textoSuave">
          Filtro (tocável):
        </Texto>
        <View style={estilos.linhaQuebra}>
          <Chip rotulo="Todos" selecionado={filtro === null} onPress={() => setFiltro(null)} />
          {(Object.keys(faixaRisco) as FaixaRisco[]).map((f) => (
            <Chip
              key={f}
              rotulo={faixaRisco[f].rotulo}
              icone={faixaRisco[f].icone}
              selecionado={filtro === f}
              onPress={() => setFiltro(f)}
            />
          ))}
        </View>
      </Secao>

      <Secao titulo="Score de propensão">
        <View style={estilos.linha}>
          <MedidorScore score={0.87} faixa="ALTO" />
          <MedidorScore score={0.53} faixa="MEDIO" />
          <MedidorScore score={0.18} faixa="BAIXO" />
          <MedidorScore score={0.87} faixa="ALTO" tamanho="destaque" />
        </View>
      </Secao>

      <Secao titulo="Cartão de lead">
        <View style={estilos.pilha}>
          {exemplos.map((lead) => (
            <CartaoLead key={lead.id} lead={lead} onPress={() => {}} />
          ))}
        </View>
      </Secao>

      <Secao titulo="Estados">
        <Cartao style={estilos.estado}>
          <EstadoCarregando mensagem="Carregando a fila…" />
        </Cartao>
        <Cartao style={estilos.estado}>
          <EstadoVazio
            icone="checkmark-done-circle"
            titulo="Fila zerada"
            mensagem="Nenhum lead com risco alto agora. Experimente outro filtro."
            acao={{ titulo: 'Limpar filtros', onPress: () => {} }}
          />
        </Cartao>
        <Cartao style={estilos.estado}>
          <EstadoErro erro={ErroApi.local('sem-conexao', 'Sem conexão')} onTentarNovamente={() => {}} />
        </Cartao>
        <Cartao style={estilos.estado}>
          <EstadoErro
            erro={
              new ErroApi({
                status: 403,
                codigo: 'outra-concessionaria',
                mensagem: 'Registro de outra concessionária',
                correlationId: 'd76270af-d785-49dc-bd33-8a9feb28ff5d',
              })
            }
          />
        </Cartao>
      </Secao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  secao: { marginBottom: espaco.xxl, gap: espaco.md },
  tituloSecao: { marginBottom: espaco.xs },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.md },
  amostra: { width: tamanho.medidorScore.destaque * 0.8, gap: espaco.xs },
  cor: { height: tamanho.alvoToque, borderRadius: raio.md, borderWidth: 1, borderColor: cores.borda },
  pilha: { gap: espaco.md },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, flexWrap: 'wrap' },
  linhaQuebra: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  estado: { padding: 0 },
});
