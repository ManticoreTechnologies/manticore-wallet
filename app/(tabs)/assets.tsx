/*
    Phoenix Campanile
    Manticore Technologies, LLC
    (c) 2024

    @/app/(tabs)/assets.tsx
    This tab displays the user's assets in a user-friendly manner.
*/

/* Imports */
import { StyleSheet, FlatList, View, TouchableOpacity, Text } from 'react-native';
import { loadAddresses, loadChangeAddresses } from '@/components/useAddress';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ColorLogger from '@/components/ColorLogger';
import React, { useEffect, useState } from 'react';
import { makeRpcRequest } from '@/components/manticore/api';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import AssetItem from '@/components/AssetItem';
import { useRouter } from 'expo-router';

interface Address {
  address: string;
  privateKey: string;
}

interface Asset {
  assetName: string;
  balance: number;
  ipfsHash?: string;
}

export default function Assets() {
  const name: [string, (string | undefined)?, (string | undefined)?] = ["Assets", "yellow", "underscore"];
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const fetchAddressesAndAssets = async () => {
      ColorLogger.log(name);
      const addresses = Object.values(await loadAddresses()).map((a: Address) => a.address);
      const assetsResponse = await makeRpcRequest('getaddressbalance', [{ addresses: addresses }, true]);
      setAssets(assetsResponse);
    };

    fetchAddressesAndAssets();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const recv_addresses = Object.values(await loadAddresses()).map((x: any) => x.address);
    const change_addresses = Object.values(await loadChangeAddresses()).map((x: any)=>{return x.address})
    const addresses = [...recv_addresses, ...change_addresses]
    const assetsResponse = await makeRpcRequest('getaddressbalance', [{ addresses: addresses }, true]);
    setAssets(assetsResponse);
    console.log(assetsResponse);
    setIsRefreshing(false);
  };



  const renderHeader = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.title}>Assets</Text>
      <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing} style={styles.refreshButton}>
        <Ionicons name="refresh" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={assets}
        keyExtractor={(item: any, index) => index.toString()}
        renderItem={({ item }) => <AssetItem asset={item} />}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#ff0000',
    borderRadius: 8,
  },
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
  copyText: {
    fontSize: 14,
    color: '#999',
  },
});
