import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  afterNextRender,
  OnDestroy,
  ElementRef,
  numberAttribute,
  booleanAttribute,
} from '@angular/core';

@Component({
  selector: 'app-spacebar-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'spacebar__button',
    '[class.is-pressed]': 'isPressed()',
    '(mousedown)': 'startPress($event)',
    '(mouseup)': 'cancelPress()',
    '(mouseleave)': 'cancelPress()',
    '(touchstart)': 'startPress($event)',
    '(touchend)': 'cancelPress()',
  },
  templateUrl: `spacebar_button_template.html`,
  styleUrl: './spacebar_button_styles.css',
})
export class SpacebarButtonComponent implements OnDestroy {
  isActive = input(true, { transform: booleanAttribute });
  pressed = output<void>();

  isPressed = signal(false);
  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly ANIMATION_DURATION = 1000;
  private isHandlingPress = false;

  private keydownHandler = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      // Si este botón inició la pulsación actual, seguir previniendo el scroll
      if (this.isHandlingPress && event.repeat) {
        event.preventDefault();
        return;
      }
      // Solo responder si esta sección es la activa y el contenedor está visible
      if (!this.isCurrentSection() || !this.isInView()) return;
      event.preventDefault();
      if (!event.repeat) {
        this.isHandlingPress = true;
        this.startPress(event);
      }
    }
  };

  private keyupHandler = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      this.isHandlingPress = false;
      this.cancelPress();
    }
  };

  constructor(private elementRef: ElementRef<HTMLElement>) {
    afterNextRender(() => {
      document.addEventListener('keydown', this.keydownHandler);
      document.addEventListener('keyup', this.keyupHandler);
    });
  }

  ngOnDestroy() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.keydownHandler);
      document.removeEventListener('keyup', this.keyupHandler);
    }
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
    }
  }

  /** Check if the parent sections-container is visible in the viewport center */
  private isInView(): boolean {
    // Walk up to find the parent app-sections-container
    let el: HTMLElement | null = this.elementRef.nativeElement;
    while (el && el.tagName !== 'APP-SECTIONS-CONTAINER') {
      el = el.parentElement;
    }
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const isContainerInView = rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.5;
    return isContainerInView && this.isActive();
  }

  private isCurrentSection(): boolean {
    let sectionEl: HTMLElement | null = this.elementRef.nativeElement;
    while (sectionEl && sectionEl.tagName !== 'APP-SECTION') {
      sectionEl = sectionEl.parentElement;
    }
    if (!sectionEl) return false;
    let containerEl: HTMLElement | null = sectionEl;
    while (containerEl && containerEl.tagName !== 'APP-SECTIONS-CONTAINER') {
      containerEl = containerEl.parentElement;
    }
    if (!containerEl) return false;
    const sections = Array.from(containerEl.querySelectorAll(':scope > * app-section, :scope > app-section'));
    const myIndex = sections.indexOf(sectionEl);
    const visibleIndex = sections.findIndex(s => s.classList.contains('visible'));

    return myIndex === visibleIndex;
  }

  gradientTransform() {
    return this.isPressed() ? 'matrix(1, 0, 0, 1, 0, 0)' : 'matrix(1, 0, 0, 1, -140, 0)';
  }

  startPress(event: Event) {
    if (this.isPressed()) return;

    event.preventDefault();
    this.isPressed.set(true);

    this.pressTimer = setTimeout(() => {
      this.completeAction();
    }, this.ANIMATION_DURATION);
  }

  cancelPress() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
    this.isPressed.set(false);
  }

  private completeAction() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
    this.pressed.emit();
    this.isPressed.set(false);
  }
}
