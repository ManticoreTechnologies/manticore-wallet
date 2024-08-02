import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, ToastAndroid } from "react-native";
import Modal from "react-native-modal";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import ColorLogger from "../ColorLogger";
import { makeRpcRequest } from "../manticore/api";

interface Delta {
  address: string;
  assetName: string;
  blockindex: number;
  height: number;
  index: number;
  satoshis: number;
  txid: string;
  change?: boolean; // Add optional change parameter
  label?: string; // Add optional label parameter
}

export const InOut = ({ addresses, changeAddresses }: any) => {
  const [deltas, setDeltas] = useState<Delta[] | null>(null);
  const [selectedDelta, setSelectedDelta] = useState<Delta | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);



  useEffect(() => {
    ColorLogger.log(["InOut", "yellow", "underscore"], ["Addresses update detected.", "green", "bright"]);
  }, [addresses, changeAddresses]);

  useEffect(() => {
    if (addresses && changeAddresses) {
      ColorLogger.log(["InOut", "yellow", "underscore"], ["Fetching deltas.", "green", "bright"]);
      fetchDeltas();
      const intervalId = setInterval(() => {
        fetchDeltas();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(intervalId); // Cleanup on unmount
    }
  }, [addresses, changeAddresses]);

  const fetchDeltas = async () => {
    const allAddresses = [
      ...addresses.map((item: any) => ({ ...item, change: false })),
      //...changeAddresses.map((item: any) => ({ ...item, change: true })),
    ];

    const response = await makeRpcRequest("getaddressdeltas", [{ addresses: allAddresses.map((item: any) => item.address) }]);

    // Map the response to include the change and label properties
    const responseWithChangeAndLabel = response.map((delta: Delta) => {
      const addressItem = allAddresses.find((item: any) => item.address === delta.address);
      return { ...delta, change: addressItem?.change, label: addressItem?.label };
    });

    setDeltas(responseWithChangeAndLabel.reverse());
  };

  const truncateAddress = (address: string) => {
    return address.length > 10 ? `${address.substring(0, 10)}...${address.substring(address.length - 10)}` : address;
  };

  const truncateTxid = (txid: string) => {
    return `${txid.substring(0, 10)}...${txid.substring(txid.length - 10)}`;
  };

  const formatSatoshis = (satoshis: number) => {
    return satoshis.toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    ToastAndroid.show("Copied to clipboard!", ToastAndroid.SHORT);
  };

  const handleItemPress = (delta: Delta) => {
    setSelectedDelta(delta);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDelta(null);
  };

  return (
    <View>
      {deltas ? (
        deltas.map((delta: Delta, index: number) => (
          <TouchableOpacity key={index} style={styles.deltaItem} onPress={() => handleItemPress(delta)}>
            <View style={styles.summaryContainer}>
              <ThemedText style={styles.summaryText}>
                {truncateAddress(delta.address)} {delta.change ? "(change)" : ""} {delta.label ? `(${delta.label})` : ""}
              </ThemedText>
              <View style={styles.satoshisContainer}>
                <Ionicons name={delta.satoshis > 0 ? "arrow-down" : "arrow-up"} size={24} color={delta.satoshis > 0 ? "green" : "red"} />
                <ThemedText style={styles.summaryText}>
                  {formatSatoshis(delta.satoshis / 100000000)} EVR
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <ActivityIndicator size="large" color="#fff" />
      )}
      <Modal isVisible={isModalVisible} onBackdropPress={closeModal}>
        <View style={styles.modalContent}>
          {selectedDelta && (
            <>
              <TouchableOpacity onPress={() => copyToClipboard(selectedDelta.address)} style={styles.modalRow}>
                <Ionicons name="wallet-outline" size={24} color="#fff" />
                
                <ThemedText style={styles.modalText}>
                  Address: {truncateAddress(selectedDelta.address)}
                </ThemedText>
                </TouchableOpacity>
              <View style={styles.modalRow}>
                <Ionicons name="pricetag-outline" size={24} color="#fff" />
                <ThemedText style={styles.modalText}>
                  Asset: {selectedDelta.assetName}
                </ThemedText>
              </View>
              <View style={styles.modalRow}>
                <Ionicons name="cube-outline" size={24} color="#fff" />
                <ThemedText style={styles.modalText}>
                  Block Index: {selectedDelta.blockindex}
                </ThemedText>
              </View>
              <View style={styles.modalRow}>
                <Ionicons name="stats-chart-outline" size={24} color="#fff" />
                <ThemedText style={styles.modalText}>
                  Height: {selectedDelta.height}
                </ThemedText>
              </View>
              <View style={styles.modalRow}>
                <Ionicons name="layers-outline" size={24} color="#fff" />
                <ThemedText style={styles.modalText}>
                  Index: {selectedDelta.index}
                </ThemedText>
              </View>
              <View style={styles.modalRow}>
                <Ionicons name="logo-bitcoin" size={24} color="#fff" />
                <ThemedText style={styles.modalText}>
                  Satoshis: {formatSatoshis(selectedDelta.satoshis)}
                </ThemedText>
              </View>
              <View style={styles.modalRow}>
                <Ionicons name="diamond-outline" size={24} color="#fff" />
                <ThemedText style={styles.modalText}>
                  Value: {formatSatoshis(selectedDelta.satoshis / 100000000)} {selectedDelta.assetName}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => copyToClipboard(selectedDelta.txid)} style={styles.modalRow}>
                <Ionicons name="copy-outline" size={24} color="#fff" />
                <ThemedText style={styles.modalText}>
                  TXID: {truncateTxid(selectedDelta.txid)} (copy)
                </ThemedText>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  deltaItem: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#111",
    borderRadius: 5,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryText: {
    color: "#fff",
    fontSize: 14,
  },
  satoshisContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 10,
    borderColor: "red",
    borderWidth: 2,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  modalText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
  },
});

export default InOut;
