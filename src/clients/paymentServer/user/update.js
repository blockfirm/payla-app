import { getAccountKeyPairFromMnemonic, getUserIdFromPublicKey } from '../crypto';
import { parse as parseAddress, resolveBaseUrl } from '../address';
import { getAuthorizationHeader } from '../authentication';

/**
 * Updates a user profile.
 *
 * @param {object} user - User profile to save.
 * @param {string} user.displayName - Display name of the user.
 * @param {number} user.addressIndex - The index of the next unused BIP49 address.
 * @param {object} credentials - User credentials for authentication.
 * @param {string} credentials.address - Pine address of the user to authenticate.
 * @param {string} credentials.mnemonic - Mnemonic to authenticate and sign the request with.
 * @param {object} credentials.keyPair - Optional bitcoinjs key pair instead of a mnemonic.
 * @param {string} credentials.userId - Optional user ID instead of deriving it from the mnemonic.
 *
 * @returns {Promise} A promise that resolves to the updated user.
 */
const update = (user, credentials) => {
  const { hostname } = parseAddress(credentials.address);
  const keyPair = credentials.keyPair || getAccountKeyPairFromMnemonic(credentials.mnemonic);
  const userId = credentials.userId || getUserIdFromPublicKey(keyPair.publicKey);

  const baseUrl = resolveBaseUrl(hostname);
  const path = `/v1/users/${userId}`;
  const url = `${baseUrl}${path}`;

  const body = {
    displayName: user.displayName,
    addressIndex: user.addressIndex
  };

  const rawBody = JSON.stringify(body);

  const fetchOptions = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthorizationHeader(userId, path, rawBody, keyPair)
    },
    body: rawBody
  };

  return fetch(url, fetchOptions)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      return response.json().then((error) => {
        throw new Error(error.message);
      });
    })
    .then((response) => {
      if (response.id !== userId) {
        throw new SyntaxError();
      }

      return response;
    })
    .catch((error) => {
      if (error.name === 'SyntaxError') {
        throw new Error('Received an invalid response when trying to update user');
      }

      throw error;
    });
};

export default update;
