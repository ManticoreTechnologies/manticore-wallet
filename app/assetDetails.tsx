import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const AssetDetails = () => {
  const { asset, assetData, uri }: any = useGlobalSearchParams();
  const asset_metadata = JSON.parse(asset);
  const asset_data = JSON.parse(assetData);
  const [imageUri, setImageUri] = useState(JSON.parse(uri));
  const defaultImage = require('@/assets/images/logo.png');

  const handleCopyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied to clipboard');
  };

  const handleShareImage = async () => {
    if (!imageUri) {
      Alert.alert('No image to share');
      return;
    }

    try {
      const localUri = `${FileSystem.documentDirectory}${imageUri.split('/').pop()}`;
      await FileSystem.downloadAsync(imageUri, localUri);
      await Sharing.shareAsync(localUri);
    } catch (error: any) {
      Alert.alert('Error sharing image', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => handleCopyToClipboard(asset_metadata.assetName)}>
        <Text style={styles.title}>{asset_metadata.assetName}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleCopyToClipboard((asset_metadata.balance / 100000000).toString())}>
        <Text style={styles.detail}>Balance: {asset_metadata.balance / 100000000}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleShareImage}>
        <Image
          source={imageUri ? { uri: imageUri } : defaultImage}
          style={styles.assetImage}
          onError={() => setImageUri(null)}
        />
      </TouchableOpacity>
      {asset_data && (
        <>
          <TouchableOpacity onPress={() => handleCopyToClipboard(asset_data.amount.toString())}>
            <Text style={styles.detail}>Amount: {asset_data.amount}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCopyToClipboard(asset_data.reissuable ? 'Yes' : 'No')}>
            <Text style={styles.detail}>Reissuable: {asset_data.reissuable ? 'Yes' : 'No'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCopyToClipboard(asset_data.units.toString())}>
            <Text style={styles.detail}>Units: {asset_data.units}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCopyToClipboard(asset_data.ipfs_hash)}>
            <Text style={styles.detail}>IPFS Hash: {asset_data.ipfs_hash}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 16,
    textAlign: 'center',
  },
  detail: {
    fontSize: 20,
    color: '#ff0000',
    marginBottom: 8,
    textAlign: 'center',
  },
  assetImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'contain',
  },
});

export default AssetDetails;
