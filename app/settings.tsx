/*
  Phoenix Campanile
  Manticore Technologies, LLC
  (c) 2024

  @/app/settings.tsx
  The settings page where mnemonic phrase and HD seed will be shown.
  This is also going to be where the user will be able to customize 
  certain aspects of the app like colors, banners, etc. as well as 
  to dump the wallet file for backup and other operational tasks.
*/

/* Imports */
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { UseWallet, deleteWallet } from '@/hooks/secure/wallet';
import { deleteAllAddresses } from '@/components/useAddress';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import React, { useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* The settings screen */
const SettingsScreen: React.FC = () => {
  /* Load the wallet, if no wallet exists then the 
     hook will redirect to the recovery screen 
  */
  const wallet = UseWallet();
  
  /* Setup local states for mnemonic and HD seed */
  const [mnemonic, setMnemonic] = useState<string>('');
  const [seed, setSeed] = useState<string>('');
  const [showMnemonic, setShowMnemonic] = useState<boolean>(false);
  const [showSeed, setShowSeed] = useState<boolean>(false);

  /* Use the router hook */
  const router = useRouter();

  useEffect(() => {
    if (wallet) {
      setSeed(wallet.seed);
      setMnemonic(wallet.mnemonic);
    }
  }, [wallet]);

  const handleDeleteWallet = async () => {
    const success = await deleteWallet();
    await AsyncStorage.removeItem("addresses.dat")
    await AsyncStorage.removeItem("changeAddresses.dat")
    if (success) {
      router.push({ pathname: "enter-seed-phrase" });
    } else {
      Alert.alert('Error', 'Failed to delete wallet');
    }
  };

  const confirmDeleteWallet = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete the wallet? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDeleteWallet },
      ],
      { cancelable: false }
    );
  };

  const maskText = (text: string) => {
    return text.split('').map(char => (char === ' ' ? ' ' : '*')).join('');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <ThemedView style={styles.seedContainer}>
        <View style={styles.seedPhraseContainer}>
          <View style={styles.row}>
            <ThemedText style={styles.title}>Mnemonic Phrase</ThemedText>
            <TouchableOpacity onPress={() => setShowMnemonic(!showMnemonic)}>
              <Ionicons name={showMnemonic ? 'eye-off' : 'eye'} size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Copyable data={mnemonic} text={showMnemonic ? mnemonic : maskText(mnemonic)} />
          <View style={styles.row}>
            <ThemedText style={styles.title}>HD Seed</ThemedText>
            <TouchableOpacity onPress={() => setShowSeed(!showSeed)}>
              <Ionicons name={showSeed ? 'eye-off' : 'eye'} size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Copyable text={showSeed ? seed : maskText(seed)} />
        </View>
      </ThemedView>
      <Button text="Delete Wallet" callback={confirmDeleteWallet} />
      <Button text="Backup Wallet" callback={() => Alert.alert('Backup', 'Backup wallet functionality goes here.')} />
      <Button text="Change PIN" callback={() => Alert.alert('Change PIN', 'Change PIN functionality goes here.')} />
      <Button text="Export Transactions" callback={() => Alert.alert('Export Transactions', 'Export transactions functionality goes here.')} />
      <Button text="Customize Appearance" callback={() => Alert.alert('Customize Appearance', 'Customize appearance functionality goes here.')} />
    </View>
  );
};

const Button = ({ text, callback }: { text: string, callback: () => void }) => {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.actionButton} onPress={callback}>
        <ThemedText style={styles.buttonText}>{text}</ThemedText>
      </TouchableOpacity>
    </View>
  );
};

const Copyable = ({ text , data}: { text: string , data?: string }) => {
  const handleCopyToClipboard = async (t: string) => {
    await Clipboard.setStringAsync(t);
    Alert.alert('Copied', 'Text copied to clipboard.');
  };

  return (
    <TouchableOpacity onPress={() => handleCopyToClipboard(data?data:text)}>
      <ThemedText style={styles.copyableText}>{text}</ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 16,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFF',
  },
  buttonContainer: {
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#ff0000', // OrangeRed color for action buttons
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#FF0000', // Red color for the delete button
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seedContainer: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#000',
    color: '#FFF',
  },
  seedPhraseContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  copyableText: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 20, // Added marginBottom to avoid overlap
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
});

export default SettingsScreen;
