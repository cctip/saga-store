import { END, runSaga, stdChannel } from 'redux-saga';
import * as ef from 'redux-saga/effects';
import type { RunSagaOptions } from '@redux-saga/core';
import { createContext, PropsWithChildren, useContext, useEffect, useRef } from 'react';
import { Action } from '@redux-saga/types';
import { globalActionRelayChannel } from './util';
import { makeAutoObservable } from 'mobx';

interface LocalDispatchType {
  (action: any): void;
}

const fallbackDispatch = () => { throw new Error('this should not happen!')};
const LocalDispatchContext = createContext<LocalDispatchType>(fallbackDispatch);

export function useLocalDispatch() {
  return useContext(LocalDispatchContext);
}

type OptsType = RunSagaOptions<Action, any>;

function useLocalStore(opts: OptsType = {}, atoms: any = {}, saga: GeneratorFunction, ...args: any[]) {
  const mainChannel = useRef(stdChannel()).current;
  const localDispatch = mainChannel.put;
  const wholeStateAtom = useRef(makeAutoObservable(atoms)).current;
  useEffect(
    () => {
      Object.assign(wholeStateAtom, atoms);
    },
    [atoms],
  );
  useEffect(
    () => {
      const instance = runSaga({
        channel: mainChannel,
        dispatch: localDispatch,
        getState: () => wholeStateAtom,
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
  atoms?: any;
}



export function withLocalStore(Comp: React.ComponentType<PropsWithChildren<any>>, option: LocalSagaStoreOption) {
  return function LocalSagaStore(props: PropsWithChildren<any>) {
    const {opts, atoms, task, args = []} = option;
    const dispatch = useLocalStore(opts, atoms, task, props, ...args);
    return (
      <LocalDispatchContext.Provider value={dispatch}>
        <Comp {...props} />
      </LocalDispatchContext.Provider>
    );
  }
}
