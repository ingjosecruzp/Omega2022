import { Component, OnInit, Input, ViewChildren, QueryList,ApplicationRef,Output,EventEmitter,ViewChild,ElementRef,Renderer2, ChangeDetectorRef } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DownloadFileService } from 'src/app/services/download-file.service';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/file/ngx';
import { Plugins } from '@capacitor/core';
import { Platform, AlertController, IonThumbnail } from '@ionic/angular';
import { BooksService } from 'src/app/services/books.service';
import { Zip } from '@ionic-native/zip/ngx';
import { stat } from 'fs';
import { computeStackId } from '@ionic/angular/directives/navigation/stack-utils';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { BehaviorSubject} from 'rxjs';
import { CircleProgressComponent } from '../circle-progress/circle-progress.component';
import { Storage } from '@ionic/storage';
import { GlobalService } from 'src/app/services/global.service';
import { PortadasService } from 'src/app/api/portadas.service';
import { apiBase } from 'src/app/api/apiBase';
import { DomSanitizer, SafeResourceUrl, SafeUrl} from '@angular/platform-browser';
import { ActPortadasService } from 'src/app/services/act-portadas.service';
import { Subscription } from 'rxjs';
import { ConnectivityService } from 'src/app/services/connectivity.service';
import Masonry from 'masonry-layout';
import { element } from 'protractor';




@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.scss'],
})
export class BooksComponent implements OnInit {
  
  libros: any[] = [];
  arrayImg: any[] = [];
  spiner = true;
  dataList = [];
  pageNumber: number = 1;
  banderaImagen = 1;
  totalXPagina = 500;
  imgLoad;
  dysplayProgres="none";
  banderaInterseccion=1;
  private observer: IntersectionObserver;
  //private  BackgroundGeolocation: modusecho;
  @ViewChildren(CircleProgressComponent) ArrayCircleProgress: QueryList<CircleProgressComponent>;
  @ViewChild('panelKinder', {read: ElementRef, static: false}) panelKinder: ElementRef;
  @ViewChild('botonKinder', {read: ElementRef, static: false}) botonKinder: ElementRef;

  @ViewChild('panelPrimaria', {read: ElementRef, static: false}) panelPrimaria: ElementRef;
  @ViewChild('botonPrimaria', {read: ElementRef, static: false}) botonPrimaria: ElementRef;

  @ViewChild('panelSecundaria', {read: ElementRef, static: false}) panelSecundaria: ElementRef;
  @ViewChild('botonSecundaira', {read: ElementRef, static: false}) botonSecundaira: ElementRef;

  @ViewChild('panelPreparatoria', {read: ElementRef, static: false}) panelPreparatoria: ElementRef;
  @ViewChild('botonPreparatoria', {read: ElementRef, static: false}) botonPreparatoria: ElementRef;

  @ViewChildren('imgMansory', {read: ElementRef}) imgMansory: QueryList<ElementRef>;

  @ViewChild('interactionObserveCircle', {read: ElementRef, static: false}) interactionObserveCircle: ElementRef;
  @ViewChild('imgMansoryContariner', {read: ElementRef, static: false}) imgMansoryContariner: ElementRef;

  @Input() idiomaIN: string;
  @Input() librosIN: any[];
  @Output() updateAutoHeightSlider = new EventEmitter();
  @Output() buscarPortadas = new EventEmitter();
  pathStorage:any;
  tipoUsuario:any;
  token:any;
  msnry;
  subscribeBooks: Subscription;

  constructor(public  webSocket: WebsocketService,private serviceDownload: DownloadFileService,private transfer: FileTransfer,
              private file: File,private platform: Platform,private booksService: BooksService,private zip: Zip,
              private webview: WebView,private storage: Storage,private applicationRef:ApplicationRef,private globalServicies: GlobalService,
              private renderer: Renderer2,private apiPortadas: PortadasService,private api: apiBase,public sanitizer: DomSanitizer,
              private elem: ElementRef,private actPortadasService: ActPortadasService,private connectivity: ConnectivityService,
			  private cdRef : ChangeDetectorRef) {
                
  }

  abrirKinder(){

    
    const statusPanel = this.panelKinder.nativeElement.getAttribute("status");
    if(statusPanel=="close") {
      this.renderer.removeStyle(this.panelKinder.nativeElement, 'max-height');
      this.renderer.addClass(this.botonKinder.nativeElement, 'active');
      this.panelKinder.nativeElement.setAttribute('status','open');
      this.renderer.removeStyle(this.panelKinder.nativeElement, 'display');
    }
    else {
      this.renderer.setStyle(this.panelKinder.nativeElement, 'max-height','0');
      this.renderer.removeClass(this.botonKinder.nativeElement, 'active');
      this.panelKinder.nativeElement.setAttribute('status','close');
      this.renderer.setStyle(this.panelKinder.nativeElement, 'display','none');
    }

    this.updateAutoHeightSlider.emit();
  }

  abrirPrimaria(){

    
    const statusPanel = this.panelPrimaria.nativeElement.getAttribute("status");
    if(statusPanel=="close") {
      this.renderer.removeStyle(this.panelPrimaria.nativeElement, 'max-height');
      this.renderer.addClass(this.botonPrimaria.nativeElement, 'active');
      this.panelPrimaria.nativeElement.setAttribute('status','open');
      this.renderer.removeStyle(this.panelPrimaria.nativeElement, 'display');
    }
    else {
      this.renderer.setStyle(this.panelPrimaria.nativeElement, 'max-height','0');
      this.renderer.removeClass(this.botonPrimaria.nativeElement, 'active');
      this.panelPrimaria.nativeElement.setAttribute('status','close');
      this.renderer.setStyle(this.panelPrimaria.nativeElement, 'display','none');
    }

    this.updateAutoHeightSlider.emit();
  }

  abrirSecundaria() {

    
    const statusPanel = this.panelSecundaria.nativeElement.getAttribute("status");
    if(statusPanel=="close") {
      this.renderer.removeStyle(this.panelSecundaria.nativeElement, 'max-height');
      this.renderer.addClass(this.botonSecundaira.nativeElement, 'active');
      this.panelSecundaria.nativeElement.setAttribute('status','open');
      this.renderer.removeStyle(this.panelSecundaria.nativeElement, 'display');
    }
    else {
      this.renderer.setStyle(this.panelSecundaria.nativeElement, 'max-height','0');
      this.renderer.removeClass(this.botonSecundaira.nativeElement, 'active');
      this.panelSecundaria.nativeElement.setAttribute('status','close');
      this.renderer.setStyle(this.panelSecundaria.nativeElement, 'display','none');
    }

    this.updateAutoHeightSlider.emit();
  }

  abrirPreparatoria(){
    
    
    const statusPanel = this.panelPreparatoria.nativeElement.getAttribute("status");

    if(statusPanel=="close") {
      this.renderer.removeStyle(this.panelPreparatoria.nativeElement, 'max-height');
      this.renderer.addClass(this.botonPreparatoria.nativeElement, 'active');
      this.panelPreparatoria.nativeElement.setAttribute('status','open');
      this.renderer.removeStyle(this.panelPreparatoria.nativeElement, 'display');
    }
    else {
      this.renderer.setStyle(this.panelPreparatoria.nativeElement, 'max-height','0');
      this.renderer.removeClass(this.botonPreparatoria.nativeElement, 'active');
      this.panelPreparatoria.nativeElement.setAttribute('status','close');
      this.renderer.setStyle(this.panelPreparatoria.nativeElement, 'display','none');
    }


    this.updateAutoHeightSlider.emit();
  }


  trackBooks(index: number, book: any){
    return book.Id;
  }

  async ngOnInit() {

    this.pathStorage = await this.globalServicies.getNameStorage();
    this.tipoUsuario = this.globalServicies.getKeyToken("tipo");

    setTimeout(() => {

      this.subscribeBooks = this.actPortadasService.procesoFinalizado.subscribe(data =>{
        this.libros=data;
        this.getImages(null);
        this.spiner = false;
      });
      this.actPortadasService.buscarLibros(this.idiomaIN).catch(err => console.log("error descarga:",err));
    }, 1000);
  }
  

 async ngOnDestroy(){
	 //this.msnry.destroy();
    if(this.subscribeBooks != undefined)	
      await this.subscribeBooks.unsubscribe();
  }

  async ngAfterViewInit (){

    setTimeout(async () => {
      //this.updateAutoHeightSlider.emit();
   
    });

    setTimeout(() => {
        
      this.imgMansory.changes.subscribe(element => {
        this.cargarMansoryPrimeraVez(null);
        console.log("changeMansory")
        this.observer = new IntersectionObserver((entries) => {
          /*   if(this.banderaInterseccion==1)
             {
               this.banderaInterseccion++;
               return;
             }*/
             entries.forEach((entry: any) => {
               if (entry.isIntersecting) {
                  // this.renderer.setStyle(entry.target.firstChild.firstChild.nextElementSibling,"display",'block');
                  //console.log("se Ve")
                  this.renderer.setStyle(entry.target.firstChild.nextElementSibling,"display",'block');
               } else {
                 //console.log("no se Ve")
                 this.renderer.setStyle(entry.target.firstChild.nextElementSibling,"display",'none');
               }
             });
          }, { rootMargin : "200px"});
     
          this.imgMansory.toArray().forEach(item =>{
           //this.imgMansory.toArray().forEach(item =>{
             //console.log(item.nativeElement);
             this.observer.observe(item.nativeElement);
           });  
          
        if((this.pageNumber-1)==1) return;

        let paginaActual = (this.pageNumber-2) * this.totalXPagina;
        this.arrayImg.forEach((element,index)=>{
            const indexMansory = paginaActual + index;
            this.msnry.appended(this.imgMansory.toArray()[indexMansory].nativeElement);
        });
        
      });
      


    }, 100);

     setTimeout(() => {
      
       
     }, 3000);

  }

    
  iniciarValidacion() {
    const directory = this.file.dataDirectory + "books2020/";
    
    //this.data = new BehaviorSubject(element);
    
    //this.libros = this.librosIN;
    //console.log(this.libros);
    return;
    //console.log(JSON.stringify(this.librosIN));
    this.libros.forEach(async(item) => {


      item.progreso=0;
      item.display="none";
      item.spinner="none";
      item.status="pendiente";
      if(this.platform.is('cordova')) {
        const date = new Date();
        const timestamp = date.getTime();

        //item.RutaThumbnails = item.RutaThumbnails.includes("?t=") ? item.RutaThumbnails : `${this.webview.convertFileSrc(urlCover)}?t=${timestamp}`;
      
        if(item.RutaThumbnails.includes("?t=")){ 
          let NombreCover=item.RutaThumbnails.split("/");

          const urlCover = `${this.file.dataDirectory}covers/${NombreCover[NombreCover.length-1].split("?")[0]}`;
          const pathIcono = `${this.file.dataDirectory}covers/iconos/${item.NombreArchivo}.svg`
          //console.log(item.RutaThumbnails);
          //console.log(urlCover);
          item.RutaThumbnails = `${this.webview.convertFileSrc(urlCover)}?t=${timestamp}`;
          item.Icono=`${this.webview.convertFileSrc(pathIcono)}?t=${timestamp}`;
        }
        else{
          const urlCover = `${this.file.dataDirectory}covers/${item.RutaThumbnails}`;
          const pathIcono = `${this.file.dataDirectory}covers/iconos/${item.NombreArchivo}.svg`

          item.RutaThumbnails=`${this.webview.convertFileSrc(urlCover)}?t=${timestamp}`;
          item.Icono=`${this.webview.convertFileSrc(pathIcono)}?t=${timestamp}`;
        }
      } else {
        const date = new Date();
        const timestamp = date.getTime();
        //https://192.168.137.1:5001/covers/HSC_ST_english_starters.jpg?t=1645997240972
        item.RutaThumbnails = item.RutaThumbnails.includes("?t=") ? item.RutaThumbnails : `${this.api.url}/covers/${item.RutaThumbnails}?t=${timestamp}`;
        item.Icono = `${this.api.url}/covers/iconos/${item.NombreArchivo}.svg?t=${timestamp}`;
      }

      if (this.platform.is('cordova')) {
        this.existeLibro(directory,'Libro'+ item.Id).then(() =>{
          //item.opacity= 1;
          /*if(item.descargado=="no")
              throw new Error("El libro no esta descargado");*/

          item.descarga = "none";
          item.flecha= "none";
        }).catch(() =>{
          //item.opacity= 0.2;
          //item.descargado="no";
          //item.descarga = "block";
          //item.flecha= "block";
        });
      }
    });
  }

  visualizarLibro() {
    //modusecho.echo(['dsfadsf','1',"Lbs"]);
  }
    //Funcion para desplegar la respuesta cuando es satisfactorio
  successCallback(message){
      alert(message);
  }

  getTipoUsuario() {
    const tipo=this.globalServicies.getKeyToken("tipo");
    
    return tipo;
  }

  async eliminarLibro(item) {
    return;
    console.log(item);
    const directory = this.file.dataDirectory + "books2020/";

    /*this.file.removeRecursively(directory,"Libro" + item.Id).then(()=>{
        alert("Libro eliminado");
    }).catch((error)=>{
      console.log(error);
    });*/

    this.file.removeFile(directory + "Libro" + item.Id,"index.html").then(() => {
      alert("IndexEliminado");
    }).catch((error)=>{
      console.log(error);
    });
  }

  async openBook(item){
    const { Browser } = Plugins;

    if(item.status=="descargando")
      return;

    console.log("openBook");
    item.status="descargando";

    if (this.platform.is('cordova')) {
        this.verificarLibro(item);
    } else {    
      const date = new Date();
      const timestamp = date.getTime();

      item.status="terminado";
      window.open('https://desktop.alfalbs.app/books/' + item.NombreArchivo + '/index.html?t=' + timestamp);
      //window.open('../books/' + item.NombreArchivo + '/index.html');
    }
  }

  //Verifica si el existen el libro en el alamacenamiento
  verificarLibro(item){
    const directory = this.file.dataDirectory + "books2020/";
    this.token=localStorage.getItem('USER_INFO');
    
    item.flecha="none";

    this.existeDirectorio(directory,'Libro'+ item.Id,item).then(_ =>{
        //Verifica conexion con el servidor
        const status = this.webSocket.getStatusSocket() == 1 ? true : false;
        item.status="terminado";

        if(status=== false) {
          (<any>window).modusecho.echo([directory + 'Libro'+ item.Id, item.Id ,"Lbs",this.token]);
        }
        else {
          this.buscarActualizaciones(item).then(data => {
            if(parseInt(data["version"]) > parseInt(item.Version))
            {
                item.spinner="block";
                item.descarga="block";
                item.progreso=0;
                this.download(data["url"] + "/" + item.Version,item,data["version"],"update");
            }
            else 
              (<any>window).modusecho.echo([directory + 'Libro'+ item.Id, item.Id ,"Lbs",this.token]);
          }).catch(() => {
              //En caso de error abre el libro;
              (<any>window).modusecho.echo([directory + 'Libro'+ item.Id, item.Id ,"Lbs",this.token]);
          });
        } 
        //console.log(this.webview.convertFileSrc(directory + 'Libro' + item.id + "/index.html"));
    }).catch(err => {
        console.log(err);
        //alert(err);
    });
  }

  existeLibro(directory,path){
    var promise = new Promise((resolve, reject) => {
      //this.file.checkDir(directory,path).then(_ =>{
      //console.log(directory + path + "/");
      this.file.checkFile(directory + path + "/","index.html").then(_ =>{
          resolve("ok");
      }).catch(err => {
          reject();
      });
    });

    return promise;
  }

  existeDirectorio(directory,path,item){
    var promise = new Promise((resolve, reject) => {
      //this.file.checkDir(directory,path).then(_ =>{
      this.file.checkFile(directory + path + "/","index.html").then(_ =>{
          /*if(item.descargado=="no")
              throw new Error("El libro no esta descargado");*/
          
          if(item.descargado=="no") {
            //Solicita la url de descarga
            item.descarga = "block";
            item.spinner="block";
            this.booksService.getBook(item.Id).subscribe(data => {
              this.download(data["url"],item,data["version"],"install");
              reject();
            },err =>{
              
            });
          } else {  
            resolve("ok");
          }
      }).catch(err => {
          item.spinner="block";

          if(item.descargado=="si"){
            item.descargado="no";
            item.descarga = "block";
            //item.flecha= "block";
          }
          //Solicita la url de descarga
          this.booksService.getBook(item.Id).subscribe(data => {
            this.download(data["url"],item,data["version"],"install");
            reject();
          },err =>{
            //reinicia el estado de la descarga
            item.spinner="none";
            item.descarga="block";
            item.status="terminado";
            item.flecha= "block";
            item.progreso=0;
            item.descargado="no";
          });
      });
    });

    return promise;
  }

  buscarActualizaciones(item) {
    const directory = this.file.dataDirectory + "books2020/";

    var promise = new Promise((resolve, reject) => { 
      this.booksService.getBook(item.Id).subscribe(data => {
          resolve(data);
      },err =>{
        reject();
        //reinicia el estado de la descarga
        /*item.spinner="none";
        item.descarga="block";
        item.status="terminado";
        item.flecha= "block";
        item.progreso=0;
        item.descargado="no";*/
      });
    });

    return promise;
  }

  download(url,item,version,tipo) {
    const fileTransfer: FileTransferObject = this.transfer.create();

    const nameFile ='Libro'+ item.Id + '.zip';
    const directory = this.file.dataDirectory + "books2020/";
    
    //this.file.dataDirectory
    //item.display="block";
    //this.file.externalDataDirectory
    item.spinner="none";

    //Descarga libro
    fileTransfer.download(url, directory + nameFile).then(entry => {
      item.spinner="block";

      //Descomprime libro

      //,(progress) => console.log('Unzipping, ' + Math.round((progress.loaded / progress.total) * 100) + '%')
      return this.zip.unzip(entry.toURL(), directory + 'Libro'+ item.Id);
    })
    .then(result =>{
      if(result === 0) { console.log('SUCCESS'); }
      if(result === -1) { console.log('FAILED'); }

      //Elimina zip para ahorrar espacio
      return this.file.removeFile(directory,nameFile);
    })
    .then( data =>{

      //item.display="none";
      //item.opacity=1;
      item.spinner="none";
      item.descarga="none";
      item.status="terminado";
      item.descargado="si";
      item.progreso=0;
      item.Version=version;

      //Obtiene el storage actual
      this.storage.get(this.pathStorage).then((data)=> {
        const index = data.findIndex(x => x.Id==item.Id);
        data[index] = item;


        this.storage.set(this.pathStorage,data).then(() => {

        });

      });

     
    })
    .catch(err => {
      /*console.error(err);
      alert(err);*/
      alert("Error con la conexión, por favor intente descargar de nuevo");
      
      if(tipo=="install")
      {
        //reinicia el estado de la descarga
        item.spinner="none";
        item.descarga="block";
        item.status="pendiente";
        item.flecha= "block";
        item.progreso=0;
        item.descargado="no";

        const circleP=this.ArrayCircleProgress.toArray().find(x => x.item.Id===item.Id);
        circleP.restartProgress();

        /*this.storage.set(this.pathStorage,this.libros).then( () => {
          console.log("guardo libros");
        });*/
        
        //Obtiene el storage actual
        this.storage.get(this.pathStorage).then((data)=> {
          const index = data.findIndex(x => x.Id==item.Id);
          data[index] = item;

          this.storage.set(this.pathStorage,data).then(() => {

          });
        });
      }
    });

    fileTransfer.onProgress(progress => {

      item.progreso = Math.round(100 *progress.loaded / progress.total);
      const circleP=this.ArrayCircleProgress.toArray().find(x => x.item.Id===item.Id);
      circleP.progress(item.progreso);

    });
  }

  paginate(array, pageSize, pageNumber) {
    //console.log(array);
    return array.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
  }

  getImages(event) {
  
    this.arrayImg = this.paginate(this.libros,this.totalXPagina,this.pageNumber);

    for(let i = 0; i < this.arrayImg.length; i++){
        this.dataList.push(this.arrayImg[i]);
       // this.msnry.appended(this.imgMansory.toArray()[i].nativeElement);
    }

    this.pageNumber +=1;


    /*for (let i = this.index; i < this.tope; i++) {
      this.dataList.push({
        src: this.LstImagenes[i].src,
        height: this.LstImagenes[i].height,
      });
    }*/

  }

  async loadData(event){   

    await this.getImages(event);

    //this.updateAutoHeightSlider.emit();
    //Hide Infinite List Loader on Complete
    this.updateAutoHeightSlider.emit();
    event.target.complete();

    // App logic to determine if all data is loaded
    // and disable the infinite scroll
    if (this.dataList.length >= this.libros.length) {
      event.target.disabled = true;
      this.updateAutoHeightSlider.emit();
    }
  }

  cargarMansoryPrimeraVez(e){
    if(this.banderaImagen==1){
		
      let elem = document.querySelector(".grid-containermasonry");
      this.msnry = new Masonry(elem, {
         // options
         itemSelector: ".grid-itemmasonry",
         gutter: 9,
         isFitWidth: true
 
      //   percentPosition: true
         
      });
      this.banderaImagen++;
      this.updateAutoHeightSlider.emit();
     }
  }

 

}
