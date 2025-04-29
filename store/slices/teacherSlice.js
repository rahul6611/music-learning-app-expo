import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth, db } from '../../config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const initialState = {
  myStudents: [],
  loading: false,
  error: null,
};

export const addStudentByTeacher = createAsyncThunk(
  'auth/addStudentByTeacher',
  async ({ email, password, role, name }, { dispatch }) => {
    try {   
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('signup>>> user', userCredential);

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

          if (name) {
            await updateProfile(userCredential.user, {
              displayName: name
            });
          }

          const userWithRole = {
            ...userCredential.user,
            role: role
          };
          
          return userWithRole;
        } catch (firestoreError) {
          console.error('Detailed Firestore error:', {
            code: firestoreError.code,
            message: firestoreError.message,
            details: firestoreError.details,
          });
          throw new Error(`Failed to store user data: ${firestoreError.message}`);
        }
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }
);

const teacherSlice = createSlice({
  name: 'teacher',
  initialState,
  reducers: {
    addStudent: (state, action) => {
      if (!state.myStudents.includes(action.payload)) {
        state.myStudents.push(action.payload);
      }
    },
    removeStudent: (state, action) => {
      state.myStudents = state.myStudents.filter(id => id !== action.payload);
    },
    clearStudents: (state) => {
      state.myStudents = [];
    },
  },
});

export const { addStudent, removeStudent, clearStudents } = teacherSlice.actions;
export default teacherSlice.reducer; 