import { runSaga, stdChannel } from 'redux-saga';
import type { RunSagaOptions } from '@redux-saga/core';
import { Atom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback, useEffect, useRef } from 'react';
import { Action } from '@redux-saga/types';

type AtomMap = {
  [key: string]: Atom<any>;
}

export function useLocalStore(opts: RunSagaOptions<Action, any>, atoms: AtomMap, saga, ...args) {
  const channel = useRef(stdChannel()).current;
  const dispatch = channel.put;
  const getState = useAtomCallback(
    useCallback(
      (get) => Object.fromEntries(
        Object.entries(atoms).map(([k, v]) => [k, get(v)])
      ),
      [],
    )
  );
  useEffect(
    () => {
      const instance = runSaga({
        channel,
        dispatch,
        getState,
        ...opts,
      }, saga, ...args);
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

