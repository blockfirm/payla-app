import { refresh as refreshBalance } from '../balance';
import { save } from './save';

export const BITCOIN_WALLET_UTXOS_RESERVE = 'BITCOIN_WALLET_UTXOS_RESERVE';

const reserveUtxo = (txid, index, expireAt, btcAmountToReserve) => {
  return {
    type: BITCOIN_WALLET_UTXOS_RESERVE,
    txid,
    index,
    expireAt,
    btcAmountToReserve
  };
};

/**
 * Action to reserve UTXOs and preventing them from being used
 * in multiple transactions while waiting for a recipient to
 * broadcast a transaction to the network.
 *
 * @param {Object[]} utxos - UTXOs to reserve.
 * @param {string} utxos[].txid - Transaction ID that contains the unspent output.
 * @param {number} utxos[].index - The index of the unspent output in the transaction.
 * @param {number} totalBtcAmountToReserve - The total amount of BTC that was sent using the reserved UTXOs.
 * @param {number} [expireAt] - Unix timestamp for when the reservation should expire.
 */
export const reserve = (utxos, totalBtcAmountToReserve, expireAt = 0) => {
  return (dispatch) => {
    utxos.forEach((utxo, index) => {
      /**
       * Store the total amount that was used by the reservation on the first UTXO
       * so that the balance can be correctly adjusted to exclude the sent amount
       * (and not the whole UTXO).
       */
      const btcAmountToReserve = index === 0 ? totalBtcAmountToReserve : 0;
      dispatch(reserveUtxo(utxo.txid, utxo.index, expireAt, btcAmountToReserve));
    });

    // Persist the change.
    return dispatch(save()).then(() => {
      return dispatch(refreshBalance());
    });
  };
};
