import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RecordingMetadata, getRecordingMetadata } from '@/utils/recordingUtils';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function DashboardScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // Load recordings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadRecordings = async () => {
        setLoading(true);
        try {
          const recordingData = await getRecordingMetadata();
          // Sort by creation date, most recent first
          const sortedRecordings = recordingData.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setRecordings(sortedRecordings);
        } catch (error) {
          console.error('Error loading recordings:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadRecordings();
    }, [])
  );

  // Calculate statistics
  const totalRecordings = recordings.length;
  const totalSize = recordings.reduce((sum, recording) => sum + (recording.fileSize || 0), 0);
  const averageSize = totalRecordings > 0 ? totalSize / totalRecordings : 0;
  const recentRecordings = recordings.slice(0, 5); // Show last 5 recordings

  // Render individual recording item
  const renderRecordingItem = ({ item }: { item: RecordingMetadata }) => (
    <View style={[styles.recordingItem, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}>
      <View style={styles.recordingHeader}>
        <Text style={[styles.recordingDate, { color: colors.text }]}>
          {item.recordedDate}
        </Text>
        <Text style={[styles.recordingTime, { color: colors.text + '80' }]}>
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={[styles.recordingPrompt, { color: colors.text }]} numberOfLines={2}>
        {item.promptText}
      </Text>
      <View style={styles.recordingDetails}>
        <Text style={[styles.recordingDetail, { color: colors.text + '60' }]}>
          Camera: {item.facing === 'front' ? 'Front' : 'Back'}
        </Text>
        {item.fileSize && (
          <Text style={[styles.recordingDetail, { color: colors.text + '60' }]}>
            Size: {(item.fileSize / 1024 / 1024).toFixed(1)} MB
          </Text>
        )}
        <Text style={[styles.recordingDetail, { color: colors.text + '60' }]}>
          {item.photoLibraryUri ? '📱 Saved to Gallery' : '📁 App Storage Only'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading your recordings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome back, {user?.name}!
          </Text>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.tint + '15' }]}
            onPress={() => {
              const loadRecordings = async () => {
                setLoading(true);
                try {
                  const recordingData = await getRecordingMetadata();
                  const sortedRecordings = recordingData.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  );
                  setRecordings(sortedRecordings);
                } finally {
                  setLoading(false);
                }
              };
              loadRecordings();
            }}
          >
            <IconSymbol name="arrow.clockwise" size={20} color={colors.tint} />
          </TouchableOpacity>
        </View>
        
        {/* Statistics Section */}
        <View style={[styles.statsContainer, { backgroundColor: colors.tint + '15' }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>Your Practice Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.tint }]}>{totalRecordings}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>Total Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.tint }]}>
                {(totalSize / 1024 / 1024).toFixed(1)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>MB Recorded</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.tint }]}>
                {(averageSize / 1024 / 1024).toFixed(1)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>Avg MB/Session</Text>
            </View>
          </View>
        </View>

        {/* Recent Recordings Section */}
        {totalRecordings > 0 ? (
          <View style={styles.recordingsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Practice Sessions ({totalRecordings} total)
            </Text>
            <FlatList
              data={recentRecordings}
              renderItem={renderRecordingItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.recordingsList}
            />
            {totalRecordings > 5 && (
              <TouchableOpacity style={[styles.viewMoreButton, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}>
                <Text style={[styles.viewMoreText, { color: colors.tint }]}>
                  View all {totalRecordings} recordings
                </Text>
                <IconSymbol name="chevron.right" size={16} color={colors.tint} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="mic.fill" size={64} color={colors.tint + '40'} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              Ready to start practicing?
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.text + '80' }]}>
              Your recordings will appear here after you complete your first practice session.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  statsContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  recordingsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  recordingsList: {
    flex: 1,
  },
  recordingItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  recordingTime: {
    fontSize: 14,
    opacity: 0.8,
  },
  recordingPrompt: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  recordingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recordingDetail: {
    fontSize: 12,
    opacity: 0.6,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.7,
  },
});
