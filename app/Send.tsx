import React, { useEffect, useState } from 'react';
import { Button, TextInput, View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Checkbox from 'expo-checkbox';
import { generateEVRTransaction, generateEVRAssetTransaction, generateHTLCTransaction, claimTimelockedFunds } from '@/components/generateTransaction'; // Ensure you have a function to claim timelocked funds
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation } from '@react-navigation/native';
import useAssets from '@/hooks/useAssets';
import { makeRpcRequest } from '@/components/manticore/api';
import { Psbt } from '@/components/evrmorejs-lib/psbt';
import { evrmore as EVRMORE_NETWORK } from '@/components/evrmorejs-lib/Networks';
import ColorLogger from '@/components/ColorLogger';
import { loadAddresses } from '@/components/useAddress';
import * as Clipboard from 'expo-clipboard';
import useUTXOs from '@/hooks/useUTXOs'; // Import the custom hook
import * as Crypto from "@/components/evrmorejs-lib/Crypto"
import { Buffer } from 'buffer';

const handleCopyToClipboard = async (text: string) => {
  await Clipboard.setStringAsync(text);
};

const CustomAlert = ({ visible, title, message, onClose }: any) => (
  <Modal transparent={true} visible={visible} animationType="fade">
    <View style={styles.alertContainer}>
      <View style={styles.alertBox}>
        {title && <Text style={styles.alertTitle}>{title}</Text>}
        <TouchableOpacity onPress={() => handleCopyToClipboard(message)}>
          <ThemedText>{message}</ThemedText>
        </TouchableOpacity>
        <Pressable style={styles.alertButton} onPress={onClose}>
          <Text style={styles.alertButtonText}>OK</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
);

const SendScreen: React.FC = ({ }) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState<any>('');
  const [fee, setFee] = useState<any>('');
  const [selectedTab, setSelectedTab] = useState<'EVR' | 'ASSETS' | 'HTLC' | 'CLAIM_HTLC'>('EVR');
  const [selectedAsset, setSelectedAsset] = useState<any>('');
  const [mainAsset, setMainAsset] = useState<any>(false);
  const [alertVisible, setAlertVisible] = useState<any>(false);
  const [alertMessage, setAlertMessage] = useState<any>('');
  const [alertTitle, setAlertTitle] = useState<any>('');
  const [assetBalances, setAssetBalances] = useState<any>({});
  const [assetUnits, setAssetUnits] = useState<any>({});
  const [secret, setSecretHash] = useState(''); // For HTLC
  const [expiryTime, setExpiryTime] = useState(''); // For HTLC
  const [claimUTXO, setClaimUTXO] = useState(''); // For claiming timelocked funds
  const [claimScript, setClaimScript] = useState(''); // For claiming timelocked funds
  const navigation = useNavigation();
  const { ownedAssets, fetchOwnedAssets } = useAssets();
  const { utxos, updateUtxos } = useUTXOs();

  useEffect(() => {
    const getUTXOS = async () => {
      await updateUtxos();
    };
    getUTXOS();
    fetchOwnedAssets();
  }, []);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const assetsResponse = await makeRpcRequest('getaddressbalance', [{ addresses: Object.values(await loadAddresses()).map((a:any)=>{return a.address}) }, true]);
        const balances: any = {};
        for (let i = 0; i < assetsResponse.length; i++) {
          const asset_data_b: any = assetsResponse[i];
          if (asset_data_b.assetName !== "EVR") {
            balances[asset_data_b.assetName] = asset_data_b.balance;
          }
        }
        setAssetBalances(balances);
      } catch (error) {
        console.error('Failed to fetch asset balances:', error);
      }
    };
    fetchBalances();
  }, []);

  useEffect(() => {
    const fetchAssetData = async () => {
      try {
        const assetUnitsData: any = {};
        for (let i = 0; i < ownedAssets.length; i++) {
          if (!ownedAssets[i].endsWith('!') && ownedAssets[i] !== "EVR") { // Filter out hidden assets and EVR
            const assetData = await makeRpcRequest('getassetdata', [ownedAssets[i]]);
            assetUnitsData[ownedAssets[i]] = assetData.units;
          }
        }
        setAssetUnits(assetUnitsData);
      } catch (error) {
        console.error('Failed to fetch asset data:', error);
      }
    };
    fetchAssetData();
  }, [ownedAssets]);

  const showAlert = (title: any, message: any) => {
    setAlertMessage(message);
    setAlertTitle(title);
    setAlertVisible(true);
  };

  const truncateTxid = (txid: string) => `${txid.slice(0, 6)}...${txid.slice(-4)}`;

  const handleSend = async () => {
    ColorLogger.log(["Send", "yellow", "underscore"], [`${amount} EVR to ${recipientAddress} with fee ${fee}`, "magenta", "bright"]);
    // Convert values to sats
    const fee_sats = fee * 100000000;
    const amount_sats = amount * 100000000;
    if (amount_sats < 1){
      showAlert('Invalid amount','Minimum amount is 1 sat (0.00000001 evr)')
    }
    // Validate fee is above network min (0.01 evr)
    if (fee_sats < 1000000){
      showAlert('Invalid Fee', 'Minimum network fee is 0.01 EVR.');
      return;
    }

    // Validate all fields are filled
    if (!recipientAddress || !amount || !fee) {
      showAlert('Error', 'Error. Please enter a valid address, amount, and fee.');
      return;
    }

    const txid = await generateEVRTransaction(amount_sats, fee_sats, recipientAddress, utxos)
    showAlert('Transaction Sent', `${txid}`)
  };

  const handleAssetSend = async () => {
    if (!recipientAddress || !selectedAsset || !amount) {
      showAlert('Error', 'Please enter a valid address, asset, and amount.');
      return;
    }
    ColorLogger.log(["Send", "yellow", "underscore"], [`${amount} ${selectedAsset} to ${recipientAddress} with fee ${fee}`, "magenta", "bright"]);
  
    try {
      const fee_sats = fee * 100000000;
      const amount_sats = amount * 100000000;
      const assetName = mainAsset ? `${selectedAsset}!` : selectedAsset;

      const filtered_utxos = utxos.filter((a: any) => a.assetName === assetName);
      const evr_utxos = utxos.filter((a: any) => a.assetName === "EVR");
      
      const psbt = new Psbt({ network: EVRMORE_NETWORK });
      ColorLogger.log(["Send", "yellow", "underscore"], [`${amount_sats} ${fee_sats} ${recipientAddress} ${selectedAsset} ${filtered_utxos.length}, ${evr_utxos.length}`, "magenta", "bright"]);
      
      const txid = await generateEVRAssetTransaction(amount_sats, fee_sats, recipientAddress, selectedAsset, amount_sats, utxos)
      showAlert('Transaction Sent', `${txid}`)
      await updateUtxos()
    } catch (error) {
      console.error('Asset transaction generation failed:', error);
    }
  };

  const handleHTLCSend = async () => {
    if (!recipientAddress || !amount || !fee || !secret || !expiryTime) {
      showAlert('Error', 'Please enter all required fields.');
      return;
    }
    ColorLogger.log(["HTLC Send", "yellow", "underscore"], [`${amount} EVR to ${recipientAddress} with fee ${fee}, secretHash ${secret}, expiryTime ${expiryTime}`, "magenta", "bright"]);

    try {
      const fee_sats = fee * 100000000;
      const amount_sats = amount * 100000000;
//amount_sats, fee_sats, recipientAddress, Crypto.sha256(Buffer.from(secret)), expiryTime, utxos
      const txid = await generateHTLCTransaction(secret);
      showAlert('Transaction Sent', `${txid}`);
      await updateUtxos();
    } catch (error) {
      console.error('HTLC transaction generation failed:', error);
    }
  };

  const handleClaimHTLC = async () => {
    if (!claimUTXO || !claimScript || !recipientAddress) {
      showAlert('Error', 'Please enter all required fields.');
      return;
    }
    ColorLogger.log(["Claim HTLC", "yellow", "underscore"], [`Claiming timelocked funds from UTXO ${claimUTXO} with script ${claimScript} to address ${recipientAddress}`, "magenta", "bright"]);

    try {
      const txHex = await claimTimelockedFunds(claimUTXO, claimScript, recipientAddress);
      showAlert('Transaction Sent', `${txHex}`);
      await updateUtxos();
    } catch (error) {
      console.error('Claiming timelocked funds failed:', error);
    }
  };

  const renderEVRTab = () => (
    <>
      <TextInput
        style={styles.input}
        placeholder="Recipient Address"
        placeholderTextColor="#aaa"
        value={recipientAddress}
        onChangeText={setRecipientAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        placeholderTextColor="#aaa"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Fee"
        placeholderTextColor="#aaa"
        value={fee}
        onChangeText={setFee}
        keyboardType="numeric"
      />
      <Button title="Send" onPress={handleSend} color="#ff0000" />
    </>
  );

  const renderAssetsTab = () => (
    <>
      <TextInput
        style={styles.input}
        placeholder="Recipient Address"
        placeholderTextColor="#aaa"
        value={recipientAddress}
        onChangeText={setRecipientAddress}
      />
      <Picker
        selectedValue={selectedAsset}
        style={styles.picker}
        itemStyle={styles.pickerItem} // Apply custom style to picker items
        onValueChange={(itemValue) => setSelectedAsset(itemValue)}
      >
        <Picker.Item label="Select Asset" value="" />
        {ownedAssets.filter(asset => !asset.endsWith('!') && asset !== "EVR").map((asset, index) => (
          <Picker.Item key={index} label={`${asset}`} value={asset} />
        ))}
      </Picker>
      {selectedAsset && (
        <Text style={styles.assetUnitsText}>
          Units: {assetUnits[selectedAsset] !== undefined ? assetUnits[selectedAsset] : 'Unknown'} | Balance: {assetBalances[selectedAsset]/100000000 || 0}
        </Text>
      )}
      <View style={styles.checkboxContainer}>
        <Checkbox
          value={mainAsset}
          onValueChange={setMainAsset}
          style={styles.checkbox}
        />
        <Text style={styles.checkboxLabel}>Main Asset</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Amount"
        placeholderTextColor="#aaa"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Fee"
        placeholderTextColor="#aaa"
        value={fee}
        onChangeText={setFee}
        keyboardType="numeric"
      />
      <Button title="Send" onPress={handleAssetSend} color="#ff0000" />
    </>
  );

  const renderHTLCTab = () => (
    <>
      <TextInput
        style={styles.input}
        placeholder="Recipient Address"
        placeholderTextColor="#aaa"
        value={recipientAddress}
        onChangeText={setRecipientAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        placeholderTextColor="#aaa"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Fee"
        placeholderTextColor="#aaa"
        value={fee}
        onChangeText={setFee}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Secret Hash"
        placeholderTextColor="#aaa"
        value={secret}
        onChangeText={setSecretHash}
      />
      <TextInput
        style={styles.input}
        placeholder="Expiry Time"
        placeholderTextColor="#aaa"
        value={expiryTime}
        onChangeText={setExpiryTime}
        keyboardType="numeric"
      />
      <Button title="Send" onPress={handleHTLCSend} color="#ff0000" />
    </>
  );

  const renderClaimHTLCTab = () => (
    <>
      <TextInput
        style={styles.input}
        placeholder="UTXO to Spend"
        placeholderTextColor="#aaa"
        value={claimUTXO}
        onChangeText={setClaimUTXO}
      />
      <TextInput
        style={styles.input}
        placeholder="Redeem Script"
        placeholderTextColor="#aaa"
        value={claimScript}
        onChangeText={setClaimScript}
      />
      <TextInput
        style={styles.input}
        placeholder="Recipient Address"
        placeholderTextColor="#aaa"
        value={recipientAddress}
        onChangeText={setRecipientAddress}
      />
      <Button title="Claim" onPress={handleClaimHTLC} color="#ff0000" />
    </>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'EVR' && styles.activeTab]}
          onPress={() => setSelectedTab('EVR')}
        >
          <Text style={styles.tabText}>Send EVR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'ASSETS' && styles.activeTab]}
          onPress={() => setSelectedTab('ASSETS')}
        >
          <Text style={styles.tabText}>Send Assets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'HTLC' && styles.activeTab]}
          onPress={() => setSelectedTab('HTLC')}
        >
          <Text style={styles.tabText}>Send HTLC</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'CLAIM_HTLC' && styles.activeTab]}
          onPress={() => setSelectedTab('CLAIM_HTLC')}
        >
          <Text style={styles.tabText}>Claim HTLC</Text>
        </TouchableOpacity>
      </View>
      {selectedTab === 'EVR' ? renderEVRTab() : selectedTab === 'ASSETS' ? renderAssetsTab() : selectedTab === 'HTLC' ? renderHTLCTab() : renderClaimHTLCTab()}
      <View style={styles.buttonContainer}>
        <Button title="Back" onPress={() => navigation.goBack()} color="#ff0000" />
      </View>
      <CustomAlert
        visible={alertVisible}
        message={alertMessage}
        title={alertTitle}
        onClose={() => setAlertVisible(false)}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
  title: {
    color: '#fff',
  },
  input: {
    height: 40,
    borderColor: 'red',
    borderBottomWidth: 2,
    marginBottom: 12,
    color: '#fff',
    paddingHorizontal: 8,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#fff',
    backgroundColor: '#1e1e1e',
    marginBottom: 12,
  },
  pickerItem: {
    color: '#ff0000', // Red text color
    backgroundColor: '#000', // Black background color
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    alignSelf: "center",
  },
  checkboxLabel: {
    color: '#fff',
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#ff0000',
  },
  tabText: {
    color: '#fff',
    fontSize: 16,
  },
  alertContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertBox: {
    width: 300,
    padding: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    borderColor: 'red',
    borderWidth: 2,
  },
  alertTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  alertText: {
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  alertButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  assetUnitsText: {
    color: '#fff',
    marginBottom: 12,
  },
  sendButton: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default SendScreen;
