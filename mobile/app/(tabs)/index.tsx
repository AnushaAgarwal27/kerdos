import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import CreditCard, { type CreditCard as CreditCardType } from '@/components/CreditCard';
import FadeIn from '@/components/FadeIn';
import MarketTicker from '@/components/MarketTicker';
import { COLORS } from '@/constants/theme';
import { USER_CARDS } from '@/lib/userCards';
import { API_BASE } from '@/lib/apiConfig';
import { setLinkedCards, getLinkedCardIds, type LinkedCardMapping } from '@/lib/linkedCards';

const INDEX_CARDS = [
  { label: 'DJIA',    value: '40,657', change: '+26.00', pct: '+0.37%', up: true  },
  { label: 'NASDAQ',  value: '18,657', change: '-4.12',  pct: '-0.02%', up: false },
  { label: 'S&P 500', value: '5,657',  change: '+41.25', pct: '+0.73%', up: true  },
];

const NEWS = [
  { id: '1', source: 'REUTERS',  time: '2m',  headline: 'US STOCKS — Slide In Growth Stocks Pummel Nasdaq, Powell Testimony In Focus As Rate Outlook Shifts', tickers: [{ t: 'MSFT', v: -1.25 }, { t: 'AAPL', v: 1.25 }] },
  { id: '2', source: 'BENZINGA', time: '12m', headline: 'Aggressive Pivot Toward AI Hardware Prompts Supply Chain Concerns — Financial Times', tickers: [{ t: 'NVDA', v: 2.10 }, { t: 'AMD', v: -0.85 }] },
  { id: '3', source: 'REUTERS',  time: '33m', headline: 'Fed Signals Fewer Rate Cuts As Inflation Remains Stubborn Above 2% Target', tickers: [{ t: 'SPY', v: -0.73 }, { t: 'BND', v: 0.11 }] },
];

const QUICK_ACTIONS = [
  { href: '/(tabs)/smartswipe',  label: 'SmartSwipe', emoji: '💳' },
  { href: '/(tabs)/rewardvest',  label: 'Invest',     emoji: '📈' },
  { href: '/(tabs)/wealthsplit', label: 'Summary',    emoji: '⚖️'  },
];

const CATEGORY_ICONS: Record<string, string> = {
  dining: '🍽️', groceries: '🛒', travel: '✈️', gas: '⛽', entertainment: '🎬', other: '🛍️',
};

const RECENT_TRANSACTIONS = [
  { id: 't1', cardId: 'amex-gold',      merchant: 'Nobu Malibu',    date: 'Today',     category: 'dining',        amount: 284.50, cashback: 14.22 },
  { id: 't2', cardId: 'chase-sapphire', merchant: 'Whole Foods',    date: 'Yesterday', category: 'groceries',     amount: 93.40,  cashback: 2.80  },
  { id: 't3', cardId: 'amex-gold',      merchant: 'Delta Airlines', date: 'Apr 8',     category: 'travel',        amount: 540.00, cashback: 16.20 },
  { id: 't4', cardId: 'citi-double',    merchant: 'Shell Gas',      date: 'Apr 7',     category: 'gas',           amount: 68.00,  cashback: 1.36  },
  { id: 't5', cardId: 'discover-it',    merchant: 'Netflix',        date: 'Apr 6',     category: 'entertainment', amount: 22.99,  cashback: 1.38  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [cards, setCards]           = useState<CreditCardType[]>([]);
  const [linkedCardIds, setLinkedCardIds_] = useState<string[] | null>(null);
  const [newsTab, setNewsTab]       = useState<'top' | 'portfolio'>('top');

  useEffect(() => {
    fetch(`${API_BASE}/api/rewards`)
      .then(r => r.json())
      .then((apiCards: any[]) => {
        setCards(apiCards.map(c => ({
          id: c.id, issuer: c.cardIssuer ?? c.id, name: c.cardName ?? c.id,
          last4: USER_CARDS[c.id]?.last4 ?? '0000',
          network: c.cardNetwork ?? '',
          color: USER_CARDS[c.id]?.color ?? 'other',
        })));
      })
      .catch(() => {});
    getLinkedCardIds().then(setLinkedCardIds_);
  }, []);

  const handleConnectPlaid = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await WebBrowser.openAuthSessionAsync(`${API_BASE}/plaid-link`, 'cardiq://');
    if (result.type === 'success') {
      const parsed = Linking.parse(result.url);
      const param = parsed.queryParams?.cardIds;
      const cardIds = typeof param === 'string' && param ? param.split(',') : [];
      if (cardIds.length > 0) {
        const mappings: LinkedCardMapping[] = cardIds.map(id => ({
          plaidAccountId: id, plaidName: id, plaidMask: '0000', cardId: id,
        }));
        await setLinkedCards(mappings);
        setLinkedCardIds_(cardIds);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const totalPoints   = Object.values(USER_CARDS).reduce((s, c) => s + c.pointsBalance, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={styles.avatar}><Text style={styles.avatarText}>K</Text></View>
            <Text style={styles.brand}>Kerdos</Text>
          </View>
          <View style={styles.topRight}>
            <Text style={styles.topIcon}>🔍</Text>
            <Text style={styles.topIcon}>🔔</Text>
            <Text style={styles.topIcon}>👤</Text>
          </View>
        </View>

        {/* Market ticker bar */}
        <MarketTicker />

        <View style={styles.body}>

          {/* Market index cards */}
          <FadeIn delay={0}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Markets open</Text>
              <Pressable onPress={() => router.push('/(tabs)/wealthsplit' as any)}>
                <Text style={styles.linkText}>View all →</Text>
              </Pressable>
            </View>
            <View style={styles.indexGrid}>
              {INDEX_CARDS.map(idx => (
                <View key={idx.label} style={styles.indexCard}>
                  <View style={styles.dotRow}>
                    <View style={[styles.dot, { backgroundColor: idx.up ? COLORS.green : COLORS.red }]} />
                    <Text style={styles.indexLabel}>{idx.label}</Text>
                  </View>
                  <Text style={styles.indexValue}>{idx.value}</Text>
                  <Text style={[styles.indexChange, { color: idx.up ? COLORS.green : COLORS.red }]}>
                    {idx.change} ({idx.pct})
                  </Text>
                </View>
              ))}
            </View>
          </FadeIn>

          {/* Quick actions */}
          <FadeIn delay={60}>
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map(a => (
                <Pressable
                  key={a.href}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(a.href as any); }}
                  style={styles.quickCard}
                >
                  <Text style={styles.quickEmoji}>{a.emoji}</Text>
                  <Text style={styles.quickLabel}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          </FadeIn>

          {/* Rewards snapshot */}
          <FadeIn delay={100}>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Rewards This Month</Text>
                <Pressable onPress={() => router.push('/(tabs)/wealthsplit' as any)}>
                  <Text style={styles.linkText}>Details</Text>
                </Pressable>
              </View>
              <View style={styles.rewardsRow}>
                {[
                  { label: 'Cashback', value: '$340' },
                  { label: 'Points',   value: `${(totalPoints / 1000).toFixed(0)}K` },
                  { label: 'Net Gain', value: '$847' },
                ].map(s => (
                  <View key={s.label}>
                    <Text style={styles.rewardValue}>{s.value}</Text>
                    <Text style={styles.rewardLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeIn>

          {/* Cards header */}
          <FadeIn delay={140}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Your Cards</Text>
              <Pressable onPress={handleConnectPlaid} style={styles.connectBtn}>
                <Text style={styles.connectText}>+ Connect</Text>
              </Pressable>
            </View>
            {linkedCardIds && (
              <Text style={styles.linkedNote}>
                {linkedCardIds.length} card{linkedCardIds.length !== 1 ? 's' : ''} linked via Plaid
              </Text>
            )}
          </FadeIn>
        </View>

        {/* Cards carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardScroll}>
          {cards.map(card => <CreditCard key={card.id} card={card} width={200} />)}
        </ScrollView>

        <View style={styles.body}>

          {/* Recent transactions */}
          <FadeIn delay={180}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent</Text>
              {RECENT_TRANSACTIONS.map((tx, i) => {
                const card = cards.find(c => c.id === tx.cardId);
                return (
                  <View key={tx.id} style={[styles.txRow, i === 0 && { borderTopWidth: 0 }]}>
                    <View style={styles.txIcon}>
                      <Text style={styles.txEmoji}>{CATEGORY_ICONS[tx.category]}</Text>
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txMerchant}>{tx.merchant}</Text>
                      <Text style={styles.txMeta}>{tx.date} · {card?.name ?? tx.cardId}</Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={styles.txAmount}>-${tx.amount.toFixed(2)}</Text>
                      <Text style={styles.txCashback}>+${tx.cashback.toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </FadeIn>

          {/* News */}
          <FadeIn delay={220}>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>News</Text>
                <Text style={styles.linkText}>More topics →</Text>
              </View>
              <View style={styles.segment}>
                <Pressable
                  onPress={() => setNewsTab('top')}
                  style={[styles.segBtn, newsTab === 'top' && styles.segBtnActive]}
                >
                  <Text style={[styles.segText, newsTab === 'top' && styles.segTextActive]}>Top News</Text>
                </Pressable>
                <Pressable
                  onPress={() => setNewsTab('portfolio')}
                  style={[styles.segBtn, newsTab === 'portfolio' && styles.segBtnActive]}
                >
                  <Text style={[styles.segText, newsTab === 'portfolio' && styles.segTextActive]}>Portfolio</Text>
                </Pressable>
              </View>
              {NEWS.map((item, i) => (
                <View key={item.id} style={[styles.newsItem, i === 0 && { borderTopWidth: 0 }]}>
                  <Text style={styles.newsMeta}>{item.source} · {item.time}</Text>
                  <Text style={styles.newsHeadline}>{item.headline}</Text>
                  <View style={styles.tickerRow}>
                    {item.tickers.map(tk => (
                      <View key={tk.t} style={styles.tickerTag}>
                        <Text style={[styles.tickerText, { color: tk.v >= 0 ? COLORS.green : COLORS.red }]}>
                          {tk.t} {tk.v >= 0 ? '+' : ''}{tk.v.toFixed(2)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </FadeIn>

          {/* Planning card */}
          <FadeIn delay={260}>
            <Pressable
              onPress={() => router.push('/(tabs)/wealthsplit' as any)}
              style={styles.planningCard}
            >
              <Text style={styles.cardTitle}>Planning</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </FadeIn>

        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  scroll:  { flex: 1 },
  content: { paddingBottom: 20 },

  topBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  topLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar:   { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#000' },
  brand:    { fontSize: 16, fontWeight: '700', color: '#fff' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  topIcon:  { fontSize: 17 },

  body:         { paddingHorizontal: 16, paddingTop: 14, gap: 14 },
  rowBetween:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  linkText:     { fontSize: 12, color: COLORS.green, fontWeight: '600' },

  indexGrid:   { flexDirection: 'row', gap: 8 },
  indexCard:   { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.border, gap: 3 },
  dotRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  dot:         { width: 6, height: 6, borderRadius: 3 },
  indexLabel:  { fontSize: 9, fontWeight: '700', color: COLORS.textSecondary },
  indexValue:  { fontSize: 12, fontWeight: '800', color: '#fff' },
  indexChange: { fontSize: 9, fontWeight: '600' },

  quickGrid: { flexDirection: 'row', gap: 8 },
  quickCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border },
  quickEmoji: { fontSize: 22 },
  quickLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },

  card:       { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  cardTitle:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  rewardsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rewardValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  rewardLabel: { fontSize: 9, color: COLORS.textSecondary, marginTop: 3 },

  connectBtn:  { borderWidth: 1, borderColor: COLORS.green, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  connectText: { fontSize: 11, color: COLORS.green, fontWeight: '700' },
  linkedNote:  { fontSize: 11, color: COLORS.textSecondary, marginTop: -8 },

  cardScroll: { paddingHorizontal: 16, gap: 12, paddingVertical: 8 },

  txRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  txIcon:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  txEmoji:    { fontSize: 16 },
  txInfo:     { flex: 1 },
  txMerchant: { fontSize: 13, fontWeight: '600', color: '#fff' },
  txMeta:     { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  txRight:    { alignItems: 'flex-end' },
  txAmount:   { fontSize: 12, fontWeight: '600', color: '#fff' },
  txCashback: { fontSize: 10, color: COLORS.green, marginTop: 1 },

  segment:        { flexDirection: 'row', backgroundColor: COLORS.bgCard2, borderRadius: 8, padding: 2 },
  segBtn:         { flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: 'center' },
  segBtnActive:   { backgroundColor: COLORS.border },
  segText:        { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  segTextActive:  { color: '#fff' },

  newsItem:     { gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  newsMeta:     { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  newsHeadline: { fontSize: 13, color: '#fff', lineHeight: 18 },
  tickerRow:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tickerTag:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard2 },
  tickerText:   { fontSize: 10, fontWeight: '600' },

  planningCard: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chevron:      { fontSize: 20, color: COLORS.textMuted, fontWeight: '300' },
});
