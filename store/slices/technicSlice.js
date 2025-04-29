import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../config/firebase';
import { doc, setDoc, collection, getDocs, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';

const initialState = {
  technics: [],
  loading: false,
  error: null,
};

export const createTechnic = createAsyncThunk(
  'technic/create',
  async ({ title, description, imageUrl, videoUrl, audioUrl, userId, userEmail, difficulty, instrument, level }, { rejectWithValue }) => {
    try {
      if (!userId) {
        throw new Error('User ID is required to create a technic');
      }

      const technicData = {
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        videoUrl,
        audioUrl,
        userId,
        userEmail,
        difficulty,
        instrument,
        level,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const technicRef = doc(collection(db, 'Technic'));
      await setDoc(technicRef, technicData);
      
      const newTechnic = {
        id: technicRef.id,
        ...technicData,
      };
      
      return newTechnic;
    } catch (error) {
      console.error('Error creating technic:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTechnic = createAsyncThunk(
  'technic/fetchAll',
  async (userId, { rejectWithValue }) => {
    try {
      if (!userId) {
        console.error('User ID is required to fetch technic');
        throw new Error('User ID is required to fetch technic');
      }
      
      console.log('Fetching technics from Firestore for user:', userId);
      const q = query(collection(db, 'Technic'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      console.log('Found technic documents:', snapshot.docs.length);
      const technics = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing technic document:', doc.id, data);
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
      
      technics.sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.seconds : 0;
        const dateB = b.createdAt ? b.createdAt.seconds : 0;
        return dateB - dateA;
      });
    
      console.log('Returning sorted technics:', technics);
      return technics;
    } catch (error) {
      console.error('Error in fetchTechnic:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateTechnic = createAsyncThunk(
  'technic/update',
  async ({ id, title, description, imageUrl, videoUrl, audioUrl, userId, userEmail, difficulty, instrument, level }, { rejectWithValue }) => {
    try {
      if (!id || !userId) {
        throw new Error('Technic ID and User ID are required to update a technic');
      }

      const technicData = {
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        videoUrl,
        audioUrl,
        userId,
        userEmail,
        difficulty,
        instrument,
        level,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'Technic', id), technicData);
      
      return {
        id,
        ...technicData,
      };
    } catch (error) {
      console.error('Error updating technic:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTechnic = createAsyncThunk(
  'technic/delete',
  async (technicId, { rejectWithValue }) => {
    try {
      if (!technicId) {
        throw new Error('Technic ID is required to delete a technic');
      }
      
      await deleteDoc(doc(db, 'Technic', technicId));
      return technicId;
    } catch (error) {
      console.error('Error deleting technic:', error);
      return rejectWithValue(error.message);
    }
  }
);

const technicSlice = createSlice({
  name: 'technic',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTechnic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTechnic.fulfilled, (state, action) => {
        state.loading = false;
        state.technics.unshift(action.payload);
      })
      .addCase(createTechnic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTechnic.pending, (state) => {
        console.log('Fetching technics - pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTechnic.fulfilled, (state, action) => {
        console.log('Fetching technics - fulfilled:', action.payload);
        state.loading = false;
        state.technics = action.payload || [];
        state.error = null;
      })
      .addCase(fetchTechnic.rejected, (state, action) => {
        console.error('Fetching technics - rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
        state.technics = [];
      })
      .addCase(updateTechnic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTechnic.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.technics.findIndex(technic => technic.id === action.payload.id);
        if (index !== -1) {
          state.technics[index] = action.payload;
        }
      })
      .addCase(updateTechnic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteTechnic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTechnic.fulfilled, (state, action) => {
        state.loading = false;
        state.technics = state.technics.filter(technic => technic.id !== action.payload);
      })
      .addCase(deleteTechnic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = technicSlice.actions;
export default technicSlice.reducer; 