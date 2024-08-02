import React, { useEffect } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { TabBarIcon } from './navigation/TabBarIcon';

const AnimatedDragon = ({ size }: any) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <Animated.View style={[styles.circle, { width: size, height: size }, animatedStyle]}>
      <Image
        source={require('@/assets/images/loading.png')} // Replace with your dragon icon image path
        style={{ width: size, height: size, resizeMode: 'contain' }}
      />
    </Animated.View>
  );
};

const Header = ({ onHamburgerPress, onLogoPress }: any) => {
  return (
    <View style={styles.topContainer}>
      {/*<AnimatedDragon size={25} />*/}
      
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onLogoPress} style={styles.logoButton}>
          <Image
            source={require('@/assets/images/logo.png')} // Replace with your logo image
            style={styles.logo}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onHamburgerPress} style={styles.hamburgerButton}>
          <TabBarIcon name="settings-outline" color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50, // Adjust the height as needed
    paddingHorizontal: 16,
    zIndex: 1,
  },
  logoButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40, // Adjust the size as needed
    resizeMode: 'contain',
  },
  circle: {
    borderRadius: 100, // Half of the size for a perfect circle
    position: 'absolute',
    top: -2, // Adjust as needed to position the circle at the top
    left: '50%',
    marginLeft: -12.5, // Half of the size to center it horizontally,
    zIndex: 1,
  },
  topContainer: {
    alignItems: 'center',
    top: 5.35,
    zIndex: 1,
  },
});

export default Header;
