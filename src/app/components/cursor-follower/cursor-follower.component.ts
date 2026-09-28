import { Component, ChangeDetectionStrategy, signal, afterNextRender, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-cursor-follower',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'cursor-follower',
    '[style.transform]': 'transform()',
  },
  template: `
    <div class="crosshair-v"></div>
    <div class="crosshair-h"></div>
  `,
  styles: `
    :host {
      position: fixed;
      top: 0;
      left: 0;
      width: 35px;
      height: 35px;
      pointer-events: none;
      z-index: 9999;
      transform: translate3d(0, 0, 0);
      margin-left: -10px;
      margin-top: -10px;
      mix-blend-mode: difference;
      /* Smooth transition for the delay/trail effect */
      transition: transform 0.10s cubic-bezier(0.2, 0, 0.2, 1);
    }

    @media (max-width: 1024px) {
      :host {
        display: none;
      }
    }

    .crosshair-v,
    .crosshair-h {
      position: absolute;
      background-color: #ffffff;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    /* Vertical line */
    .crosshair-v {
      width: 2px;
      height: 100%;
    }

    /* Horizontal line */
    .crosshair-h {
      width: 100%;
      height: 2px;
    }
  `,
})
export class CursorFollowerComponent implements OnDestroy {
  transform = signal('translate3d(-100px, -100px, 0)');

  private mouseMoveHandler = (e: MouseEvent) => {
    this.transform.set(`translate3d(${e.clientX}px, ${e.clientY}px, 0)`);
  };

  constructor() {
    afterNextRender(() => {
      document.addEventListener('mousemove', this.mouseMoveHandler);
    });
  }

  ngOnDestroy() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousemove', this.mouseMoveHandler);
    }
  }
}
