import React from 'react';
import {View, Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../types/navigation';
import SignInScreen from '../screens/auth/SignInScreen';
import EmailSignInScreen from '../screens/auth/EmailSignInScreen';
import EmailSignUpScreen from '../screens/auth/EmailSignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import ConnectWalletScreen from '../screens/auth/ConnectWalletScreen';
import CreateProfileScreen from '../screens/auth/CreateProfileScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  // console.log('AuthNavigator rendering');
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="EmailSignIn"
        component={EmailSignInScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="EmailSignUp"
        component={EmailSignUpScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ConnectWallet"
        component={ConnectWalletScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="CreateProfile"
        component={CreateProfileScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}
