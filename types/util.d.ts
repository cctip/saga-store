import { Atom } from 'jotai';
export declare function useAtomWriteAgent(): (update?: {
    atom: Atom<any>;
    val: any;
}) => void;
export declare const globalActionRelayChannel: import("redux-saga").MulticastChannel<{}>;
export declare type AnyAction = {
    type: string;
    [payload: string]: any;
};
export declare function useAtomReadAgent(): (arg?: Atom<any>) => any;
