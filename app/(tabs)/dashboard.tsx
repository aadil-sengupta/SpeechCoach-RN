import { IconSymbol } from '@/components/ui/IconSymbol';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RecordingMetadata, formatDuration, getRecordingMetadata } from '@/utils/recordingUtils';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<RecordingMetadata | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
  const totalDuration = recordings.reduce((sum, recording) => sum + (recording.duration || 0), 0);
  const averageDuration = totalRecordings > 0 ? totalDuration / totalRecordings : 0;
  const recentRecordings = recordings.slice(0, 5); // Show last 5 recordings

  const handleRecordingPress = (recording: RecordingMetadata) => {
    setSelectedRecording(recording);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRecording(null);
  };

  // Render individual recording item
  const renderRecordingItem = ({ item }: { item: RecordingMetadata }) => (
    <TouchableOpacity
      style={[styles.recordingItem, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}
      onPress={() => handleRecordingPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.recordingContent}>
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {item.thumbnailUri ? (
            <Image
              source={{ uri: item.thumbnailUri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.tint + '20' }]}>
              <IconSymbol name="video.fill" size={24} color={colors.tint} />
            </View>
          )}
          {/* Play button overlay */}
          <View style={styles.playButtonOverlay}>
            <View style={styles.playButton}>
              <IconSymbol name="play.fill" size={16} color="white" />
            </View>
          </View>
          {/* Duration badge */}
          {item.duration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.recordingDetails}>
          <View style={styles.recordingHeader}>
            <Text style={[styles.recordingDate, { color: colors.text }]}>
              {item.recordedDate}
            </Text>
            <Text style={[styles.recordingTime, { color: colors.text + '80' }]}>
              {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.recordingMeta}>
            {item.fileSize && (
              <Text style={[styles.recordingDetail, { color: colors.text + '60' }]}>
                {(item.fileSize / 1024 / 1024).toFixed(1)} MB
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
                {formatDuration(totalDuration)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>Total Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.tint }]}>
                {formatDuration(Math.round(averageDuration))}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>Avg Duration</Text>
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

      {/* Video Player Modal */}
      <VideoPlayerModal
        visible={modalVisible}
        recording={selectedRecording}
        onClose={handleCloseModal}
      />
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
    padding: 0,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recordingContent: {
    flexDirection: 'row',
  },
  thumbnailContainer: {
    position: 'relative',
    width: 120,
    height: 90,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  recordingDetails: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
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
  recordingMeta: {
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
