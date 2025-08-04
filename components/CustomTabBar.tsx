import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
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

  // Filter out practice tab and get visible tabs
  const visibleRoutes = state.routes.filter(route => route.name !== 'practice');
  const visibleTabWidth = 100 / visibleRoutes.length;

  React.useEffect(() => {
    // Find active tab index among visible tabs
    const activeRoute = state.routes[state.index];
    const activeVisibleIndex = visibleRoutes.findIndex(route => route.key === activeRoute.key);
    
    if (activeVisibleIndex !== -1) {
      tabIndicatorPosition.value = (activeVisibleIndex * 100) / visibleRoutes.length;
    }
  }, [state.index, visibleRoutes.length]);

  const handlePracticePress = () => {
    router.push('/camera-practice' as any);
  };

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
      
      {/* Active tab indicator - only for visible tabs */}
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.tint,
            width: `${visibleTabWidth}%`,
          },
          indicatorStyle,
        ]}
      />

      <View style={styles.tabContainer}>
        {/* Left tabs */}
        {visibleRoutes.slice(0, Math.ceil(visibleRoutes.length / 2)).map((route, index) => {
          const { options } = descriptors[route.key];
          const label = typeof options.tabBarLabel === 'string' 
            ? options.tabBarLabel 
            : options.title ?? route.name;
          const isFocused = state.routes[state.index].key === route.key;

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

          return (
            <AnimatedTouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
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

        {/* Center Practice Button */}
        <TouchableOpacity
          style={[styles.centerButton, { backgroundColor: colors.tint }]}
          onPress={handlePracticePress}
          activeOpacity={0.8}
        >
          <View style={styles.centerButtonInner}>
            <Animated.View style={styles.centerIcon}>
              {descriptors[state.routes.find(r => r.name === 'practice')?.key || '']?.options?.tabBarIcon?.({
                focused: false,
                color: 'white',
                size: 28,
              })}
            </Animated.View>
          </View>
        </TouchableOpacity>

        {/* Right tabs */}
        {visibleRoutes.slice(Math.ceil(visibleRoutes.length / 2)).map((route, index) => {
          const { options } = descriptors[route.key];
          const label = typeof options.tabBarLabel === 'string' 
            ? options.tabBarLabel 
            : options.title ?? route.name;
          const isFocused = state.routes[state.index].key === route.key;

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

          return (
            <AnimatedTouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
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
    minHeight: 70,
    alignItems: 'center',
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
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 20,
    marginTop: -15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
