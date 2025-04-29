import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import lessonReducer from './slices/lessonSlice';
import classReducer from './slices/classSlice';
import teacherReducer from './slices/teacherSlice';
import technicReducer from './slices/technicSlice';
import assignmentReducer from './slices/assignmentSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    lessons: lessonReducer,
    class : classReducer,
    teacher: teacherReducer,
    technic: technicReducer,
    assignments: assignmentReducer,
  },
});

export default store; 