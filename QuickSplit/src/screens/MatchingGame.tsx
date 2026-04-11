import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Animated as RNAnimated } from 'react-native';
import { Colors, Shadows } from '../constants/theme';
import { ParticipantAvatar } from '../components/ParticipantAvatar';
import { DraggableItemCard } from '../components/DraggableItemCard';
import { ReceiptItem } from '../hooks/useOCR';
import { Participant } from '../hooks/useContacts';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Assignment {
  itemId: string;
  participantIds: string[];
}

interface MatchingGameProps {
  items: ReceiptItem[];
  participants: Participant[];
  onComplete: (assignments: Assignment[]) => void;
}

export const MatchingGame: React.FC<MatchingGameProps> = ({ items, participants, onComplete }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [avatarLayouts, setAvatarLayouts] = useState<Record<string, { x: number, y: number, w: number, h: number }>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const unassignedItems = items.filter(item => !assignments.some(a => a.itemId === item.id));
  const progress = (items.length - unassignedItems.length) / items.length;

  const onAvatarLayout = (id: string, event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setAvatarLayouts(prev => ({ ...prev, [id]: { x, y, w: width, h: height } }));
  };

  const handleDrop = useCallback((itemId: string, x: number, y: number) => {
    // Check collision with any avatar
    // Note: React Native coordinates can be tricky between absolute and relative.
    // In a high-quality implementation, we'd use 'measure' to get consistent absolute coords.
    
    let droppedOnParticipantId = null;

    for (const [pId, layout] of Object.entries(avatarLayouts)) {
      // Simplified collision check
      // Adjusting for ScrollView / Header offsets if necessary
      if (x > layout.x && x < layout.x + layout.w && y > 100 && y < 250) {
        droppedOnParticipantId = pId;
        break;
      }
    }

    if (droppedOnParticipantId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAssignments(prev => {
        const existing = prev.find(a => a.itemId === itemId);
        if (existing) {
          if (existing.participantIds.includes(droppedOnParticipantId)) return prev;
          return prev.map(a => a.itemId === itemId ? { ...a, participantIds: [...a.participantIds, droppedOnParticipantId!] } : a);
        }
        return [...prev, { itemId, participantIds: [droppedOnParticipantId!] }];
      });

      // Check if mission accomplished
      if (unassignedItems.length === 1) {
        setShowSuccess(true);
      }
    }
  }, [avatarLayouts, unassignedItems]);

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Mission Progress</Text>
          <Text style={styles.progressValue}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Participant Selection (Top Row) */}
      <View style={styles.avatarRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarScroll}>
          {participants.map(p => (
            <View key={p.id} onLayout={(e) => onAvatarLayout(p.id, e)}>
              <ParticipantAvatar 
                name={p.name} 
                avatar={p.avatar}
                assignedCount={assignments.filter(a => a.participantIds.includes(p.id)).length}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Items List (Bottom) */}
      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Drag Items to Avatars</Text>
        <ScrollView style={styles.itemsScroll} contentContainerStyle={styles.itemsContent}>
          {unassignedItems.length > 0 ? (
            unassignedItems.map(item => (
              <DraggableItemCard 
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                onDrop={handleDrop}
              />
            ))
          ) : (
            <View style={styles.allDone}>
              <Text style={styles.allDoneText}>All items linked! 🎉</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {showSuccess && (
        <View style={styles.successOverlay}>
          <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut={true} />
          <Text style={styles.successEmoji}>🚀</Text>
          <Text style={styles.successTitle}>MISSION ACCOMPLISHED!</Text>
          <Text style={styles.successSubtitle}>Everyone is matched. Time to get paid!</Text>
          <TouchableOpacity style={styles.finishButton} onPress={() => onComplete(assignments)}>
            <Text style={styles.finishButtonText}>Review & Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Placeholder for TouchableOpacity if not imported correctly
import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progressContainer: {
    padding: 20,
    paddingTop: 40,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  avatarRow: {
    height: 120,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarScroll: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  itemsSection: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  itemsScroll: {
    flex: 1,
  },
  itemsContent: {
    paddingBottom: 40,
  },
  allDone: {
    alignItems: 'center',
    marginTop: 40,
  },
  allDoneText: {
    fontSize: 18,
    color: Colors.success,
    fontWeight: '700',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    zIndex: 1000,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  finishButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    ...Shadows.medium,
  },
  finishButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
