import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RecordingMetadata, getRecordingMetadata, updateRecordingObservations } from '@/utils/recordingUtils';
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
import * as Animatable from 'react-native-animatable';


const { width, height } = Dimensions.get('window');

type FocusMode = 'both' | 'audio' | 'video';

export default function AnalysisScreen() {
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
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisComplete, setAiAnalysisComplete] = useState(false);
  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  //const colors = Colors[colorScheme ?? 'light'];
  let colors = {
    text: '#222222',
    background: '#FFFFFF',
    tint: '#F0E68C',
  };
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    // Start AI analysis after recording is loaded
    if (recording && !aiAnalysisLoading && !aiAnalysisComplete) {
      setAiAnalysisLoading(true);
      // Simulate AI analysis for 20 seconds
      const analysisTimer = setTimeout(() => {
        setAiAnalysisLoading(false);
        setAiAnalysisComplete(true);
      }, 20000);
      
      return () => clearTimeout(analysisTimer);
    }
  }, [recording]);

  const loadRecording = async () => {
    try {
      const recordings = await getRecordingMetadata();
      const targetRecording = recordings.find(r => r.id === recordingId);
      
      if (targetRecording) {
        setRecording(targetRecording);
        // Load existing observations if they exist
        if (targetRecording.observations) {
          setUserNotes(targetRecording.observations);
        }
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
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading recording...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recording) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.text} />
          <Text style={[styles.errorText, { color: colors.text }]}>Recording not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      {/* Clean Header */}
      <View style={[styles.header, { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <View style={styles.backButtonContainer}>
            <Text style={styles.backButtonEmoji}>👈</Text>
            <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
          </View>
        </TouchableOpacity>
        
        <Animatable.View 
          animation="fadeInDown" 
          duration={800}
          style={styles.headerTitleContainer}
        >
          <Text style={styles.headerEmoji}>🎬</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analysis</Text>
        </Animatable.View>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction Banner */}
        <View style={[styles.introCard, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}>
          <View style={styles.introHeader}>
            <IconSymbol name="lightbulb" size={20} color={colors.tint} />
            <Text style={[styles.introTitle, { color: colors.tint }]}>Speech Analysis Benefits</Text>
          </View>
          <Text style={[styles.introText, { color: colors.text + '90' }]}>
            Focusing on individual aspects of your speech—audio clarity or visual presence—helps you identify specific areas for improvement and build stronger presentation skills over time.
          </Text>
        </View>

        {/* AI Speech Analysis Section */}
        <View style={[styles.aiAnalysisCard, { backgroundColor: colors.text + '05' }]}>
          <View style={styles.aiAnalysisHeader}>
            <Text style={styles.aiAnalysisEmoji}>🤖</Text>
            <Text style={[styles.aiAnalysisTitle, { color: colors.text }]}>AI Speech Analysis</Text>
            {aiAnalysisLoading && (
              <View style={[styles.loadingBadge, { backgroundColor: colors.tint + '20' }]}>
                <Text style={[styles.loadingBadgeText, { color: colors.tint }]}>Analyzing...</Text>
              </View>
            )}
            {aiAnalysisComplete && (
              <View style={[styles.completeBadge, { backgroundColor: '#10B981' + '20' }]}>
                <Text style={[styles.completeBadgeText, { color: '#10B981' }]}>Complete</Text>
              </View>
            )}
          </View>
          
          {aiAnalysisLoading && (
            <View style={styles.aiLoadingContainer}>
              <Text style={[styles.aiLoadingText, { color: colors.text + '80' }]}>
                🎙️ Analyzing your speech patterns and delivery...
              </Text>
              <Text style={[styles.aiLoadingSubText, { color: colors.text + '60' }]}>
                • Evaluating speech clarity and pronunciation{'\n'}
                • Measuring speaking pace and rhythm{'\n'}
                • Detecting filler words and pauses{'\n'}
                • Assessing vocal variety and engagement{'\n'}
                • Generating personalized recommendations
              </Text>
              <View style={styles.loadingIndicatorContainer}>
                <View style={styles.loadingDots}>
                  <Animatable.View 
                    animation="pulse" 
                    iterationCount="infinite" 
                    duration={800}
                    style={[styles.loadingDot, { backgroundColor: colors.tint }]}
                  />
                  <Animatable.View 
                    animation="pulse" 
                    iterationCount="infinite" 
                    duration={800}
                    delay={200}
                    style={[styles.loadingDot, { backgroundColor: colors.tint }]}
                  />
                  <Animatable.View 
                    animation="pulse" 
                    iterationCount="infinite" 
                    duration={800}
                    delay={400}
                    style={[styles.loadingDot, { backgroundColor: colors.tint }]}
                  />
                </View>
              </View>
            </View>
          )}
          
          {aiAnalysisComplete && (
            <Animatable.View animation="fadeInUp" duration={600} style={styles.aiResultsContainer}>
              <View style={styles.aiSummaryContainer}>
                <Text style={[styles.aiSummaryTitle, { color: colors.text }]}>Analysis Summary</Text>
                <Text style={[styles.aiSummaryText, { color: colors.text + '90' }]}>
                  Your presentation shows strong confidence and clear articulation, with excellent engagement throughout. 
                  Key areas for improvement include reducing speaking pace and minimizing filler words. 
                  With focused practice on vocal variety, you're well on your way to becoming an exceptional speaker.
                </Text>
              </View>
              
              <View style={styles.aiScoreContainer}>
                <Text style={[styles.aiScoreLabel, { color: colors.text + '80' }]}>Overall Score</Text>
                <Text style={[styles.aiScore, { color: colors.tint }]}>8.2/10</Text>
                <Text style={[styles.aiScoreSubtext, { color: colors.text + '60' }]}>Excellent Performance</Text>
              </View>
              
              <View style={styles.aiMetricsContainer}>
                <View style={styles.aiMetric}>
                  <Text style={[styles.aiMetricLabel, { color: colors.text + '80' }]}>Speech Clarity</Text>
                  <View style={styles.aiMetricBar}>
                    <View style={[styles.aiMetricFill, { backgroundColor: '#10B981', width: '85%' }]} />
                  </View>
                  <Text style={[styles.aiMetricScore, { color: colors.text }]}>8.5</Text>
                </View>
                
                <View style={styles.aiMetric}>
                  <Text style={[styles.aiMetricLabel, { color: colors.text + '80' }]}>Speaking Pace</Text>
                  <View style={styles.aiMetricBar}>
                    <View style={[styles.aiMetricFill, { backgroundColor: '#F59E0B', width: '78%' }]} />
                  </View>
                  <Text style={[styles.aiMetricScore, { color: colors.text }]}>7.8</Text>
                </View>
                
                <View style={styles.aiMetric}>
                  <Text style={[styles.aiMetricLabel, { color: colors.text + '80' }]}>Confidence Level</Text>
                  <View style={styles.aiMetricBar}>
                    <View style={[styles.aiMetricFill, { backgroundColor: '#3B82F6', width: '82%' }]} />
                  </View>
                  <Text style={[styles.aiMetricScore, { color: colors.text }]}>8.2</Text>
                </View>
                
                <View style={styles.aiMetric}>
                  <Text style={[styles.aiMetricLabel, { color: colors.text + '80' }]}>Vocal Variety</Text>
                  <View style={styles.aiMetricBar}>
                    <View style={[styles.aiMetricFill, { backgroundColor: '#8B5CF6', width: '73%' }]} />
                  </View>
                  <Text style={[styles.aiMetricScore, { color: colors.text }]}>7.3</Text>
                </View>
                
                <View style={styles.aiMetric}>
                  <Text style={[styles.aiMetricLabel, { color: colors.text + '80' }]}>Filler Word Usage</Text>
                  <View style={styles.aiMetricBar}>
                    <View style={[styles.aiMetricFill, { backgroundColor: '#EF4444', width: '65%' }]} />
                  </View>
                  <Text style={[styles.aiMetricScore, { color: colors.text }]}>6.5</Text>
                </View>
                
                <View style={styles.aiMetric}>
                  <Text style={[styles.aiMetricLabel, { color: colors.text + '80' }]}>Engagement</Text>
                  <View style={styles.aiMetricBar}>
                    <View style={[styles.aiMetricFill, { backgroundColor: '#06B6D4', width: '88%' }]} />
                  </View>
                  <Text style={[styles.aiMetricScore, { color: colors.text }]}>8.8</Text>
                </View>
              </View>
              
              <View style={styles.aiInsightsContainer}>
                <Text style={[styles.aiInsightsTitle, { color: colors.text }]}>Key Insights</Text>
                <View style={styles.aiInsight}>
                  <Text style={styles.aiInsightEmoji}>✅</Text>
                  <Text style={[styles.aiInsightText, { color: colors.text + '90' }]}>
                    Excellent voice projection and clear articulation throughout
                  </Text>
                </View>
                <View style={styles.aiInsight}>
                  <Text style={styles.aiInsightEmoji}>🎯</Text>
                  <Text style={[styles.aiInsightText, { color: colors.text + '90' }]}>
                    Consider reducing speaking pace by 10-15% for better comprehension
                  </Text>
                </View>
                <View style={styles.aiInsight}>
                  <Text style={styles.aiInsightEmoji}>🎵</Text>
                  <Text style={[styles.aiInsightText, { color: colors.text + '90' }]}>
                    Add more vocal variety - vary your pitch and tone for emphasis
                  </Text>
                </View>
                <View style={styles.aiInsight}>
                  <Text style={styles.aiInsightEmoji}>⚠️</Text>
                  <Text style={[styles.aiInsightText, { color: colors.text + '90' }]}>
                    Detected 12 filler words ("um", "uh") - practice pausing instead
                  </Text>
                </View>
                <View style={styles.aiInsight}>
                  <Text style={styles.aiInsightEmoji}>💪</Text>
                  <Text style={[styles.aiInsightText, { color: colors.text + '90' }]}>
                    Strong confidence and engagement - keep up the great energy!
                  </Text>
                </View>
              </View>
              
              <View style={styles.aiActionableAdviceContainer}>
                <Text style={[styles.aiActionableTitle, { color: colors.text }]}>Actionable Recommendations</Text>
                
                <View style={styles.aiAdviceCard}>
                  <View style={styles.aiAdviceHeader}>
                    <Text style={styles.aiAdviceEmoji}>🏃‍♂️</Text>
                    <Text style={[styles.aiAdviceCategory, { color: colors.text }]}>Pace Control</Text>
                  </View>
                  <Text style={[styles.aiAdviceText, { color: colors.text + '90' }]}>
                    Practice the "pause and breathe" technique. Count to 1-2 between sentences to naturally slow your pace.
                  </Text>
                  <Text style={[styles.aiAdviceTip, { color: colors.tint }]}>
                    💡 Try: Record yourself reading for 1 minute, then replay at 0.8x speed to hear the ideal pace
                  </Text>
                </View>
                
                <View style={styles.aiAdviceCard}>
                  <View style={styles.aiAdviceHeader}>
                    <Text style={styles.aiAdviceEmoji}>🎼</Text>
                    <Text style={[styles.aiAdviceCategory, { color: colors.text }]}>Vocal Variety</Text>
                  </View>
                  <Text style={[styles.aiAdviceText, { color: colors.text + '90' }]}>
                    Emphasize key words by changing your pitch. Practice going higher for questions and lower for serious points.
                  </Text>
                  <Text style={[styles.aiAdviceTip, { color: colors.tint }]}>
                    💡 Try: Read children's stories aloud to practice exaggerated vocal variety, then dial it back
                  </Text>
                </View>
                
                <View style={styles.aiAdviceCard}>
                  <View style={styles.aiAdviceHeader}>
                    <Text style={styles.aiAdviceEmoji}>🚫</Text>
                    <Text style={[styles.aiAdviceCategory, { color: colors.text }]}>Eliminate Fillers</Text>
                  </View>
                  <Text style={[styles.aiAdviceText, { color: colors.text + '90' }]}>
                    Replace "um" and "uh" with strategic pauses. Silence is more powerful than filler words.
                  </Text>
                  <Text style={[styles.aiAdviceTip, { color: colors.tint }]}>
                    💡 Try: Have a friend count your fillers during practice - awareness is the first step
                  </Text>
                </View>
              </View>
              
              <View style={styles.aiProgressContainer}>
                <Text style={[styles.aiProgressTitle, { color: colors.text }]}>Your Progress Journey</Text>
                <View style={styles.aiProgressItem}>
                  <Text style={styles.aiProgressEmoji}>🏁</Text>
                  <View style={styles.aiProgressContent}>
                    <Text style={[styles.aiProgressLabel, { color: colors.text }]}>Short Term Goal (1-2 weeks)</Text>
                    <Text style={[styles.aiProgressText, { color: colors.text + '80' }]}>
                      Reduce filler words by 50% and practice 2-second pauses between sentences
                    </Text>
                  </View>
                </View>
                <View style={styles.aiProgressItem}>
                  <Text style={styles.aiProgressEmoji}>🎯</Text>
                  <View style={styles.aiProgressContent}>
                    <Text style={[styles.aiProgressLabel, { color: colors.text }]}>Medium Term Goal (1 month)</Text>
                    <Text style={[styles.aiProgressText, { color: colors.text + '80' }]}>
                      Master vocal variety with 3 distinct pitch levels and maintain optimal speaking pace
                    </Text>
                  </View>
                </View>
                <View style={styles.aiProgressItem}>
                  <Text style={styles.aiProgressEmoji}>🏆</Text>
                  <View style={styles.aiProgressContent}>
                    <Text style={[styles.aiProgressLabel, { color: colors.text }]}>Long Term Vision (3 months)</Text>
                    <Text style={[styles.aiProgressText, { color: colors.text + '80' }]}>
                      Achieve consistently confident, clear, and engaging delivery across all speaking situations
                    </Text>
                  </View>
                </View>
              </View>
            </Animatable.View>
          )}
        </View>
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

 

        {/* Analysis Notes Section */}
        <View style={[styles.notesCard, { backgroundColor: colors.text + '05' }]}>
          <Text style={[styles.notesTitle, { color: colors.text }]}>Analysis Notes</Text>
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
          onPress={async () => {
            // Save observations if provided
            if (userNotes.trim() && recording) {
              try {
                await updateRecordingObservations(recording.id, userNotes.trim());
              } catch (error) {
                console.error('Error saving observations:', error);
              }
            }
            
            const completionMessage = userNotes.trim() 
              ? 'Great job reviewing your recording and sharing your insights! Your observations have been saved and will help track your progress over time.'
              : 'Great job reviewing your recording! Consider adding your observations next time to track your improvement journey.';
            
            Alert.alert(
              'Analysis Complete',
              completionMessage,
              [{ text: 'OK', onPress: () => router.back() }]
            );
          }}
        >
          <IconSymbol name="checkmark.circle.fill" size={24} color="black" />
          <Text style={styles.completeButtonText}>Complete Analysis</Text>
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
    paddingVertical: 20,
    borderBottomWidth: 0,
  },
  backButton: {
    zIndex: 1,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  introCard: {
    margin: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
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
  // New colorful styles
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  backButtonEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  controlsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlsEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  segmentEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  // AI Analysis Styles
  aiAnalysisCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  aiAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  aiAnalysisEmoji: {
    fontSize: 20,
  },
  aiAnalysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  loadingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  completeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  aiLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  aiLoadingText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  aiLoadingSubText: {
    fontSize: 12,
    textAlign: 'left',
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  loadingIndicatorContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  aiResultsContainer: {
    gap: 16,
  },
  aiSummaryContainer: {
    backgroundColor: 'rgba(240, 230, 140, 0.15)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  aiSummaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  aiSummaryText: {
    fontSize: 13,
    lineHeight: 18,
  },
  aiScoreContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(240, 230, 140, 0.1)',
  },
  aiScoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  aiScore: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  aiMetricsContainer: {
    gap: 12,
  },
  aiMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiMetricLabel: {
    fontSize: 13,
    fontWeight: '500',
    width: 100,
  },
  aiMetricBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  aiMetricFill: {
    height: '100%',
    borderRadius: 3,
  },
  aiMetricScore: {
    fontSize: 13,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },
  aiInsightsContainer: {
    gap: 12,
  },
  aiInsightsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  aiInsight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  aiInsightEmoji: {
    fontSize: 16,
    marginTop: 1,
  },
  aiInsightText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  // Enhanced AI Analysis Styles
  aiScoreSubtext: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  aiActionableAdviceContainer: {
    marginTop: 20,
    gap: 16,
  },
  aiActionableTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  aiAdviceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  aiAdviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiAdviceEmoji: {
    fontSize: 18,
  },
  aiAdviceCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  aiAdviceText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  aiAdviceTip: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  aiProgressContainer: {
    marginTop: 20,
    gap: 16,
  },
  aiProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  aiProgressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F0E68C',
  },
  aiProgressEmoji: {
    fontSize: 16,
    marginTop: 2,
  },
  aiProgressContent: {
    flex: 1,
  },
  aiProgressLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  aiProgressText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
