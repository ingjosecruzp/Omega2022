import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appBindCssVariable]'
})
export class BindCssVariableDirective {
  @Input("appBindCssVariable") variable: string;
  @Input("appBindCssVariableValue") value: string;

  constructor(private host: ElementRef<HTMLElement>) { 

  }

  ngOnChanges(changes) {
    const value = changes.value.currentValue;
    this.host.nativeElement.style.setProperty(`--${this.variable}`, value);
  }

}