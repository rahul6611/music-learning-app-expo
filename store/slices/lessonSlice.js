import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFirestore, collection, doc, setDoc, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

const initialState = {
  lessons: [],
  loading: false,
  error: null,
};

export const createLesson = createAsyncThunk(
  'lessons/create',
  async ({ title, description, imageUrl, videoUrl, userId, userEmail }, { rejectWithValue }) => {
    try {
      if (!userId) {
        throw new Error('User ID is required to create a lesson');
      }

      const lessonData = {
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        videoUrl,
        userId,
        userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const lessonRef = doc(collection(db, 'Lesson'));
      await setDoc(lessonRef, lessonData);
      
      const newLesson = {
        id: lessonRef.id,
        ...lessonData,
      };
      
      return newLesson;
    } catch (error) {
      console.error('Error creating lesson:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchLessons = createAsyncThunk(
  'lessons/fetchAll',
  async (userId, { rejectWithValue }) => {
    try {
      if (!userId) {
        console.error('User ID is required to fetch lessons');
        throw new Error('User ID is required to fetch lessons');
      }
      
      console.log('Fetching lessons from Firestore for user:', userId);
      const q = query(collection(db, 'Lesson'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      console.log('Found lessons documents:', querySnapshot.docs.length);
      const lessons = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing lesson document:', doc.id, data);
        const createdAt = data.createdAt ? {
          seconds: data.createdAt.seconds,
          nanoseconds: data.createdAt.nanoseconds
        } : null;
        
        return {
          id: doc.id,
          ...data,
          createdAt: createdAt
        };
      });
      
      lessons.sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.seconds : 0;
        const dateB = b.createdAt ? b.createdAt.seconds : 0;
        return dateB - dateA;
      });
    
      console.log('Returning sorted lessons:', lessons);
      return lessons;
    } catch (error) {
      console.error('Error in fetchLessons:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateLesson = createAsyncThunk(
  'lessons/update',
  async ({ id, title, description, imageUrl, videoUrl, userId, userEmail }, { rejectWithValue }) => {
    try {
      if (!id || !userId) {
        throw new Error('Lesson ID and User ID are required to update a lesson');
      }

      const lessonData = {
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        videoUrl,
        userId,
        userEmail,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'Lesson', id), lessonData);
      
      return {
        id,
        ...lessonData,
      };
    } catch (error) {
      console.error('Error updating lesson:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const deleteLesson = createAsyncThunk(
  'lessons/delete',
  async (lessonId, { rejectWithValue }) => {
    try {
      if (!lessonId) {
        throw new Error('Lesson ID is required to delete a lesson');
      }
      
      await deleteDoc(doc(db, 'Lesson', lessonId));
      return lessonId;
    } catch (error) {
      console.error('Error deleting lesson:', error);
      return rejectWithValue(error.message);
    }
  }
);

const lessonSlice = createSlice({
  name: 'lessons',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createLesson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLesson.fulfilled, (state, action) => {
        state.loading = false;
        state.lessons.unshift(action.payload);
      })
      .addCase(createLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchLessons.pending, (state) => {
        console.log('Fetching lessons - pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLessons.fulfilled, (state, action) => {
        console.log('Fetching lessons - fulfilled:', action.payload);
        state.loading = false;
        state.lessons = action.payload || [];
        state.error = null;
      })
      .addCase(fetchLessons.rejected, (state, action) => {
        console.error('Fetching lessons - rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
        state.lessons = [];
      })
      .addCase(updateLesson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLesson.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.lessons.findIndex(lesson => lesson.id === action.payload.id);
        if (index !== -1) {
          state.lessons[index] = action.payload;
        }
      })
      .addCase(updateLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteLesson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLesson.fulfilled, (state, action) => {
        state.loading = false;
        state.lessons = state.lessons.filter(lesson => lesson.id !== action.payload);
      })
      .addCase(deleteLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = lessonSlice.actions;
export default lessonSlice.reducer; 