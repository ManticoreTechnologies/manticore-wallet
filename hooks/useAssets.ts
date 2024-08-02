import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import ColorLogger from '@/components/ColorLogger';
import { makeRpcRequest } from '@/components/manticore/api';
import { loadAddresses } from '@/components/useAddress';

const useAssets = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [ownedAssets, setOwnedAssets] = useState<any[]>([]);

  // Function to get assets from file
  const getAssetsFromFile = async (): Promise<any[]> => {
    const fileUri = FileSystem.documentDirectory + 'assets.json';
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(fileUri);
      return JSON.parse(content);
    }
    return [];
  };

  // Function to save assets to file
  const saveAssetsToFile = async (assets: any[]) => {
    const fileUri = FileSystem.documentDirectory + 'assets.json';
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(assets));
  };

  // Function to fetch all assets
  const fetchAssets = async () => {
    ColorLogger.log(["Assets", "yellow", "underscore"], ["Fetching assets data", "cyan"]);
    try {
      const response = await makeRpcRequest('listassets', []);
      setAssets(response);
      await saveAssetsToFile(response);
    } catch (error) {
      ColorLogger.log(["Assets", "yellow", "underscore"], ["Failed to fetch assets data", "red", "bright"]);
      return [];
    }
  };

  // Function to fetch owned assets
  const fetchOwnedAssets = async () => {
    ColorLogger.log(["Assets", "yellow", "underscore"], ["Fetching owned assets data", "cyan"]);
    try {
     const addresses = await loadAddresses()
      const response = await makeRpcRequest('getaddressbalance', [{ addresses:  Object.values(addresses).map((a:any)=>{return a.address})}, true]);
      setOwnedAssets(response.map((asset: any)=>{return asset.assetName}));
      return ownedAssets;
    } catch (error) {
      ColorLogger.log(["Assets", "yellow", "underscore"], ["Failed to fetch owned assets data", "red", "bright"]);
      return [];
    }
  };

  // Function to fetch specific asset by name
  const fetchAssetByName = async (assetName: string) => {
    try {
      const response = await makeRpcRequest('getassetdata', [assetName]);
      return response;
    } catch (error) {
      ColorLogger.log(["Assets", "yellow", "underscore"], [`Failed to fetch data for asset ${assetName}`, "red", "bright"]);
      return null;
    }
  };

  // Load assets from file and fetch owned assets on initial render
  useEffect(() => {
    const loadAssets = async () => {
      const storedAssets = await getAssetsFromFile();
      if (storedAssets.length > 0) {
        setAssets(storedAssets);
      } else {
        await fetchAssets();
      }
      const owned_assets = await fetchOwnedAssets();
      console.log(owned_assets)
    };
    loadAssets();
  }, []);

  return {
    assets,
    ownedAssets,
    fetchAssets,
    fetchOwnedAssets,
    fetchAssetByName,
    saveAssetsToFile,
    getAssetsFromFile
  };
};

export default useAssets;
