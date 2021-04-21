import {
  Inject,
  Injector,
  ModuleWithProviders,
  NgModule,
  NgZone,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Dispatcher } from "./services/dispatcher";
import { Router } from "@angular/router";
import { RouterState } from "./state/router-state";
import { ServiceLocator } from "./helpers/service-locator";
import { State } from "./state/state";
import {
  StateHistory,
  StateHistoryOptions,
  StateKeeper,
} from "./state/history";
import { Store } from "./store/store";
import { HistoryController } from "./state/history-controller";
import { DebugInfo, DebugOptions } from "./debug/debug-info";
import { DataStrategy } from "@ng-state/data-strategy";
import {
  TRANSFER_STATE_KEY,
  NG_STATE_OPTIONS,
  INITIAL_STATE,
  IS_PROD,
  IS_TEST,
  RESTORE_FROM_SERVER as RESTORE_FROM_SERVER_OPTIONS,
} from "./inject-constants";

export function stateFactory(
  initialState,
  dataStrategy: DataStrategy,
  restoreFromServerOptions?: RestoreFromServerOptions
) {
  if (
    !restoreFromServerOptions ||
    !restoreFromServerOptions.restoreStateFromServer ||
    !restoreFromServerOptions.transferState
  ) {
    return new State(initialState, dataStrategy);
  }

  const stateKey = restoreFromServerOptions.makeStateKey<any>(
    TRANSFER_STATE_KEY
  );
  if (restoreFromServerOptions.transferState.hasKey(stateKey)) {
    initialState = restoreFromServerOptions.transferState.get(
      stateKey,
      initialState
    );
  }

  return new State(initialState, dataStrategy);
}

export function storeFactory(state: State<any>) {
  return new Store(state);
}

export function historyControllerFactory(
  store: Store<any>,
  history: StateHistory,
  debugerInfo: DebugInfo,
  router: Router,
  dataStrategy: DataStrategy
) {
  return new HistoryController(
    store,
    history,
    debugerInfo,
    router,
    dataStrategy
  );
}

export function routerStateFactory(
  store: Store<any>,
  router: Router,
  debugerInfo: DebugInfo
) {
  return new RouterState(store, router, debugerInfo);
}

export function debugInfoFactory(
  history: StateHistory,
  zone: NgZone,
  dataStrategy: DataStrategy
) {
  return new DebugInfo(history, zone, dataStrategy);
}

@NgModule({
  imports: [CommonModule],
})
export class StoreModule {
  static provideStore(
    initialState: any,
    isProd?: boolean,
    options: NgStateOptions = {},
    restoreStateFromServer?: RestoreFromServerOptions
  ): ModuleWithProviders<StoreModule> {
    return {
      ngModule: StoreModule,
      providers: [
        { provide: NG_STATE_OPTIONS, useValue: options },
        { provide: INITIAL_STATE, useValue: initialState },
        { provide: IS_PROD, useValue: isProd },
        { provide: IS_TEST, useValue: false },
        {
          provide: RESTORE_FROM_SERVER_OPTIONS,
          useValue: restoreStateFromServer,
        },
        {
          provide: State,
          useFactory: stateFactory,
          deps: [INITIAL_STATE, DataStrategy, RESTORE_FROM_SERVER_OPTIONS],
        },
        { provide: Store, useFactory: storeFactory, deps: [State] },
        { provide: StateHistory, useClass: StateHistory },
        {
          provide: DebugInfo,
          useFactory: debugInfoFactory,
          deps: [StateHistory, NgZone, DataStrategy],
        },
        {
          provide: HistoryController,
          useFactory: historyControllerFactory,
          deps: [Store, StateHistory, DebugInfo, Router, DataStrategy],
        },
        {
          provide: RouterState,
          useFactory: routerStateFactory,
          deps: [Store, Router, DebugInfo],
        },
        Dispatcher,
      ],
    };
  }

  constructor(
    private stateHistory: StateHistory,
    private debugInfo: DebugInfo,
    injector: Injector,
    historyController: HistoryController,
    routerState: RouterState,
    dataStrategy: DataStrategy,
    store: Store<any>,
    @Inject(INITIAL_STATE) initialState: any,
    @Inject(NG_STATE_OPTIONS) ngStateOptions: any,
    @Inject(IS_PROD) isProd: any
  ) {
    ServiceLocator.injector = injector;
    this.initStateHistory(initialState, ngStateOptions);
    this.initDebugger(ngStateOptions);
    historyController.init();

    routerState.init();

    if (!isProd) {
      this.ensureWindowObject();
      (<any>window).state = {
        history: StateKeeper,
        debug: debugInfo.publicApi,
      };
    }

    dataStrategy.init(store, isProd);
  }

  private ensureWindowObject() {
    var global = global || globalThis.global || (globalThis as any);
    if (global["window"] === undefined) {
      global["window"] = global;
    }
  }

  private initStateHistory(initialState: any, ngStateOptions: NgStateOptions) {
    if (ngStateOptions && ngStateOptions.history) {
      this.stateHistory.changeDefaults(ngStateOptions.history);
    }

    this.stateHistory.init(initialState);
  }

  private initDebugger(ngStateOptions: NgStateOptions) {
    DebugInfo.instance = this.debugInfo;

    if (!ngStateOptions || !ngStateOptions.debugger) {
      return;
    }

    if (ngStateOptions.debugger.options) {
      this.debugInfo.changeDefaults(ngStateOptions.debugger.options);
    }

    if (ngStateOptions.debugger.enableInitialDebugging) {
      this.debugInfo.init(true);
    }
  }
}

export interface NgStateOptions {
  history?: StateHistoryOptions;
  debugger?: {
    enableInitialDebugging?: boolean;
    options?: DebugOptions;
  };
  restoreFromServerOptions?: RestoreFromServerOptions;
}

export interface RestoreFromServerOptions {
  restoreStateFromServer: boolean;
  transferState: TransferStateLike;
  makeStateKey<T = void>(key: string): StateKeyLike<T>;
}

type StateKeyLike<T> = string & {
  __not_a_string: never;
};

interface TransferStateLike {
  get<T>(key: StateKeyLike<T>, defaultValue: T): T;
  set<T>(key: StateKeyLike<T>, value: T): void;
  remove<T>(key: StateKeyLike<T>): void;
  hasKey<T>(key: StateKeyLike<T>): boolean;
  onSerialize<T>(key: StateKeyLike<T>, callback: () => T): void;
  toJson(): string;
}
