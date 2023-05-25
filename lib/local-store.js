import { jsx as _jsx } from "react/jsx-runtime";
import { END, runSaga, stdChannel } from 'redux-saga';
import * as ef from 'redux-saga/effects';
import { createContext, useContext, useEffect, useRef } from 'react';
import { globalActionRelayChannel } from './util';
import { makeAutoObservable } from 'mobx';
const fallbackDispatch = () => { throw new Error('this should not happen!'); };
const LocalDispatchContext = createContext(fallbackDispatch);
export function useLocalDispatch() {
    return useContext(LocalDispatchContext);
}
function useLocalStore(opts = {}, atoms = {}, saga, ...args) {
    const mainChannel = useRef(stdChannel()).current;
    const localDispatch = mainChannel.put;
    const wholeStateAtom = useRef(makeAutoObservable(atoms)).current;
    useEffect(() => {
        Object.assign(wholeStateAtom, atoms);
    }, [atoms]);
    useEffect(() => {
        const instance = runSaga({
            channel: mainChannel,
            dispatch: localDispatch,
            getState: () => wholeStateAtom,
            ...opts,
        }, function* () {
            yield ef.fork(saga, ...(args ?? []));
            // forward actions from global to local
            const forward = (a) => {
                if (a === END)
                    return;
                localDispatch(a);
                globalActionRelayChannel.take(forward);
            };
            globalActionRelayChannel.take(forward);
        });
        return () => {
            setTimeout(() => {
                instance.cancel();
            }, 0);
        };
    }, []);
    return localDispatch;
}
export function withLocalStore(Comp, option) {
    return function LocalSagaStore(props) {
        const { opts, atoms, task, args = [] } = option;
        const dispatch = useLocalStore(opts, atoms, task, props, ...args);
        return (_jsx(LocalDispatchContext.Provider, { value: dispatch, children: _jsx(Comp, { ...props }) }));
    };
}
//# sourceMappingURL=local-store.js.map