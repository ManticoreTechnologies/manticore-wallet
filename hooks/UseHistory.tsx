import { useState, useEffect, useCallback } from "react";
import { makeRpcRequest } from "@/components/manticore/api";
import { loadAddresses, loadChangeAddresses } from "@/components/useAddress";
import ColorLogger from "@/components/ColorLogger";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { addDays, format } from 'date-fns'; 

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

const CLEAR_SAVED_DATA = false; // Set to true to clear saved data

const useHistory = () => {
  const name: [string, (string | undefined)?, (string | undefined)?] = ["UseHistory", "yellow", "underscore"];
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [evrDeltas, setEvrDeltas] = useState<Delta[]>([]);
  const [assetDeltas, setAssetDeltas] = useState<Delta[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [totalAssetBalance, setTotalAssetBalance] = useState<number>(0);
  const [evrToUsdtRate, setEvrToUsdtRate] = useState<number>(0);
  const [evrToBtcRate, setEvrToBtcRate] = useState<number>(0);
  const [assets, setAssets] = useState<AssetBalance[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<{ date: string; balance: number; }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      if (CLEAR_SAVED_DATA) {
        await AsyncStorage.removeItem('deltas');
        await AsyncStorage.removeItem('mempool');
      }

      ColorLogger.log(name, ["Fetching addresses", "blue", "bright"]);
      const recv_addresses = Object.values(await loadAddresses()).map((x: any) => x.address);
      const change_addresses = Object.values(await loadChangeAddresses()).map((x: any) => x.address);
      const addresses = [...recv_addresses, ...change_addresses];

      let storedDeltas = null//await AsyncStorage.getItem('deltas');
      let storedAssetDeltas = null//await AsyncStorage.getItem('assetDeltas');
      let storedMempool = null//await AsyncStorage.getItem('mempool');

      let deltasResponse: Delta[] = storedDeltas ? JSON.parse(storedDeltas) : [];
      let deltasAssetResponse: Delta[] = storedAssetDeltas ? JSON.parse(storedAssetDeltas) : [];
      let mempoolResponse: any[] = storedMempool ? JSON.parse(storedMempool) : [];

      if (!storedDeltas || !storedMempool) {
        deltasResponse = await makeRpcRequest('getaddressdeltas', [{ addresses }]);
        mempoolResponse = await makeRpcRequest('getaddressmempool', [{ addresses }]);
        deltasAssetResponse = await makeRpcRequest('getaddressdeltas', [{ addresses, assetName:""}]);

        await AsyncStorage.setItem('deltas', JSON.stringify(deltasResponse));
        await AsyncStorage.setItem('mempool', JSON.stringify(mempoolResponse));
      }

      ColorLogger.log(name, ["Fetched deltas", deltasResponse, "blue", "bright"]);
      ColorLogger.log(name, ["Fetched mempool", mempoolResponse, "blue", "bright"]);

      const evrDeltas = deltasResponse.sort((a: Delta, b: Delta) => b.height - a.height);
      const assetDeltas = deltasAssetResponse.sort((a: Delta, b: Delta) => b.height - a.height);
      
      const transformedMempool = mempoolResponse.map((item: any) => ({
        address: item.address,
        assetName: item.assetName,
        blockindex: item.blockindex,
        height: "unconfirmed",
        index: item.index,
        satoshis: item.satoshis,
        txid: item.txid,
      }));

      
      ColorLogger.log(name, [`Fetched ${evrDeltas.length} EVR deltas`, "blue", "bright"]);
      ColorLogger.log(name, [`Fetched ${assetDeltas.length} asset deltas`, "blue", "bright"]);

      setEvrDeltas([...transformedMempool, ...evrDeltas]);
      setAssetDeltas(assetDeltas);
      setTotalBalance(calculateTotalBalance(evrDeltas));
      setTotalAssetBalance(calculateTotalBalance(assetDeltas));

      try {
        const balanceHistory = await calculateBalanceHistory(evrDeltas);        
        setBalanceHistory(balanceHistory);
      } catch (error) {
        ColorLogger.log(name, [error, "red"]);
      }

      const assetBalances: AssetBalance[] = await makeRpcRequest('getaddressbalance', [{ addresses }, true]);
      setAssets(assetBalances);

      await fetchEvrToUsdtRate();
      await fetchEvrToBtcRate();
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, []);

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

  const calculateBalanceHistory = async (deltas: Delta[]) => {
    ColorLogger.log(name, ["Looking for balance history", "magenta", "bright"]);
    if (deltas.length === 0) throw new Error("No deltas available");

    // Get the txidMap
    let txidMap: any = {};

    for (const delta of deltas) {
      if (!txidMap[delta.txid]) {
        txidMap[delta.txid] = 0;
      }
      txidMap[delta.txid] += delta.satoshis;
    }

    let deltasByDate: any = null//await AsyncStorage.getItem('deltasByDate');

    if (!deltasByDate) {
      deltasByDate = {};
      for (const txid in txidMap) {
        const transaction = await makeRpcRequest('getrawtransaction', [txid, true]);
        const timestamp = transaction.time;
        const raw_date = new Date(timestamp * 1000);
        const date = new Date(Date.UTC(raw_date.getUTCFullYear(), raw_date.getUTCMonth(), raw_date.getUTCDate()));
        ColorLogger.log(['txidMap', 'underscore'], [timestamp, "green"], [txidMap[txid], txidMap[txid] > 0 ? "green" : "red"], [date, "yellow"]);
        if (!deltasByDate[date]) deltasByDate[date] = 0;
        deltasByDate[date] += txidMap[txid]; // Convert satoshis to EVR
      }
    } else {
      deltasByDate = JSON.parse(deltasByDate);
    }

    console.log(deltasByDate);
    await AsyncStorage.setItem('deltasByDate', JSON.stringify(deltasByDate));

    // Sort dates and fill in days with no transactions
    const sortedDates = Object.keys(deltasByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let cumulativeBalance = 0;
    const completeBalanceHistory: { date: string; balance: number; }[] = [];
    let previousDate: any = sortedDates[0];

    for (const date of sortedDates) {
      const currentDate = date;

      cumulativeBalance += deltasByDate[date];
      ColorLogger.log([currentDate, "yellow", "underscore"], [cumulativeBalance, 'underscore', 'magenta']);
      completeBalanceHistory.push({ date, balance: cumulativeBalance });
      previousDate = date;
    }

    // Fill in the days from the last transaction to today
    let paddedHistory: { date: string; balance: number; }[] = [];
    let prevDate: Date = new Date(completeBalanceHistory[0].date);
    let prevBalance: number = completeBalanceHistory[0].balance;

    for (const entry of completeBalanceHistory) {
      let currentDate: Date = new Date(entry.date);
      let currentBalance: number = entry.balance;

      // Fill the gap with previous balance for missing days
      while (prevDate < currentDate) {
        paddedHistory.push({ date: format(prevDate, 'yyyy-MM-dd'), balance: prevBalance });
        prevDate = addDays(prevDate, 1);
      }

      // Add the current entry
      paddedHistory.push({ date: format(currentDate, 'yyyy-MM-dd'), balance: currentBalance });

      // Update previous date and balance
      prevDate = addDays(currentDate, 1);
      prevBalance = currentBalance;
    }

    console.log(paddedHistory);

    return paddedHistory;
  };

  return {
    deltas,
    evrDeltas,
    assetDeltas,
    totalBalance,
    totalAssetBalance,
    evrToUsdtRate,
    evrToBtcRate,
    balanceHistory,
    assets,
    fetchData,
  };
};

export default useHistory;
