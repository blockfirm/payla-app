import { redeem } from './redeem';

export const LIGHTNING_INVOICES_REDEEM_ALL_REQUEST = 'LIGHTNING_INVOICES_REDEEM_ALL_REQUEST';
export const LIGHTNING_INVOICES_REDEEM_ALL_SUCCESS = 'LIGHTNING_INVOICES_REDEEM_ALL_SUCCESS';
export const LIGHTNING_INVOICES_REDEEM_ALL_FAILURE = 'LIGHTNING_INVOICES_REDEEM_ALL_FAILURE';

const redeemAllRequest = () => {
  return {
    type: LIGHTNING_INVOICES_REDEEM_ALL_REQUEST
  };
};

const redeemAllSuccess = () => {
  return {
    type: LIGHTNING_INVOICES_REDEEM_ALL_SUCCESS
  };
};

const redeemAllFailure = (errors) => {
  return {
    type: LIGHTNING_INVOICES_REDEEM_ALL_FAILURE,
    errors
  };
};

const shouldRedeem = (invoice) => {
  return invoice.redeem && !invoice.redeemed;
};

/**
 * Action to redeem all unredeemed invoices.
 */
export const redeemAll = () => {
  return async (dispatch, getState) => {
    const invoices = getState().lightning.invoices.items;
    const errors = [];

    dispatch(redeemAllRequest());

    for (const invoice of invoices) {
      if (shouldRedeem(invoice)) {
        try {
          await dispatch(redeem(invoice));
        } catch (error) {
          errors.push(error);
        }
      }
    }

    if (errors.length > 0) {
      dispatch(redeemAllFailure(errors));
      throw errors;
    }

    dispatch(redeemAllSuccess());
  };
};
