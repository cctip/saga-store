import { channel, END, runSaga, stdChannel } from 'redux-saga';
import * as ef from 'redux-saga/effects';
import type { RunSagaOptions } from '@redux-saga/core';
import { atom, Atom, useAtomValue, Provider } from 'jotai';
import { waitForAll } from 'jotai/utils';
import { PropsWithChildren, useEffect, useRef } from 'react';
import { Action } from '@redux-saga/types';
import { globalActionRelayChannel, useAtomReadAgent, useAtomWriteAgent } from './util';

type AtomMap = {
  [key: string]: Atom<any>;
}

interface LocalDispatchType {
  (action: any): void;
}

const fallbackDispatch = () => { throw new Error('this should not happen!')};
const LocalDispatchAtom = atom<{ dispatch: LocalDispatchType}>({ dispatch: fallbackDispatch });

export function useLocalDispatch() {
  return useAtomValue(LocalDispatchAtom).dispatch;
}

type OptsType = RunSagaOptions<Action, any>;

function useLocalStore(opts: OptsType = {}, atoms: AtomMap = {}, saga: GeneratorFunction, ...args: any[]) {
  const mainChannel = useRef(stdChannel()).current;
  const localDispatch = mainChannel.put;
  const wholeStateAtom = useRef(waitForAll(atoms)).current;
  const writeAgent = useAtomWriteAgent();
  const readAgent = useAtomReadAgent();
  useEffect(
    () => {
      const instance = runSaga({
        channel: mainChannel,
        dispatch: localDispatch,
        getState: () => readAgent(wholeStateAtom),
        context: {
          writeAgent,
          readAgent,
        },
        ...opts,
      }, function* () {
        yield ef.fork(saga, ...(args ?? []));
        // forward actions from global to local
        const forward = (a) => {
          if (a === END) return;
          localDispatch(a);
          globalActionRelayChannel.take(forward);
        }
        globalActionRelayChannel.take(forward);
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

type LocalSagaStoreOption = {
  task: GeneratorFunction;
  args?: any[];
  opts?: OptsType;
  atoms?: AtomMap;
}



export function withLocalStore(Comp: React.ComponentType<PropsWithChildren<any>>, option: LocalSagaStoreOption) {
  return function LocalSagaStore(props: PropsWithChildren<any>) {
    const {opts, atoms, task, args = []} = option;
    const dispatch = useLocalStore(opts, atoms, task, props, ...args);
    const init = useRef([[LocalDispatchAtom, { dispatch }]]).current;
    return (
      <Provider initialValues={init as any}>
        <Comp {...props} />
      </Provider>
    );
  }
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
