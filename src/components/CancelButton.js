import React, { Component } from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import PropTypes from 'prop-types';
import StyledText from './StyledText';

const styles = StyleSheet.create({
  button: {
    padding: 10,
    paddingRight: 16.5
  },
  text: {
    fontSize: 17,
    letterSpacing: 0.1,
    color: '#000000'
  }
});

export default class CancelButton extends Component {
  render() {
    return (
      <TouchableOpacity onPress={this.props.onPress} style={styles.button}>
        <Text>
          <StyledText style={styles.text}>
            Cancel
          </StyledText>
        </Text>
      </TouchableOpacity>
    );
  }
}

CancelButton.propTypes = {
  onPress: PropTypes.func
};
