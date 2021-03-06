/* eslint-disable max-lines */
import EventEmitter from 'eventemitter3';

import {
  deserializeClientMessage,
  serializeResponse,
  serializeRequest
} from './serializers';

import { parse as parseAddress, resolveBaseUrl } from '../paymentServer/address';
import { getAuthorizationHeader } from '../paymentServer/authentication';

const PING_LATENCY = 2000; // 2 seconds
const RECONNECT_INTERVAL = 1000; // 1 second

export default class LightningClient extends EventEmitter {
  constructor(pineAddress, credentials, config) {
    const { hostname } = parseAddress(pineAddress);

    super();

    this.config = config;
    this.baseUrl = resolveBaseUrl(hostname);
    this.keyPair = credentials.keyPair;
    this.userId = credentials.userId;

    this.methods = {};
    this.callCounter = 1;
    this.callbacks = {};
    this.disconnected = true;
    this.ready = false;
  }

  registerMethods(methods) {
    this.methods = methods;
  }

  async connect() {
    this.disconnect();

    const { baseUrl } = this;
    const wsBaseUrl = baseUrl.replace(/http/, 'ws');
    const url = `${wsBaseUrl}/v1/lightning/ws`;
    const sessionId = await this._startSession();
    const authorizationHeader = this._getWebSocketAuthorizationHeader(sessionId);

    this.websocket = new WebSocket(url, authorizationHeader);

    this.websocket.addEventListener('open', this._onOpen.bind(this));
    this.websocket.addEventListener('close', this._onClose.bind(this));
    this.websocket.addEventListener('error', this._onError.bind(this));
    this.websocket.addEventListener('message', this._onMessage.bind(this));
  }

  reconnect() {
    // Try to reconnect.
    setTimeout(() => {
      this.connect().catch(() => {
        this.reconnect();
      });
    }, RECONNECT_INTERVAL);
  }

  disconnect() {
    const { websocket } = this;

    this.ready = false;
    this.disconnected = true;

    if (!websocket) {
      return;
    }

    websocket.close();
    delete this.websocket;
  }

  sendRequest(methodName, request) {
    const callId = this.callCounter++;

    const data = serializeRequest({
      id: callId,
      method: methodName,
      request
    });

    return new Promise((resolve, reject) => {
      this.callbacks[callId] = (error, response) => {
        if (error) {
          return reject(error);
        }

        resolve(response);
      };

      this.websocket.send(data);
    });
  }

  sendResponse(callId, response, error) {
    this.websocket.send(serializeResponse({ id: callId, response, error }));
  }

  sendError(callId, error) {
    return this.sendResponse(callId, null, error);
  }

  openChannel(sats, satsPerByte) {
    return this.sendRequest('openChannel', { sats, satsPerByte });
  }

  openInboundChannel() {
    return this.sendRequest('openInboundChannel', {});
  }

  closeChannel() {
    return this.sendRequest('closeChannel', {});
  }

  getBalance() {
    return this.sendRequest('getBalance', {});
  }

  sendPayment(paymentRequest) {
    return this.sendRequest('sendPayment', { paymentRequest });
  }

  estimateFee(paymentRequest) {
    return this.sendRequest('estimateFee', { paymentRequest });
  }

  createInvoice(amount) {
    return this.sendRequest('createInvoice', { amount });
  }

  _startSession() {
    const { baseUrl } = this;
    const endpoint = '/v1/lightning/sessions';
    const url = `${baseUrl}${endpoint}`;

    const fetchOptions = {
      method: 'POST',
      headers: {
        Authorization: this._getRestAuthorizationHeader(endpoint)
      }
    };

    return fetch(url, fetchOptions)
      .then(response => {
        if (response.ok) {
          return response.json();
        }

        return response.json().then(error => {
          throw new Error(error.message);
        });
      })
      .then(response => {
        this.sessionId = response.sessionId;
        return this.sessionId;
      })
      .catch(error => {
        if (error.name === 'SyntaxError') {
          throw new Error(
            'Received an invalid response when trying to start new lightning session'
          );
        }

        throw error;
      });
  }

  _getRestAuthorizationHeader(endpoint) {
    const { userId, keyPair } = this;
    return getAuthorizationHeader(userId, endpoint, '', keyPair);
  }

  _getWebSocketAuthorizationHeader(sessionId) {
    const { keyPair } = this;
    return getAuthorizationHeader(sessionId, sessionId, '', keyPair);
  }

  _onOpen() {
    this.disconnected = false;
    this._onPing();
  }

  _onClose() {
    this.ready = false;
    clearTimeout(this._pingTimeout);

    if (this.disconnected) {
      return;
    }

    this.reconnect();
  }

  _onError(error) {
    this.emit('error', error);
  }

  _onReady() {
    this.ready = true;
    this.emit('ready');
  }

  _handleEventMessage(eventMessage) {
    const { event } = eventMessage;
    const data = eventMessage.data || {};
    let error;

    switch (event) {
      case 'error':
        error = new Error(data.message);
        error.name = data.name;
        return this._onError(error);

      case 'ready':
        return this._onReady();
    }
  }

  _handleResponseMessage(responseMessage) {
    const { id, response, error } = responseMessage;
    const callback = this.callbacks[id];

    if (!callback) {
      return; // No callback found for call.
    }

    if (error) {
      callback(new Error(error.message));
    } else {
      callback(null, response);
    }

    delete this.callbacks[id];
  }

  _handleRequestMessage(requestMessage) {
    const { methods } = this;
    const { id, method, request } = requestMessage;

    if (!methods[method]) {
      const error = new Error(`Invalid method '${method}'`);
      this._onError(error);
      return this.sendError(id, error);
    }

    methods[method](request)
      .then(response => {
        this.sendResponse(id, response);
      })
      .catch(error => {
        this.sendError(id, error);
        this._onError(error);
      });
  }

  _onMessage({ data }) {
    let deserializedMessage;

    if (data === 'ping') {
      return this._onPing();
    }

    try {
      deserializedMessage = deserializeClientMessage(data);
    } catch (error) {
      this._onError(error);
      return this.sendError(0, new Error('Malformed request'));
    }

    if (deserializedMessage.event) {
      return this._handleEventMessage(deserializedMessage);
    }

    if (deserializedMessage.response || deserializedMessage.error) {
      return this._handleResponseMessage(deserializedMessage);
    }

    return this._handleRequestMessage(deserializedMessage);
  }

  _onPing() {
    const { serverPingInterval } = this.config;

    // Respond with pong.
    this.websocket.send('pong');

    clearTimeout(this._pingTimeout);

    /**
     * Assume the connection is dead if no ping has been received within
     * the ping interval + some assumption of latency.
     */
    this._pingTimeout = setTimeout(() => {
      this.websocket.close();
    }, serverPingInterval * 1000 + PING_LATENCY);
  }
}
