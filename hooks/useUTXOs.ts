import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import ColorLogger from '@/components/ColorLogger';
import { makeRpcRequest } from '@/components/manticore/api';
import { loadAddresses, loadAllAddresses, loadChangeAddresses } from '@/components/useAddress';

const UTXOManager = {
  fileUri: FileSystem.documentDirectory + 'utxos.json',

  async getUtxosFromFile(): Promise<any[]> {
    const fileInfo = await FileSystem.getInfoAsync(this.fileUri);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(this.fileUri);
      return JSON.parse(content);
    }
    return [];
  },

  async saveUtxosToFile(utxos: any[]) {
    await FileSystem.writeAsStringAsync(this.fileUri, JSON.stringify(utxos));
  },

  async fetchAddressUTXOs() {
    ColorLogger.log(["Transactions", "yellow", "underscore"], ["Fetching address data", "cyan"]);
    try {
      const recv_addresses = Object.values(await loadAddresses()).map((x: any) => x.address);
      const change_addresses = Object.values(await loadChangeAddresses()).map((x: any)=>{return x.address})
      const addresses = [...recv_addresses, ...change_addresses]
      // Fetch EVR UTXOs
      const evrResponse = await makeRpcRequest('getaddressutxos', [{ addresses }]);
      // Fetch asset UTXOs (excluding EVR)
      const assetsResponse = await makeRpcRequest('getaddressutxos', [{ addresses, assetName: "*" }]);
      // Fetch mempool data
      const mempoolData = await makeRpcRequest('getaddressmempool', [{ addresses }]); 
      
      const sortedEvr = evrResponse.sort((a: any, b: any) => b.height - a.height);
      const sortedAssets = assetsResponse.sort((a: any, b: any) => b.height - a.height);
      const sortedMempool = mempoolData.map((utxo: any) => ({ ...utxo, height: "unconfirmed" }));

      const combinedUtxos = [...sortedMempool, ...sortedEvr, ...sortedAssets];
      await this.saveUtxosToFile(combinedUtxos);

      return combinedUtxos;
    } catch (error) {
      ColorLogger.log(["Transactions", "yellow", "underscore"], ["Failed to fetch utxo data", "red", "bright"]);
      return [];
    }
  },

  async fetchTransactionData(txid: string) {
    try {
      const response = await makeRpcRequest('getrawtransaction', [txid, true]);
      return response;
    } catch (error) {
      console.error('Failed to fetch transaction data:', error);
      return null;
    }
  },

  async loadUtxosByAssetName(assetName: string) {
    const utxos = await this.getUtxosFromFile();
    if (assetName === 'EVR') {
      return utxos.filter((utxo: any) => utxo.assetName === 'EVR');
    } else {
      return utxos.filter((utxo: any) => utxo.assetName !== 'EVR');
    }
  }
};

const useUTXOs = () => {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [utxos, setUtxos] = useState<any[]>([]);
  ColorLogger.log(["useUTXOs", "yellow", "underscore"], ["Received request to use UTXOs", "magenta"])
  const updateUtxos = async () => {
    ColorLogger.log(["useUTXOs", "yellow", "underscore"], ["Updating UTXOs", "green", "bright"])
    
    const savedAddresses = await loadAllAddresses();
    if (savedAddresses) {
      setAddresses(Object.values(savedAddresses).map(a => a.address));
      const fetchedUtxos = await UTXOManager.fetchAddressUTXOs();
      setUtxos(fetchedUtxos);
      ColorLogger.log(["useUTXOs", "yellow", "underscore"], ["UTXOs Updated", "green"])
    }
  };

  useEffect(() => {
    updateUtxos();
  }, []);

  return {
    addresses,
    utxos,
    updateUtxos,
    fetchTransactionData: UTXOManager.fetchTransactionData,
    loadUtxosByAssetName: UTXOManager.loadUtxosByAssetName,
  };
};

export default useUTXOs;
