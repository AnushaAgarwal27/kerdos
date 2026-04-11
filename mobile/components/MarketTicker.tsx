import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

const INDICES = [
  { label: 'DJIA',    value: '40,657', change: '+0.37%', up: true  },
  { label: 'NASDAQ',  value: '18,657', change: '-0.02%', up: false },
  { label: 'S&P 500', value: '5,657',  change: '+0.73%', up: true  },
  { label: 'VIX',     value: '18.42',  change: '-2.10%', up: false },
  { label: '10Y',     value: '4.38%',  change: '+0.03',  up: true  },
  { label: 'BTC',     value: '83,412', change: '+1.24%', up: true  },
];

export default function MarketTicker() {
  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {INDICES.map((idx, i) => (
          <View key={idx.label} style={[styles.item, i < INDICES.length - 1 && styles.itemBorder]}>
            <Text style={styles.label}>{idx.label}</Text>
            <Text style={styles.value}>{idx.value}</Text>
            <Text style={[styles.change, { color: idx.up ? COLORS.green : COLORS.red }]}>{idx.change}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderBottomWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  scroll: { flexDirection: 'row' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRightWidth: 1, borderRightColor: COLORS.border },
  itemBorder: {},
  label:  { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  value:  { fontSize: 11, color: '#fff', fontWeight: '700' },
  change: { fontSize: 10, fontWeight: '600' },
});
