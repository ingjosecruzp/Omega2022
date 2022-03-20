import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'linkify'})
export class LinkifyPipe implements PipeTransform {
  transform(link: string,arg1: any): string {
    return this.linkify(link,arg1);
  }

  private linkify(plainText,recursoId): string{
    let replacedText;
    let replacePattern1;
    let replacePattern2;
    let replacePattern3;

    //console.log(recursoId);

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    let htmlElement ='<a href="$1" target="_blank" hreflang="'+recursoId+'" class="link">$1</a>';
    replacedText = plainText.replace(replacePattern1,htmlElement);

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    let htmlElement2 ='$1<a href="http://$2" target="_blank" hreflang="'+recursoId+'" class="link">$2</a>';
    replacedText = replacedText.replace(replacePattern2, htmlElement2);

    //Change email addresses to mailto:: links.
    //replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    //replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
   }
}