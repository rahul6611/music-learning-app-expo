import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, StatusBar } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { googleLogin, loginUser } from '../../store/slices/authSlice';
import { TextInput, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { loading, error, user, role } = useSelector((state) => state.auth);
  const { colors } = useTheme();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '920083811255-hlvpjgpb0ts9lkqup4nqttbumqrn3sak.apps.googleusercontent.com',
    webClientId: '920083811255-ob7lcejblq95r17lovuun439jiehgfh3.apps.googleusercontent.com',
    iosClientId: '920083811255-iup9p7e3uae01s8ba3e2c3sq2bi41lom.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication);
    }
  }, [response]);

  const handleGoogleLogin = async (authentication) => {
    try {
      await dispatch(googleLogin(authentication));
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Google Login Failed', error.message);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await dispatch(loginUser({ email, password }));
      setEmail('');
      setPassword('');
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="#fff"
        translucent={false}
      />
      <Text style={[styles.title, { color: colors.primary }]}>Login</Text>
      
      <TextInput
        style={styles.input}
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        activeOutlineColor={colors.primary}
      />
      <TextInput
        style={styles.input}
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        activeOutlineColor={colors.primary}
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => promptAsync()}
        disabled={loading}
      >
        <View style={styles.buttonContent}>
          <Icon name="google" size={24} color="white" style={styles.icon} />
          <Text style={styles.buttonText}>Login with Google</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Signup')}
        style={styles.linkButton}
      >
        <Text style={[styles.linkText, { color: colors.primary }]}>
          Don't have an account? Sign up
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
});

export default Login; 
