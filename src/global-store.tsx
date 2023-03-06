import { runSaga, stdChannel, channel, END } from 'redux-saga';
import * as ef from 'redux-saga/effects';
import type { RunSagaOptions } from '@redux-saga/core';
import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import { Action } from '@redux-saga/types';
import { AnyAction, globalActionRelayChannel } from './util';
import { makeAutoObservable, runInAction } from 'mobx';

export const globalChannel = channel<AnyAction>();
const GlobalAtomContext = createContext<any>({});

export function useGlobalStore(globalTask: GeneratorFunction, opts: RunSagaOptions<Action, any> = {}) {
  const ch = useRef(stdChannel()).current;
  
  const dispatch = useRef(
    (action: any) => {
      ch.put(action);
      globalActionRelayChannel.put(action);
    }
  ).current;

  const state = useContext(GlobalAtomContext);

  useEffect(
    () => {
      const task = runSaga({
        channel: ch,
        dispatch,
        getState: () => state,
        context: {
          setGlobalValue: (next) => runInAction(
            () => {
              Object.assign(state, next);
            }
          ),
        },
        onError: (err, info) => {
          console.error(err);
          console.error(info.sagaStack);
        },
        ...opts,
      }, function* () {
        yield ef.takeEvery(globalChannel, function* (action) { if (action !== END) yield ef.put(action); });
        try {
          yield ef.call(globalTask ?? (() => {}));
        } catch (e) {
          console.error('failed to setup global task', e);
        };
      });
      return () => {
        setTimeout(() => {
          task.cancel();
        }, 0);
      }
    },
    [],
  );
  return dispatch;
}

const DispatchContext = createContext<(action: any) => void>(
  () => { throw new Error('Wrap Provider at Topest Component Tree!') }
);

type StoreProviderProps = PropsWithChildren<{
  opts?: RunSagaOptions<Action, any>,
  task?: GeneratorFunction,
  initialValue?: any,
}>;

export function StoreProvider({ opts, task, children, initialValue = {} }: StoreProviderProps) {
  const dispatch = useGlobalStore(task, opts);
  const [globalAtom] = useState(() => makeAutoObservable(initialValue));

  return (
    <GlobalAtomContext.Provider value={globalAtom}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </GlobalAtomContext.Provider>
  )
}

export function useDispatch() {
  return useContext(DispatchContext);
}

export function useSelector(fn?: (state: any) => any) {
  const val = useContext(GlobalAtomContext);
  return fn?.(val) ?? val;
}

export function dispatch2Buffer(action: Action) {
  globalChannel.put(action);
}

export function setGlobalStore(updater: (current: any) => void) {
  globalChannel.put({
    type: '_global/write-store',
    updater,
  });
}
