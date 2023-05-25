import type { RunSagaOptions } from '@redux-saga/core';
import { PropsWithChildren } from 'react';
import { Action } from '@redux-saga/types';
interface LocalDispatchType {
    (action: any): void;
}
export declare function useLocalDispatch(): LocalDispatchType;
declare type OptsType = RunSagaOptions<Action, any>;
declare type LocalSagaStoreOption = {
    task: GeneratorFunction;
    args?: any[];
    opts?: OptsType;
    atoms?: any;
};
export declare function withLocalStore(Comp: React.ComponentType<PropsWithChildren<any>>, option: LocalSagaStoreOption): (props: PropsWithChildren<any>) => JSX.Element;
export {};
//# sourceMappingURL=local-store.d.ts.map