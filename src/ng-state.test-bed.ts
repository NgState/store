import { ServiceLocator } from './helpers/service-locator';
import { IS_TEST, stateFactory, storeFactory } from './ng-state.module';
import { HasStateActions } from './decorators/component-state.decorator';
import { StateHistory } from './state/history';

export class NgStateTestBed {
    public static setTestEnvironment() {
        ServiceLocator.injector = { get: (key) => key === IS_TEST };
    }

    public static createActions(initialState: any, path: string | any[], actionsType: any) {
        const state = stateFactory(initialState);
        const store = storeFactory(state);
        const stateHistory = new StateHistory(store);
        stateHistory.init(initialState);
        ServiceLocator.injector = {
            get: (key) => {
                return key === IS_TEST
                    ? true
                    : store;
            }
        };

        const actions = new (actionsType as any)();
        actions.createTestStore(NgStateTestBed.getPath(path));

        return actions;
    }

    public static setActionsToComponent(actions: any, component: any) {
        (<any>component).actions = actions;
    }

    private static getPath(path: string | string[]) {
        if (path instanceof Array) {
            return path;
        }

        path = path.split('/');
        return path;
    }
}