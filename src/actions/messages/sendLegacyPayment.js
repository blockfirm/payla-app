import uuidv4 from 'uuid/v4';

import {
  UNIT_BTC,
  UNIT_SATOSHIS,
  convert as convertBitcoin
} from '../../crypto/bitcoin/convert';

import { post as postTransaction } from '../bitcoin/blockchain/transactions';
import { addLegacy as addLegacyContact } from '../contacts';
import { add as addMessage } from './add';

export const MESSAGES_SEND_LEGACY_PAYMENT_REQUEST = 'MESSAGES_SEND_LEGACY_PAYMENT_REQUEST';
export const MESSAGES_SEND_LEGACY_PAYMENT_SUCCESS = 'MESSAGES_SEND_LEGACY_PAYMENT_SUCCESS';
export const MESSAGES_SEND_LEGACY_PAYMENT_FAILURE = 'MESSAGES_SEND_LEGACY_PAYMENT_FAILURE';

const sendLegacyPaymentRequest = () => {
  return {
    type: MESSAGES_SEND_LEGACY_PAYMENT_REQUEST
  };
};

const sendLegacyPaymentSuccess = () => {
  return {
    type: MESSAGES_SEND_LEGACY_PAYMENT_SUCCESS
  };
};

const sendLegacyPaymentFailure = (error) => {
  return {
    type: MESSAGES_SEND_LEGACY_PAYMENT_FAILURE,
    error
  };
};

/**
 * Adds a sent message as received to the same conversation.
 * This is used when the user sends a transaction to themselves.
 *
 * @param {function} dispatch - Redux dispatch function.
 * @param {Object} contact - Contact to add the message to.
 * @param {string} contact.id - The contact's ID.
 * @param {Object} sentMessage - The message containing the transaction that was sent to oneself.
 *
 * @returns {Promise}
 */
const addAsReceivedMessage = (dispatch, contact, sentMessage) => {
  const persistContact = true;
  const markAsUnread = false;

  const receivedMessage = {
    ...sentMessage,
    id: uuidv4(),
    from: 'unknown',
    feeBtc: null,
    createdAt: sentMessage.createdAt + 0.5 // This forces the received message to show after the sent.
  };

  return dispatch(
    addMessage(contact.id, receivedMessage, persistContact, markAsUnread)
  );
};

/**
 * Action to send a bitcoin transaction to a bitcoin address.
 *
 * The transaction must be serialized in raw format:
 * <https://bitcoin.org/en/developer-reference#raw-transaction-format>
 *
 * @param {string} rawTransaction - Serialized and signed transaction in raw format.
 * @param {Object} metadata - Metadata about the transaction.
 * @param {string} metadata.txid - The transaction's ID (hash).
 * @param {string} metadata.address - Bitcoin address the transaction is paying to.
 * @param {number} metadata.amountBtc - The amount in BTC of the transaction excluding fees.
 * @param {number} metadata.fee - The transaction fee in satoshis.
 * @param {Object} [contact] - Contact the payment is for. One will be created if not specified.
 * @param {string} contact.id - The contact's ID.
 *
 * @returns {Promise.{ message, createdContact }} A promise that resolves when the payment has been broadcasted.
 */
export const sendLegacyPayment = (rawTransaction, metadata, contact = null) => {
  const { txid, address, amountBtc, fee } = metadata;
  const feeBtc = fee ? convertBitcoin(fee, UNIT_SATOSHIS, UNIT_BTC) : 0;
  let createdContact;
  let createdMessage;

  return (dispatch, getState) => {
    const state = getState();
    const externalAddresses = state.bitcoin.wallet.addresses.external.items;

    dispatch(sendLegacyPaymentRequest());

    return Promise.resolve()
      .then(() => {
        // Add as legacy contact if not already added.
        if (!contact) {
          return dispatch(addLegacyContact({ address })).then((addedContact) => {
            createdContact = addedContact;
            return createdContact;
          });
        }

        return contact;
      })
      .then(async (bitcoinContact) => {
        const message = {
          id: uuidv4(),
          type: 'payment',
          from: null,
          address: { address },
          createdAt: Math.floor(Date.now() / 1000),
          data: { transaction: rawTransaction },
          txid,
          amountBtc,
          feeBtc
        };

        // Add message to the created contact/conversation.
        createdMessage = await dispatch(addMessage(bitcoinContact.id, message));

        // Add as received as well if it was sent to oneself.
        if (address in externalAddresses) {
          await addAsReceivedMessage(dispatch, bitcoinContact, message);
        }
      })
      .then(() => {
        // Broadcast transaction.
        return dispatch(postTransaction(rawTransaction));
      })
      .then(() => {
        dispatch(sendLegacyPaymentSuccess());

        return {
          message: createdMessage,
          createdContact
        };
      })
      .catch((error) => {
        dispatch(sendLegacyPaymentFailure(error));
        throw error;
      });
  };
};
