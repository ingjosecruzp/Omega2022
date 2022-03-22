import { EventEmitter,Injectable } from '@angular/core';
import { LoadingController, Platform } from '@ionic/angular';
import { isDevMode } from '@angular/core';
import { GlobalService } from './global.service';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/file/ngx';
import { apiBase } from '../api/apiBase';
import { Storage } from '@ionic/storage';
import { PortadasService } from '../api/portadas.service'
import { Zip } from '@ionic-native/zip/ngx';
import { BooksService } from './books.service';
import { WebView } from '@ionic-native/ionic-webview/ngx';


@Injectable({
  providedIn: 'root'
})
export class ActPortadasService {

  procesoFinalizado = new EventEmitter<any>();

  loading: any = undefined;
  promisesDescargas = [];
  libros: any[]=[];
  fileTransfer: FileTransferObject;

  constructor(public platform: Platform,private globalServicies: GlobalService,
              private transfer: FileTransfer,private file: File,private api: apiBase,private storage: Storage,
              private loadingController: LoadingController,private apiPortadas: PortadasService,private zip: Zip,
              private booksService: BooksService,private webview: WebView) {
      this.fileTransfer = this.transfer.create();
      //this.buscarLibros("Todos");
  }

  async limpiarLibros(){
    this.libros = [];
  }

  async buscarLibros(idioma:string) {
    try {
      if(this.libros.length > 0) { 
        if(idioma=="Todos") {
          this.procesoFinalizado.emit(this.libros);
        } else {
          this.procesoFinalizado.emit(this.libros.filter(f => f.Idioma == idioma));
        }
        return;
      }

      console.log("buscalibros");
      const pathStorage = await this.globalServicies.getNameStorage();
      
      const status = await this.connectivityInternet();

      const fileTransfer: FileTransferObject = this.transfer.create();

      let librosLocales = await this.storage.get(pathStorage);
      const date = new Date();
      const timestamp = date.getTime();
      
      if(status==true)  {
        console.info("Con conexion a internet");

        const tipo  = this.getKeyToken('tipo');
        if(librosLocales==null) {

          console.info("Sin libros en data");
          this.cargandoAnimation("Descargando portadas");
          const data = await this.booksService.getBooksGrado().toPromise();

          //Aqui va descargar las portadas
          if(this.platform.is('cordova')) {
            const url = await this.apiPortadas.getPortadasURL(data).toPromise();
            await this.downloadPortadas(url["url"]);
          }
                  
          await Promise.all(data.map(async (element) => { 
            element.descargado="no"
            //element.VersionThumbnailsLocal=0;
            element.VersionThumbnailsLocal = element.VersionThumbnails;
             
            //await this.buscarPortadasIndividual(element,pathStorage,status);
            await this.prepararLibro(element,timestamp);
          }));

          /*if(this.promisesDescargas.length > 0) {
              await this.descargarPortadas(pathStorage);
          }*/
          
          this.libros = data;
          await this.storage.set(pathStorage,data);

          this.loadingController.dismiss();
          
          if(idioma=="Todos") {
            this.procesoFinalizado.emit(this.libros);
          } else {
            this.procesoFinalizado.emit(this.libros.filter(f => f.Idioma == idioma));
          }

          return;

        } else {
          
          console.info("ya tiene libros");
          const data = await this.booksService.getBooksGrado().toPromise();
          
          //Busca si viene algun nuevo libro del servidor
          await Promise.all(data.map(async (element) => {
            const libroD = librosLocales.filter(l => l.Id == element.Id);
            element.descargado="no";
            if(libroD.length == 0)
                librosLocales.push(element);
          }));

          let index=0;

          await Promise.all(librosLocales.map(async(element) => {
            const libroD = data.filter(l => l.Id == element.Id);

            //Solo selecciona los elementos que no se deben eliminar
            if(libroD.length != 0) {
              const libro = librosLocales.filter(l => l.Id == element.Id);
              libro[0].Nombre=libroD[0].Nombre;
              libro[0].NombreArchivo=libroD[0].NombreArchivo;
              libro[0].Idioma=libroD[0].Idioma;
              libro[0].Grados=libroD[0].Grados;
              libro[0].Suffix=libroD[0].Suffix;
              libro[0].Escolaridad=libroD[0].Escolaridad;
              libro[0].RutaThumbnails=libroD[0].RutaThumbnails;
              libro[0].VersionThumbnails=libroD[0].VersionThumbnails;
              libro[0].HeightImg=libroD[0].HeightImg;
              libro[0].AspectRatio=libroD[0].AspectRatio;
              if(libro[0].VersionThumbnailsLocal==undefined)
                  libro[0].VersionThumbnailsLocal=0;
              this.libros.push(libro[0]);

              await this.buscarPortadasIndividual(element,pathStorage,status);
              await this.prepararLibro(element,timestamp);
            }  
            index++;
          }));

          if(this.promisesDescargas.length > 0) 
              await this.descargarPortadas(pathStorage);

          //Ordena por grados los libros antes de ser guardados.
          await this.storage.set(pathStorage,this.libros.sort((a, b) => a.Grados.localeCompare(b.Grados)));
          
          console.log("dataLista");
          //return this.libros;
          if(idioma=="Todos") {
            this.procesoFinalizado.emit(this.libros);
          } else {
            this.procesoFinalizado.emit(this.libros.filter(f => f.Idioma == idioma));
          }
          return;

        } 
      } else {
        console.log("sin conexion a internet");
        this.libros = librosLocales;
        
        //return this.libros;
        if(idioma=="Todos") {
          this.procesoFinalizado.emit(this.libros);
        } else {
          this.procesoFinalizado.emit(this.libros.filter(f => f.Idioma == idioma));
        }
        return;
      }
      
      
    } catch (error) {
      //alert(error);
      this.loadingController.dismiss();
      console.error(error);
    }
  }

  async prepararLibro(libro,timestamp) {
    return new Promise(async(resolve,reject) => {
        
        libro.progreso=0;
        libro.display="none";
        libro.spinner="none";
        libro.status="pendiente";

        if(this.platform.is('cordova')) { 

          if(libro.RutaThumbnails.includes("?t=")){ 
            let NombreCover=libro.RutaThumbnails.split("/");
  
            let urlCover = this.webview.convertFileSrc(`${this.file.dataDirectory}covers/${NombreCover[NombreCover.length-1].split("?")[0]}`);
            let pathIcono = this.webview.convertFileSrc(`${this.file.dataDirectory}covers/iconos/${libro.NombreArchivo}.svg`);
            
            if(urlCover.startsWith("undefined/") ) {
              urlCover = urlCover.replace("undefined/", "http://localhost/");  
              pathIcono = pathIcono.replace("undefined/", "http://localhost/");  
            }
            
            libro.RutaThumbnails = `${urlCover}?t=${timestamp}`;
            libro.Icono=`${pathIcono}?t=${timestamp}`;
          }
          else{
            let urlCover = this.webview.convertFileSrc(`${this.file.dataDirectory}covers/${libro.RutaThumbnails}`);
            let pathIcono = this.webview.convertFileSrc(`${this.file.dataDirectory}covers/iconos/${libro.NombreArchivo}.svg`);

            if(urlCover.startsWith("undefined/") ) {
              urlCover = urlCover.replace("undefined/", "http://localhost/");  
              pathIcono = pathIcono.replace("undefined/", "http://localhost/");  
            }
  
            libro.RutaThumbnails=`${urlCover}?t=${timestamp}`;
            libro.Icono=`${pathIcono}?t=${timestamp}`;
          }
        }
        else {
          libro.RutaThumbnails = libro.RutaThumbnails.includes("?t=") ? libro.RutaThumbnails : `${this.api.url}/covers/${libro.RutaThumbnails}?t=${timestamp}`;
          libro.Icono = `${this.api.url}/covers/iconos/${libro.NombreArchivo}.svg?t=${timestamp}`;
        }

        resolve('');

    }); 
  }

  async descargarPortadas (pathStorage) {
    return new Promise(async(resolve,reject) => {
        this.cargandoAnimation("Actualizando portadas");

        //promises.map(p => p.catch(e => e)); 
        
        await Promise.all(this.promisesDescargas).then(items =>{
            this.loadingController.dismiss();
            console.log("portadas descargadas");
            resolve("");      
        }).catch(err => { 
            console.warn(err);
            this.loadingController.dismiss();
            reject("Uno de los libros presenta un inconveniente, favor de comunicarte con el área de soporte");
        });
    });
  }

  async buscarPortadasIndividual(libro,pathStorage,statusInternet){
    return new Promise(async (resolve,reject) =>{
      if(statusInternet=== false) {
        resolve("");
        return;
      }

      if(!this.platform.is('cordova')) {
        resolve("");
        return;
      }

      const directory = this.file.dataDirectory + "covers/";

      //const url = isDevMode()==true ? `${this.api.url.toString().replace('https://','http://').replace('5001','5000')}/covers/`  : `${this.api.url}/covers/`;
      const url =  `${this.api.url}/covers/`;

      if(parseInt(libro.VersionThumbnails) > parseInt(libro.VersionThumbnailsLocal)) {

        this.promisesDescargas.push(this.fileTransfer.download(url + libro.RutaThumbnails, directory + libro.RutaThumbnails).then(()=>{
          //console.log(libro);
          libro.VersionThumbnailsLocal = libro.VersionThumbnails;
        }).catch((err) => {
          libro.VersionThumbnailsLocal = 0;
          console.warn(err);
          console.log(libro);
        }));

        //Descarga los circulos
        this.promisesDescargas.push(this.fileTransfer.download(`${url}iconos/${libro.NombreArchivo}.svg`, `${directory}iconos/${libro.NombreArchivo}.svg`).then(()=>{
          //console.log(libro);
          libro.VersionThumbnailsLocal = libro.VersionThumbnails;
        }).catch((err) => {
          libro.VersionThumbnailsLocal = 0;
          console.warn(err);
          console.log(libro);
        }));

        //Actuliza la version local con la version remota
        //Si se comenta esta linea la actulizacion va entrar siempre y en combinacion con indexdb es una manera de debugear desde el celular
        

        resolve("");

      }

      resolve("");

    });
  }

  async buscarPortadas(){
    return new Promise(async (resolve,reject) =>{

        //Verifica conexion con el servidor
        const status = await this.connectivityInternet();
        
        if(status=== false) {
          resolve("");
          return;
        }

        if(!this.platform.is('cordova')) {
          resolve("");
          return;
        }

        const pathStorage = await this.globalServicies.getNameStorage();

        const fileTransfer: FileTransferObject = this.transfer.create();
        const directory = this.file.dataDirectory + "covers/";
        
        
        const url = isDevMode()==true ? `${this.api.url.toString().replace('https://','http://').replace('5001','5000')}/covers/`  : `${this.api.url}/covers/`;

        let promises = [];
        this.storage.get(pathStorage).then(async (librosLocales) => { 

            librosLocales.forEach(element => {
              if(parseInt(element.VersionThumbnails) > parseInt(element.VersionThumbnailsLocal)) {

                promises.push(fileTransfer.download(url + element.RutaThumbnails, directory + element.RutaThumbnails).catch(console.warn));

                //Descarga los circulos
                promises.push(fileTransfer.download(`${url}/iconos/${element.NombreArchivo}.svg`, `${directory}iconos/${element.NombreArchivo}.svg`).catch(console.warn));

                //Actuliza la version local con la version remota
                //Si se comenta esta linea la actulizacion va entrar siempre y en combinacion con indexdb es una manera de debugear desde el celular
                element.VersionThumbnailsLocal = element.VersionThumbnails;

              }
            });
            
            if(promises.length > 0)
            {
              this.cargandoAnimation("Actualizando portadas");

              //promises.map(p => p.catch(e => e)); 
              
              Promise.all(promises).then(items =>{
                this.storage.set(pathStorage,librosLocales).then((data)=> {
                    resolve("");      
                });
              }).catch(err => { 
                  console.warn(err);
                  reject("Uno de los libros presenta un inconveniente, favor de comunicarte con el área de soporte");
              });
            }
            else {
                resolve("");          
            }
        });
    });
  }

  async buscarFondosTemas() {
       /*
        Este servicio se utilizaba anteriormente para actulaizar todas las portadas, se dejo
        solo para actulizar los fondos
       */
      return new Promise(async (resolve,reject) =>{ 
        const status = await this.connectivityInternet();

        if(status=== false) {
          resolve({ifUpdate:false});
          return;
        }

        if(!this.platform.is('cordova')) {
          resolve({ifUpdate:false});
          return;
        }

        const versionPortadas =await this.storage.get("versionPortadas");

        const data =await this.apiPortadas.getPortadasVersion().toPromise();

        if(versionPortadas==null){
          this.download(data["url"],0,data["version"]).then(resolve).catch(reject);
        }
        else{
  
          if(parseInt(data["version"]) > parseInt(versionPortadas)) {
            this.download(data["url"],versionPortadas,data["version"]).then(resolve).catch(reject);
          }
          else {
            resolve({ifUpdate:false});
          }
        }

    });
  }

  async downloadPortadas(url) {
    return new Promise(async (resolve,reject) =>{
      const fileTransfer: FileTransferObject = this.transfer.create();
      const nameFile ='covers.zip';
      const directory = this.file.dataDirectory;

	  console.log("//Inicia Descarga Portadas");
	  console.log(url);
	  console.log(directory);
	  console.log(nameFile);
	  console.log(directory + nameFile);
	
      fileTransfer.download(url, directory + nameFile).catch(entry =>{
        console.log("//Portadas Descargadas");
        
        return this.zip.unzip(entry.toURL(), directory + 'covers');
      }).then(result => {
        console.log("//Portadas Descompromido");
        if(result === 0) { console.log('SUCCESS'); }
        if(result === -1) { console.log('FAILED'); }

        //Elimina zip para ahorrar espacio
        return this.file.removeFile(directory,nameFile);
      }).then(data =>{
        console.log("//Portadas zip eliminado");
        resolve("Terminado");
      }).catch(err => {
        console.log(err);
        /*alert(err);*/
        reject("Error con la conexión, por favor intente descargar de nuevo");
      });

	  fileTransfer.onProgress(progress => {
		const progreso = Math.round(100 *progress.loaded / progress.total);
		console.log("progreso:",progreso)
	  });
    });
  }

  download(url,versionDevice,versionServer) {
    return new Promise(async (resolve,reject) =>{ 
          this.cargandoAnimation("Actualizando fondos");

          const fileTransfer: FileTransferObject = this.transfer.create();

          const nameFile ='covers.zip';
          const directory = this.file.dataDirectory;
          
          //Descarga libro
          fileTransfer.download(url + versionDevice, directory + nameFile).then(entry => {

            //Descomprime libro

            return this.zip.unzip(entry.toURL(), directory + 'covers');
          })
          .then(result =>{

            if(result === 0) { console.log('SUCCESS'); }
            if(result === -1) { console.log('FAILED'); }

            //Elimina zip para ahorrar espacio
            return this.file.removeFile(directory,nameFile);
          })
          .then( data =>{

            //this.changeSVG();

            this.storage.set("versionPortadas",versionServer).then( () => {
                  resolve({ifUpdate:true});
            });
          })
          .catch(err => {
            console.warn(err);
            /*alert(err);*/
            reject("Error con la conexión, por favor intente descargar de nuevo");
          });
    });
  }

  async cargandoAnimation(text) {
    //if(this.loading!= undefined) return;

    this.loading = await this.loadingController.create({
      message: text,
      duration: 60000
    });

    await this.loading.present();
  }

  getKeyToken(key: string): string {

    const jwt = localStorage.getItem('USER_INFO');

    const jwtData = jwt.split('.')[1];
    // let decodedJwtJsonData = window.atob(jwtData);
    const decodedJwtJsonData = decodeURIComponent(escape(window.atob(jwtData)));
    const decodedJwtData = JSON.parse(decodedJwtJsonData);

    const value = decodedJwtData[key];

    return value;
  }

   connectivityInternet() {
    return new Promise(async (resolve,reject) =>{ 

      if (!window || !navigator || !('onLine' in navigator)) return;

      const status = navigator.onLine;

      resolve(status);
    });
  }
}
