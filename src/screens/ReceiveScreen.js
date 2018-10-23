import React, { Component } from 'react';
import { StyleSheet, Clipboard } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import QRCode from 'react-qr-code';
import ReactNativeHaptic from 'react-native-haptic';

import BaseScreen from './BaseScreen';
import Footer from '../components/Footer';
import Button from '../components/Button';

const styles = StyleSheet.create({
  view: {
  }
});

@connect((state) => ({
  address: state.bitcoin.wallet.addresses.external.unused
}))
export default class ReceiveScreen extends Component {
  static navigationOptions = {
    header: null
  }

  _copyAddress() {
    const address = this.props.address;

    Clipboard.setString(address);
    ReactNativeHaptic.generate('notification');
  }

  render() {
    const address = this.props.address;
    const qrData = `bitcoin:${address}`;

    return (
      <BaseScreen style={styles.view}>
        <QRCode value={qrData} size={200} />

        <Footer>
          <Button
            label='Copy Address'
            disableThrottling={true}
            onPress={this._copyAddress.bind(this)}
          />
        </Footer>
      </BaseScreen>
    );
  }
}

ReceiveScreen.propTypes = {
  dispatch: PropTypes.func,
  address: PropTypes.string
};
