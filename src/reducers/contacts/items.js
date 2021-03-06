import * as contactsActions from '../../actions/contacts';
import * as contactRequestsActions from '../../actions/contacts/contactRequests';

// eslint-disable-next-line max-statements
const items = (state = {}, action) => {
  let newState;
  let contact;

  switch (action.type) {
    case contactsActions.CONTACTS_LOAD_SUCCESS:
    case contactsActions.CONTACTS_SYNC_SUCCESS:
    case contactsActions.CONTACTS_UPDATE_PROFILES_SUCCESS:
    case contactRequestsActions.CONTACTS_CONTACT_REQUESTS_SYNC_INCOMING_SUCCESS:
      return action.contacts;

    case contactsActions.CONTACTS_ADD_SUCCESS:
    case contactsActions.CONTACTS_ADD_LEGACY:
    case contactsActions.CONTACTS_ADD_LIGHTNING:
    case contactsActions.CONTACTS_ADD_VENDOR:
      contact = { ...action.contact };

      return {
        ...state,
        [action.contact.id]: contact
      };

    case contactsActions.CONTACTS_REMOVE_SUCCESS:
    case contactRequestsActions.CONTACTS_CONTACT_REQUESTS_IGNORE_SUCCESS:
    case contactRequestsActions.CONTACTS_CONTACT_REQUESTS_REMOVE_SUCCESS:
      newState = { ...state };
      delete newState[action.contact.id];
      return newState;

    case contactRequestsActions.CONTACTS_CONTACT_REQUESTS_ACCEPT_SUCCESS:
      contact = { ...action.contact };
      newState = { ...state };

      Object.values(newState).forEach((oldContact) => {
        if (oldContact.address === contact.address) {
          delete newState[oldContact.id];
        }
      });

      newState[contact.id] = contact;

      return newState;

    case contactsActions.CONTACTS_MARK_AS_READ:
    case contactsActions.CONTACTS_MARK_AS_UNREAD:
      contact = action.contact;

      if (state[contact.id]) {
        newState = { ...state };
        newState[contact.id] = { ...newState[contact.id] };
        newState[contact.id].unread = action.type === contactsActions.CONTACTS_MARK_AS_UNREAD;

        return newState;
      }

      return state;

    case contactsActions.CONTACTS_SET_LAST_MESSAGE:
      contact = action.contact;

      if (state[contact.id]) {
        newState = { ...state };
        newState[contact.id] = { ...newState[contact.id] };
        newState[contact.id].lastMessage = action.message;

        return newState;
      }

      return state;

    case contactsActions.CONTACTS_ADD_VENDOR_ASSOCIATED_ADDRESS:
      contact = Object.values(state).find(({ vendorId }) => vendorId === action.vendorId);

      if (contact) {
        newState = { ...state };
        newState[contact.id] = { ...newState[contact.id] };
        newState[contact.id].associatedAddresses = newState[contact.id].associatedAddresses || [];
        newState[contact.id].associatedAddresses.push(action.address);

        return newState;
      }

      return state;

    default:
      return state;
  }
};

export default items;
