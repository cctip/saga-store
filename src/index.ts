import { enableAllPlugins, setAutoFreeze } from 'immer';

enableAllPlugins();
setAutoFreeze(true);

export * from 'jotai';
export { atomWithImmer as atom } from 'jotai/immer';
export * from 'redux-saga';
export * as effects from 'redux-saga/effects';

export {
  globalChannel, useGlobalStore,
  useDispatch, useSelector,
  StoreProvider, dispatch2Buffer, setGlobalStore,
} from './global-store';

export {
  withLocalStore,
  useLocalDispatch,
} from './local-store';
