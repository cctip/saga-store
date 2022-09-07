import { Atom, atom, useSetAtom, WritableAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useRef } from 'react';
import { stdChannel } from 'redux-saga';

function getWriteAgentAtom() {
  return atom<never, { atom: Atom<any>, val: any }>(null, (_get, set, update) => {
    set(update.atom as WritableAtom<any, any, any>, update.val);
  });
}

export function useAtomWriteAgent() {
  const agentAtom = useRef(getWriteAgentAtom()).current;
  return useSetAtom(agentAtom);
}

export const globalActionRelayChannel = stdChannel();

export type AnyAction = {
  type: string;
  [payload: string]: any;
}

const getter = (get, set, arg) => get(arg);
export function useAtomReadAgent() {
  return useAtomCallback<any, Atom<any>>(getter);
}