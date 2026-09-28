import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EN } from './en';
import { ES } from './es';
import { Translations } from './translations.type';

const STORAGE_KEY = 'la-lang';
type Lang = 'en' | 'es';

const DICTIONARIES: Record<Lang, Translations> = { en: EN, es: ES };

@Injectable({ providedIn: 'root' })
export class TranslationService {
    /** Current language code */
    readonly currentLang = signal<Lang>(this.getInitialLang());

    /** Reactive translation dictionary — recomputes when language changes */
    readonly t = computed<Translations>(() => DICTIONARIES[this.currentLang()]);

    constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

    /** Switch to a different language and persist choice */
    setLanguage(lang: Lang): void {
        this.currentLang.set(lang);
        if (isPlatformBrowser(this.platformId)) {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, lang);
            }
        }
    }

    /** Toggle between EN ↔ ES */
    toggleLanguage(): void {
        this.setLanguage(this.currentLang() === 'en' ? 'es' : 'en');
    }

    /** Read language from localStorage or default to 'en' */
    private getInitialLang(): Lang {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'en' || stored === 'es') return stored;
        }
        return 'en';
    }
}
