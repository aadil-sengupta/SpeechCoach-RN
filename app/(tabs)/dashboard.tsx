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
    ScrollView,
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
  const renderRecordingItem = ({ item, index }: { item: RecordingMetadata; index: number }) => (
    <TouchableOpacity
      style={[styles.recordingItem, { 
        backgroundColor: colors.background,
        borderColor: colors.tint + '20',
        shadowColor: colors.text + '20',
      }]}
      onPress={() => handleRecordingPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.recordingContent}>
        <View style={styles.thumbnailContainer}>
          {item.thumbnailUri ? (
            <Image
              source={{ uri: item.thumbnailUri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.tint + '15' }]}>
              <IconSymbol name="video.fill" size={28} color={colors.tint} />
            </View>
          )}
          {/* Enhanced Play button overlay */}
          <View style={styles.playButtonOverlay}>
            <View style={[styles.playButton, { backgroundColor: colors.tint + 'CC' }]}>
              <IconSymbol name="play.fill" size={18} color="white" />
            </View>
          </View>
          
          {/* {item.duration && (
            <View style={[styles.durationBadge, { backgroundColor: colors.tint }]}>
              <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
            </View>
          )} */}
          {/* Session number badge */}
          <View style={[styles.sessionBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.sessionNumber, { color: colors.tint }]}>#{index + 1}</Text>
          </View>
        </View>

        {/* Enhanced Content */}
        <View style={styles.recordingDetails}>
          <View style={styles.recordingMain}>
            <Text style={[styles.sessionTitle, { color: colors.text }]}>
              Practice Session #{index + 1}
            </Text>
            <View style={styles.dateTimeRow}>
              <Text style={[styles.recordingDate, { color: colors.text }]}>
                {item.recordedDate}
              </Text>
              <Text style={[styles.recordingTime, { color: colors.text + '70' }]}>
                {new Date(item.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </Text>
            </View>
          </View>
          
          <View style={styles.recordingFooter}>
            <View style={styles.recordingMeta}>
              {item.duration && (
                <View style={styles.metaItem}>
                  <IconSymbol name="clock" size={12} color={colors.text + '60'} />
                  <Text style={[styles.metaText, { color: colors.text + '60' }]}>
                    {formatDuration(item.duration)}
                  </Text>
                </View>
              )}
              {item.fileSize && (
                <View style={styles.metaItem}>
                  <IconSymbol name="doc" size={12} color={colors.text + '60'} />
                  <Text style={[styles.metaText, { color: colors.text + '60' }]}>
                    {(item.fileSize / 1024 / 1024).toFixed(1)} MB
                  </Text>
                </View>
              )}
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.text + '40'} />
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
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
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


        {/* <View style={[styles.aiInsightsBanner, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerHeader}>
              <IconSymbol name="brain" size={24} color={colors.tint} />
              <Text style={[styles.bannerTitle, { color: colors.tint }]}>🚧 AI Speech Insights - Coming Soon!</Text>
            </View>
            <Text style={[styles.bannerDescription, { color: colors.text + '80' }]}>
              Get personalized feedback on your speech patterns, pacing, and delivery.
            </Text>
          </View>
        </View> */}

        {/* Recent Recordings Section */}
        {totalRecordings > 0 ? (
          <View style={styles.recordingsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Practice Sessions ({totalRecordings} total)
            </Text>
            <FlatList
              data={recentRecordings}
              renderItem={({ item, index }) => renderRecordingItem({ item, index })}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.recordingsList}
              scrollEnabled={false}
            />
            {totalRecordings > 5 && (
              <TouchableOpacity style={[styles.viewMoreButton, { 
                backgroundColor: colors.background, 
                borderColor: colors.tint + '30',
                shadowColor: colors.text + '20',
              }]}>
                <Text style={[styles.viewMoreText, { color: colors.tint }]}>
                  View all {totalRecordings} recordings
                </Text>
                <IconSymbol name="chevron.right" size={18} color={colors.tint} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.tint + '15' }]}>
              <IconSymbol name="mic.fill" size={48} color={colors.tint} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              Ready to start practicing?
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.text + '70' }]}>
              Your practice sessions will appear here after you complete your first recording.
            </Text>
            <TouchableOpacity 
              style={[styles.startPracticeButton, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/camera-practice')}
            >
              <IconSymbol name="video.fill" size={20} color="black" />
              <Text style={styles.startPracticeText}>Start Your First Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  recordingsList: {
    flexGrow: 0,
  },
  recordingItem: {
    borderRadius: 16,
    padding: 0,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recordingContent: {
    flexDirection: 'row',
  },
  thumbnailContainer: {
    position: 'relative',
    width: 130,
    height: 100,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  sessionBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sessionNumber: {
    fontSize: 11,
    fontWeight: '700',
  },
  recordingDetails: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  recordingMain: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingDate: {
    fontSize: 15,
    fontWeight: '500',
  },
  recordingTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  recordingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 90,
    marginTop: 0,
    gap: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  startPracticeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startPracticeText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
  },
  aiInsightsBanner: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  bannerContent: {
    gap: 8,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  bannerDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
