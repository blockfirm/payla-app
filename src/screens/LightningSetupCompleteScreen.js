import React, { Component } from 'react';
import { StyleSheet, Image } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { reset as navigateWithReset } from '../actions/navigate';
import headerStyles from '../styles/headerStyles';
import Title from '../components/Title';
import Paragraph from '../components/Paragraph';
import Button from '../components/Button';
import Footer from '../components/Footer';
import BaseScreen from './BaseScreen';

//const confettiImage = require('../images/illustrations/Confetti.png');

const styles = StyleSheet.create({
  view: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    marginBottom: 20,
    lineHeight: 25
  },
  paragraph: {
    textAlign: 'center'
  },
  confetti: {
    width: 100,
    height: 96,
    marginBottom: 40
  }
});

@connect()
export default class LightningSetupCompleteScreen extends Component {
  static navigationOptions = () => ({
    header: null
  });

  _goToHome() {
    const { dispatch, navigation } = this.props;
    dispatch(navigateWithReset('Home'));
  }

  render() {
    return (
      <BaseScreen style={styles.view} hideHeader={true}>
        {/*<Image source={confettiImage} style={styles.confetti} />*/}

        <Title style={styles.title}>
          Your Pine account is now Lightning-enabled!
        </Title>

        <Paragraph style={styles.paragraph}>
          But you'll have to wait 10 minutes or so until it has been confirmed on the blockchain.
        </Paragraph>
        <Paragraph style={styles.paragraph}>
          Explore the rest of the app or grab a cup of coffee while you wait. You will get a
          notification when it's ready.
        </Paragraph>

        <Footer>
          <Button
            label='Continue'
            onPress={this._goToHome.bind(this)}
          />
        </Footer>
      </BaseScreen>
    );
  }
}

LightningSetupCompleteScreen.propTypes = {
  dispatch: PropTypes.func,
  navigation: PropTypes.any
};
