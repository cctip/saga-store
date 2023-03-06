import { stdChannel } from 'redux-saga';

export const globalActionRelayChannel = stdChannel();

export type AnyAction = {
  type: string;
  [payload: string]: any;
}