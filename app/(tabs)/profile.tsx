import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { clearAllRecordingMetadata, getRecordingStatistics } from '@/utils/recordingUtils';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleClearAuthData = () => {
    Alert.alert(
      'Clear Authentication Data',
      'This will clear all stored authentication data and take you to the login screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear Data', style: 'destructive', onPress: clearAuthData },
      ]
    );
  };

  const handleClearRecordings = () => {
    Alert.alert(
      'Clear All Recordings',
      'This will permanently delete all recording metadata. Video files will remain in storage but won\'t be accessible through the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Recordings', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await clearAllRecordingMetadata();
              setAppStats({ totalRecordings: 0, totalSize: 0, totalDuration: 0 });
              Alert.alert('Success', 'All recording metadata has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear recording metadata.');
            }
          }
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear App Cache',
      'This will clear temporary files and thumbnails to free up storage space.',
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header Section */}
          <View style={[styles.headerSection, { backgroundColor: colors.tint + '15' }]}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.tint }]}>
              <IconSymbol name="person.fill" size={32} color="white" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {user?.name || 'User'}
            </Text>
            <Text style={[styles.email, { color: colors.text + '80' }]}>
              {user?.email}
            </Text>
          </View>

          {/* App Statistics */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Progress
            </Text>
            <View style={[styles.statsContainer, { backgroundColor: colors.tint + '10' }]}>
              <View style={styles.statItem}>
                <IconSymbol name="video.fill" size={24} color={colors.tint} />
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {appStats.totalRecordings}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
                  Recordings
                </Text>
              </View>
              <View style={styles.statItem}>
                <IconSymbol name="clock.fill" size={24} color={colors.tint} />
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {Math.round(appStats.totalDuration / 60)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
                  Minutes
                </Text>
              </View>
              <View style={styles.statItem}>
                <IconSymbol name="internaldrive.fill" size={24} color={colors.tint} />
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {(appStats.totalSize / 1024 / 1024).toFixed(1)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
                  MB Used
                </Text>
              </View>
            </View>
          </View>

          {/* Profile Options */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Account
            </Text>
            <View style={[styles.optionsContainer, { backgroundColor: colors.tint + '05' }]}>
              <TouchableOpacity 
                style={[styles.optionItem, { borderBottomColor: colors.tint + '20' }]}
                onPress={handleLogout}
              >
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#FF6B6B" />
                <Text style={[styles.optionText, { color: colors.text }]}>Sign Out</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.text + '60'} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionItem, { borderBottomColor: colors.tint + '20' }]}
                onPress={handleClearAuthData}
              >
                <IconSymbol name="trash" size={20} color="#FF9500" />
                <Text style={[styles.optionText, { color: colors.text }]}>Clear Auth Data</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.text + '60'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* App Data Management */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Data Management
            </Text>
            <View style={[styles.optionsContainer, { backgroundColor: colors.tint + '05' }]}>
              <TouchableOpacity 
                style={[styles.optionItem, { borderBottomColor: colors.tint + '20' }]}
                onPress={handleExportData}
              >
                <IconSymbol name="square.and.arrow.up" size={20} color={colors.tint} />
                <Text style={[styles.optionText, { color: colors.text }]}>Export Data</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.text + '60'} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionItem, { borderBottomColor: colors.tint + '20' }]}
                onPress={handleClearCache}
              >
                <IconSymbol name="trash.circle" size={20} color="#007AFF" />
                <Text style={[styles.optionText, { color: colors.text }]}>Clear Cache</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.text + '60'} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionItem, { borderBottomWidth: 0 }]}
                onPress={handleClearRecordings}
              >
                <IconSymbol name="xmark.circle" size={20} color="#FF3B30" />
                <Text style={[styles.optionText, { color: colors.text }]}>Clear All Recordings</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.text + '60'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* App Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              About
            </Text>
            <View style={[styles.optionsContainer, { backgroundColor: colors.tint + '05' }]}>
              <TouchableOpacity 
                style={[styles.optionItem, { borderBottomWidth: 0 }]}
                onPress={showAppInfo}
              >
                <IconSymbol name="info.circle" size={20} color={colors.tint} />
                <Text style={[styles.optionText, { color: colors.text }]}>App Information</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.text + '60'} />
              </TouchableOpacity>
            </View>
          </View>
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
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  optionsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
});
