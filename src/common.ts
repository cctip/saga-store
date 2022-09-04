import { channel, runSaga, stdChannel } from 'redux-saga';
import * as ef from 'redux-saga/effects';
import type { RunSagaOptions } from '@redux-saga/core';
import { useAtom, useAtomValue } from 'jotai';
import { atomWithReducer, useAtomCallback } from 'jotai/utils';
import { useEffect, useRef } from 'react';
// import produce from 'immer';
import { Action } from '@redux-saga/types';

type UpdateAction = {
  type: '@update';
  produce: (prev: any) => void;
}

const isUpdateAction = (action: Action | UpdateAction): action is UpdateAction => {
  return action.type === '@update';
}

export const reducer = (value: any, action: Action | UpdateAction) => {
  if (isUpdateAction(action)) return action.produce(value);
  return value;
};
