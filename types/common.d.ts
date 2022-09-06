import { Action } from '@redux-saga/types';
declare type UpdateAction = {
    type: '@update';
    produce: (prev: any) => void;
};
export declare const reducer: (value: any, action: Action | UpdateAction) => any;
export {};
