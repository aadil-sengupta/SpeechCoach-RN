import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  
  // Shared value for tab indicator position
  const tabIndicatorPosition = useSharedValue(0);
  
  // Animated style for the indicator
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(tabIndicatorPosition.value, {
            damping: 20,
            stiffness: 150,
          }),
        },
      ],
    };
  });

  // Calculate tab width
  const tabWidth = 100 / state.routes.length;

  React.useEffect(() => {
    const activeIndex = state.index;
    tabIndicatorPosition.value = (activeIndex * 100) / state.routes.length;
  }, [state.index, state.routes.length]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={100}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: colors.background + 'DD' },
          ]}
        />
      )}
      
      {/* Active tab indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.tint,
            width: `${tabWidth}%`,
          },
          indicatorStyle,
        ]}
      />

      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = typeof options.tabBarLabel === 'string' 
            ? options.tabBarLabel 
            : options.title ?? route.name;
          const isFocused = state.index === index;

          // Scale animation for active tab
          const scaleValue = useSharedValue(isFocused ? 1 : 0.8);
          const opacityValue = useSharedValue(isFocused ? 1 : 0.6);

          React.useEffect(() => {
            scaleValue.value = withSpring(isFocused ? 1 : 0.8, {
              damping: 15,
              stiffness: 150,
            });
            opacityValue.value = withTiming(isFocused ? 1 : 0.6, { duration: 200 });
          }, [isFocused]);

          const animatedStyle = useAnimatedStyle(() => {
            return {
              transform: [{ scale: scaleValue.value }],
              opacity: opacityValue.value,
            };
          });

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <AnimatedTouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tab, animatedStyle]}
            >
              <Animated.View style={styles.tabContent}>
                {options.tabBarIcon &&
                  options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? colors.tint : colors.text,
                    size: 24,
                  })}
                <Animated.Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? colors.tint : colors.text,
                      fontWeight: isFocused ? '600' : '400',
                    },
                  ]}
                >
                  {label}
                </Animated.Text>
              </Animated.View>
            </AnimatedTouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    borderRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 16,
    minHeight: 60,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
  },
});
