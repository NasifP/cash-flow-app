import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Colors, Shadows } from '../src/constants/theme';
import { useOCR, ReceiptItem } from '../src/hooks/useOCR';
import { useContacts, Participant } from '../src/hooks/useContacts';
import { MatchingGame } from '../src/screens/MatchingGame';
import { calculateSplits, formatCurrency } from '../src/utils/math';
import { getSettings } from '../src/utils/storage';
import { generateTelegramMessage, sendToTelegram } from '../src/utils/export';

export default function Dashboard() {
  const [step, setStep] = useState(1);
  const { scanReceipt, isScanning, extractedItems } = useOCR();
  const { pickParticipants, selectedParticipants } = useContacts();
  const [extraCharges, setExtraCharges] = useState(0); // For tax/service

  const settings = getSettings();

  const handleGameComplete = (assignments: any) => {
    // Process final splits
    const participantsWithSubtotals = selectedParticipants.map(p => {
      const pItems = assignments
        .filter((a: any) => a.participantIds.includes(p.id))
        .map((a: any) => extractedItems.find(i => i.id === a.itemId));
      
      const sub = pItems.reduce((acc: number, item: any) => {
        // If split between multiple people, divide price
        const splitCount = assignments.find((a: any) => a.itemId === item?.id)?.participantIds.length || 1;
        return acc + (item?.price || 0) / splitCount;
      }, 0);

      return { ...p, itemsSubtotal: sub };
    });

    const result = calculateSplits(participantsWithSubtotals, extraCharges);
    setFinalResults(result);
    setStep(4); // Review Step
  };

  const [finalResults, setFinalResults] = useState<any>(null);

  if (step === 3) {
    return (
      <View style={{ flex: 1 }}>
        <MatchingGame 
          items={extractedItems} 
          participants={selectedParticipants} 
          onComplete={handleGameComplete} 
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>QuickSplit</Text>
          <Text style={styles.greeting}>Good morning, {settings?.fullName.split(' ')[0]}! 🌯</Text>
        </View>

        {step === 4 ? (
          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Final Breakdown</Text>
            {finalResults.participants.map((p: any) => (
              <View key={p.id} style={styles.resultCard}>
                <View>
                  <Text style={styles.pName}>{p.name}</Text>
                  <Text style={styles.pSub}>Subtotal: {formatCurrency(p.subtotal)}</Text>
                </View>
                <View style={styles.pTotalContainer}>
                  <Text style={styles.pTotal}>{formatCurrency(p.total)}</Text>
                  <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={() => sendToTelegram(generateTelegramMessage(p, settings?.instaPayIPA || '', settings?.fullName || ''))}
                  >
                    <Text style={styles.shareText}>Send ✈️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.resetButton} onPress={() => setStep(1)}>
              <Text style={styles.resetText}>Start New Split</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.steps}>
            {/* Step 1: Scan */}
            <TouchableOpacity 
              style={[styles.stepCard, extractedItems.length > 0 && styles.completed]}
              onPress={scanReceipt}
            >
              <Text style={styles.stepNumber}>Step 1</Text>
              <Text style={styles.stepTitle}>Scan Receipt</Text>
              <Text style={styles.stepDesc}>
                {extractedItems.length > 0 ? `${extractedItems.length} items found.` : 'Capture or upload a photo of the bill.'}
              </Text>
            </TouchableOpacity>

            {/* Step 2: Who Ate? */}
            <TouchableOpacity 
              style={[styles.stepCard, selectedParticipants.length > 0 && styles.completed]}
              onPress={pickParticipants}
              disabled={extractedItems.length === 0}
            >
              <Text style={styles.stepNumber}>Step 2</Text>
              <Text style={styles.stepTitle}>Who Ate?</Text>
              <Text style={styles.stepDesc}>
                {selectedParticipants.length > 0 ? `${selectedParticipants.length} people join the mission.` : 'Select friends from your contacts.'}
              </Text>
            </TouchableOpacity>

            {/* Step 3: Game */}
            <TouchableOpacity 
              style={styles.stepCard}
              onPress={() => setStep(3)}
              disabled={extractedItems.length === 0 || selectedParticipants.length === 0}
            >
              <Text style={styles.stepNumber}>Step 3</Text>
              <Text style={styles.stepTitle}>Matching Game</Text>
              <Text style={styles.stepDesc}>Enter the interactive split engine.</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.primary,
  },
  greeting: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  steps: {
    gap: 20,
  },
  stepCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    ...Shadows.medium,
    borderLeftWidth: 8,
    borderLeftColor: Colors.surface,
  },
  completed: {
    borderLeftColor: Colors.success,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  reviewSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Shadows.light,
  },
  pName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  pSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pTotalContainer: {
    alignItems: 'flex-end',
  },
  pTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  shareButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  shareText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  resetButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 20,
  },
  resetText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
