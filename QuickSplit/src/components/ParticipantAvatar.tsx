import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { Colors, Shadows } from '../constants/theme';

interface ParticipantAvatarProps {
  name: string;
  avatar?: string;
  isSelected?: boolean;
  assignedCount?: number;
}

export const ParticipantAvatar: React.FC<ParticipantAvatarProps> = ({ 
  name, 
  avatar, 
  isSelected,
  assignedCount = 0
}) => {
  return (
    <View style={styles.container}>
      <View style={[
        styles.avatarContainer, 
        isSelected && styles.selected,
        assignedCount > 0 && styles.active
      ]}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.initial}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        {assignedCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{assignedCount}</Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>{name.split(' ')[0]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: 70,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.light,
  },
  selected: {
    borderColor: Colors.primary,
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  active: {
    borderColor: Colors.success,
    borderWidth: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
