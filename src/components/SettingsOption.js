import React, { Component } from 'react';
import { StyleSheet, View, TouchableHighlight } from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/Octicons';

import { withTheme } from '../contexts/theme';
import settingsStyles from '../styles/settingsStyles';
import StyledText from './StyledText';

const styles = StyleSheet.create({
  checkmark: {
    position: 'absolute',
    right: 15,
    fontSize: 16,
    paddingTop: 2
  }
});

class SettingsOption extends Component {
  _onPress() {
    this.props.onSelect(this.props.name);
  }

  render() {
    const { name, value, isLastItem, theme } = this.props;
    const isChecked = value.toLowerCase() === name.toLowerCase();

    const containerStyles = [
      settingsStyles.item,
      theme.settingsItem,
      isLastItem ? { borderBottomWidth: 0 } : undefined
    ];

    return (
      <TouchableHighlight onPress={this._onPress.bind(this)} underlayColor={theme.settingsUnderlayColor}>
        <View style={containerStyles}>
          <StyledText style={settingsStyles.label}>{name}</StyledText>
          {isChecked ? <Icon name='check' style={[styles.checkmark, theme.settingsCheckmark]} /> : null}
        </View>
      </TouchableHighlight>
    );
  }
}

SettingsOption.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  isLastItem: PropTypes.bool,
  theme: PropTypes.object.isRequired
};

export default withTheme(SettingsOption);
