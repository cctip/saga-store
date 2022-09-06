import type { RunSagaOptions } from '@redux-saga/core';
import { PropsWithChildren } from 'react';
import { Action } from '@redux-saga/types';
import { AnyAction } from './util';
export declare const globalChannel: import("redux-saga").MulticastChannel<AnyAction>;
export declare function useGlobalStore(globalTask: GeneratorFunction, opts?: RunSagaOptions<Action, any>): (action: any) => void;
declare type StoreProviderProps = PropsWithChildren<{
    opts?: RunSagaOptions<Action, any>;
    task?: GeneratorFunction;
}>;
export declare function StoreProvider({ opts, task, children }: StoreProviderProps): JSX.Element;
export declare function useDispatch(): (action: any) => void;
export declare function useSelector(fn?: (state: any) => any): any;
export declare function dispatch2Buffer(action: Action): void;
export declare function setGlobalStore(updater: (current: any) => void): void;
export {};
