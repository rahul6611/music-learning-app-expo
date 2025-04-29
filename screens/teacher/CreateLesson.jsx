import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useSelector, useDispatch } from 'react-redux';
import { createLesson, updateLesson } from '../../store/slices/lessonSlice';

const CreateLesson = ({ navigation, route }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [lessonId, setLessonId] = useState(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.lessons);

  useEffect(() => {
      if (route.params?.lesson) {
      const { lesson } = route.params;
      setTitle(lesson.title);
      setDescription(lesson.description);
      setImageUri(lesson.imageUrl|| null);
      setVideoUri(lesson.videoUrl|| null);
      setLessonId(lesson.id);
      setIsEditing(true);
    }
  }, [route.params]);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        return false;
      }
      return true;
    }
    return true;
  };

  const pickMedia = async (type) => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      let result;
      if (type === 'photo') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else if (type === 'image') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else if (type === 'video') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          quality: 0.8,
          videoMaxDuration: 600, // 10 minutes
        });
      }

      if (!result.canceled) {
        if (type === 'video') {
          setVideoUri(result.assets[0].uri);
        } else {
          setImageUri(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Media picker error:', error);
      Alert.alert('Error', 'Failed to access media. Please check your permissions and try again.');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the lesson');
      return;
    }

    if (!user || !user.uid) {
      Alert.alert('Error', 'You must be logged in to create a lesson');
      return;
    }

    try {
      const lessonData = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUri,
        videoUrl: videoUri,
        userId: user.uid,
        userEmail: user.email,
      };

      if (isEditing) {
        lessonData.id = lessonId;
        await dispatch(updateLesson(lessonData)).unwrap();
      } else {
        await dispatch(createLesson(lessonData)).unwrap();
      }

      Alert.alert(
        'Success',
        `Lesson ${isEditing ? 'updated' : 'created'} successfully!`,
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
        `Failed to ${isEditing ? 'update' : 'save'} lesson: ${error}`
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Lesson' : 'Create New Lesson'}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter lesson title"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter lesson description"
          multiline
          numberOfLines={4}
        />

        <View style={styles.mediaSection}>
          <Text style={styles.label}>Add Media</Text>
          <View style={styles.mediaButtons}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => pickMedia('image')}
            >
              <Icon name="image" size={24} color="#6200EE" />
              <Text style={styles.mediaButtonText}>Choose Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => pickMedia('video')}
            >
              <Icon name="video-camera" size={24} color="#6200EE" />
              <Text style={styles.mediaButtonText}>Choose Video</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <View style={styles.mediaPreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => setImageUri(null)}
              >
                <Icon name="times-circle" size={24} color="#FF0000" />
              </TouchableOpacity>
            </View>
          )}

          {videoUri && (
            <View style={styles.mediaPreview}>
              <View style={styles.videoPreview}>
                <Icon name="play-circle" size={40} color="#6200EE" />
                <Text style={styles.videoText}>Video Selected</Text>
                <Text style={styles.videoUriText} numberOfLines={1} ellipsizeMode="middle">
                  {videoUri.split('/').pop()}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => setVideoUri(null)}
              >
                <Icon name="times-circle" size={24} color="#FF0000" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, (!title.trim() || loading) && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={!title.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{isEditing ? 'Update Lesson' : 'Save Lesson'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#6200EE',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  mediaSection: {
    marginBottom: 20,
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  mediaButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '45%',
  },
  mediaButtonText: {
    marginTop: 8,
    color: '#424242',
  },
  mediaPreview: {
    marginTop: 20,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  videoText: {
    marginTop: 10,
    color: '#424242',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoUriText: {
    marginTop: 5,
    color: '#757575',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: '90%',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
  },
  saveButton: {
    backgroundColor: '#6200EE',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateLesson; 