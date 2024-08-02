/*
  Phoenix Campanile
  Manticore Technologies, LLC
  (c) 2024

  @/app/(tabs)/index.tsx
  This tab is the first one shown to the user.
  It should be simple yet informative.
*/

/* Imports */
import React, { useEffect, useState, useCallback } from 'react';
import { Image, StyleSheet, View, SafeAreaView, RefreshControl, Button } from 'react-native';
import { loadAddresses, loadChangeAddresses } from '@/components/useAddress';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import {BalanceValues} from '@/components/sharing/balance_value';
import { generateAddress } from '@/components/generateAddress';
import { UseAddresses } from '@/hooks/secure/addresses';
import RecvList from '@/components/sharing/recv_list';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ColorLogger from '@/components/ColorLogger';
import { UseWallet } from '@/hooks/secure/wallet';
import { Link, useRouter } from 'expo-router';
import Header from '@/components/Header';
import InOut from '@/components/sharing/in_out';
/* Wallet homescreen component */
const HomeScreen: React.FC = () => {

  /* Load the wallet, if no wallet exists then the 
     hook will redirect to the recovery screen 
  */
  const wallet = UseWallet();
  
  const {addresses, changeAddresses, discovering, generateAddress, labelAddress, updateBalance} = UseAddresses(wallet); 
  


  const debug_name: any = ["HomeScreen", "yellow", "underscore"];
  const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewStart, setViewStart] = useState(0); // Start of the view range
  const [viewRange, setViewRange] = useState(10); // Width of the view range
  //const { balanceHistory, fetchData } = useHistory();
  const [new_address, set_new_address] = useState('')
  const router = useRouter();




  //useEffect(() => {
  //  fetchData();
  //}, [fetchData]);

  
  const handleReceiveAddress = async (change: boolean) => {
    if (isGeneratingAddress) return;

    setIsGeneratingAddress(true);
    const index = addresses.length;
    await generateAddress(`m/44'/175'/0'/0/${index}`)
    setIsGeneratingAddress(false);
  };





  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const onRefresh = useCallback(async() => {
    setRefreshing(true);
    await delay(1)
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>

      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#000' }}
        headerImage={
          <View style={styles.bannerContainer}>
            <Image
              style={styles.reactLogo}
              source={require('@/assets/images/banner.png')}
            />
          </View>
        }
      header={  
        <View>
          <Header onHamburgerPress={() => { router.push({ pathname: "settings" }) }} onLogoPress={() => { router.push({pathname: "WebViewScreen", params: {url: "https://manticore.exchange"}})}} />
          <ThemedText style={styles.powered}>by Manticore Technologies  <Image style={styles.smallImage} source={require('@/assets/images/minimal_logo.png')} /></ThemedText>

        </View>
      }
      >
        
        {/* Total evrmore across all addresses */}
        <BalanceValues addresses={[...addresses, ...changeAddresses]} refreshing={refreshing} /> 
        
        {/* Receiving address list */}
        <RecvList updateBalance={updateBalance} labelAddress={labelAddress} isGeneratingAddress={isGeneratingAddress} addresses={addresses} changeAddresses={changeAddresses} refreshing={refreshing}/>

        {/* Send and receive buttons */}
        <ThemedView style={styles.stepContainer}>
          <Link style={[styles.button, styles.sendButton]} href="/Send">SEND</Link>
          <Button title="Receive" onPress={() => { handleReceiveAddress(false);  }} color="#ff0000" disabled={isGeneratingAddress} />
        </ThemedView>

        <InOut addresses={addresses} changeAddresses={changeAddresses}/>

        {/* A list of the most recent transactions */}
        {/*<TXList addresses = {addresses}/>*/}


        {/* A list of the most recent address deltas */}

{/*
        <ThemedView style={styles.graphContainer}>
          <ThemedText style={styles.sectionTitle}>Balance History</ThemedText>
          {balanceHistory.length > 0 ? (
            <>
              <LineChart
                data={{
                  labels: balanceHistory.slice(viewStart, viewStart + viewRange).map((a: any) => {return new Date(a.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', })}),
                  datasets: [
                    {
                      data: balanceHistory.slice(viewStart, viewStart + viewRange).map((a: any) => a.balance / 100000000),
                    }
                  ]
                }}
                width={320}
                height={220}
                chartConfig={{
                  backgroundColor: "#000",
                  backgroundGradientFrom: "#000",
                  backgroundGradientTo: "#000",
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "1",
                    strokeWidth: "2",
                    stroke: "#ff0026"
                  },
                  propsForLabels: {
                    fontSize: 9, // Adjust the font size for labels
                  },
                  propsForBackgroundLines: {
                    stroke: "#222", // Subtle color for background grid lines
                  },
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
              />
              <Slider
                style={{
                  width: 300,
                  height: 40,
                  alignSelf: 'center',
                  marginTop: 10,
                }}
                minimumValue={0}
                maximumValue={balanceHistory.length - viewRange}
                value={viewStart}
                onValueChange={value => setViewStart(value)}
                step={1}
                minimumTrackTintColor="#FF0000"
                maximumTrackTintColor="#333333" // Darker shade of black for contrast
                thumbTintColor='#FF0000'
                trackStyle={{
                  height: 2, // Make the track thinner
                  backgroundColor: '#000000', // Ensure the background is black
                }}
                thumbStyle={{
                  width: 12, // Smaller thumb
                  height: 12,
                  backgroundColor: '#FF0000', // Red thumb
                  borderRadius: 6, // Make the thumb round
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.2,
                  shadowRadius: 1,
                }}
              />
            </>
          ) : (
            <ActivityIndicator size="large" color="#fff" />
          )}
        </ThemedView>
*/}
      </ParallaxScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  smallImage: {
    width: 10, // Set the width of the image
    height: 10, // Set the height of the image
    marginLeft: 2, // Add some space between the text and the image
  },
  powered: {
    fontSize: 10, // Make the text smaller
    marginBottom: 2, // Move the text higher
    color: '#FFFFFF',
    position: 'absolute', // Position absolutely
    top: 25, // Adjust the top value as needed to place it over the header
    left: 0, // Align to the left edge
    right: 0, // Align to the right edge
    textAlign: 'center', // Center the text horizontally
    zIndex: 1, // Ensure it is above other elements
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactLogo: {
    top: 50,
    height: 125,
    width: 500,
  },
  stepContainer: {
    gap: 8,
    padding: 16,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  button: {
    color: '#fff',
    backgroundColor: '#2196F3',
    alignItems: 'center',
    textAlign: "center",
    padding: 8,
    borderRadius: 2,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#ff0000',
  },
});

export default HomeScreen;
