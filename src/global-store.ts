import { channel, runSaga, stdChannel } from 'redux-saga';
import * as ef from 'redux-saga/effects';
import type { RunSagaOptions } from '@redux-saga/core';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithImmer } from 'jotai/immer';
import { useAtomCallback } from 'jotai/utils';
import { useEffect, useRef } from 'react';
import { Action } from '@redux-saga/types';

export const globalAtom = atomWithImmer({});

const globalAtomGetter = get => get(globalAtom);

export const globalChannel = channel<Action>();

export function useGlobalStore(opts: RunSagaOptions<Action, any>) {
  const channel = useRef(stdChannel()).current;
  const dispatch = channel.put;
  const getState = useAtomCallback(globalAtomGetter);
  useEffect(
    () => {
      const instance = runSaga({
        channel,
        dispatch,
        getState,
        ...opts,
      }, function* () {
        yield listenGlobalChannel();
      });
      return () => {
        setTimeout(() => {
          instance.cancel();
        }, 0);
      }
    },
    [],
  );
  return dispatch;
}

export const useGlobalStoreValue = () => useAtomValue(globalAtom);
export const useGlobalStoreSetter = () => useSetAtom(globalAtom);

function* listenGlobalChannel() {
  yield ef.takeEvery(globalChannel, function* (action) { yield ef.put(action); });
}

