import { runSaga, stdChannel } from 'redux-saga';
import * as ef from 'redux-saga/effects';
import type { RunSagaOptions } from '@redux-saga/core';
import { Atom } from 'jotai';
import { waitForAll } from 'jotai/utils';
import { useEffect, useRef } from 'react';
import { Action } from '@redux-saga/types';
import { globalActionRelayChannel, useAtomReadAgent, useAtomWriteAgent } from './util';

type AtomMap = {
  [key: string]: Atom<any>;
}

export function useLocalStore(opts: RunSagaOptions<Action, any>, atoms: AtomMap, saga: GeneratorFunction, ...args: any[]) {
  const channel = useRef(stdChannel()).current;
  const localDispatch = channel.put;
  const wholeStateAtom = useRef(waitForAll(atoms)).current;
  
  const writeAgent = useAtomWriteAgent();
  const readAgent = useAtomReadAgent();
  useEffect(
    () => {
      const instance = runSaga({
        channel,
        dispatch: localDispatch,
        getState: () => readAgent(wholeStateAtom),
        context: {
          writeAgent,
          readAgent,
        },
        ...opts,
      }, function* () {
        yield ef.fork(saga, ...args);
        yield ef.takeEvery(globalActionRelayChannel, function (gAction) {
          localDispatch(gAction);
        });
      });
      return () => {
        setTimeout(() => {
          instance.cancel();
        }, 0);
      }
    },
    [],
  );
  return localDispatch;
}

/**
 * use this only in local store
 * to change global store, use setGlobalStore !
 * @param atom 
 * @param val 
 */
export function* writeAtom(atom: Atom<any>, val: any) {
  const write = yield ef.getContext('writeAgent');
  write({ atom, val });
}

export function* readAtom(atom: Atom<any>) {
  const read = yield ef.getContext('readAgent');
  return read(atom);
}
