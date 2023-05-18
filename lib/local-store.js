import { jsx as _jsx } from "react/jsx-runtime";
import { channel, runSaga, stdChannel } from 'redux-saga';
import * as ef from 'redux-saga/effects';
import { useEffect, useRef, createContext, useContext } from 'react';
import { observable } from 'mobx';
const fallbackDispatch = (action) => { throw new Error('this should not happen!'); };
const LocalDispatchContext = createContext(fallbackDispatch);
export function useLocalDispatch() {
    return useContext(LocalDispatchContext);
}
function useLocalStore(opts = {}, store, saga, ...args) {
    const mainChannel = useRef(stdChannel()).current;
    const localDispatch = useRef((action) => { mainChannel.put(action); }).current;
    useEffect(() => {
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
        };
    }, []);
    return localDispatch;
}
const getVal = v => typeof v === 'function' ? v() : v;
const SharedChannelContext = createContext(channel());
export function useSharedChannel() {
    return useContext(SharedChannelContext);
}
export function withLocalStore(Comp, option) {
    return function LocalSagaStore(props) {
        const { opts, storeGetter, task, args = [] } = option;
        const sharedChannel = useRef(channel()).current;
        const dispatch = useLocalStore(opts, storeGetter?.() ?? observable.map(), task, ...getVal(args), sharedChannel);
        return (_jsx(SharedChannelContext.Provider, { value: sharedChannel, children: _jsx(LocalDispatchContext.Provider, { value: dispatch, children: _jsx(Comp, { ...props }) }) }));
    };
}
//# sourceMappingURL=local-store.js.map