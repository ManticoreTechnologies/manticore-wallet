import React, { useLayoutEffect, useCallback } from 'react';
import { StyleSheet, View, Image, BackHandler, ActivityIndicator, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useGlobalSearchParams } from 'expo-router';

const LoadingScreen = () => {
  const { message }: any = useGlobalSearchParams();

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        // Do nothing when back button is pressed
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => backHandler.remove();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/banner.png')}
        style={styles.banner}
      />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>{message ? message : "Loading..."}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  banner: {
    width: '100%',
    height: '30%',
    resizeMode: 'contain',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#ff0000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LoadingScreen;
