import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { makeRpcRequest } from '../manticore/api';
import { fetchEvrToBtcRate, fetchEvrToUsdtRate } from '../xeggex/public';
import ColorLogger from '../ColorLogger';

export const AddressBalance = ({ address, style, refreshing }: any) => {
    const [balance, setBalance] = useState<number | null>(null);
  
    const fetchBalance = async () => {
      try {
        const response = await makeRpcRequest('getaddressbalance', [{ addresses: [address] }]);
        const total_evrmore = response.balance / 100000000;
        setBalance(total_evrmore);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(0);
      }
    };
  
    useEffect(() => {
      fetchBalance();
    }, [address]);
  
    return (balance !== null && !refreshing) ? (
      <Text style={style}>{balance}</Text>
    ) : (
      <ActivityIndicator size="small" color="#fff" />
    );
};

export const TotalBalance = ({ addresses, style, refreshing }: any) => {
    const [balance, setBalance] = useState<number | null>(null);
  
    const fetchBalance = async () => {
      ColorLogger.log(["TotalBalance", "yellow", "underscore"], ["Refreshing balance...", "green", "bright"])
      try {
        const response = await makeRpcRequest('getaddressbalance', [{ addresses: addresses.map((a: Address)=>{return a.address}) }]);
        const total_evrmore = response.balance / 100000000;
        setBalance(total_evrmore);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(0);
      }
    };
  
    // Fetch balance on load
    useEffect(()=>{
      fetchBalance()
      const intervalId = setInterval(() => {
        fetchBalance();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(intervalId); // Cleanup on unmount
    }, [addresses]);

    useEffect(() => {
        if(!refreshing)return 
        ColorLogger.log(["TotalBalance", "yellow", "underscore"], ["Refreshing balances", "green", "bright"])
        fetchBalance();
      }, [addresses, refreshing]);
  
    return (balance !== null && !refreshing) ? (
      <Text style={style}>{balance.toFixed(2)}</Text>
    ) : (
      <ActivityIndicator size="small" color="#fff" />
    );
};
  

export const EvrmoreBalance = ({ addresses, refreshing }: any) => {

return (    
    <ThemedView style={styles.centeredContainer}>
        <ThemedText style={styles.balanceText}>
            <TotalBalance refreshing={refreshing} addresses={addresses}/> EVR
        </ThemedText>
    </ThemedView>
    );
};

export const BalanceValues = ({ addresses, refreshing}: any) => {
  const [balance, setBalance] = useState<number>(0);
  const [evrUsd, setEvrUsd] = useState<number>(0);
  const [evrBtc, setEvrBtc] = useState<number>(0);

  const fetchBalance = async () => {
    ColorLogger.log(["BalanceValues", "yellow", "underscore"], ["Refreshing balances", "green", "bright"])
    
    try {
      const response = await makeRpcRequest('getaddressbalance', [{ addresses: addresses.map((a: Address)=>{return a.address}) }]);
      const total_evrmore = response.balance / 100000000;
      setBalance(total_evrmore);
      setEvrUsd(await fetchEvrToUsdtRate());
      setEvrBtc(await fetchEvrToBtcRate());
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0);
    }
  };
    useEffect(()=>{
      fetchBalance();
      const intervalId = setInterval(() => {
        if(addresses.length>0)fetchBalance();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(intervalId); // Cleanup on unmount
    });
  useEffect(() => {
    if(!refreshing)return 
    fetchBalance();
  }, [addresses, refreshing]);

  return (
    <ThemedView style={styles.balanceContainer}>
      <ThemedView style={styles.inlineValuesContainer}>
        <ThemedText style={styles.inlineBalanceText}>
          {(balance * evrUsd).toFixed(2)} USD
        </ThemedText>
        <ThemedText style={styles.inlineBalanceText}>
          {(balance * evrBtc) > 1 ? (balance * evrBtc).toFixed(2) : (balance * evrBtc * 100000000).toFixed(2)} Sats
        </ThemedText>
      </ThemedView>
      <EvrmoreBalance refreshing={refreshing} addresses={addresses} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  balanceText: {
    fontSize: 24,
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 24,
    color: '#fff',
    marginLeft: 10,
  },
  balanceContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  inlineValuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  inlineBalanceText: {
    fontSize: 16,
    color: '#fff',
  },
});

export default { EvrmoreBalance, BalanceValues };
