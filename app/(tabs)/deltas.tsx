/*
  Phoenix Campanile
  Manticore Technologies, LLC
  (c) 2024

  @/app/(tabs)/index.tsx
  This tab is the first one shown to the user.
  It should be simple yet informative.
*/

/* Imports */
import { ThemedText } from "@/components/ThemedText";
import { makeRpcRequest } from "@/components/manticore/api";
import { loadAddresses, loadChangeAddresses } from "@/components/useAddress";
import { useEffect, useState } from "react";
import { StyleSheet, View, FlatList, Text, TouchableOpacity, RefreshControl } from "react-native";
import ColorLogger from "@/components/ColorLogger";
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface Address {
  address: string;
  privateKey: string;
}

interface Delta {
  address: string;
  assetName: string;
  blockindex: number;
  height: number;
  index: number;
  satoshis: number;
  txid: string;
}

interface AssetBalance {
  assetName: string;
  balance: number;
}

export default function Deltas() {
  const name: [string, (string | undefined)?, (string | undefined)?] = ["Deltas", "yellow", "underscore"];
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [evrDeltas, setEvrDeltas] = useState<Delta[]>([]);
  const [assetDeltas, setAssetDeltas] = useState<Delta[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [totalAssetBalance, setTotalAssetBalance] = useState<number>(0);
  const [evrToUsdtRate, setEvrToUsdtRate] = useState<number>(0);
  const [evrToBtcRate, setEvrToBtcRate] = useState<number>(0);
  const [currentTab, setCurrentTab] = useState<'EVR' | 'ASSETS'>('EVR');
  const [assets, setAssets] = useState<AssetBalance[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    ColorLogger.log(name, ["Fetching addresses", "blue", "bright"]);
    const recv_addresses = Object.values(await loadAddresses()).map((x: any) => x.address);
    const change_addresses = Object.values(await loadChangeAddresses()).map((x: any)=>{return x.address})
    const addresses = [...recv_addresses, ...change_addresses]
    // Fetch EVR deltas
    const deltasResponse = await makeRpcRequest('getaddressdeltas', [{ addresses, assetName: "" }]);
    const mempoolResponse = await makeRpcRequest('getaddressmempool', [{ addresses }]);
    
    const sortedDeltas = deltasResponse.sort((a: Delta, b: Delta) => b.height - a.height);
    // Transform mempool data to match Delta interface
    const transformedMempool = mempoolResponse.map((item: any) => ({
      address: item.address,
      assetName: item.assetName,
      blockindex: item.blockindex,
      height: "unconfirmed", // Set height as "unconfirmed"
      index: item.index,
      satoshis: item.satoshis,
      txid: item.txid,
    }));
    const evrDeltas = sortedDeltas.filter((delta: any) => delta.assetName === "EVR");
    const assetDeltas = sortedDeltas.filter((delta: any) => delta.assetName !== "EVR");

    ColorLogger.log(name, [`Fetched ${evrDeltas.length} EVR deltas`, "blue", "bright"]);
    ColorLogger.log(name, [`Fetched ${assetDeltas.length} asset deltas`, "blue", "bright"]);

    setEvrDeltas([...transformedMempool, ...evrDeltas]);
    setAssetDeltas(assetDeltas);
    setTotalBalance(calculateTotalBalance(evrDeltas));
    setTotalAssetBalance(calculateTotalBalance(assetDeltas));

    // Fetch the list of assets
    const assetBalances: AssetBalance[] = await makeRpcRequest('getaddressbalance', [{ addresses }, true]);
    setAssets(assetBalances);

    await fetchEvrToUsdtRate();
    await fetchEvrToBtcRate();
    setRefreshing(false);
  };

  const fetchEvrToUsdtRate = async () => {
    try {
      const response = await axios.get('https://api.xeggex.com/api/v2/ticker/evr_usdt');
      setEvrToUsdtRate(parseFloat(response.data.last_price));
    } catch (error) {
      console.error('Failed to fetch EVR-USDT rate:', error);
    }
  };

  const fetchEvrToBtcRate = async () => {
    try {
      const response = await axios.get('https://api.xeggex.com/api/v2/ticker/evr_btc');
      setEvrToBtcRate(parseFloat(response.data.last_price));
    } catch (error) {
      console.error('Failed to fetch EVR-BTC rate:', error);
    }
  };

  const calculateTotalBalance = (deltas: Delta[]) => {
    const total = deltas.reduce((acc, delta) => acc + delta.satoshis, 0);
    return total / 100000000; // Convert satoshis to EVR (100,000,000 satoshis = 1 EVR)
  };

  const truncateTxid = (txid: string) => `${txid.slice(0, 6)}...${txid.slice(-4)}`;

  const renderDelta = ({ item }: { item: Delta }) => (
    <View style={styles.deltaContainer}>
      <View style={styles.deltaHeader}>
        <Ionicons name={item.satoshis > 0 ? "arrow-down" : "arrow-up"} size={24} color={item.satoshis > 0 ? "green" : "red"} />
        <Text style={styles.deltaDate}>{item.height}</Text>
      </View>
      <View style={styles.deltaDetails}>
        <Text style={styles.deltaValue}>{item.satoshis > 0 ? `+${item.satoshis / 100000000}` : item.satoshis / 100000000} {item.assetName}</Text>
        <Text style={styles.deltaTxid}>{truncateTxid(item.txid)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your balance</Text>
      <Text style={styles.balance}>{currentTab === 'EVR' ? totalBalance.toFixed(6) : totalAssetBalance.toFixed(6)} {currentTab === 'EVR' ? 'EVR' : 'ASSETS'}</Text>
      <Text style={styles.usdtBalance}>{(totalBalance * evrToUsdtRate).toFixed(2)} USDT</Text>
      <Text style={styles.btcBalance}>{(totalBalance * evrToBtcRate).toFixed(8)} BTC</Text>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, currentTab === 'EVR' && styles.activeTab]} onPress={() => setCurrentTab('EVR')}>
          <Text style={styles.tabText}>EVR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, currentTab === 'ASSETS' && styles.activeTab]} onPress={() => setCurrentTab('ASSETS')}>
          <Text style={styles.tabText}>ASSETS</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.activityTitle}>Activity</Text>
      {currentTab === 'EVR' ? (
        <FlatList
          data={evrDeltas}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderDelta}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
          }
        />
      ) : (
        <FlatList
          data={assetDeltas}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderDelta}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  balance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff0000',
  },
  usdtBalance: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  btcBalance: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  tab: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  activeTab: {
    backgroundColor: '#ff0000',
  },
  tabText: {
    color: '#fff',
    fontSize: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  deltaContainer: {
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    marginBottom: 8,
    borderColor: '#ff0000',
    borderWidth: 1,
  },
  deltaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deltaDate: {
    marginLeft: 8,
    fontSize: 16,
    color: '#fff',
  },
  deltaDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deltaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  deltaTxid: {
    fontSize: 14,
    color: '#666',
  },
});
