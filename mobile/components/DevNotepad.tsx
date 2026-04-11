import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

const NOTES: { heading: string; color: string; items: { label: string; status: 'done' | 'progress' | 'todo' }[] }[] = [
  {
    heading: 'Plaid',
    color: COLORS.green,
    items: [
      { label: 'Sandbox account + keys', status: 'done' },
      { label: 'API route returning transactions', status: 'done' },
      { label: 'Wire transactions to SmartSwipe UI', status: 'progress' },
    ],
  },
  {
    heading: 'SmartSwipe',
    color: COLORS.green,
    items: [
      { label: 'UI built (mock data)', status: 'done' },
      { label: 'Cleared for rebuild', status: 'done' },
      { label: 'Connect rewardscc.com reward rates', status: 'done' },
      { label: 'Build SmartSwipe UI + algorithm', status: 'progress' },
    ],
  },
  {
    heading: 'RewardVest',
    color: COLORS.blue,
    items: [
      { label: 'UI built (mock data)', status: 'done' },
      { label: 'Alpha Vantage market data', status: 'todo' },
      { label: 'OpenAI investment suggestion', status: 'todo' },
    ],
  },
  {
    heading: 'WealthSplit',
    color: COLORS.purple,
    items: [
      { label: 'UI built (mock data)', status: 'done' },
      { label: 'Real calculations from Plaid', status: 'todo' },
    ],
  },
  {
    heading: 'Auth & Infra',
    color: COLORS.yellow,
    items: [
      { label: 'Auth0 login', status: 'todo' },
      { label: 'Supabase database', status: 'todo' },
    ],
  },
];

const STATUS_ICON = { done: '✅', progress: '🔄', todo: '⬜' };

export default function DevNotepad() {
  const [open, setOpen] = useState(true);

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={() => setOpen(o => !o)} style={styles.toggle}>
        <Text style={styles.toggleText}>📋 Dev Notepad</Text>
        <Text style={styles.toggleText}>{open ? '▲' : '▼'}</Text>
      </Pressable>

      {open && (
        <ScrollView style={styles.body} nestedScrollEnabled>
          {NOTES.map((section, si) => (
            <View key={section.heading} style={[styles.section, si > 0 && styles.sectionBorder]}>
              <Text style={[styles.heading, { color: section.color }]}>{section.heading}</Text>
              {section.items.map(item => (
                <View key={item.label} style={styles.item}>
                  <Text style={styles.icon}>{STATUS_ICON[item.status]}</Text>
                  <Text style={[
                    styles.label,
                    item.status === 'done' && styles.labelDone,
                    item.status === 'progress' && styles.labelProgress,
                  ]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0f0f1a',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a1a2e',
  },
  toggleText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' },
  body: { maxHeight: 220, paddingHorizontal: 16, paddingVertical: 8 },
  section: { paddingVertical: 8, gap: 6 },
  sectionBorder: { borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  heading: { fontSize: 11, fontWeight: '700', marginBottom: 4, fontFamily: 'monospace' },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  icon: { fontSize: 11, lineHeight: 18 },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 18, fontFamily: 'monospace', flex: 1 },
  labelDone: { textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.2)' },
  labelProgress: { color: 'rgba(255,255,255,0.9)' },
});
