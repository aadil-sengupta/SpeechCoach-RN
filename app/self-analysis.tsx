import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RecordingMetadata, getRecordingMetadata } from '@/utils/recordingUtils';
import { ResizeMode, Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

type FocusMode = 'both' | 'audio' | 'video';

export default function SelfAnalysisScreen() {
  const { recordingId } = useLocalSearchParams<{ recordingId: string }>();
  const [recording, setRecording] = useState<RecordingMetadata | null>(null);
  const [focusMode, setFocusMode] = useState<FocusMode>('both');
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userNotes, setUserNotes] = useState('');
  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log('SelfAnalysisScreen mounted with recordingId:', recordingId);
    loadRecording();
  }, [recordingId]);

  const loadRecording = async () => {
    try {
      const recordings = await getRecordingMetadata();
      const targetRecording = recordings.find(r => r.id === recordingId);
      
      if (targetRecording) {
        setRecording(targetRecording);
      } else {
        Alert.alert(
          'Recording Not Found',
          'The requested recording could not be found.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error loading recording:', error);
      Alert.alert(
        'Error',
        'Failed to load the recording.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error controlling video playback:', error);
    }
  };

  const handleFocusModeChange = (newMode: FocusMode) => {
    if (newMode !== focusMode) {
      // Animate the description change
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      setFocusMode(newMode);
    }
  };

  const getFocusModeDescription = () => {
    switch (focusMode) {
      case 'audio':
        return 'Focus on your speech patterns, pace, and clarity. The video is hidden to help you concentrate on audio elements.';
      case 'video':
        return 'Focus on your body language, facial expressions, and gestures. Audio is muted to help you concentrate on visual elements.';
      default:
        return 'Review both audio and visual aspects of your presentation together.';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading recording...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recording) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.text} />
          <Text style={[styles.errorText, { color: colors.text }]}>Recording not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.text + '20' }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>Self-Analysis</Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Processing Banner */}
        <BlurView intensity={20} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.aiProcessingBanner}>
          <View style={styles.aiProcessingContent}>
            <IconSymbol name="brain" size={20} color={colors.tint} />
            <Text style={[styles.aiProcessingText, { color: colors.text }]}>
              AI analysis is being processed in the background
            </Text>
          </View>
        </BlurView>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          {focusMode !== 'audio' ? (
            <Video
              ref={videoRef}
              source={{ uri: recording.localUri }}
              style={styles.video}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
              isMuted={focusMode === 'video'}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) {
                  setIsPlaying(status.isPlaying || false);
                }
              }}
            />
          ) : (
            <View style={[styles.audioOnlyContainer, { backgroundColor: colors.text + '10' }]}>
              <IconSymbol name="waveform" size={64} color={colors.text} />
              <Text style={[styles.audioOnlyText, { color: colors.text }]}>Audio Focus Mode</Text>
              <Text style={[styles.audioOnlySubtext, { color: colors.text + '80' }]}>
                Video is hidden to help you focus on speech
              </Text>
              {/* Hidden video for audio playback */}
              <Video
                ref={videoRef}
                source={{ uri: recording.localUri }}
                style={{ width: 0, height: 0 }}
                useNativeControls={false}
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                isMuted={false}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded) {
                    setIsPlaying(status.isPlaying || false);
                  }
                }}
              />
            </View>
          )}
          
          {/* Play/Pause Button Overlay */}
          <TouchableOpacity 
            style={styles.playButton}
            onPress={handlePlayPause}
          >
            <BlurView intensity={80} tint="dark" style={styles.playButtonBlur}>
              <IconSymbol 
                name={isPlaying ? "pause.fill" : "play.fill"} 
                size={32} 
                color="white" 
              />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Recording Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.text + '05' }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Recording Details</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text + '80' }]}>Duration:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {recording.duration ? formatDuration(recording.duration) : 'Unknown'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text + '80' }]}>Date:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(recording.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Focus Mode Controls */}
        <View style={styles.controlsCard}>
          <Text style={[styles.controlsTitle, { color: colors.text }]}>Analysis Focus</Text>
          
          {/* Segmented Control Style Switcher */}
          <View style={[styles.segmentedControl, { backgroundColor: colors.text + '10' }]}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                focusMode === 'both' && [styles.activeSegment, { backgroundColor: colors.tint }]
              ]}
              onPress={() => handleFocusModeChange('both')}
              activeOpacity={0.7}
            >
              <View style={styles.segmentContent}>
                <IconSymbol 
                  name="eye" 
                  size={18} 
                  color={focusMode === 'both' ? 'black' : colors.text + '80'} 
                />
                <Text style={[
                  styles.segmentText, 
                  { 
                    color: focusMode === 'both' ? 'black' : colors.text + '80',
                    fontWeight: focusMode === 'both' ? '600' : '500'
                  }
                ]}>
                  Both
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                focusMode === 'audio' && [styles.activeSegment, { backgroundColor: colors.tint }]
              ]}
              onPress={() => handleFocusModeChange('audio')}
              activeOpacity={0.7}
            >
              <View style={styles.segmentContent}>
                <IconSymbol 
                  name="speaker.wave.2" 
                  size={18} 
                  color={focusMode === 'audio' ? 'black' : colors.text + '80'} 
                />
                <Text style={[
                  styles.segmentText, 
                  { 
                    color: focusMode === 'audio' ? 'black' : colors.text + '80',
                    fontWeight: focusMode === 'audio' ? '600' : '500'
                  }
                ]}>
                  Audio
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                focusMode === 'video' && [styles.activeSegment, { backgroundColor: colors.tint }]
              ]}
              onPress={() => handleFocusModeChange('video')}
              activeOpacity={0.7}
            >
              <View style={styles.segmentContent}>
                <IconSymbol 
                  name="video" 
                  size={18} 
                  color={focusMode === 'video' ? 'black' : colors.text + '80'} 
                />
                <Text style={[
                  styles.segmentText, 
                  { 
                    color: focusMode === 'video' ? 'black' : colors.text + '80',
                    fontWeight: focusMode === 'video' ? '600' : '500'
                  }
                ]}>
                  Video
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Focus Mode Description */}
          <Animated.View style={[styles.descriptionContainer, { backgroundColor: colors.tint + '05', opacity: fadeAnim }]}>
            <Text style={[styles.descriptionText, { color: colors.text + '90' }]}>
              {getFocusModeDescription()}
            </Text>
          </Animated.View>
        </View>

        {/* Self-Analysis Notes Section */}
        <View style={[styles.notesCard, { backgroundColor: colors.text + '05' }]}>
          <Text style={[styles.notesTitle, { color: colors.text }]}>Self-Analysis Notes</Text>
          <Text style={[styles.notesSubtitle, { color: colors.text + '80' }]}>
            Consider these aspects while reviewing:
          </Text>
          
          {focusMode !== 'video' && (
            <View style={styles.noteSection}>
              <Text style={[styles.noteSectionTitle, { color: colors.tint }]}>Audio Focus Points:</Text>
              <Text style={[styles.noteText, { color: colors.text + '80' }]}>
                • Pace and rhythm of speech{'\n'}
                • Clarity of pronunciation{'\n'}
                • Use of filler words (um, uh, like){'\n'}
                • Volume and projection{'\n'}
                • Tone and inflection
              </Text>
            </View>
          )}

          {focusMode !== 'audio' && (
            <View style={styles.noteSection}>
              <Text style={[styles.noteSectionTitle, { color: colors.tint }]}>Visual Focus Points:</Text>
              <Text style={[styles.noteText, { color: colors.text + '80' }]}>
                • Eye contact and gaze direction{'\n'}
                • Facial expressions and engagement{'\n'}
                • Hand gestures and body language{'\n'}
                • Posture and confidence{'\n'}
                • Overall presence and energy
              </Text>
            </View>
          )}
        </View>

        {/* User Notes Section */}
        <View style={[styles.notesInputCard, { backgroundColor: colors.text + '05' }]}>
          <Text style={[styles.notesInputTitle, { color: colors.text }]}>Your Observations</Text>
          <Text style={[styles.notesInputSubtitle, { color: colors.text + '80' }]}>
            What did you notice about your presentation? What would you like to improve next time?
          </Text>
          
          <View style={[styles.textInputContainer, { borderColor: colors.text + '20', backgroundColor: colors.background }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              multiline
              numberOfLines={6}
              placeholder="Share your thoughts, observations, and areas for improvement..."
              placeholderTextColor={colors.text + '60'}
              value={userNotes}
              onChangeText={setUserNotes}
              textAlignVertical="top"
            />
          </View>
          
          {userNotes.length > 0 && (
            <Text style={[styles.characterCount, { color: colors.text + '60' }]}>
              {userNotes.length} characters
            </Text>
          )}
        </View>

        {/* Complete Analysis Button */}
        <TouchableOpacity 
          style={[styles.completeButton, { backgroundColor: colors.tint }]}
          onPress={() => {
            const completionMessage = userNotes.trim() 
              ? 'Great job reviewing your recording and sharing your insights! Your observations will help track your progress over time.'
              : 'Great job reviewing your recording! Consider adding your observations next time to track your improvement journey.';
            
            Alert.alert(
              'Analysis Complete',
              completionMessage,
              [{ text: 'OK', onPress: () => router.back() }]
            );
          }}
        >
          <IconSymbol name="checkmark.circle.fill" size={24} color="black" />
          <Text style={styles.completeButtonText}>Complete Self-Analysis</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  aiProcessingBanner: {
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  aiProcessingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  aiProcessingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  videoContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 16/9,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  audioOnlyContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  audioOnlyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  audioOnlySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  playButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  playButtonBlur: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  controlsCard: {
    margin: 20,
    marginTop: 0,
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  activeSegment: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  segmentText: {
    fontSize: 14,
  },
  descriptionContainer: {
    borderRadius: 8,
    padding: 12,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  notesCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  noteSection: {
    marginBottom: 16,
  },
  noteSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    margin: 20,
    marginTop: 0,
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
  notesInputCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  notesInputTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesInputSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  textInputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
  },
  textInput: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
});
