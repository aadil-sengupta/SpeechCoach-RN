import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraType } from 'expo-camera';

// Interface for recording metadata
export interface RecordingMetadata {
  id: string;
  fileName: string;
  localUri: string;
  photoLibraryUri?: string;
  timestamp: string;
  duration?: number;
  promptText: string;
  facing: CameraType;
  createdAt: Date;
  recordedDate: string;
  fileSize?: number;
}

// Constants for AsyncStorage
export const RECORDINGS_STORAGE_KEY = 'speechcoach_recordings';

// Helper functions for managing recording metadata
export const saveRecordingMetadata = async (metadata: RecordingMetadata): Promise<void> => {
  try {
    const existingRecordings = await getRecordingMetadata();
    const updatedRecordings = [...existingRecordings, metadata];
    await AsyncStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(updatedRecordings));
    console.log('Recording metadata saved:', metadata.id);
  } catch (error) {
    console.error('Error saving recording metadata:', error);
  }
};

export const getRecordingMetadata = async (): Promise<RecordingMetadata[]> => {
  try {
    const recordings = await AsyncStorage.getItem(RECORDINGS_STORAGE_KEY);
    return recordings ? JSON.parse(recordings) : [];
  } catch (error) {
    console.error('Error retrieving recording metadata:', error);
    return [];
  }
};

export const deleteRecordingMetadata = async (recordingId: string): Promise<void> => {
  try {
    const existingRecordings = await getRecordingMetadata();
    const filteredRecordings = existingRecordings.filter(recording => recording.id !== recordingId);
    await AsyncStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(filteredRecordings));
    console.log('Recording metadata deleted:', recordingId);
  } catch (error) {
    console.error('Error deleting recording metadata:', error);
  }
};

export const clearAllRecordingMetadata = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(RECORDINGS_STORAGE_KEY);
    console.log('All recording metadata cleared');
  } catch (error) {
    console.error('Error clearing recording metadata:', error);
  }
};

export const exportRecordingMetadata = async (): Promise<RecordingMetadata[] | null> => {
  try {
    const recordings = await getRecordingMetadata();
    console.log('Exported recording metadata:', recordings);
    return recordings;
  } catch (error) {
    console.error('Error exporting recording metadata:', error);
    return null;
  }
};

export const generateRecordingId = (): string => {
  return `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get recording statistics
export const getRecordingStatistics = async () => {
  try {
    const recordings = await getRecordingMetadata();
    const totalRecordings = recordings.length;
    const totalSize = recordings.reduce((sum, recording) => sum + (recording.fileSize || 0), 0);
    const averageSize = totalRecordings > 0 ? totalSize / totalRecordings : 0;
    
    // Group by date
    const recordingsByDate: { [date: string]: number } = {};
    recordings.forEach(recording => {
      const date = recording.recordedDate;
      recordingsByDate[date] = (recordingsByDate[date] || 0) + 1;
    });
    
    // Most used prompts
    const promptCounts: { [prompt: string]: number } = {};
    recordings.forEach(recording => {
      promptCounts[recording.promptText] = (promptCounts[recording.promptText] || 0) + 1;
    });
    
    return {
      totalRecordings,
      totalSize,
      averageSize,
      recordingsByDate,
      promptCounts,
      mostRecentRecording: recordings.length > 0 ? recordings.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0] : null
    };
  } catch (error) {
    console.error('Error calculating recording statistics:', error);
    return {
      totalRecordings: 0,
      totalSize: 0,
      averageSize: 0,
      recordingsByDate: {},
      promptCounts: {},
      mostRecentRecording: null
    };
  }
};
