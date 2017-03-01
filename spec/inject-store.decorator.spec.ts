import { ServiceLocator } from './../src/helpers/service-locator';
import { InjectStore } from '../src/decorators/inject-store.decorator';

class TestStateActions {
    store: any;
    createStore(statePath: string[], stateIndex: number | null) {
        return ['newStatePath'];
    }
};

const store = {
    initialize: (statePath, intialState) => { },
    select: (statePath: string[]) => 'store'
};

ServiceLocator.injector = <any>{
    get: () => store
};

describe('InjectStore decorator', () => {
    let target;

    let setup = (newPath: string[] | string | ((currentPath, stateIndex) => string[] | string), intialState?: Object | any) => {
        const decorator = InjectStore(newPath, intialState);
        decorator(TestStateActions);
        target = new TestStateActions();
    };

    it('should resolve state path from anonymous function', () => {
        setup((currentPath, stateIndex) => 'new path');
        const newPath = target.createStore();

        expect(newPath.length).toEqual(1);
        expect(newPath[0]).toBe('new path');
    });

    it('should extract absolute path', () => {
        setup('new/${stateIndex}/path/${stateIndex}');
        const newPath = target.createStore(null, [1, 2]);

        expect(newPath.length).toEqual(4);
        expect(newPath[0]).toBe('new');
        expect(newPath[1]).toBe(1);
        expect(newPath[2]).toBe('path');
        expect(newPath[3]).toBe(2);
    });

    it('should extract relative path', () => {
        setup(['test', '${stateIndex}', 'path']);
        const newPath = target.createStore(['parent'], 1);

        expect(newPath.length).toEqual(4);
        expect(newPath[0]).toBe('parent');
        expect(newPath[1]).toBe('test');
        expect(newPath[2]).toBe(1);
        expect(newPath[3]).toBe('path');
    });

    it('should create store', () => {
        spyOn(ServiceLocator.injector, 'get').and.callThrough();
        setup(['test', '${stateIndex}', 'path']);
        target.createStore(['parent'], 1);

        expect(ServiceLocator.injector.get).toHaveBeenCalled();
        expect(target.store).toBeDefined();
    });

    it('should initialize store with initial values if provided', () => {
        setup(['test', '${stateIndex}', 'path'], { test: 'test' });
        target.store = store;
        spyOn(target.store, 'initialize');

        target.createStore(['parent'], 1);

        expect(target.store.initialize).toHaveBeenCalled();
    });
});