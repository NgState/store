import { Router, NavigationCancel, NavigationEnd, RoutesRecognized } from '@angular/router';
import { Store } from '../store/store';
import { DebugInfo } from '../debug/debug-info';
import { filter, take } from 'rxjs/operators';

export class RouterState {
    static startingRoute = '';

    constructor(private store: Store<any>, private router: Router, private debugInfo: DebugInfo) {
    }

    init() {
        this.initRouter();
        this.bindRouter();
    }

    private initRouter() {
        this.router.events
            .pipe(
                filter(event => event instanceof RoutesRecognized),
                take(1)
            )
            .subscribe((event: RoutesRecognized) => {
                this.store.initialize(['router'], { url: event.url }, false);
            });
    }

    private bindRouter() {
        if (!this.router.events) {
            return;
        }

        let cancelledId = -1;
        this.router.events
            .pipe(filter(() => this.debugInfo && !this.debugInfo.isTimeTravel))
            .subscribe((event) => {
                if (event instanceof NavigationCancel) {
                    cancelledId = (<NavigationCancel>event).id;
                }
                if (event instanceof NavigationEnd && (<NavigationEnd>event).id !== cancelledId) {
                    (<Store<any>>this.store.select(['router']))
                        .update(state => {
                            state.url = event.url;
                        });
                }
            });
    }
}