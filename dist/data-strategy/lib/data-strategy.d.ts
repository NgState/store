import { StoreLike } from './store-like';
export declare abstract class DataStrategy {
    rootStore: StoreLike<any>;
    abstract getIn(state: any, path: any[]): any;
    abstract merge(state: any, newState: any, path?: any[], isRootPath?: boolean): any;
    abstract update(path: any[], action: (state: any) => void): void;
    abstract fromJS(data: any): any;
    abstract toJS(data: any): any;
    abstract set(state: any, property: string, data: any): any;
    abstract setIn(state: any, path: any[], data: any, additionalData?: {
        fromUpdate: boolean;
    }): any;
    abstract isObject(state: any): any;
    abstract overrideContructor(obj: any): any;
    abstract reset(path: any[], stateToMerge: any): void;
    abstract resetRoot(initialState: any, startingRoute: string): void;
    abstract equals(objOne: any, objTwo: any): boolean;
    protected readonly currentState: any;
    init(store: StoreLike<any>): void;
}
