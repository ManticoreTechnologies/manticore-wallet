/*
    Phoenix Campanile
    Manticore Technologies, LLC
    (c) 2024

    @/app/(tabs)/utxos.tsx
    This tab displays address UTXOs in a user-friendly manner.
*/

/* Imports */
import { StyleSheet, FlatList, View, TouchableOpacity, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import useUTXOs from '@/hooks/useUTXOs';
import ColorLogger from '@/components/ColorLogger';

export default function Utxos() {
  const name: any = ["Utxos", "yellow", "underscore"];
  ColorLogger.log(name, ["Component loaded", "blue", "bright"]);
  
  const { addresses, utxos, updateUtxos } = useUTXOs();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);

  const handleRefresh = async () => {
    ColorLogger.log(name, ["Refreshing UTXOs", "green", "bright"]);
    setIsRefreshing(true);
    await updateUtxos();
    setIsRefreshing(false);
    ColorLogger.log(name, ["UTXOs refreshed", "green", "bright"]);
  };

  const handleToggleTransaction = (txid: string) => {
    ColorLogger.log(name, [`Toggling transaction details for: ${txid}`, "magenta", "bright"]);
    setExpandedTransaction(expandedTransaction === txid ? null : txid);
  };

  const handleCopyToClipboard = async (text: string) => {
    ColorLogger.log(name, [`Copying to clipboard: ${text}`, "cyan", "bright"]);
    await Clipboard.setStringAsync(text);
    alert('Copied to clipboard');
    ColorLogger.log(name, ["Text copied to clipboard", "cyan", "bright"]);
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  const renderHeader = (title: string) => (
    <View style={styles.titleContainer}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );

  const truncateTxid = (txid: string) => `${txid.slice(0, 6)}...${txid.slice(-4)}`;

  const renderUtxo = ({ item }: { item: any }) => (
    <View style={styles.utxoContainer}>
      <TouchableOpacity onPress={() => handleToggleTransaction(item.txid)}>
        <Text style={styles.transactionId}>Transaction ID: {truncateTxid(item.txid)}</Text>
        <Text style={styles.transactionDate}>Height: {item.height}</Text>
        <Text style={styles.transactionAmount}>Amount: {item.satoshis / 100000000} {item.assetName}</Text>
      </TouchableOpacity>
      {expandedTransaction === item.txid && (
        <View style={styles.detailsContainer}>
          <TouchableOpacity onPress={() => handleCopyToClipboard(item.address)}>
            <Text style={styles.transactionDetail}>Address: {item.address}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCopyToClipboard(item.script)}>
            <Text style={styles.transactionDetail}>Script: {item.script}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const evrUtxos = utxos.filter(utxo => utxo.assetName === 'EVR');
  const otherUtxos = utxos.filter(utxo => utxo.assetName !== 'EVR');

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader("EVR UTXOs")}
        data={evrUtxos}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderUtxo}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
      <FlatList
        ListHeaderComponent={renderHeader("Other UTXOs")}
        data={otherUtxos}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderUtxo}
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
    marginTop: 16,
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
  utxoContainer: {
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    marginBottom: 8,
    borderColor: '#ff0000',
    borderWidth: 1,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  transactionDate: {
    fontSize: 14,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    color: '#fff',
  },
  detailsContainer: {
    marginTop: 8,
  },
  transactionDetail: {
    fontSize: 14,
    color: '#999',
  },
});
