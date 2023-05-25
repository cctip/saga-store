import { jsx as _jsx } from "react/jsx-runtime";
import { runSaga, stdChannel, channel, END } from 'redux-saga';
import * as ef from 'redux-saga/effects';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { globalActionRelayChannel } from './util';
import { makeAutoObservable, runInAction } from 'mobx';
export const globalChannel = channel();
const GlobalAtomContext = createContext({});
export function useGlobalStore(globalTask, opts = {}) {
    const ch = useRef(stdChannel()).current;
    const dispatch = useRef((action) => {
        ch.put(action);
        globalActionRelayChannel.put(action);
    }).current;
    const state = useContext(GlobalAtomContext);
    useEffect(() => {
        const task = runSaga({
            channel: ch,
            dispatch,
            getState: () => state,
            context: {
                setGlobalValue: (next) => runInAction(() => {
                    Object.assign(state, next);
                }),
            },
            onError: (err, info) => {
                console.error(err);
                console.error(info.sagaStack);
            },
            ...opts,
        }, function* () {
            yield ef.takeEvery(globalChannel, function* (action) { if (action !== END)
                yield ef.put(action); });
            try {
                yield ef.call(globalTask ?? (() => { }));
            }
            catch (e) {
                console.error('failed to setup global task', e);
            }
            ;
        });
        return () => {
            setTimeout(() => {
                task.cancel();
            }, 0);
        };
    }, []);
    return dispatch;
}
const DispatchContext = createContext(() => { throw new Error('Wrap Provider at Topest Component Tree!'); });
export function StoreProvider({ opts, task, children, initialValue = {} }) {
    const dispatch = useGlobalStore(task, opts);
    const [globalAtom] = useState(() => makeAutoObservable(initialValue));
    return (_jsx(GlobalAtomContext.Provider, { value: globalAtom, children: _jsx(DispatchContext.Provider, { value: dispatch, children: children }) }));
}
export function useDispatch() {
    return useContext(DispatchContext);
}
export function useSelector(fn) {
    const val = useContext(GlobalAtomContext);
    return fn?.(val) ?? val;
}
export function dispatch2Buffer(action) {
    globalChannel.put(action);
}
export function setGlobalStore(updater) {
    globalChannel.put({
        type: '_global/write-store',
        updater,
    });
}
//# sourceMappingURL=global-store.js.map