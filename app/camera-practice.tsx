import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BlurView } from 'expo-blur';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function CameraPracticeScreen() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [isRecording, setIsRecording] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <IconSymbol name="camera.fill" size={64} color={colors.text} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Camera Permission Required
          </Text>
          <Text style={[styles.permissionText, { color: colors.text }]}>
            We need access to your camera to help you practice speaking.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.tint }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.tint }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: colors.tint }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleRecordPress = async () => {
    if (!cameraRef.current) return;

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      cameraRef.current.stopRecording();
      Alert.alert('Recording Stopped', 'Your practice session has been saved!');
    } else {
      // Start recording
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({
          maxDuration: 30, // 30 second limit
        });
        if (video) {
          console.log('Video recorded:', video.uri);
        }
      } catch (error) {
        console.error('Recording failed:', error);
        setIsRecording(false);
      }
    }
  };

  const handleClosePress = () => {
    if (isRecording) {
      Alert.alert(
        'Recording in Progress',
        'Stop recording before closing?',
        [
          { text: 'Continue Recording', style: 'cancel' },
          { 
            text: 'Stop & Close', 
            style: 'destructive',
            onPress: () => {
              if (cameraRef.current) {
                cameraRef.current.stopRecording();
              }
              setIsRecording(false);
              router.back();
            }
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
      >
        {/* Gradient Overlays for better visual hierarchy */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        {/* Top Controls */}
        <SafeAreaView style={styles.topControls}>

          
          <View style={styles.topCenter}>
            <BlurView intensity={80} tint="dark" style={styles.titleBlur}>
              <Text style={styles.practiceTitle}>Practice Session</Text>
            </BlurView>
            {isRecording && (
              <BlurView intensity={90} tint="dark" style={styles.recordingIndicatorBlur}>
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording</Text>
                </View>
              </BlurView>
            )}
          </View>
                      <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClosePress}
          >
            <BlurView intensity={90} tint="dark" style={styles.blurButton}>
              <IconSymbol name="xmark" size={24} color="white" />
            </BlurView>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <BlurView intensity={90} tint="dark" style={styles.blurButton}>
              <IconSymbol name="arrow.triangle.2.circlepath.camera" size={24} color="white" />
            </BlurView>
          </TouchableOpacity> */}
        </SafeAreaView>

        {/* Practice Prompt Overlay */}
        <View style={styles.promptOverlay}>
          <BlurView intensity={85} tint="dark" style={styles.promptContainer}>
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']}
              style={styles.promptGradient}
            >
              <Text style={styles.promptTitle}>Today's Practice</Text>
              <Text style={styles.promptText}>
                "Introduce yourself and talk about your goals for the next 30 seconds"
              </Text>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <BlurView intensity={70} tint="dark" style={styles.bottomControlsBlur}>
            <View style={styles.controlsContainer}>
              {/* Gallery/Library button */}
              <TouchableOpacity
                style={styles.sideButton}
                onPress={() => Alert.alert('Gallery', 'View previous recordings')}
              >
                <BlurView intensity={90} tint="dark" style={styles.sideButtonBlur}>
                  <IconSymbol name="photo.on.rectangle" size={24} color="white" />
                </BlurView>
              </TouchableOpacity>

              {/* Record Button */}
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive
                ]}
                onPress={handleRecordPress}
              >
                <BlurView 
                  intensity={isRecording ? 80 : 60} 
                  tint={isRecording ? "light" : "dark"} 
                  style={styles.recordButtonBlur}
                >
                  <View style={[
                    styles.recordButtonInner,
                    isRecording && styles.recordButtonInnerActive
                  ]}>
                    {isRecording ? (
                      <View style={styles.stopIcon} />
                    ) : (
                      <IconSymbol name="mic.fill" size={32} color="white" />
                    )}
                  </View>
                </BlurView>
              </TouchableOpacity>

              {/* Settings button */}
              <TouchableOpacity
                style={styles.sideButton}
                onPress={() => Alert.alert('Settings', 'Practice settings')}
              >
                <BlurView intensity={90} tint="dark" style={styles.sideButtonBlur}>
                  <IconSymbol name="gear" size={24} color="white" />
                </BlurView>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 50,
    paddingTop: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 15,
  },
  blurButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  topCenter: {
    alignItems: 'center',
    flex: 1,
  },
  titleBlur: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  practiceTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  recordingIndicatorBlur: {
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  recordingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  promptOverlay: {
    position: 'absolute',
    top: '35%',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  promptContainer: {
    borderRadius: 16,
    maxWidth: width - 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  promptGradient: {
    padding: 20,
    borderRadius: 16,
  },
  promptTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  promptText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
  },
  bottomControlsBlur: {
    paddingTop: 20,
    paddingBottom: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  sideButtonBlur: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  recordButtonBlur: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    borderColor: 'rgba(255,0,0,0.8)',
  },
  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{translateX: -3}, {translateY: -3}],
  },
  recordButtonInnerActive: {
    backgroundColor: 'white',
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'red',
    borderRadius: 4,
  },
});
