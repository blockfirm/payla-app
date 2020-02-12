/* eslint-disable lines-around-comment */
import * as actions from '../actions';
import { handle as handleError } from '../actions/error';
import * as lightningActions from '../actions/paymentServer/lightning';
import * as lightningRpcActions from '../actions/paymentServer/lightning/rpc';
import { LightningClient, setClient } from '../clients/lightning';

/**
 * Returns a map of lightning RPC client methods to redux implementations.
 */
const getMethods = (dispatch) => {
  const methods = {};

  Object.keys(lightningRpcActions).forEach(methodName => {
    methods[methodName] = (request) => dispatch(lightningRpcActions[methodName](request));
  });

  return methods;
};

/**
 * This is a redux middleware that manages the Pine Lightning
 * client and integrates it with redux.
 */
const lightningMiddleware = () => {
  let client;

  // eslint-disable-next-line max-statements
  return store => next => action => {
    const state = store.getState();
    const { settings } = state;

    if (!settings || !settings.user || !settings.lightning.enabled) {
      return next(action);
    }

    const pineAddress = settings.user.profile.address;

    switch (action.type) {
      // Connect when app is ready.
      case actions.READY:
        if (!client) {
          client = new LightningClient(pineAddress, state.pine.credentials, settings.lightning);
          client.once('ready', () => store.dispatch(lightningActions.sync()));
          client.on('error', (error) => store.dispatch(handleError(error)));
          client.registerMethods(getMethods(store.dispatch));
          client.connect();

          setClient(client);
        }
        break;

      // Disconnect when app is reset (user signed out).
      case actions.RESET_SUCCESS:
        if (client) {
          client.disconnect();
          client.removeAllListeners();
          client = null;

          setClient(client);
        }
        break;
    }

    return next(action);
  };
};

export default lightningMiddleware();
