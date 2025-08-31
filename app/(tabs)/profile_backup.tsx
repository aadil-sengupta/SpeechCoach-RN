import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { clearAllRecordingMetadata, getRecordingStatistics } from '@/utils/recordingUtils';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, logout, clearAuthData } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [appStats, setAppStats] = useState({
    totalRecordings: 0,
    totalSize: 0,
    totalDuration: 0,
  });

  // Load app statistics when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        try {
          const stats = await getRecordingStatistics();
          setAppStats({
            totalRecordings: stats.totalRecordings,
            totalSize: stats.totalSize,
            totalDuration: stats.totalDuration,
          });
        } catch (error) {
          console.error('Error loading app statistics:', error);
        }
      };
      loadStats();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleClearAuthData = () => {
    Alert.alert(
      'Clear Auth Data',
      'This will clear all saved authentication data. You will need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearAuthData }
      ]
    );
  };

  const handleClearRecordings = () => {
    Alert.alert(
      'Clear All Recordings',
      'Are you sure you want to delete all recordings? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All Recordings', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await clearAllRecordingMetadata();
              setAppStats({ totalRecordings: 0, totalSize: 0, totalDuration: 0 });
              Alert.alert('Success', 'All recordings have been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear recordings.');
            }
          }
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear App Cache',
      'This will clear temporary files and cached data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Cache', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const cacheDir = FileSystem.cacheDirectory;
              if (cacheDir) {
                const files = await FileSystem.readDirectoryAsync(cacheDir);
                for (const file of files) {
                  await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
                }
              }
              Alert.alert('Success', 'App cache has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear app cache.');
            }
          }
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const stats = await getRecordingStatistics();
      const exportData = {
        user: {
          name: user?.name,
          email: user?.email,
        },
        statistics: stats,
        exportDate: new Date().toISOString(),
      };
      
      const exportString = JSON.stringify(exportData, null, 2);
      console.log('Export Data:', exportString);
      
      Alert.alert(
        'Data Export',
        `Your data has been exported to the console. Check the development logs to view the complete export.\n\nTotal recordings: ${stats.totalRecordings}\nTotal size: ${(stats.totalSize / 1024 / 1024).toFixed(1)} MB`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data.');
    }
  };

  const showAppInfo = () => {
    Alert.alert(
      'About SpeechCoach',
      'SpeechCoach helps you practice your speaking skills through video recording and analysis.\n\nVersion: 1.0.0\nBuild: Development',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Enhanced Header Section with Gradient */}
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.headerSection}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animatable.View 
              animation="bounceIn" 
              duration={1000}
              style={styles.avatarContainer}
            >
              <LinearGradient
                colors={[colors.accentGradientStart, colors.accentGradientEnd]}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.avatarEmoji}>👤</Text>
              </LinearGradient>
            </Animatable.View>
            <Animatable.Text 
              animation="fadeInUp" 
              duration={800}
              delay={300}
              style={styles.title}
            >
              {user?.name || 'User'} ✨
            </Animatable.Text>
            <Animatable.Text 
              animation="fadeInUp" 
              duration={800}
              delay={500}
              style={styles.email}
            >
              {user?.email}
            </Animatable.Text>
          </LinearGradient>

          {/* Enhanced App Statistics */}
          <Animatable.View 
            animation="fadeInLeft" 
            duration={800}
            delay={600}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🏆 Your Progress
            </Text>
            <LinearGradient
              colors={[colors.gradientStart + '20', colors.gradientEnd + '20']}
              style={styles.statsContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.statItem}>
                <LinearGradient
                  colors={[colors.accentGradientStart, colors.accentGradientEnd]}
                  style={styles.statIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.statEmoji}>🎥</Text>
                </LinearGradient>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {appStats.totalRecordings}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Recordings
                </Text>
              </View>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={styles.statIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.statEmoji}>⏱️</Text>
                </LinearGradient>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {Math.round(appStats.totalDuration / 60)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Minutes
                </Text>
              </View>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={[colors.secondary, colors.tertiary]}
                  style={styles.statIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.statEmoji}>💾</Text>
                </LinearGradient>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {(appStats.totalSize / 1024 / 1024).toFixed(1)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  MB Used
                </Text>
              </View>
            </LinearGradient>
          </Animatable.View>

          {/* Enhanced Profile Options */}
          <Animatable.View 
            animation="fadeInRight" 
            duration={800}
            delay={800}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              👤 Account
            </Text>
            <View style={[styles.optionsContainer, { backgroundColor: colors.cardBackground }]}>
              <TouchableOpacity 
                style={[styles.optionItem, { borderBottomColor: colors.border }]}
                onPress={handleLogout}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E8E']}
                  style={styles.optionIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.optionEmoji}>🚪</Text>
                </LinearGradient>
                <Text style={[styles.optionText, { color: colors.text }]}>Sign Out</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionItem, { borderBottomColor: colors.border }]}
                onPress={handleClearAuthData}
              >
                <LinearGradient
                  colors={['#FF9500', '#FFAA00']}
                  style={styles.optionIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.optionEmoji}>🗑️</Text>
                </LinearGradient>
                <Text style={[styles.optionText, { color: colors.text }]}>Clear Auth Data</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Enhanced App Data Management */}
          <Animatable.View 
            animation="fadeInLeft" 
            duration={800}
            delay={1000}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📊 Data Management
            </Text>
            <View style={[styles.optionsContainer, { backgroundColor: colors.cardBackground }]}>
              <TouchableOpacity 
                style={[styles.optionItem, { borderBottomColor: colors.border }]}
                onPress={handleExportData}
              >
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={styles.optionIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.optionEmoji}>📤</Text>
                </LinearGradient>
                <Text style={[styles.optionText, { color: colors.text }]}>Export Data</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionItem, { borderBottomColor: colors.border }]}
                onPress={handleClearCache}
              >
                <LinearGradient
                  colors={['#FF3B30', '#FF6B6B']}
                  style={styles.optionIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.optionEmoji}>🧹</Text>
                </LinearGradient>
                <Text style={[styles.optionText, { color: colors.text }]}>Clear Cache</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionItem, { borderBottomWidth: 0 }]}
                onPress={handleClearRecordings}
              >
                <LinearGradient
                  colors={['#FF3B30', '#FF4444']}
                  style={styles.optionIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.optionEmoji}>❌</Text>
                </LinearGradient>
                <Text style={[styles.optionText, { color: colors.text }]}>Clear All Recordings</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Enhanced App Information */}
          <Animatable.View 
            animation="fadeInRight" 
            duration={800}
            delay={1200}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              ℹ️ About
            </Text>
            <View style={[styles.optionsContainer, { backgroundColor: colors.cardBackground }]}>
              <TouchableOpacity 
                style={[styles.optionItem, { borderBottomWidth: 0 }]}
                onPress={showAppInfo}
              >
                <LinearGradient
                  colors={[colors.secondary, colors.tertiary]}
                  style={styles.optionIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.optionEmoji}>💬</Text>
                </LinearGradient>
                <Text style={[styles.optionText, { color: colors.text }]}>App Information</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 0,
    marginBottom: 24,
    marginHorizontal: -20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  avatarEmoji: {
    fontSize: 40,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statEmoji: {
    fontSize: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  optionsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optionEmoji: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
});
