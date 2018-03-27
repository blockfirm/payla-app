import { StackNavigator } from 'react-navigation';
import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import MnemonicScreen from './screens/MnemonicScreen';
import ConfirmMnemonicScreen from './screens/ConfirmMnemonicScreen';
import HomeScreen from './screens/HomeScreen';

// eslint-disable-next-line new-cap
const AppNavigator = StackNavigator({
  Splash: { screen: SplashScreen },
  Welcome: { screen: WelcomeScreen },
  Mnemonic: { screen: MnemonicScreen },
  ConfirmMnemonic: { screen: ConfirmMnemonicScreen },
  Home: { screen: HomeScreen }
});

export default AppNavigator;
