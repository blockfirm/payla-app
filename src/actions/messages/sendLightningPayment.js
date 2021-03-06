import uuidv4 from 'uuid/v4';

import { btcToSats } from '../../crypto/bitcoin/convert';
import { sendPayment } from '../lightning';
import { add as addInvoice, setPaymentHash } from '../lightning/invoices';
import { add as addMessage } from './add';

export const MESSAGES_SEND_LIGHTNING_PAYMENT_REQUEST = 'MESSAGES_SEND_LIGHTNING_PAYMENT_REQUEST';
export const MESSAGES_SEND_LIGHTNING_PAYMENT_SUCCESS = 'MESSAGES_SEND_LIGHTNING_PAYMENT_SUCCESS';
export const MESSAGES_SEND_LIGHTNING_PAYMENT_FAILURE = 'MESSAGES_SEND_LIGHTNING_PAYMENT_FAILURE';

const sendLightningPaymentRequest = () => {
  return {
    type: MESSAGES_SEND_LIGHTNING_PAYMENT_REQUEST
  };
};

const sendLightningPaymentSuccess = () => {
  return {
    type: MESSAGES_SEND_LIGHTNING_PAYMENT_SUCCESS
  };
};

const sendLightningPaymentFailure = (error) => {
  return {
    type: MESSAGES_SEND_LIGHTNING_PAYMENT_FAILURE,
    error
  };
};

/**
 * Action to send a lightning payment to a contact.
 *
 * @param {Object} invoice - Pine lightning invoice to pay.
 * @param {Object} paymentMessage - Pine payment message that was used to create the invoice.
 * @param {number} amountBtc - The amount in BTC of the transaction excluding fees.
 * @param {Object} contact - Contact to send the payment to.
 * @param {string} contact.id - The contact's local ID.
 * @param {string} contact.address - The contact's Pine address.
 * @param {string} contact.userId - The contact's user ID.
 * @param {string} contact.publicKey - The contact's public key.
 *
 * @returns {Promise.{ message }} A promise that resolves when the payment has been sent and saved.
 */
export const sendLightningPayment = (invoice, paymentMessage, amountBtc, contact) => {
  const amountSats = btcToSats(amountBtc);

  return async (dispatch) => {
    dispatch(sendLightningPaymentRequest());

    try {
      const messageId = uuidv4();

      invoice.messageId = messageId;
      invoice.paidAmount = amountSats.toString();
      invoice.payee = contact.address;

      // Save the invoice locally.
      await dispatch(addInvoice([invoice]));

      // Pay the invoice.
      const paymentHash = await dispatch(sendPayment(invoice.paymentRequest));
      await dispatch(setPaymentHash(invoice, paymentHash));

      // Add message to conversation.
      const createdMessage = await dispatch(addMessage(contact.id, {
        ...paymentMessage,
        id: messageId,
        from: null,
        createdAt: Math.floor(Date.now() / 1000)
      }));

      dispatch(sendLightningPaymentSuccess());

      return { message: createdMessage };
    } catch (error) {
      dispatch(sendLightningPaymentFailure(error));
      throw error;
    }
  };
};
