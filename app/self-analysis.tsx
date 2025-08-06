import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RecordingMetadata, getRecordingMetadata } from '@/utils/recordingUtils';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('SelfAnalysisScreen mounted with recordingId:', recordingId);
    loadRecording();
  }, [recordingId]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isPlaying]);

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

  const handleVideoPress = () => {
    setShowControls(true);
    resetControlsTimeout();
  };

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleSeek = async (value: number) => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.setPositionAsync(value * duration);
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
        {/* AI Analysis Coming Soon Banner */}
        <BlurView intensity={20} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.aiProcessingBanner}>
          <View style={styles.aiProcessingContent}>
            <IconSymbol name="brain" size={20} color={colors.tint} />
            <View style={styles.aiProcessingTextContainer}>
              <Text style={[styles.aiProcessingText, { color: colors.text }]}>
                🚧 AI Speech Analysis - Coming Soon!
              </Text>
              <Text style={[styles.aiProcessingSubtext, { color: colors.text + '80' }]}>
                We're developing AI-powered speech feedback. For now, use the self-analysis tools below.
              </Text>
            </View>
          </View>
        </BlurView>

        {/* Video Player */}
        {isFullscreen ? (
          <Modal
            visible={isFullscreen}
            animationType="fade"
            supportedOrientations={['portrait', 'landscape']}
            onRequestClose={() => setIsFullscreen(false)}
          >
            <StatusBar hidden />
            <TouchableOpacity 
              style={[styles.videoContainer, styles.fullscreenContainer, { backgroundColor: 'black' }]}
              onPress={handleVideoPress}
              activeOpacity={1}
            >
              <Video
                ref={videoRef}
                source={{ uri: recording.localUri }}
                style={styles.video}
                useNativeControls={false}
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                isMuted={focusMode === 'video' || isMuted}
                onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                  if (status.isLoaded) {
                    setIsPlaying(status.isPlaying || false);
                    setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
                    setPosition(status.positionMillis ? status.positionMillis / 1000 : 0);
                  }
                }}
              />
              
              {/* Video Controls Overlay */}
              {showControls && (
                <View style={styles.controlsOverlay}>
                  {/* Top Controls */}
                  <View style={styles.topControls}>
                    <TouchableOpacity 
                      style={styles.fullscreenButton}
                      onPress={toggleFullscreen}
                    >
                      <BlurView intensity={80} tint="dark" style={styles.controlButton}>
                        <IconSymbol 
                          name="xmark" 
                          size={18} 
                          color="white" 
                        />
                      </BlurView>
                    </TouchableOpacity>
                  </View>

                  {/* Center Play/Pause Button */}
                  <TouchableOpacity 
                    style={styles.centerPlayButton}
                    onPress={handlePlayPause}
                  >
                    <BlurView intensity={80} tint="dark" style={styles.centerPlayButtonBlur}>
                      <IconSymbol 
                        name={isPlaying ? "pause.fill" : "play.fill"} 
                        size={28} 
                        color="white" 
                      />
                    </BlurView>
                  </TouchableOpacity>

                  {/* Bottom Controls */}
                  <View style={styles.bottomControls}>
                    <BlurView intensity={80} tint="dark" style={styles.bottomControlsBlur}>
                      <View style={styles.progressContainer}>
                        <Text style={styles.timeText}>{formatDuration(position)}</Text>
                        <TouchableOpacity 
                          style={styles.progressBar}
                          onPress={(event) => {
                            const { locationX } = event.nativeEvent;
                            const progressWidth = width * 0.5; // Approximate width based on screen width
                            const percentage = Math.max(0, Math.min(1, locationX / progressWidth));
                            handleSeek(percentage);
                          }}
                        >
                          <View 
                            style={[styles.progressFill, { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }]}
                          />
                          <View
                            style={[styles.progressThumb, { left: `${duration > 0 ? (position / duration) * 100 : 0}%` }]}
                          />
                        </TouchableOpacity>
                        <Text style={styles.timeText}>{formatDuration(duration)}</Text>
                      </View>
                      
                      <View style={styles.controlButtons}>
                        <TouchableOpacity 
                          style={styles.smallControlButton}
                          onPress={handlePlayPause}
                        >
                          <IconSymbol 
                            name={isPlaying ? "pause.fill" : "play.fill"} 
                            size={20} 
                            color="white" 
                          />
                        </TouchableOpacity>
                        
                        {focusMode !== 'video' && (
                          <TouchableOpacity 
                            style={styles.smallControlButton}
                            onPress={toggleMute}
                          >
                            <IconSymbol 
                              name={isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill"} 
                              size={18} 
                              color="white" 
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </BlurView>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </Modal>
        ) : (
          <TouchableOpacity 
            style={styles.videoContainer}
            onPress={handleVideoPress}
            activeOpacity={1}
          >
            {focusMode !== 'audio' ? (
              <Video
                ref={videoRef}
                source={{ uri: recording.localUri }}
                style={styles.video}
                useNativeControls={false}
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                isMuted={focusMode === 'video' || isMuted}
                onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                  if (status.isLoaded) {
                    setIsPlaying(status.isPlaying || false);
                    setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
                    setPosition(status.positionMillis ? status.positionMillis / 1000 : 0);
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
                  onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                    if (status.isLoaded) {
                      setIsPlaying(status.isPlaying || false);
                      setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
                      setPosition(status.positionMillis ? status.positionMillis / 1000 : 0);
                    }
                  }}
                />
              </View>
            )}
            
            {/* Video Controls Overlay */}
            {showControls && (
              <View style={styles.controlsOverlay}>
                {/* Top Controls */}
                <View style={styles.topControls}>
                  <TouchableOpacity 
                    style={styles.fullscreenButton}
                    onPress={toggleFullscreen}
                  >
                    <BlurView intensity={80} tint="dark" style={styles.controlButton}>
                      <IconSymbol 
                        name="arrow.up.left.and.arrow.down.right" 
                        size={18} 
                        color="white" 
                      />
                    </BlurView>
                  </TouchableOpacity>
                </View>

                {/* Center Play/Pause Button */}
                <TouchableOpacity 
                  style={styles.centerPlayButton}
                  onPress={handlePlayPause}
                >
                  <BlurView intensity={80} tint="dark" style={styles.centerPlayButtonBlur}>
                    <IconSymbol 
                      name={isPlaying ? "pause.fill" : "play.fill"} 
                      size={28} 
                      color="white" 
                    />
                  </BlurView>
                </TouchableOpacity>

                {/* Bottom Controls */}
                <View style={styles.bottomControls}>
                  <BlurView intensity={80} tint="dark" style={styles.bottomControlsBlur}>
                      <View style={styles.progressContainer}>
                        <Text style={styles.timeText}>{formatDuration(position)}</Text>
                        <TouchableOpacity 
                          style={styles.progressBar}
                          onPress={(event) => {
                            const { locationX } = event.nativeEvent;
                            const progressWidth = width * 0.7; // Wider in fullscreen
                            const percentage = Math.max(0, Math.min(1, locationX / progressWidth));
                            handleSeek(percentage);
                          }}
                        >
                          <View 
                            style={[styles.progressFill, { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }]}
                          />
                          <View
                            style={[styles.progressThumb, { left: `${duration > 0 ? (position / duration) * 100 : 0}%` }]}
                          />
                        </TouchableOpacity>
                        <Text style={styles.timeText}>{formatDuration(duration)}</Text>
                      </View>                    <View style={styles.controlButtons}>
                      <TouchableOpacity 
                        style={styles.smallControlButton}
                        onPress={handlePlayPause}
                      >
                        <IconSymbol 
                          name={isPlaying ? "pause.fill" : "play.fill"} 
                          size={20} 
                          color="white" 
                        />
                      </TouchableOpacity>
                      
                      {focusMode !== 'video' && (
                        <TouchableOpacity 
                          style={styles.smallControlButton}
                          onPress={toggleMute}
                        >
                          <IconSymbol 
                            name={isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill"} 
                            size={18} 
                            color="white" 
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </BlurView>
                </View>
              </View>
            )}
          </TouchableOpacity>
        )}

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

        {/* AI Analysis Coming Soon Section */}
        <View style={[styles.comingSoonCard, { backgroundColor: colors.text + '05', borderColor: colors.tint + '30' }]}>
          <View style={styles.comingSoonHeader}>
            <IconSymbol name="brain" size={24} color={colors.tint} />
            <Text style={[styles.comingSoonTitle, { color: colors.text }]}>AI Speech Analysis</Text>
            <View style={[styles.comingSoonBadge, { backgroundColor: colors.tint + '20' }]}>
              <Text style={[styles.comingSoonBadgeText, { color: colors.tint }]}>Coming Soon</Text>
            </View>
          </View>
          
          <Text style={[styles.comingSoonDescription, { color: colors.text + '80' }]}>
            We're developing an AI-powered speech analysis feature that will provide:
          </Text>
          
          <View style={styles.comingSoonFeatures}>
            <View style={styles.comingSoonFeature}>
              <IconSymbol name="checkmark.circle" size={16} color={colors.tint} />
              <Text style={[styles.comingSoonFeatureText, { color: colors.text + '90' }]}>
                Speech clarity and pace analysis
              </Text>
            </View>
            <View style={styles.comingSoonFeature}>
              <IconSymbol name="checkmark.circle" size={16} color={colors.tint} />
              <Text style={[styles.comingSoonFeatureText, { color: colors.text + '90' }]}>
                Filler word detection and feedback
              </Text>
            </View>
            <View style={styles.comingSoonFeature}>
              <IconSymbol name="checkmark.circle" size={16} color={colors.tint} />
              <Text style={[styles.comingSoonFeatureText, { color: colors.text + '90' }]}>
                Personalized improvement suggestions
              </Text>
            </View>
            <View style={styles.comingSoonFeature}>
              <IconSymbol name="checkmark.circle" size={16} color={colors.tint} />
              <Text style={[styles.comingSoonFeatureText, { color: colors.text + '90' }]}>
                Speech transcription and confidence scoring
              </Text>
            </View>
          </View>
          
          <Text style={[styles.comingSoonFooter, { color: colors.text + '70' }]}>
            For now, use the self-analysis tools below to review your recording manually.
          </Text>
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
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
  },
  aiProcessingTextContainer: {
    flex: 1,
  },
  aiProcessingText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  aiProcessingSubtext: {
    fontSize: 12,
    lineHeight: 16,
  },
  videoContainer: {
    margin: 10,
    borderRadius: 20,
    overflow: 'hidden',
//    aspectRatio: 16/9,
    position: 'relative',
    //minHeight: 220,
    maxHeight: 400,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 0,
    borderRadius: 0,
    zIndex: 1000,
    flex: 1,
    width: '100%',
    height: '100%',
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
  // Video Controls Styles
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
  },
  fullscreenButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  centerPlayButtonBlur: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  bottomControlsBlur: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  timeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    position: 'relative',
    paddingVertical: 8, // Increase touch area
  },
  progressFill: {
    height: 3,
    backgroundColor: 'white',
    borderRadius: 6,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    backgroundColor: 'white',
    borderRadius: 6,
    marginLeft: -6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallControlButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  // Coming Soon Styles
  comingSoonCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  comingSoonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  comingSoonDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  comingSoonFeatures: {
    gap: 12,
    marginBottom: 16,
  },
  comingSoonFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comingSoonFeatureText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  comingSoonFooter: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
