import { createStore as createReduxStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';

import { lightningMiddleware, loggingMiddleware } from './middlewares';
import getRootReducer from './reducers';

const reactNavigationReduxMiddleware = createReactNavigationReduxMiddleware(
  'root',
  state => state.nav
);

const createStore = (navReducer) => {
  const store = createReduxStore(
    getRootReducer(navReducer),
    applyMiddleware(
      thunkMiddleware,
      reactNavigationReduxMiddleware,
      loggingMiddleware,
      lightningMiddleware
    )
  );

  return store;
};

export default createStore;
