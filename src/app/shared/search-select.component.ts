import { Component, Input, Output, EventEmitter, forwardRef, OnChanges, SimpleChanges, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SearchOption {
  id: number;
  label: string;
}

@Component({
  selector: 'app-search-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SearchSelectComponent),
    multi: true,
  }],
  template: `
    <div class="ss-wrap" [class.ss-open]="open">
      <div class="ss-box" [class.ss-focused]="open" (click)="focusInput()">
        <i class="ti ti-search ss-icon"></i>
        <input
          #inputEl
          type="text"
          class="ss-input"
          [placeholder]="open ? placeholder : (selectedLabel || placeholder)"
          [(ngModel)]="search"
          (input)="onSearch()"
          (focus)="onFocus()"
          (keydown.arrowdown)="moveDown($event)"
          (keydown.arrowup)="moveUp($event)"
          (keydown.enter)="selectHighlighted($event)"
          (keydown.escape)="close()"
          (keydown.tab)="close()"
          autocomplete="off"
        />
        @if (selectedLabel && !open) {
          <span class="ss-display" (click)="focusInput()">{{ selectedLabel }}</span>
        }
        @if (value && !open) {
          <button class="ss-clear" (click)="clear($event)" type="button"><i class="ti ti-x"></i></button>
        }
      </div>
      @if (open) {
        <div class="ss-dropdown" #dropdown>
          @if (filtered.length === 0) {
            <div class="ss-empty"><i class="ti ti-mood-empty"></i> Sin resultados para "{{ search }}"</div>
          }
          @for (opt of filtered; track opt.id; let i = $index) {
            <div
              class="ss-option"
              [class.ss-highlighted]="i === highlightIdx"
              [class.ss-active]="opt.id === value"
              (mouseenter)="highlightIdx = i"
              (click)="select(opt, $event)">
              <i class="ti" [class.ti-check]="opt.id === value" [class.ti-point]="opt.id !== value"></i>
              {{ opt.label }}
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host{display:block;width:100%}
    .ss-wrap{position:relative}

    .ss-box{
      display:flex;align-items:center;gap:6px;
      padding:7px 12px;
      border:1px solid var(--line,#ddd);border-radius:8px;
      background:var(--bg,#fff);
      cursor:text;transition:border-color .15s,box-shadow .15s;
      position:relative;
    }
    .ss-box:hover{border-color:var(--tx3,#aaa)}
    .ss-focused{border-color:var(--orange,#e67e22) !important;box-shadow:0 0 0 3px rgba(230,126,34,.12)}

    .ss-icon{color:var(--tx3,#999);font-size:16px;flex-shrink:0}

    .ss-input{
      border:0;background:0;font:inherit;font-size:13px;color:var(--ink,#333);
      outline:0;flex:1;min-width:0;
    }
    .ss-input::placeholder{color:var(--tx3,#aaa)}

    .ss-display{
      position:absolute;left:34px;right:32px;top:50%;transform:translateY(-50%);
      font-size:13px;color:var(--ink,#333);
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
      pointer-events:none;
    }

    .ss-clear{
      border:0;background:0;cursor:pointer;padding:2px;
      color:var(--tx3,#999);font-size:14px;line-height:1;
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      transition:color .15s,background .15s;flex-shrink:0;
    }
    .ss-clear:hover{color:var(--orange,#e67e22);background:rgba(230,126,34,.08)}

    .ss-dropdown{
      position:absolute;top:calc(100% + 4px);left:0;right:0;
      max-height:240px;overflow-y:auto;
      background:var(--bg,#fff);
      border:1px solid var(--line,#ddd);border-radius:10px;
      box-shadow:0 8px 24px rgba(0,0,0,.12);
      z-index:1000;
      padding:4px 0;
    }

    .ss-option{
      padding:8px 12px;font-size:13px;cursor:pointer;
      display:flex;align-items:center;gap:8px;
      transition:background .1s;border-radius:0;
    }
    .ss-option .ti{font-size:14px;color:var(--tx3,#ccc);flex-shrink:0}
    .ss-option:hover,.ss-highlighted{background:var(--bg3,#f5f5f5)}
    .ss-active{font-weight:600}
    .ss-active .ti{color:var(--orange,#e67e22)}
    .ss-highlighted{background:rgba(230,126,34,.06)}
    .ss-highlighted.ss-active{background:rgba(230,126,34,.10)}

    .ss-empty{padding:16px;text-align:center;color:var(--tx3,#999);font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px}
    .ss-empty .ti{font-size:18px}
  `],
  host: {
    '(document:click)': 'onDocClick($event)',
  },
})
export class SearchSelectComponent implements ControlValueAccessor, OnChanges {
  @Input() options: SearchOption[] = [];
  @Input() placeholder = 'Buscar...';
  @Output() valueChange = new EventEmitter<number>();
  @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('dropdown') dropdownEl?: ElementRef<HTMLDivElement>;

  open = false;
  search = '';
  value: number | null = null;
  selectedLabel = '';
  highlightIdx = 0;
  filtered: SearchOption[] = [];

  private onChange: (v: number | null) => void = () => {};
  private onTouched: () => void = () => {};
  private elRef = inject(ElementRef);

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['options']) {
      if (this.search) {
        this.onSearch();
      } else {
        this.filtered = this.options;
      }
      this.updateLabel();
    }
  }

  writeValue(v: number | null): void {
    this.value = v;
    this.updateLabel();
  }

  registerOnChange(fn: (v: number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  private updateLabel(): void {
    const found = this.options.find(o => o.id === this.value);
    this.selectedLabel = found ? found.label : '';
  }

  focusInput(): void {
    this.inputEl?.nativeElement?.focus();
  }

  onFocus(): void {
    this.open = true;
    this.search = '';
    this.filtered = this.options;
    this.highlightIdx = this.findActiveIdx();
  }

  close(): void {
    this.open = false;
    this.search = '';
    this.onTouched();
  }

  private norm(s: string): string {
    let r = '';
    for (const c of s.toLowerCase().normalize('NFD')) {
      const code = c.charCodeAt(0);
      if (code < 0x0300 || code > 0x036f) r += c;
    }
    return r;
  }

  onSearch(): void {
    const q = this.norm(this.search);
    if (!q) {
      this.filtered = this.options;
    } else {
      this.filtered = this.options.filter(o => this.norm(o.label).includes(q));
    }
    this.highlightIdx = 0;
    this.open = true;
  }

  select(opt: SearchOption, ev?: Event): void {
    ev?.stopPropagation();
    this.value = opt.id;
    this.selectedLabel = opt.label;
    this.search = '';
    this.open = false;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  clear(ev: Event): void {
    ev.stopPropagation();
    this.value = null;
    this.selectedLabel = '';
    this.onChange(null);
    this.valueChange.emit(0);
  }

  moveDown(ev: Event): void {
    ev.preventDefault();
    if (this.highlightIdx < this.filtered.length - 1) {
      this.highlightIdx++;
      this.scrollToHighlighted();
    }
  }

  moveUp(ev: Event): void {
    ev.preventDefault();
    if (this.highlightIdx > 0) {
      this.highlightIdx--;
      this.scrollToHighlighted();
    }
  }

  selectHighlighted(ev: Event): void {
    ev.preventDefault();
    if (this.filtered[this.highlightIdx]) this.select(this.filtered[this.highlightIdx]);
  }

  onDocClick(ev: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(ev.target)) this.close();
  }

  private findActiveIdx(): number {
    if (!this.value) return 0;
    const idx = this.filtered.findIndex(o => o.id === this.value);
    return idx >= 0 ? idx : 0;
  }

  private scrollToHighlighted(): void {
    setTimeout(() => {
      const dd = this.dropdownEl?.nativeElement;
      if (!dd) return;
      const el = dd.children[this.highlightIdx] as HTMLElement;
      if (el) el.scrollIntoView({ block: 'nearest' });
    });
  }
}
