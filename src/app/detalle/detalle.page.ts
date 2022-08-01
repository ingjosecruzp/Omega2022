import { Component, OnInit, Input, ChangeDetectorRef, ApplicationRef, ViewChild } from '@angular/core';
import { ModalController, LoadingController, Platform, ToastController, AlertController, IonSlides, IonContent, ActionSheetController } from '@ionic/angular';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { File,FileEntry } from '@ionic-native/file/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { Plugins } from '@capacitor/core';
import { apiBase } from '../api/apiBase';
import { async } from '@angular/core/testing';
import { AlumnosService } from '../api/alumnos.service';
import { FormGroup, FormBuilder,Validators  } from '@angular/forms';
import { DownloadFileService } from '../services/download-file.service';
import { EvidenciasService } from '../api/evidencias.service';
import { GlobalService } from '../services/global.service';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { TareasService } from '../api/tareas.service';
import { UsuariosService } from '../api/usuarios.service';


@Component({
  selector: 'app-detalle',
  templateUrl: './detalle.page.html',
  styleUrls: ['./detalle.page.scss'],
})
export class DetallePage implements OnInit {
  @Input() item;
  loading: any;
  segmentaActivated: any = 'instrucciones';
  private mutationObserver: MutationObserver;
  LstAlumnos: any[] = [];
  LstFiles: any[] = [];
  LstEvidencias: any[] = [];
  LstComentarios: any[] = [];
  public FrmItem: FormGroup;
  private files: any;
  public submitAttempt: boolean = false;
  comentario: any;
  comentarioNuevo: any;
  public objComentario : any;
  public objComentarioApi : any;
  tipoUsuario: any;
  slideOpts = {
    autoHeight: true
  };
  public user = {
    Id : '',
    NombreCompleto : '',
    Nombre : '',
    ApellidoPaterno : '',
    Grado  : '',
    Grupo : '',
    Escolaridad: '',
    GradoIngles: '',
    GrupoIngles: '',
    Usuario: '',
    Tipo:'',
    PlayerId: ''
  };
  @ViewChild('slider', {static: false}) slider: IonSlides;
  usuarioSeleccionado: any="Seleccione un alumno";
  showBackButton:boolean = false;
  private imgBlob: any;
  fotoActviva: boolean = false;
  spinnerShow:boolean = false;
  spinnerComentarios:boolean = false;
  eliminando: boolean=false;
  totalEntregadas: number = 0;
  totalPendientes: number = 0;
  mensaje: any = "Enviar"

  constructor(private modalCtrl: ModalController,private api: apiBase,private loadingController: LoadingController,
              private platform: Platform,private transfer: FileTransfer,private file: File,private fileOpener: FileOpener,
              private apiAlumnos: AlumnosService,public toastController: ToastController,private cd:ChangeDetectorRef,
              private fileClound: DownloadFileService,private formBuilder: FormBuilder, private applicationRef: ApplicationRef,
              private alertCtrl: AlertController,private apiEvidencias: EvidenciasService,private globalServicies: GlobalService,
              private camera: Camera,private apiTareas: TareasService, private apiUsuarios: UsuariosService, public actionSheetController: ActionSheetController) { 

                this.FrmItem = formBuilder.group({
                  Image: [null, Validators.compose([])]
                });
  }

  ngOnInit() {

    this.tipoUsuario=this.globalServicies.getKeyToken("tipo");
    if(this.item.Image != undefined)
    {
      console.log(this.item.Image.includes('http://'));
      this.item.image = this.item.Image.includes('http://') == true ?  this.item.Image : `${this.api.url}/images/${this.item.Image}`;
    }
    
    if(this.tipoUsuario=="Alumno")
    {
      this.spinnerShow=true;
    }
  }

  async ionViewDidEnter() {
    let index;
    
    if(this.item.Escolaridad=="Kinder") index=1;
    else if(this.item.Escolaridad=="Primaria") index=2;
    else if(this.item.Escolaridad=="Secundaria") index=3;
    else if(this.item.Escolaridad=="Preparatoria") index=4;

    if(this.tipoUsuario=="Profesor")
    {
      this.loading =await this.loadingController.create({
        //cssClass: 'my-custom-class',
        message: 'Cargando Alumnos...',
        duration: 120000
      });

      this.loading.present();
      
  
      this.LstEvidencias = await this.apiEvidencias.getEvidenciasAlumnos(this.item.Id,this.item.MateriaId).toPromise();
      console.log(this.LstEvidencias);

      if(this.item.GrupoIngles=="SI") {
        this.LstAlumnos = await this.apiAlumnos.getAlumnosEscolaridadIngles(index,this.item.Grado,this.item.Grupo).toPromise();
      } else {
        this.LstAlumnos= await this.apiAlumnos.getAlumnosEscolaridad(index,this.item.Grado,this.item.Grupo).toPromise();
      }

      this.LstAlumnos.forEach(element => {
        //console.log(element);
        const userD = this.LstEvidencias.filter(l => l.UsuarioId == element.Id);
        if(userD.length > 0) {
              element.status ="Entregada"
              this.totalEntregadas +=1;
        } else {
              element.status ="Pendiente"
              this.totalPendientes +=1;
        }
      });

      this.loadingController.dismiss();
    }
    else {
      
      this.slider.lockSwipeToNext(true);
      this.slider.lockSwipeToPrev(true);

      this.apiTareas.updateAcceso(this.item.Id).toPromise();
      if(this.item.Tareasusuarios.length > 0)
        this.item.Tareasusuarios[0].Visto='SI';

      this.cargarEvidencia();
      this.cargarComentarios();
    }
    

  }

  async cargarEvidencia(){
   
    console.log("cargando evidencia")
      this.apiEvidencias.getEvidenciasTarea(this.item.Id).subscribe(data => {
          if(data.length > 0) {
            this.LstFiles = data;
            this.comentario = data[0].Descripcion != undefined ? data[0].Descripcion : null;
            this.mensaje = "Editar"
          } else {
            this.mensaje = "Enviar";
          }
          this.spinnerShow=false;
      });
  }

  async cargarComentarios(){

     /* nos traemos informacion completa del usuario*/
     const UsuarioId =this.globalServicies.getKeyToken('id');
     this.apiUsuarios.getUsuario(UsuarioId).subscribe(data => {
      console.log('idataaaaaaa',data)
        this.user.Id = data["Id"];
        this.user.NombreCompleto = data["NombreCompleto"];
        this.user.Nombre = data["Nombre"];
        this.user.ApellidoPaterno = data["ApellidoPaterno"];
        this.user.Grado = data["Grado"];
        this.user.Grupo = data["Grupo"];
        this.user.Escolaridad = data["Escolaridad"];
        this.user.GradoIngles = data["GradoIngles"];
        this.user.GrupoIngles = data["GrupoIngles"];
        this.user.Usuario = data["Usuario"];
        this.user.Tipo = data["Tipo"];
     });
 

    console.log("cargando comentario")
    let usuarioEvidencia="";
    console.log(this.tipoUsuario);
    if(this.tipoUsuario=="Profesor") usuarioEvidencia = this.usuarioSeleccionado.Id; else usuarioEvidencia = this.item.Tareasusuarios[0].UsuarioId;
    console.log(usuarioEvidencia);
      this.apiEvidencias.getEvidenciasComentarios(this.item.Id,usuarioEvidencia).subscribe(data => {
        this.LstComentarios=data;
        this.spinnerComentarios=true;
        console.log(this.LstComentarios)
      });
  }


  buscarEvidencia() {

  }

  async enviarMensaje() {

   if (this.comentarioNuevo == '')return;

   console.log(this.comentarioNuevo);
   if(this.LstFiles.length==0 && (this.comentarioNuevo!= '' && this.comentarioNuevo!= null)) {
     const alertTerminado = await this.alertCtrl.create({
       header: 'Evidencia',
       backdropDismiss: false,
       message: 'No puedes enviar un comentario sin antes adjuntar una evidencia',
       buttons: ["Aceptar"]
     });

     await alertTerminado.present();
     return; 
   }

   console.log("cargando comentario")
   let usuarioEvidencia="";
   console.log(this.tipoUsuario);
   if(this.tipoUsuario=="Profesor") usuarioEvidencia = this.usuarioSeleccionado.Id; else usuarioEvidencia = this.item.Tareasusuarios[0].UsuarioId;
    console.log("item" + this.item);
    this.objComentario = {
      Comentario : this.comentarioNuevo,
      FechaComentario :  Date.now().toString(),
      TipoComentario : this.tipoUsuario,
      Usuario : { NombreCompleto : this.user.Nombre + ' ' +  this.user.ApellidoPaterno }
    }

    this.objComentarioApi = {
      UsuarioId : usuarioEvidencia,
      TareaId : this.item.Id,
      MateriaId: this.item.MateriaId,
      Comentario : this.comentarioNuevo
    }

    const tareaUpload = await this.apiEvidencias.saveComentarios(this.objComentarioApi).toPromise(); //manda agregar el comentario y se espera
   // this.LstComentarios.push(this.objComentario); //para pintar la vista se agrega a la lista
    this.LstComentarios.unshift(this.objComentario);//para pintar la vista se agrega a la lista
    this.applicationRef.tick();
    this.comentarioNuevo = '';

  }

  back() {
    this.slider.slidePrev();
  }

  async presentActionSheet(item,estadoAction) {
    const actionSheet = await this.actionSheetController.create({
      mode: 'ios', 
      header: 'Opciones',
      cssClass: estadoAction,
      buttons: [
        {
          text: 'Eliminar',
          icon: 'trash-bin',
          cssClass: 'my-custom-class', 
          
          handler: () => {
            this.deleteComentario(item);
          },
        }],
    });
    await actionSheet.present();

    const { role } = await actionSheet.onDidDismiss();
    console.log('onDidDismiss resolved with role', role);
  }

  ionSlideDidChange() {
    console.log("ionSlideDidChange");
    this.slider.getActiveIndex().then(index => {
       console.log(index);
       if(index > 0)
         this.showBackButton=true;
        else
          this.showBackButton=false;

          if(index == 2) 
         this.cargarComentarios();
 
    })
  }

  async deleteComentario(item){
     
    await this.apiEvidencias.deleteComentario(item.Id).toPromise();
    this.LstComentarios = this.LstComentarios.filter(obj => obj !== item);
  }

  async verEvidenciaAlumno(evidencia) {
    this.usuarioSeleccionado = evidencia;
    this.LstFiles=await this.apiEvidencias.getEvidenciasAlumnoProfesor(evidencia.Id,this.item.Id).toPromise();
    try {
      this.comentario = this.LstFiles[0].Descripcion;
    } 
    catch (error) {
      //console.log(error);
    }
    this.slider.slideNext();
  }

  verAlumnos(){
    this.slider.slideNext();
  }

  async openFile(item) {
    setTimeout(async () => {
        this.loading =await this.loadingController.create({
          //cssClass: 'my-custom-class',
          message: 'Cargando...',
          duration: 120000
        });
    
        this.loading.present();
        
        console.log(item);
        const { Browser } = Plugins;
        if (this.platform.is('cordova')) {
          console.log(this.item.ImageUser);
          this.download(`${this.api.url}/images/${item.Image}`,this.item.ImageUser);
          //this.download(`http://192.168.0.16:5000/resources/${item.PathRecurso}`);
        } else {
          await Browser.open({ url: `${this.api.url}/images/${item.Image}` });
          this.loadingController.dismiss();
        }
    }, 300);
  }

  async openEvidencia(item){
    setTimeout(async () => {
      this.loading =await this.loadingController.create({
        //cssClass: 'my-custom-class',
        message: 'Cargando...',
        duration: 120000
      });
  
      this.loading.present();
      
      console.log(item);
      const { Browser } = Plugins;
      if (this.platform.is('cordova')) {
        //Valida si el achivo se encuntra en la carpeta temporal de recursos
        if(item.CampusId===undefined) {
          this.download(`${this.api.url}/resources/temp/${item.PathRecurso}`,item.PathRecursoUser);
          //this.download(`http://192.168.137.1:5000/resources/temp/${item.PathRecurso}`,item.PathRecursoUser);
        }
        else {
          this.download(`${this.api.url}/resources/${item.PathRecurso}`,item.PathRecursoUser);
          //this.download(`http://192.168.137.1:5000/resources/${item.PathRecurso}`,item.PathRecursoUser);
        }
      } else {
        //Valida si el achivo se encuntra en la carpeta temporal de recursos
        if(item.CampusId===undefined)
          await Browser.open({ url: `${this.api.url}/resources/temp/${item.PathRecurso}`});
        else
          await Browser.open({ url: `${this.api.url}/resources/${item.PathRecurso}`});
        this.loadingController.dismiss();
      }
    }, 300);
  }

  download(url,NameFile) {
    console.log(url);
    console.log(NameFile);
    const fileTransfer: FileTransferObject = this.transfer.create();
    const extension = url.split('/').pop(); 
    const pathDownload = this.platform.is("android") ? this.file.dataDirectory  :  this.file.dataDirectory;
    //const pathDownload = this.platform.is("android") ? this.file.externalDataDirectory :  this.file.documentsDirectory;
    //const pathDownload = this.platform.is("android") ? this.file.externalRootDirectory + "download/" :  this.file.documentsDirectory;

    fileTransfer.download(url, pathDownload + NameFile).then((entry) => {
        console.log('download complete: ' + entry.toURL());

        let files = entry as FileEntry;
        files.file(success =>{
            //success.name;

            this.fileOpener.open(pathDownload + NameFile, success.type)
            .then(() => { console.log('File is opened'); this.loading.dismiss(); })
            .catch(e => console.log('Error opening file', e));

        });
    }, (error) => {
      // handle error
      console.log(error);
      alert(error.exception);
      this.loadingController.dismiss();
    });

  }

  
  async upload(nameFile){
    console.log("enviar");

    this.resetProgress();

    let file= {
      PathRecursoUser: nameFile,
      PathRecurso: "",
      progress: 0,
      display: true,
      MateriaId: this.item.MateriaId,
      TareaId: this.item.Id,
      Titulo: this.item.Titulo
    };
  
    this.LstFiles.push(file);
    this.applicationRef.tick();

    setTimeout( async () => {
      const payload = new FormData();
      //payload.append('ItemUpload', this.files, this.files.PathRecursoUser);

      if(this.fotoActviva == false) {
        payload.append('ItemUpload', this.files, file.PathRecursoUser);
      }
      else {
        payload.append('ItemUpload', this.imgBlob, file.PathRecursoUser);
        this.fotoActviva=false;
      }
  
      let a= this.fileClound.upload(payload);
      const result = await a.toPromise();

      this.fileClound.uploadProgress.subscribe(progress => {
        let fileD = this.LstFiles.filter(l => l.PathRecursoUser == nameFile);
        if(fileD.length > 0) {
          if(fileD[0].progress < 100)
          {
            fileD[0].progress = progress;
            setTimeout(() => {
              fileD[0].display = false;
            }, 500);
          }

          if(fileD[0].progress==100)
          {
            fileD[0].PathRecurso = result.file;
          }
        }
      });   

    }, 200);

  }

  async enviar() {

    if(this.eliminando==true) return;

    let fileD = this.LstFiles.filter(l => l.progress <100);
    if(fileD.length > 0)
        return;

    console.log(this.comentario);
    /*if(this.LstFiles.length==0 && (this.comentario!= '' && this.comentario!= null)) {
      const alertTerminado = await this.alertCtrl.create({
        header: 'Evidencia',
        backdropDismiss: false,
        message: 'No puedes enviar un comentario sin antes adjuntar una evidencia',
        buttons: ["Aceptar"]
      });

      await alertTerminado.present();
      return; 
    }*/

    const alertTerminado = await this.alertCtrl.create({
      header: 'Evidencia',
      backdropDismiss: false,
      message: this.mensaje=='Enviar' ? '¿Estás seguro de enviar la evidencia de la tarea ' + this.item.Titulo + '?' : '¿Estás seguro de editar la evidencia de la tarea ' + this.item.Titulo + '?',
      buttons: [
        {
           text: 'No', handler: () =>  console.log("no")
        },
        {
          text: 'Enviar', handler: () => { 
            this.guardar();
            this.enviarMensaje();
          }
        }
      ]
    });

    await alertTerminado.present();

  }

  async guardar(){
    try {
      console.log(this.LstFiles);
    
      this.submitAttempt = true;
  
      const loading = await this.loadingController.create({
        message: 'Guardando...'
      });
  
      await loading.present();
  
      this.LstFiles.forEach(element => element.Descripcion=this.comentario);
  
      //if(this.item.Id == 0)
        await this.apiEvidencias.save(this.item.Id,this.LstFiles).toPromise();
      /*else
        await this.apiRecursos.update(payload).toPromise();*/
  
      //this.banderaEdito=true;
      this.submitAttempt = false;
  
      this.loadingController.dismiss();
  
      const alertTerminado = await this.alertCtrl.create({
        header: this.mensaje=='Enviar' ? 'Evidencia enviada con éxito' : 'Evidencia editada con éxito' ,
        backdropDismiss: false,
        message: this.mensaje=='Enviar' ? 'Se envío la evidencia ' + this.item.Titulo : 'Se edito la evidencia ' + this.item.Titulo,
        buttons: [
          {
             text: 'Aceptar', handler: () =>  this.modalCtrl.dismiss()
          }
        ]
      });
  
      await alertTerminado.present();
    }
    catch(err) {
      this.loadingController.dismiss();

      const alert = await this.alertCtrl.create({
        header: 'LBS Plus',
        //subHeader: 'Subtitle',
        message: "Error con la conexión hacia el servidor, inténtelo de nuevo",
        buttons: ['Aceptar']
      });
  
      await alert.present();
    }
  }

  removeAttach(event,item){
    console.log(item);
    this.eliminando=true;
    event.stopPropagation();
    setTimeout(() => {
      const index = this.LstFiles.findIndex(l => l.PathRecurso == item.PathRecurso);
      this.LstFiles.splice(index,1); 
      this.applicationRef.tick();
      this.eliminando=false;
    }, 100);
    
  }

  resetProgress(){
    this.fileClound.uploadProgress.next(0);
    this.fileClound.downloadProgress.next(0);
  }

  closeModal (){
      console.log("cerar");
      this.modalCtrl.dismiss();
  }

  onFileChange($event: any) {
    if( $event.target.files &&  $event.target.files.length) {
      /*console.log($event.target.files[0].name);
      console.log($event.target.files[0].type);*/ 


      //No te permite subir dos archivos con el mismo nombre
      let fileD = this.LstFiles.filter(l => l.Name == $event.target.files[0].name);
      if(fileD.length > 0) return;

      const re = new RegExp('(application|text)\/(x-msdownload|javascript|x-pkcs12|html)', 'g');   

      //No se permite subir archivo con extesione exe;
      if(re.test($event.target.files[0].type)==true) {
        this.presentToast("No se permite subir este tipo de archivo");
        //this.texto_adjuntar_portada = 'Foto de Portada';
        return;
      }

      if($event.target.files[0].size > 20000000) {
        this.presentToast("No está permitido subir archivos mayores a 20mb");
        return;
      }


      //this.texto_adjuntar_portada = 'Recurso Seleccionado';

      this.FrmItem.patchValue({
        Image: $event.target.files[0]
      });

      this.files = $event.target.files[0];
      this.upload($event.target.files[0].name);
      // need to run CD since file load runs outside of zone
      this.cd.markForCheck();
    }
  }

  async presentToast(text) {
    const toast = await this.toastController.create({
      message: text,
      color: "dark",
      mode: "ios",
      cssClass : "toastCenter",
      duration: 3000
    });

    toast.present();
  }

  /***Logica fotografia ******/
  tomarFoto() {
    console.log("tomarFoto");
    
    const options: CameraOptions = {
      quality: 70,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    };

    this.camera.getPicture(options).then((imageData) => {
      //console.log(imageData);
      this.startUpload(imageData);
     }, (err) => {
      // Handle error
     });

  }

  startUpload(imgEntry) {
    this.file.resolveLocalFilesystemUrl(imgEntry)
        .then(entry => {
          (<FileEntry>entry).file(file => this.readFile(file));
        })
        .catch(err => {
            alert('Error while reading file.');
        });
  }

  readFile(file: any) {
    const reader = new FileReader();
    reader.onload = () => {
        this.imgBlob = new Blob([reader.result], {
            type: file.type
        });

        this.fotoActviva = true;
        const date = new Date();
        const timestamp = date.getTime();

        this.upload(timestamp + '.jpg')
        //console.log(this.files);
    };

    reader.readAsArrayBuffer(file);
   }

  /************************ */

}

