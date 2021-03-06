/* eslint-disable max-lines */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as bolt11 from 'bolt11';

import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  LayoutAnimation,
  Dimensions,
  Animated
} from 'react-native';

import { withTheme } from '../../contexts/theme';
import { UNIT_BTC, satsToBtc } from '../../crypto/bitcoin/convert';
import CurrencyLabelContainer from '../../containers/CurrencyLabelContainer';
import authentication from '../../authentication';
import HelpIcon from '../icons/HelpIcon';
import SmallLightningIcon from '../icons/SmallLightningIcon';
import Button from '../Button';
import Footer from '../Footer';
import StyledText from '../StyledText';
import Bullet from '../typography/Bullet';
import FeeLabel from '../FeeLabel';

const WINDOW_HEIGHT = Dimensions.get('window').height;

const BIOMETRY_TYPE_TOUCH_ID = 'TouchID';
const BIOMETRY_TYPE_FACE_ID = 'FaceID';

const styles = StyleSheet.create({
  view: {
    paddingHorizontal: 15,
    alignSelf: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth
  },
  footer: {
    backgroundColor: 'transparent'
  },
  details: {
    alignSelf: 'stretch',
    marginTop: 16,
    marginHorizontal: 16
  },
  detail: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  lastDetail: {
    borderBottomWidth: 0
  },
  label: {
    fontSize: 15
  },
  feeLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  valueWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  value: {
    fontSize: 15,
    position: 'absolute',
    right: 0,
    top: 16
  },
  valueLabel: {
    fontSize: 15
  },
  errorText: {
    marginTop: 1
  },
  bold: {
    fontWeight: '600'
  },
  helpIcon: {
    paddingHorizontal: 5,
    opacity: 0.75
  },
  helpIconActive: {
    opacity: 1
  },
  helpText: {
    marginTop: 5,
    fontSize: 13
  },
  lightningIcon: {
    marginRight: 5
  }
});

class ConfirmTransaction extends Component {
  state = {
    biometryType: null,
    showFeeHelpText: false,
    amountBtc: 0
  }

  static getDerivedStateFromProps(props) {
    if (props.paymentRequest) {
      return null;
    }

    return {
      amountBtc: props.amountBtc
    };
  }

  constructor() {
    super(...arguments);
    this._toggleFeeHelpText = this._toggleFeeHelpText.bind(this);
  }

  componentDidMount() {
    const { paymentRequest } = this.props;

    // Get the supported biometry authentication type.
    authentication.getSupportedBiometryType().then((biometryType) => {
      this.setState({ biometryType });
    });

    // Get amount from lightning payment request.
    if (paymentRequest) {
      const decodedPaymentRequest = bolt11.decode(paymentRequest);
      const amountBtc = satsToBtc(decodedPaymentRequest.satoshis);

      this.setState({
        decodedPaymentRequest,
        amountBtc
      });
    }
  }

  _getButtonLabel() {
    switch (this.state.biometryType) {
      case BIOMETRY_TYPE_TOUCH_ID:
        return 'Pay with Touch ID';

      case BIOMETRY_TYPE_FACE_ID:
        return 'Pay with Face ID';

      default:
        return 'Pay';
    }
  }

  _toggleFeeHelpText() {
    const animation = LayoutAnimation.create(
      200,
      LayoutAnimation.Types['easeOut'],
      LayoutAnimation.Properties.opacity
    );

    LayoutAnimation.configureNext(animation);

    this.setState({
      showFeeHelpText: !this.state.showFeeHelpText
    });
  }

  _renderFeeHelpText() {
    const { theme, isLightning } = this.props;

    if (!this.state.showFeeHelpText) {
      return null;
    }

    if (isLightning) {
      return (
        <StyledText style={[styles.helpText, theme.confirmTransactionHelpText]}>
          The fee goes to various node operators on the Lightning network,
          including Pine.
        </StyledText>
      );
    }

    return (
      <StyledText style={[styles.helpText, theme.confirmTransactionHelpText]}>
        The fee goes to the miner who mines the block containing your transaction.
        Pine and its developers does not charge any fees.
      </StyledText>
    );
  }

  _renderFee() {
    const { displayCurrency, displayUnit, fee, cannotAffordFee, isLightning, theme } = this.props;
    const { amountBtc } = this.state;
    const feeBtc = fee ? satsToBtc(fee) : 0;

    if (cannotAffordFee) {
      return (
        <StyledText style={[styles.errorText, theme.confirmTransactionErrorText]}>
          Not enough funds to pay for the fee
        </StyledText>
      );
    }

    if (typeof fee !== 'number') {
      return <ActivityIndicator color='gray' size='small' />;
    }

    return (
      <FeeLabel
        prefix={isLightning ? '~' : null}
        fee={feeBtc}
        amount={amountBtc}
        currency={displayCurrency}
        unit={displayUnit}
        style={[styles.valueLabel, theme.confirmTransactionValue]}
      />
    );
  }

  _renderTotal() {
    const { fee, displayCurrency, displayUnit, isLightning, theme } = this.props;
    const { amountBtc } = this.state;
    const feeBtc = fee ? satsToBtc(fee) : 0;
    const totalAmount = amountBtc + feeBtc;
    let amountLabel = null;

    if (displayCurrency === UNIT_BTC) {
      amountLabel = (
        <CurrencyLabelContainer
          amountBtc={totalAmount}
          currency={displayCurrency}
          unit={displayUnit}
          style={[styles.valueLabel, theme.confirmTransactionValue, styles.bold]}
        />
      );
    } else {
      amountLabel = (
        <CurrencyLabelContainer
          amountBtc={totalAmount}
          currencyType='primary'
          style={[styles.valueLabel, theme.confirmTransactionValue, styles.bold]}
        />
      );
    }

    return (
      <View style={styles.valueWrapper}>
        {isLightning && <SmallLightningIcon style={styles.lightningIcon} />}
        {amountLabel}
        <Bullet />
        <CurrencyLabelContainer
          amountBtc={totalAmount}
          currencyType='secondary'
          style={[styles.valueLabel, theme.confirmTransactionValue, styles.bold]}
        />
      </View>
    );
  }

  render() {
    const { theme } = this.props;
    const { showFeeHelpText } = this.state;
    const hideTotal = showFeeHelpText && WINDOW_HEIGHT < 700;

    return (
      <Animated.View style={[styles.view, theme.confirmTransactionView, this.props.style]}>
        <View style={styles.details}>
          <View style={[styles.detail, theme.confirmTransactionDetail]}>
            <TouchableOpacity onPress={this._toggleFeeHelpText}>
              <View style={styles.feeLabelWrapper}>
                <StyledText style={[styles.label, theme.confirmTransactionLabel]}>
                  Fee
                </StyledText>
                <HelpIcon style={[styles.helpIcon, showFeeHelpText && styles.helpIconActive]} />
              </View>
            </TouchableOpacity>
            <View style={[styles.value, theme.confirmTransactionValue]}>
              {this._renderFee()}
            </View>
            { this._renderFeeHelpText() }
          </View>
          <View style={[styles.detail, styles.lastDetail, hideTotal && { opacity: 0 }]}>
            <StyledText style={[styles.label, theme.confirmTransactionLabel, styles.bold]}>
              You Pay
            </StyledText>
            <View style={[styles.value, theme.confirmTransactionValue]}>
              {this._renderTotal()}
            </View>
          </View>
        </View>
        <Footer style={styles.footer}>
          <Button
            label={this._getButtonLabel()}
            onPress={this.props.onPayPress}
            showLoader={true}
            disabled={this.props.fee === null}
          />
        </Footer>
      </Animated.View>
    );
  }
}

ConfirmTransaction.propTypes = {
  dispatch: PropTypes.func.isRequired,
  amountBtc: PropTypes.number.isRequired,
  displayCurrency: PropTypes.string.isRequired,
  displayUnit: PropTypes.string,
  fee: PropTypes.number,
  paymentRequest: PropTypes.string,
  cannotAffordFee: PropTypes.bool,
  isLightning: PropTypes.bool,
  onPayPress: PropTypes.func,
  style: PropTypes.any,
  theme: PropTypes.object.isRequired
};

export default withTheme(ConfirmTransaction);
