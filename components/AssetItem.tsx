import { StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import React from 'react';
import useIPFSImages from '@/hooks/useIPFSImages';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';

interface Asset {
  assetName: string;
  balance: number;
  data: { ipfs_hash?: string };
}

const AssetItem = ({ asset }: { asset: Asset }) => {
  const { imageUri, assetData, setImageUri } = useIPFSImages(asset.assetName);
  const defaultImage = require('@/assets/images/logo.png');
  const router = useRouter();

  const handleAssetPress = (asset: Asset) => {
    router.push({
      pathname: 'assetDetails',
      params: { asset: JSON.stringify(asset), assetData: JSON.stringify(assetData), uri: JSON.stringify(imageUri) },
    });
  };

  const handleCopyToClipboard = async () => {
    await Clipboard.setStringAsync(asset.assetName);
    alert('Copied to clipboard');
  };

  return (
    <TouchableOpacity onPress={() => handleAssetPress(asset)} style={styles.assetContainer}>
      <View style={styles.assetHeader}>
        <Text style={styles.assetName}>{asset.assetName}</Text>
        <Text style={styles.assetBalance}>{asset.balance / 100000000}</Text>
      </View>
      {!asset.assetName.endsWith('!') && (
        <>
          <Image
            source={imageUri ? { uri: imageUri } : defaultImage}
            style={styles.assetImage}
            onError={() => setImageUri(null)}
          />
          {assetData && (
            <View style={styles.assetDetails}>
              <Text style={styles.detailText}>Amount: {assetData.amount}</Text>
              <Text style={styles.detailText}>Reissuable: {assetData.reissuable ? 'Yes' : 'No'}</Text>
              <Text style={styles.detailText}>Units: {assetData.units}</Text>
            </View>
          )}
        </>
      )}
      <TouchableOpacity onPress={handleCopyToClipboard}>
        <Text style={styles.copyText}>Copy Asset Name</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  assetContainer: {
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    marginBottom: 8,
    borderColor: '#ff0000',
    borderWidth: 1,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  assetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  assetBalance: {
    fontSize: 18,
    color: '#fff',
  },
  assetImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 8,
  },
  assetDetails: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#999',
  },
  copyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default AssetItem;
