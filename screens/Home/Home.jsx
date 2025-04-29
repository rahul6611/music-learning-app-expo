import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Button, Text, Title } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';

export default function Home({ navigation }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  console.log('User:', user);
  

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isAuthenticated) {
    navigation.navigate('Login');
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="#fff"
        translucent={false}
      />
      <Title style={styles.title}>Welcome to Music Learning App</Title>
      <Text style={styles.subtitle}>Hello, {user?.role}!</Text>
      <Text style={styles.email}>Email: {user?.email}</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={handleLogout} 
          style={styles.button}
        >
          Logout
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  button: {
    marginVertical: 10,
  },
}); 