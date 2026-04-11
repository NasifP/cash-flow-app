import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS 
} from 'react-native-reanimated';
import { Colors, Shadows } from '../constants/theme';

interface DraggableItemProps {
  id: string;
  name: string;
  price: number;
  onDrop: (itemId: string, x: number, y: number) => void;
}

export const DraggableItemCard: React.FC<DraggableItemProps> = ({ id, name, price, onDrop }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startX: number; startY: number }>({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: (event) => {
      // Notify parent of the drop coordinates
      runOnJS(onDrop)(id, event.absoluteX, event.absoluteY);
      
      // Snap back to original position
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: withSpring(translateX.value !== 0 || translateY.value !== 0 ? 1.05 : 1) }
      ],
      zIndex: translateX.value !== 0 || translateY.value !== 0 ? 100 : 1,
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.price}>{price.toFixed(2)} EGP</Text>
        </View>
        <View style={styles.dragHandle} />
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.light,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  price: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  dragHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    marginLeft: 12,
  },
});
