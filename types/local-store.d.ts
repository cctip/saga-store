import * as ef from 'redux-saga/effects';
import type { RunSagaOptions } from '@redux-saga/core';
import { Atom } from 'jotai';
import { Action } from '@redux-saga/types';
declare type AtomMap = {
    [key: string]: Atom<any>;
};
export declare function useLocalStore(opts: RunSagaOptions<Action, any>, atoms: AtomMap, saga: GeneratorFunction, ...args: any[]): (message: {} | import("@redux-saga/types").END) => void;
export declare function writeAtom(atom: Atom<any>, val: any): Generator<ef.GetContextEffect, void, unknown>;
export declare function readAtom(atom: Atom<any>): Generator<ef.GetContextEffect, any, unknown>;
export {};
