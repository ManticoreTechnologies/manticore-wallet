import React, { useState, useLayoutEffect, useCallback, useEffect } from 'react';
import { StyleSheet, View, TextInput, Button, Alert, BackHandler, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { createWallet, saveWallet, walletExists } from '@/hooks/secure/wallet';
import { ThemedText } from '@/components/ThemedText';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as bip39 from '@/components/evrmorejs-lib/bip39';
import ColorLogger from '@/components/ColorLogger';

/* Seed phrase recovery/creation page */
const EnterSeedPhrase = () => {

  const name: any = ["RecoveryScreen", "yellow", "underscore"]
  const [mnemonic, setMnemonic] = useState('');
  const navigation = useNavigation();
  const router = useRouter();

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

  const handleSubmit = async () => {
    if (mnemonic.trim() === '') {
      Alert.alert('Error', 'Mnemonic phrase cannot be empty');
      return;
    }

    await saveWallet(createWallet(mnemonic))    
    if(await walletExists()){
      ColorLogger.log(name, ["Successfully created and saved wallet", "green", "bright"])
      router.replace({ pathname: '(tabs)' }); // Navigate to the home screen

    }else{
      ColorLogger.log(name, ["Failed to create wallet", "lightRed"])
    }

  };

  const handleGeneratePhrase = () => {
    const newMnemonic = bip39.generateMnemonic(256);
    setMnemonic(newMnemonic);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={styles.logo}
      />
      <View style={styles.header}>
        <ThemedText style={styles.title}>Recover Wallet</ThemedText>
        <ThemedText style={styles.subtitle}>Enter your mnemonic phrase to recover your wallet</ThemedText>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Enter mnemonic phrase"
        value={mnemonic}
        onChangeText={setMnemonic}
        multiline
        numberOfLines={4}
        placeholderTextColor="#999"
      />
      <View style={styles.buttonContainer}>
        <Button title="Submit" onPress={handleSubmit} color="#ff0000" />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Generate New Phrase" onPress={handleGeneratePhrase} color="#ff0000" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#000',
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  input: {
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 8,
    marginBottom: 16,
    color: '#fff',
    backgroundColor: '#1e1e1e',
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginBottom: 16,
  },
});

export default EnterSeedPhrase;
