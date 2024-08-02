import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import QRCode from '@/components/qrcode_generator';
import Modal from 'react-native-modal';
import { ThemedText } from '../ThemedText';
import * as Clipboard from 'expo-clipboard';

const handleCopyToClipboard = async (text: string | undefined) => {
  await Clipboard.setStringAsync(text || '');
};

const QRPopup = ({ visible, data, setModalVisible }: any) => {
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={() => setModalVisible(false)}
      backdropColor="#000000"
      backdropOpacity={0.8} // Adjust backdrop opacity to make the background more visible
      animationIn="zoomInDown"
      animationOut="zoomOutUp"
      animationInTiming={600}
      animationOutTiming={600}
      useNativeDriver
    >
      <View style={styles.modalContent}>
        <QRCode value={data} size={150} />
        <TouchableOpacity onPress={() => handleCopyToClipboard(data)}>
          <ThemedText style={styles.copyButtonModal}>{data}</ThemedText>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  copyButtonModal: {
    fontSize: 14,
    color: '#ff0000',
    marginTop: 8,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default QRPopup;
