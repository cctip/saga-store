import { runSaga, stdChannel } from 'redux-saga';
import * as ef from 'redux-saga/effects';
import type { RunSagaOptions } from '@redux-saga/core';
import { Provider as JotaiProvider, Atom, useAtomValue } from 'jotai';
import { atomWithImmer } from 'jotai/immer';
import { createContext, PropsWithChildren, useContext, useEffect, useRef } from 'react';
import { Action } from '@redux-saga/types';
import { AnyAction, globalActionRelayChannel, useAtomReadAgent, useAtomWriteAgent } from './util';

export const globalChannel = stdChannel<AnyAction>();

const globalAtom = atomWithImmer({});

export function useGlobalStore(globalTask: GeneratorFunction, opts: RunSagaOptions<Action, any> = {}) {
  const channel = useRef(stdChannel()).current;
  const writeAgent = useAtomWriteAgent();
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
          setGlobalValue: (next) => writeAgent({
            atom: globalAtom,
            val: next,
          }),
        },
        onError: (err, info) => {
          console.error(err);
          console.error(info.sagaStack);
        },
        ...opts,
      }, function* () {
        yield ef.takeEvery(globalChannel, function* (action) { yield ef.put(action); });
        yield ef.takeEvery('_global/write-store' as any, function* writeGlobalAtom(action: { updater: (current: any) => void }) {
          console.log('asdfasd getContext', ef.getContext);
          const setter = yield ef.getContext('setGlobalValue');
          console.log('writeGlobalAtom =>')
          console.log(setter, action.updater.toString(), action)
          setter(action.updater);
        });
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
  const vals = useRef<Array<[Atom<any>, any]>>([[globalAtom, initialValue]]).current;

  return (
    <JotaiProvider initialValues={vals}>
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

export function setGlobalStore(updater: (current: any) => void) {
  globalChannel.put({
    type: '_global/write-store',
    updater,
  });
}
