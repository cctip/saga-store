import { runSaga, stdChannel } from 'redux-saga';
import * as ef from 'redux-saga/effects';
import type { RunSagaOptions } from '@redux-saga/core';
import { useAtom, Provider as JotaiProvider, Atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithImmer } from 'jotai/immer';
import { createContext, PropsWithChildren, useContext, useEffect, useRef } from 'react';
import { Action } from '@redux-saga/types';
import { AnyAction, globalActionRelayChannel, useAtomReadAgent } from './util';

export const globalChannel = stdChannel<AnyAction>();

const globalAtom = atomWithImmer({});

export function useGlobalStore(globalTask: GeneratorFunction, opts: RunSagaOptions<Action, any> = {}) {
  const channel = useRef(stdChannel()).current;
  const setGlobalValue = useSetAtom(globalAtom);
  const readAtomValue = useAtomReadAgent();
  
  const dispatch = useRef(
    (action: any) => {
      channel.put(action);
      globalActionRelayChannel.put(action);
    }
  ).current;

  useEffect(
    () => {
      const task = runSaga({
        channel,
        dispatch,
        getState: () => readAtomValue(globalAtom),
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
        yield ef.takeEvery('_global/write-store' as any, writeGlobalAtom);
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
  console.log('writeGlobalAtom =>')
  console.log(setter, action.updater.toString(), action)
  setter(action.updater);
}

export function setGlobalStore(updater: (current: any) => void) {
  globalChannel.put({
    type: '_global/write-store',
    updater,
  });
}
