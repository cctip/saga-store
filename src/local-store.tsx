import { channel, runSaga, stdChannel } from 'redux-saga';
import * as ef from 'redux-saga/effects';
import type { RunSagaOptions } from '@redux-saga/core';
import { PropsWithChildren, useEffect, useRef, createContext, useContext } from 'react';
import { Action } from '@redux-saga/types';
import { observable, ObservableMap } from 'mobx';

interface LocalDispatchType {
  (action: any): void;
}

const fallbackDispatch = (action: any): void => { throw new Error('this should not happen!')};
const LocalDispatchContext = createContext(fallbackDispatch);

export function useLocalDispatch() {
  return useContext<LocalDispatchType>(LocalDispatchContext);
}

type OptsType = RunSagaOptions<Action, any>;

function useLocalStore(opts: OptsType = {}, store: any, saga: GeneratorFunction, ...args: any[]) {
  const mainChannel = useRef(stdChannel()).current;
  const localDispatch = useRef((action: any) => {mainChannel.put(action);}).current;
  useEffect(
    () => {
      const instance = runSaga({
        channel: mainChannel,
        dispatch: localDispatch,
        getState: () => store,
        ...opts,
      }, function* () {
        yield ef.fork(saga, ...(args ?? []));
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

type argsGetter = () => any[];

type LocalSagaStoreOption = {
  task: GeneratorFunction;
  args?: any[] | argsGetter;
  opts?: OptsType;
  storeGetter?: () => ObservableMap;
}

const getVal = v => typeof v === 'function' ? v() : v;

const SharedChannelContext = createContext(channel());

export function withLocalStore(Comp: React.ComponentType<PropsWithChildren<any>>, option: LocalSagaStoreOption) {
  return function LocalSagaStore(props: PropsWithChildren<any>) {
    const {opts, storeGetter, task, args = []} = option;
    const sharedChannel = useRef(channel()).current;
    const dispatch = useLocalStore(opts, storeGetter?.() ?? observable.map(), task, props, ...getVal(args), sharedChannel);
    return (
      <SharedChannelContext.Provider value={sharedChannel}>
        <LocalDispatchContext.Provider value={dispatch}>
          <Comp {...props} />
        </LocalDispatchContext.Provider>
      </SharedChannelContext.Provider>
    );
  }
}

