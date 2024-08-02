import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { makeRpcRequest } from '../manticore/api';

const truncateTxId = (txid: string) => {
  if (!txid) return '';
  return `${txid.slice(0, 6)}...${txid.slice(-6)}`;
};

const calculateTotalVout = (vout: any[]) => {
  return vout.reduce((total, out) => total + out.value, 0).toFixed(2);
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const TXList = ({ addresses }: any) => {
  const [transactions, setTransactions] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTransactions = async () => {
    try {
      setTransactions([]); // Clear previous transactions
      const txids: string[] = await makeRpcRequest('getaddresstxids', [{ addresses }]);
      const recent_txids = txids.slice(0, 10);
      for (let i = 0; i < recent_txids.length; i++) {
        const transaction = await makeRpcRequest('getrawtransaction', [recent_txids[i], true]);
        setTransactions((prevTransactions: any) => [...prevTransactions, transaction]);
        await delay(500); // Delay of 500ms between requests
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [addresses]);

  return (
    <ThemedView style={styles.transactionContainer}>
      <ThemedText style={styles.sectionTitle}>Recent Transactions</ThemedText>
      {transactions.length > 0 ? (
        transactions.map((tx: any, index: any) => (
          <View key={index} style={styles.transactionRow}>
            <ThemedText>{truncateTxId(tx.txid)}</ThemedText>
            <ThemedText>{calculateTotalVout(tx.vout)} EVR</ThemedText>
          </View>
        ))
      ) : (
        loading ? <ActivityIndicator size="large" color="#fff" /> : <ThemedText>No Transactions Found</ThemedText>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  transactionContainer: {
    padding: 16,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});

export default TXList;
