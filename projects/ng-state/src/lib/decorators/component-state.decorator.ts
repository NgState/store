import { ServiceLocator } from "../helpers/service-locator";
import {
  ChangeDetectorRef,
  Input,
  OnDestroy,
  OnChanges,
  OnInit,
  SimpleChanges,
  ɵɵngDeclareDirective,
  Directive,
} from "@angular/core";
import { Dispatcher } from "../services/dispatcher";
import { IS_TEST } from "../inject-constants";
import { NgStateTestBed } from "../ng-state.test-bed";

export function ComponentState(
  stateActions: any | ((T) => any),
  disableOnChangesBeforeActionsCreated = true
) {
  return (target: any) => {
    let origInit = target.prototype.ngOnInit || (() => {});
    let origDestroy = target.prototype.ngOnDestroy || (() => {});
    let origOnChanges = target.prototype.ngOnChanges || (() => {});

    const ensureMarkForCheck = function () {
      if (!this.cd) {
        this.cd = ServiceLocator.injector.get(ChangeDetectorRef);
      }
    };

    target.prototype.ngOnChanges = function () {
      if (disableOnChangesBeforeActionsCreated && !this.actions) {
        return;
      }

      origOnChanges.apply(this, arguments);
    };

    target.prototype.ngOnInit = function () {
      const isTest = ServiceLocator.injector.get(IS_TEST);
      if (isTest) {
        const actions = NgStateTestBed.getActions(
          stateActions,
          NgStateTestBed.strictActionsCheck
        );
        if (actions) {
          this.actions = actions.instance;
          this.statePath = actions.statePath;
          origInit.apply(this, arguments);
          return;
        }
      } else {
        ensureMarkForCheck.apply(this);
      }

      if (!this.statePath) {
        this.statePath = [];
      }

      // DOC - CONVETION: only annonymous function allwed for choosing state; Actions can be only named functions;
      const extractedStateAction =
        stateActions.name === "" ? stateActions(this) : stateActions;

      const actions = new extractedStateAction();
      this.statePath = actions.createStore(this.statePath, this.stateIndex);

      const dispatcher = ServiceLocator.injector.get(Dispatcher);
      this.stateChangeSubscription = dispatcher.subscribe(actions.aId, () => {
        this.cd.markForCheck();
      });

      this.actions = actions;

      origInit.apply(this, arguments);
    };

    target.prototype.ngOnDestroy = function () {
      if (this.actions) {
        this.actions.onDestroy();
      }

      if (this.stateChangeSubscription) {
        this.stateChangeSubscription.unsubscribe();
      }

      origDestroy.apply(this, arguments);
    };
  };
}

@Directive()
export class HasStateActions<T> implements OnInit, OnDestroy, OnChanges {
  @Input() statePath: any;
  @Input() stateIndex?: string | number = null;

  readonly actions: T;
  readonly cd: ChangeDetectorRef;

  constructor(cd: ChangeDetectorRef) {
    this.cd = cd;
  }

  ngOnInit(): void {}
  ngOnChanges(changes: SimpleChanges): void {}
  ngOnDestroy(): void {}
}
