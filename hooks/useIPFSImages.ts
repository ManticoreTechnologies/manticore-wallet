import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { makeRpcRequest } from '@/components/manticore/api';
import * as FileSystem from 'expo-file-system';

const useIPFSImages = (assetName: string) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [assetData, setAssetData] = useState<any>(null);
  const maxRetries = 3;
  const delay = 1000;

  useEffect(() => {
    const fetchImage = async (retryCount: number = maxRetries) => {
      try {
        const asset_data = await makeRpcRequest('getassetdata', [assetName]);
        if (!asset_data) {
          setImageUri(null);
          return;
        }
        setAssetData(asset_data);
        if (asset_data.ipfs_hash) {
          const ipfsHash = asset_data.ipfs_hash;
          const cachedUri = await SecureStore.getItemAsync(ipfsHash);
          if (cachedUri) {
            setImageUri(cachedUri);
          } else {
            const uri = `https://api.manticore.exchange/ipfs/${ipfsHash}`;
            const fileUri = `${FileSystem.cacheDirectory}${ipfsHash}`;
            await FileSystem.downloadAsync(uri, fileUri);
            await SecureStore.setItemAsync(ipfsHash, fileUri);
            setImageUri(fileUri);
          }
        } else {
          setImageUri(null);
        }
      } catch (error) {
        if (retryCount > 0) {
          setTimeout(() => fetchImage(retryCount - 1), delay);
        } else {
          setImageUri(null);
        }
      }
    };

    if (!assetName.endsWith('!')) {
      fetchImage();
    }
  }, [assetName]);

  return { imageUri, assetData, setImageUri };
};

export default useIPFSImages;
