import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import QRPopup from './qr_popup';
import { Ionicons } from '@expo/vector-icons';
import Prompt from './prompt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const RecvList = ({ updateBalance, labelAddress, addresses, changeAddresses, isGeneratingAddress, refreshing }: any) => {
  const [modalVisible, setModalVisible] = useState<any>({});
  const [labelModalVisible, setLabelModalVisible] = useState<boolean>(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [localAddresses, setLocalAddresses] = useState<any>([]);
  const [localChangeAddresses, setLocalChangeAddresses] = useState<any>([]);

  const handlePress = (address: string) => {
    setModalVisible({ ...modalVisible, [address]: true });
  };

  const handleClose = (address: string) => {
    setModalVisible({ ...modalVisible, [address]: false });
  };

  useEffect(() => {
    setLocalAddresses(addresses);
  }, [addresses]);

  useEffect(() => {
    setLocalChangeAddresses(changeAddresses);
  }, [changeAddresses]);

  const fetchAddresses = useCallback(async () => {
    // Function to fetch addresses
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses, refreshing, isGeneratingAddress]);

  const truncateAddress = (address: string) => {
    return address.length > 10 ? `${address.substring(0, 4)}...${address.substring(address.length - 4)}` : address;
  };

  const addAddressLabel = (address: string) => {
    setSelectedAddress(address);
    setLabelModalVisible(true);
  };


  const handleAddLabel = (label: string) => {
    if (selectedAddress) {
      labelAddress(selectedAddress, label);
      setLabelModalVisible(false);
    }
  };

  return (
    <ThemedView style={styles.addressContainer}>
      <ScrollView horizontal nestedScrollEnabled={true}>
        <AddressList updateBalance={updateBalance} title={"Receive Addresses"} addresses={localAddresses} addAddressLabel={addAddressLabel} />
        <AddressList updateBalance={updateBalance} title={"Change Addresses"} addresses={changeAddresses} addAddressLabel={addAddressLabel} />

      </ScrollView>
      <Prompt
        isVisible={labelModalVisible}
        onClose={() => setLabelModalVisible(false)}
        onSubmit={handleAddLabel}
        placeholder="Enter label"
      />
    </ThemedView>
  );
};

const AddressList = ({ addresses, title, addAddressLabel, updateBalance }: { addresses: any, title: string, addAddressLabel: (address: string) => void , updateBalance: (address: string) => void }) => {
  return (
    <View>
      <ThemedText style={styles.listLabel}>{title}</ThemedText>
      <View style={styles.headerRow}>
        <ThemedText style={styles.headerText}>Label</ThemedText>
        <ThemedText style={styles.headerText}>Address</ThemedText>
        <ThemedText style={styles.headerText}>Balance</ThemedText>
        <ThemedText style={styles.headerText}>Received</ThemedText>
      </View>
      <ScrollView nestedScrollEnabled={true} style={styles.innerScrollView}>
        {addresses ? addresses.slice().reverse().map((address: any, index: number) => (
          <AddressItem updateBalance={updateBalance} key={index} address={address} index={index} addAddressLabel={addAddressLabel} />
        )) : (<ActivityIndicator size="large" color="#fff" />)}
      </ScrollView>
    </View>
  );
}

const AddressItem = ({ address, index, addAddressLabel, updateBalance }: any) => {
  const [modalVisible, setModalVisible] = useState<any>({});
  const router = useRouter();
  const handlePress = (address: string) => {
    setModalVisible({ ...modalVisible, [address]: true });
  };
  const truncateAddress = (address: string) => {
    try{
      return address.length > 10 ? `${address.substring(0, 3)}...${address.substring(address.length - 3)}` : address;
    }catch{
      return ""
    }
  };
  const handleClose = (address: string) => {
    setModalVisible({ ...modalVisible, [address]: false });
  };
  const containsEmoji = (text: string) => {
    const emojiRegex = /[\p{Emoji}]/u;
    return emojiRegex.test(text);
  };

  const truncateLabel = (label: string) => {
    if (containsEmoji(label)) {
      return label.length > 4 ? `${label.substring(0, 4)}...` : label;
    }
    return label.length > 8 ? `${label.substring(0, 8)}...` : label;
  };
  const formatNumber = (num: number) => {
    return num.toString().length > 6 ? num.toExponential(2) : num;
  };
  useEffect(()=>{
    const intervalId = setInterval(() => {
      updateBalance(address.address)
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  })
  return (
    <View key={index} style={styles.addressItem}>
      <View style={styles.labelContainer}>
      <TouchableOpacity style={styles.labelContainer} onPress={() => addAddressLabel(address.address)}>
        {address.label ? (
          <ThemedText style={styles.label}>{truncateLabel(address.label)}</ThemedText>
        ) : (
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
        )}
      </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => handlePress(address.address)} style={styles.addressContainer}>
        <ThemedText style={styles.walletAddress}>
          {truncateAddress(address.address)}
        </ThemedText>
      </TouchableOpacity>
      <View style={styles.balanceContainer}>
        <ThemedText style={styles.balance}>{formatNumber(address.balance / 100000000)}</ThemedText>
      </View>
      <View style={styles.balanceContainer}>
        <ThemedText style={styles.balance}>{formatNumber(address.received / 100000000)}</ThemedText>
      </View>
      <QRPopup visible={modalVisible[address.address]} data={address.address} setModalVisible={() => handleClose(address.address)} />
    </View>
  )
}

const styles = StyleSheet.create({
  addressContainer: {
    flex: 1,
    maxHeight: 200,
    alignItems: 'center',
    backgroundColor: '#000',
    borderBottomWidth: 1,
    width: "100%",
    borderBottomColor: '#dee2e6',
  },
  centerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  walletAddress: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
  },
  balance: {
    fontSize: 13,
    color: '#fff',
    width: 70,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    color: '#fff',
    width: 70,
    textAlign: 'center',
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    width: 370,
    padding: 5,
    backgroundColor: '#111',
    borderRadius: 5,
  },
  labelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  addressTextContainer: {
    flex: 2,
    alignItems: 'center',
  },
  balanceContainer: {
    flex: 1,
    alignItems: 'center',
  },
  innerScrollView: {
    paddingEnd: 5,
  },
  listLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 370,
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    marginBottom: 5,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    color: '#fff',
    width: 90,
    textAlign: 'center',
    
  },
});

export default RecvList;
