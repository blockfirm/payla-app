import { PushNotificationIOS, AppState } from 'react-native';
import { onRegister } from '../actions/notifications/onRegister';
import { onRegisterError } from '../actions/notifications/onRegisterError';
import { setPermissions } from '../actions/notifications/setPermissions';
import { openConversation } from '../actions/navigate';
import { sync as syncApp } from '../actions/sync';
import { add as addDeviceTokenToPine } from '../actions/pine/deviceTokens/add';

export default class NotificationService {
  constructor(store) {
    this.store = store;

    this._onRegister = this._onRegister.bind(this);
    this._onRegisterError = this._onRegisterError.bind(this);
    this._onNotification = this._onNotification.bind(this);
    this._onAppStateChange = this._onAppStateChange.bind(this);
  }

  start() {
    PushNotificationIOS.setApplicationIconBadgeNumber(0);

    PushNotificationIOS.addEventListener('register', this._onRegister);
    PushNotificationIOS.addEventListener('registrationError', this._onRegisterError);
    PushNotificationIOS.addEventListener('notification', this._onNotification);

    this._appState = AppState.currentState;
    AppState.addEventListener('change', this._onAppStateChange);

    this._register();
    this._handleInitialNotification();
  }

  stop() {
    PushNotificationIOS.removeEventListener('register', this._onRegister);
    PushNotificationIOS.removeEventListener('registrationError', this._onRegisterError);
    PushNotificationIOS.removeEventListener('notification', this._onNotification);
    AppState.removeEventListener('change', this._onAppStateChange);
  }

  _register() {
    const { dispatch } = this.store;

    PushNotificationIOS.requestPermissions().then((permissions) => {
      dispatch(setPermissions(permissions));
    });
  }

  _handleInitialNotification() {
    PushNotificationIOS.getInitialNotification().then((notification) => {
      if (notification) {
        this._openConversation(notification);
      }
    });
  }

  _openConversation(notification) {
    const state = this.store.getState();
    const { dispatch } = this.store;
    const data = notification.getData();

    if (data && data.address) {
      const { activeConversation } = state.navigate;
      const activeContact = activeConversation && activeConversation.contact;

      if (!activeContact || activeContact.address !== data.address) {
        dispatch(openConversation(data.address));
      }
    }
  }

  _addDeviceTokenToPine() {
    const { store } = this;
    const state = store.getState();

    // Wait until the state has loaded.
    if (state.settings.initialized === undefined) {
      return setTimeout(() => {
        this._addDeviceTokenToPine();
      }, 1000);
    }

    // Abort if wallet is not initialized or user has not accepted terms.
    if (!state.settings.initialized || !state.settings.user.hasAcceptedTerms) {
      return;
    }

    store.dispatch(addDeviceTokenToPine()).catch(() => {
      // Suppress errors.
    });
  }

  _onRegister(deviceToken) {
    const { dispatch } = this.store;

    dispatch(onRegister(deviceToken));
    this._addDeviceTokenToPine();
  }

  _onRegisterError(error) {
    const { dispatch } = this.store;
    dispatch(onRegisterError(error));
  }

  _onNotification(notification) {
    const { store } = this;
    const state = store.getState();
    const { initialized } = state.settings;
    const isInBackground = this._appState.match(/inactive|background/);

    if (!initialized) {
      return notification.finish(PushNotificationIOS.FetchResult.ResultFailed);
    }

    store.dispatch(syncApp())
      .then(() => {
        if (isInBackground) {
          this._openConversation(notification);
        }

        notification.finish(PushNotificationIOS.FetchResult.NewData);
      })
      .catch(() => {
        notification.finish(PushNotificationIOS.FetchResult.ResultFailed);
      });
  }

  _onAppStateChange(nextAppState) {
    if (this._appState.match(/inactive|background/) && nextAppState === 'active') {
      // The app has come to the foreground.
      PushNotificationIOS.setApplicationIconBadgeNumber(0);
    }

    this._appState = nextAppState;
  }
}
