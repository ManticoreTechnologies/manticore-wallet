import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

interface PromptProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (input: string) => void;
  placeholder?: string;
}

const Prompt: React.FC<PromptProps> = ({ isVisible, onClose, onSubmit, placeholder }) => {
  const [input, setInput] = useState<string>('');

  const handleSubmit = () => {
    onSubmit(input);
    setInput('');
    onClose();
  };

  return (
    <Modal isVisible={isVisible}>
      <View style={styles.modalContent}>
        <TextInput
          placeholder={placeholder || 'Enter text'}
          value={input}
          onChangeText={setInput}
          style={styles.textInput}
        />
        <Button title="Submit" onPress={handleSubmit} />
        <Button title="Cancel" onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

export default Prompt;
