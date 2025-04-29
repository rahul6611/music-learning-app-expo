import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Linking,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { createTechnic, updateTechnic } from '../../store/slices/technicSlice';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';

const CreateTechnic = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [difficulty, setDifficulty] = useState('Beginner');
  const [instrument, setInstrument] = useState('Piano');
  const [level, setLevel] = useState('1');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [technicId, setTechnicId] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState('00:00');
  const [audioFileName, setAudioFileName] = useState('');
  const [audioDuration, setAudioDuration] = useState('');
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const recordingTimer = useRef(null);

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (route.params?.technic) {
      const { technic } = route.params;
      setTitle(technic.title);
      setDescription(technic.description || '');
      setImageUri(technic.imageUrl);
      setVideoUri(technic.videoUrl);
      setAudioUri(technic.audioUrl);
      setDifficulty(technic.difficulty || 'Beginner');
      setInstrument(technic.instrument || 'Piano');
      setLevel(technic.level || '1');
      setIsEditing(true);
      setTechnicId(technic.id);
    }
  }, [route.params]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimer.current);
      setRecordingTime(0);
    }

    return () => {
      clearInterval(recordingTimer.current);
    };
  }, [isRecording]);

  const requestPermissions = async (type) => {
    try {
      if (Platform.OS === 'ios') {
        if (type === 'camera') {
          if (hasCameraPermission) return true;
          const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
          if (cameraStatus !== 'granted') {
            Alert.alert(
              'Camera Permission Required',
              'Please grant camera permission to take photos and videos',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
            return false;
          }
          setHasCameraPermission(true);
          return true;
        } else if (type === 'mediaLibrary') {
          if (hasMediaLibraryPermission) return true;
          const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (mediaStatus !== 'granted') {
            Alert.alert(
              'Media Library Permission Required',
              'Please grant access to your media library',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
            return false;
          }
          setHasMediaLibraryPermission(true);
          return true;
        } else if (type === 'audio') {
          const { status: audioStatus } = await Audio.requestPermissionsAsync();
          if (audioStatus !== 'granted') {
            Alert.alert(
              'Microphone Permission Required',
              'Please grant microphone permission to record audio',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
            return false;
          }
          return true;
        }
      } else {
        // Android permissions
        if (type === 'camera') {
          if (hasCameraPermission) return true;
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'App needs camera permission to take photos and videos',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          setHasCameraPermission(isGranted);
          return isGranted;
        } else if (type === 'mediaLibrary') {
          if (hasMediaLibraryPermission) return true;
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'App needs storage permission to access media files',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          setHasMediaLibraryPermission(isGranted);
          return isGranted;
        } else if (type === 'audio') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'App needs microphone permission to record audio',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      }
      return false;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const handleImagePick = async () => {
    try {
      const hasPermission = await requestPermissions('mediaLibrary');
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image pick error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleVideoPick = async () => {
    try {
      const hasPermission = await requestPermissions('mediaLibrary');
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Video pick error:', error);
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const handleAudioPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'application/octet-stream', 'audio/mpeg', 'audio/wav', 'audio/mp3'],
        copyToCacheDirectory: true,
      });

      console.log('Audio pick result:', result);

      if (!result.canceled) {
        const fileName = result.assets[0].name || 'Audio File';
        setAudioFileName(fileName);
        setAudioUri(result.assets[0].uri);
        setIsAudioLoaded(true);

        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: result.assets[0].uri },
            { shouldPlay: false }
          );
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            const durationInSeconds = Math.floor(status.durationMillis / 1000);
            setAudioDuration(formatTime(durationInSeconds));
          }
          sound.unloadAsync();
        } catch (error) {
          console.error('Error getting audio duration:', error);
          setAudioDuration('Unknown');
        }
      }
    } catch (error) {
      console.error('Audio pick error:', error);
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const handleImageCapture = async () => {
    try {
      const hasPermission = await requestPermissions('camera');
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(
        'Error',
        'Failed to access camera. Please make sure you have granted camera permissions and try again.'
      );
    }
  };

  const handleVideoCapture = async () => {
    try {
      const hasPermission = await requestPermissions('camera');
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 600,
        exif: false,
      });

      if (!result.canceled) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(
        'Error',
        'Failed to access camera. Please make sure you have granted camera permissions and try again.'
      );
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions('audio');
      if (!hasPermission) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordingTime(0);
      setRecordingDuration('00:00');

      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          setRecordingDuration(formatTime(newTime));
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      clearInterval(recordingTimer.current);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      setAudioUri(uri);

      await MediaLibrary.saveToLibraryAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const playSound = async () => {
    try {
      if (!audioUri) return;

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      setSound(sound);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      await sound.playAsync();
    } catch (error) {
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const stopSound = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to stop audio');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the technique');
      return;
    }

    if (!user || !user.uid) {
      Alert.alert('Error', 'You must be logged in to create a technique');
      return;
    }

    try {
      setLoading(true);
      const technicData = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUri,
        videoUrl: videoUri,
        audioUrl: audioUri,
        userId: user.uid,
        userEmail: user.email,
        difficulty,
        instrument,
        level,
      };

      if (isEditing) {
        technicData.id = technicId;
        await dispatch(updateTechnic(technicData)).unwrap();
      } else {
        await dispatch(createTechnic(technicData)).unwrap();
      }

      Alert.alert(
        'Success',
        `Technique ${isEditing ? 'updated' : 'created'} successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to ${isEditing ? 'update' : 'save'} technique: ${error}`
      );
    } finally {
      setLoading(false);
    }
  };

  const instrumentList = ['Piano', 'Guitar', 'Violin', 'Drums', 'Flute'];
  const levelList = ['1', '2', '3', '4', '5'];
  const DifficultyList = ['Beginner', 'Intermediate', 'Advanced'];
  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter technique title"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter technique description"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Instrument</Text>
        <View style={styles.instrumentContainer}>
          {instrumentList.map((inst) => (
            <TouchableOpacity
              key={inst}
              style={[
                styles.instrumentButton,
                instrument === inst && styles.selectedInstrument,
              ]}
              onPress={() => setInstrument(inst)}
            >
              <Text
                style={[
                  styles.instrumentText,
                  instrument === inst && styles.selectedInstrumentText,
                ]}
              >
                {inst}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Level</Text>
        <View style={styles.levelContainer}>
          {levelList.map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.levelButton,
                level === lvl && styles.selectedLevel,
              ]}
              onPress={() => setLevel(lvl)}
            >
              <Text
                style={[
                  styles.levelText,
                  level === lvl && styles.selectedLevelText,
                ]}
              >
                {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Difficulty Level</Text>
        <View style={styles.difficultyContainer}>
          {DifficultyList.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.difficultyButton,
                difficulty === level && styles.selectedDifficulty,
              ]}
              onPress={() => setDifficulty(level)}
            >
              <Text
                style={[
                  styles.difficultyText,
                  difficulty === level && styles.selectedDifficultyText,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Image</Text>
        <View style={styles.mediaButtonsContainer}>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handleImagePick}
          >
            <Icon name="image" size={24} color="#6200EE" />
            <Text style={styles.mediaButtonText}>Select Image</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handleImageCapture}
          >
            <Icon name="camera" size={24} color="#6200EE" />
            <Text style={styles.mediaButtonText}>Capture Image</Text>
          </TouchableOpacity>
        </View>
        {imageUri && (
          <View style={styles.mediaPreview}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => setImageUri(null)}
            >
              <Icon name="times-circle" size={24} color="#6200EE" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Video</Text>
        <View style={styles.mediaButtonsContainer}>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handleVideoPick}
          >
            <Icon name="video-camera" size={24} color="#6200EE" />
            <Text style={styles.mediaButtonText}>Select Video</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handleVideoCapture}
          >
            <Icon name="video-camera" size={24} color="#6200EE" />
            <Text style={styles.mediaButtonText}>Record Video</Text>
          </TouchableOpacity>
        </View>
        {videoUri && (
          <View style={styles.mediaPreview}>
            <View style={styles.videoPreview}>
              <Image 
                source={{ uri: videoUri }} 
                style={styles.videoThumbnail}
                resizeMode="cover"
              />
              <View style={styles.videoOverlay}>
                <Icon name="play-circle" size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.videoText}>Video Selected</Text>
              <Text style={styles.videoUriText} numberOfLines={1} ellipsizeMode="middle">
                {videoUri.split('/').pop()}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => setVideoUri(null)}
            >
              <Icon name="times-circle" size={24} color="#6200EE" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Audio</Text>
        <View style={styles.mediaButtonsContainer}>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handleAudioPick}
          >
            <Icon name="music" size={24} color="#6200EE" />
            <Text style={styles.mediaButtonText}>Select Audio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mediaButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Icon 
              name={isRecording ? "stop-circle" : "microphone"} 
              size={24} 
              color={isRecording ? "#FF0000" : "#6200EE"} 
            />
            <Text style={styles.mediaButtonText}>
              {isRecording ? "Stop Recording" : "Record Audio"}
            </Text>
          </TouchableOpacity>
        </View>
        {isRecording && (
          <View style={styles.recordingTimer}>
            <Icon name="microphone" size={24} color="#FF0000" />
            <Text style={styles.recordingTimeText}>
              Recording: {recordingDuration}
            </Text>
          </View>
        )}
        {audioUri && (
          <View style={styles.mediaPreview}>
            <View style={styles.audioPreview}>
              <Icon name="music" size={40} color="#6200EE" />
              <Text style={styles.audioText}>Audio Selected</Text>
              <Text style={styles.audioUriText} numberOfLines={1} ellipsizeMode="middle">
                {audioFileName || audioUri.split('/').pop()}
              </Text>
              <View style={styles.audioControls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={isPlaying ? stopSound : playSound}
                >
                  <Icon 
                    name={isPlaying ? "stop-circle" : "play-circle"} 
                    size={24} 
                    color="#6200EE" 
                  />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => {
                setAudioUri(null);
                setAudioFileName('');
                setAudioDuration('');
                setIsAudioLoaded(false);
                if (sound) {
                  sound.unloadAsync();
                  setSound(null);
                  setIsPlaying(false);
                }
              }}
            >
              <Icon name="times-circle" size={24} color="#6200EE" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#6200EE" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Technique' : 'Create Technique'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  instrumentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  instrumentButton: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    elevation: 2,
  },
  selectedInstrument: {
    backgroundColor: '#6200EE',
  },
  instrumentText: {
    fontSize: 14,
    color: '#333',
  },
  selectedInstrumentText: {
    color: '#FFFFFF',
  },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  levelButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    elevation: 2,
  },
  selectedLevel: {
    backgroundColor: '#6200EE',
  },
  levelText: {
    fontSize: 14,
    color: '#333',
  },
  selectedLevelText: {
    color: '#FFFFFF',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  difficultyButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    elevation: 2,
  },
  selectedDifficulty: {
    backgroundColor: '#6200EE',
  },
  difficultyText: {
    fontSize: 14,
    color: '#333',
  },
  selectedDifficultyText: {
    color: '#FFFFFF',
  },
  mediaButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    elevation: 2,
  },
  mediaButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6200EE',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#6200EE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 5,
  },
  mediaPreview: {
    marginTop: 10,
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    position: 'absolute',
    bottom: 40,
    left: 10,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  videoUriText: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    color: '#FFFFFF',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  audioPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  audioText: {
    marginTop: 10,
    color: '#424242',
    fontSize: 16,
    fontWeight: 'bold',
  },
  audioUriText: {
    marginTop: 5,
    color: '#757575',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: '90%',
  },
  audioControls: {
    marginTop: 10,
  },
  playButton: {
    padding: 10,
  },
  recordingTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE5E5',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  recordingTimeText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  recordingButton: {
    backgroundColor: '#FFE5E5',
  },
});

export default CreateTechnic; 