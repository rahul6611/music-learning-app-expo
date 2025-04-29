import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth, db } from '../../config/firebase';
import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithEmailAndPassword,
  signInWithRedirect
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  role: null,
  allUsers: [] 
};

export const signupUser = createAsyncThunk(
  'auth/signup',
  async ({ email, password, role, name }, { dispatch }) => {
    try {   
      dispatch(signupStart());
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('signup>>> user', userCredential);
      
      if (name) {
        await updateProfile(userCredential.user, {
          displayName: name
        });
      }
      
      if (userCredential.user.uid) {
        const userDataToStore = {
          email: email,
          role: role,
          fullName: name || '',
          createdAt: serverTimestamp()
        };

        try {
          const userRef = doc(db, 'users', userCredential.user.uid);
          await setDoc(userRef, userDataToStore, { merge: true });
          
          const verifyDoc = await getDoc(userRef);
          if (verifyDoc.exists()) {
            console.log('Successfully verified data in Firestore:', verifyDoc.data());
          } else {
            console.error('Write appeared to succeed but document does not exist');
          }

          const userWithRole = {
            ...userCredential.user,
            role: role
          };
          
          dispatch(signupSuccess(userWithRole));
        } catch (firestoreError) {
          console.error('Detailed Firestore error:', {
            code: firestoreError.code,
            message: firestoreError.message,
            details: firestoreError.details,
          });
          throw new Error(`Failed to store user data: ${firestoreError.message}`);
        }
      }
      
      return userCredential;
    } catch (error) {
      console.error('Signup error:', error);
      dispatch(signupFailure(error.message));
      throw error;
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { dispatch }) => {
    try {
      dispatch(loginStart());
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('login>>> user', userCredential);
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      const userWithRole = {
        ...userCredential.user,
        role: userData.role
      };
      
      dispatch(loginSuccess(userWithRole));
      return userWithRole;
    } catch (error) {
      console.log('login error', error);
      dispatch(loginFailure(error.message));
      if (error.code === 'auth/email-already-in-use') {
        dispatch(loginFailure('That email address is already in use!'));
      }
      if (error.code === 'auth/invalid-email') {
        dispatch(loginFailure('That email address is invalid!'));
      }
      
      throw error;
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (_, { dispatch }) => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithCredential(auth, provider);
      console.log('Google login>>> user', result);
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          fullName: result.user.displayName || '',
          role: 'student',
          createdAt: serverTimestamp(),
          googleSignIn: true
        });
      }
      
      const userData = userDoc.exists() ? userDoc.data() : { role: 'student' };
      const userWithRole = {
        ...result.user,
        role: userData.role || 'student'
      };
      
      dispatch(loginSuccess(userWithRole));
      return result;
    } catch (error) {
      console.error('Google login error:', error);
      dispatch(loginFailure(error.message));
      throw error;
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));      
      return users;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await signOut(auth);
      dispatch(logout());
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
   extraReducers: (builder) => {
      builder
        .addCase(fetchUsers.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchUsers.fulfilled, (state, action) => {
          state.loading = false;
          state.allUsers = action.payload;
        })
        .addCase(fetchUsers.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })
    },
  reducers: {
    signupStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    signupSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.role = action.payload.role;
      state.error = null;
    },
    signupFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.role = action.payload.role;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.role = null;
    },
  },
});

export const { 
  signupStart, 
  signupSuccess, 
  signupFailure,
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout 
} = authSlice.actions;

export default authSlice.reducer; 