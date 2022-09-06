import { runSaga, stdChannel } from 'redux-saga';
import * as ef from 'redux-saga/effects';
import type { RunSagaOptions } from '@redux-saga/core';
import { useAtom, Provider as JotaiProvider, Atom, useAtomValue } from 'jotai';
import { atomWithImmer } from 'jotai/immer';
import { createContext, PropsWithChildren, useContext, useEffect, useRef } from 'react';
import { Action } from '@redux-saga/types';
import { AnyAction, globalActionRelayChannel } from './util';

export const globalChannel = stdChannel<AnyAction>();

const globalAtom = atomWithImmer({});

export function useGlobalStore(globalTask: GeneratorFunction, opts: RunSagaOptions<Action, any> = {}) {
  const channel = useRef(stdChannel()).current;
  const [globalValue, setGlobalValue] = useAtom(globalAtom);
  const gvRef = useRef(globalValue);
  useEffect(
    () => {
      gvRef.current = globalValue;
    },
    [globalValue],
  );
  const dispatch = (action: any) => {
    channel.put(action);
    globalActionRelayChannel.put(action);
  };

  useEffect(
    () => {
      const task = runSaga({
        channel,
        dispatch,
        getState: () => gvRef.current,
        context: {
          setGlobalValue,
        },
        ...opts,
      }, function* () {
        try {
          yield ef.call(globalTask ?? (() => {}));
        } catch (e) {
          console.error('failed to setup global task', e);
        };
        yield listenGlobalChannel();
        yield ef.takeEvery('write-store' as any, writeGlobalAtom);
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
const initialValues: Array<[Atom<any>, any]> = [
  [globalAtom, {}],
];

type StoreProviderProps = PropsWithChildren<{
  opts?: RunSagaOptions<Action, any>,
  task?: GeneratorFunction,
}>;

export function StoreProvider({ opts, task, children }: StoreProviderProps) {
  const dispatch = useGlobalStore(task, opts);

  return (
    <JotaiProvider initialValues={initialValues}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </JotaiProvider>
  )
}

export function useDispatch() {
  return useContext(DispatchContext);
}

export function useSelector(fn?: (state: any) => any) {
  const val = useAtomValue(globalAtom);
  return fn?.(val) ?? val;
}

export function dispatch2Buffer(action: Action) {
  globalChannel.put(action);
}

function* listenGlobalChannel() {
  yield ef.takeEvery(globalChannel, function* (action) { yield ef.put(action); });
}

function* writeGlobalAtom(action: { updater: (current: any) => void }) {
  const setter = yield ef.getContext('setGlobalValue');
  setter(action.updater);
}

export function setGlobalStore(updater: (current: any) => void) {
  globalChannel.put({
    type: 'write-store',
    updater,
  });
}