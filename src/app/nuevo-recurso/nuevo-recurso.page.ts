import { Component, OnInit, ChangeDetectorRef,ViewChild,ElementRef,Input, Renderer2} from '@angular/core';
import { ModalController, AlertController, PickerController,IonInput, LoadingController, ToastController, IonSelect, IonSelectOption } from '@ionic/angular';
import { FormGroup, FormBuilder,Validators  } from '@angular/forms';
import { TareasService } from '../api/tareas.service';
import { ChatService } from '../api/chat.service';
import { MateriasService } from '../api/materias.service';
import { element } from 'protractor';

@Component({
  selector: 'app-nuevo-recurso',
  templateUrl: './nuevo-recurso.page.html',
  styleUrls: ['./nuevo-recurso.page.scss'],
})
export class NuevoRecursoPage implements OnInit {
  @ViewChild('txtGradoGrupo', {static: false}) txtGradoGrupo: IonInput;
  @ViewChild('txtGradoGrupo', {read: ElementRef, static: true}) txtGradoGrupoHTML: ElementRef;
  @ViewChild('txtMateria', {static: false}) txtMateria: IonInput;
  @ViewChild('txtMateria', {read: ElementRef, static: true}) txtMateriaHTML: ElementRef;
  @ViewChild('filtrosGrupos', {static: false}) filtrosGrupos: IonSelect;
  public FrmItem: FormGroup;
  public  texto_adjuntar_portada: string = 'Foto de Portada';
  public submitAttempt: boolean = false;
  //private item: any;
  private files: any;
  grupos: any[] = [];
  materias: any[] = [];
  gruposSeleccionados: any[] = [];
  gradoSeleccionado: any;
  grupoSeleccionado: any;
  MateriaSeleccionada: any;
  EscolaridadSeleccionada:any;
  tempGradoSeleccionado: number = 0;
  titulo: any;
  tituloBoton: any;
  banderaEdito: boolean=false;
  GrupoIngles: any;

  @Input() item;
  @Input() estadoFormulario; //Define si se ve crear, modificar o clonar una tarea

  constructor(private modalCtrl: ModalController,private formBuilder: FormBuilder, private cd:ChangeDetectorRef,
              private alertCtrl: AlertController,private apiTareas: TareasService,private apiChat: ChatService,
              private apiMaterias: MateriasService,private pickerController: PickerController,public loadingController: LoadingController,
              public toastController: ToastController,private renderer: Renderer2) {
    this.FrmItem = formBuilder.group({
      Id:   [0, Validators.compose([Validators.required])],
      Grupo:   ['', Validators.compose([Validators.required])],
      MateriaId:   ['', Validators.compose([Validators.required])],
      Titulo: ['', Validators.compose([Validators.required])],
      Descripcion: ['', Validators.compose([Validators.required])],
      FechaPublicacion: ['', Validators.compose([Validators.required])],
      HoraPublicacion: ['', Validators.compose([Validators.required])],
      Image: [null, Validators.compose([])]
    });
  }

  ngOnInit() {

  }

  ionViewWillEnter() {
    
    if(this.item != undefined) {
      this.FrmItem.patchValue(this.item);
      
      this.gradoSeleccionado = this.item.Grado;
      this.grupoSeleccionado = this.item.Grupo;
      this.EscolaridadSeleccionada = this.item.Escolaridad
      if(this.item.GrupoIngles=='NO')
        this.txtGradoGrupo.value = this.item.Grado + this.item.Grupo + " " + this.item.Escolaridad;
      else
        this.txtGradoGrupo.value = 'Level ' + this.item.Grado  + this.item.Grupo + " " + this.item.Escolaridad;

      this.txtMateria.value = this.item.Materia.Nombre;
      this.MateriaSeleccionada = this.item.MateriaId;
      this.GrupoIngles = this.item.GrupoIngles;

      if(this.item.Image != undefined)
        this.texto_adjuntar_portada = 'Foto de Portada Seleccionada';
        
      if(this.estadoFormulario=="clonar"){
        //this.item.Id = 0;
        this.item.Grado = undefined;
        this.item.Grupo = undefined;
        this.item.MateriaId = undefined;
        this.item.GrupoIngles = undefined;
        this.item.MateriaId = undefined;

        this.titulo = 'Clonar Tarea';
        this.tituloBoton= 'Clonar Tarea';

        this.gradoSeleccionado = undefined;
        this.grupoSeleccionado = undefined;
        this.txtGradoGrupo.value = "";

        this.txtMateria.value ="";
        this.MateriaSeleccionada = undefined;

        this.FrmItem.patchValue(this.item);
        this.submitAttempt = true; // Simula que ya envio una peticion para poner las cajas de texto con alerta
      } else {
        this.titulo = 'Modificar Tarea';
        this.tituloBoton= 'Modificar Tarea';

        this.item.Clonada="NO";
      }
    } else {
      this.titulo = 'Nueva Tarea';
      this.tituloBoton = 'Crear Tarea';
      
      //this.item.Clonada="NO";
    }
  }

  async crearNoticia() {
    const loading = await this.loadingController.create({
      message: 'Guardando...'
    });

    try {
        this.submitAttempt = true;

        console.log(this.FrmItem);
        if (!this.FrmItem.valid) {

          const alert = await  this.alertCtrl.create({
            header: 'No concluiste con el formulario',
            subHeader: 'El formulario se encuentra incompleto, favor de completar los datos faltantes.',
            mode: 'ios',
            buttons: ['Aceptar']
          });

          await alert.present();
          return;
        }

        await loading.present();

        
        this.item = this.FrmItem.value;
        console.log(this.item);
        
        const payload = new FormData();
        payload.append('Id', this.item.Id);
        payload.append('Titulo', this.item.Titulo);
        payload.append('Descripcion', this.item.Descripcion);
        payload.append('FechaPublicacion', this.item.FechaPublicacion.toString());
        payload.append('HoraPublicacion', this.item.HoraPublicacion);
        payload.append('MateriaId', this.MateriaSeleccionada);
        payload.append('Grado', this.gradoSeleccionado);
        payload.append('Grupo', this.grupoSeleccionado);
        payload.append('GrupoIngles', this.GrupoIngles);
        payload.append('Clonada', this.estadoFormulario=="clonar" ? "SI" : "NO");
        
        if(this.files != undefined) //Valida si se selecciono alguna imagen
          payload.append('ImageUpload', this.files, this.files.name);

          console.log(this.item);
          console.log(payload);
        
        if(this.item.Id == 0 || this.estadoFormulario=="clonar") {
            const tareaUpload = await this.apiTareas.save(payload).toPromise();
        }
        else {
            const tareaUpload =await this.apiTareas.update(payload).toPromise();
        }

        this.banderaEdito=true;
        this.submitAttempt = false;

        this.loadingController.dismiss();

        if(this.item.Id == 0) {
          const alertTerminado = await this.alertCtrl.create({
            header: 'Tarea creada con éxito',
            backdropDismiss: false,
            message: 'Se creó la tarea ' + this.FrmItem.get('Titulo').value + ', ¿desea crear otra tarea?',
            buttons: [
              {
                text: 'No', handler: () =>  this.closeModal()
              },
              {
                text: 'Crear otra', handler: () =>{ 
                  this.FrmItem.reset(); 
                  this.FrmItem.controls['Id'].setValue(0);
                }
              }
            ]
          });
          await alertTerminado.present();
        } else if(this.estadoFormulario=="clonar") {
            const alertTerminado = await this.alertCtrl.create({
              header: 'Tarea clonada con éxito',
              backdropDismiss: false,
              message: 'Se clono la tarea ' + this.FrmItem.get('Titulo').value,
              buttons: [
                {
                  text: 'Continuar', handler: () =>  this.closeModal()
                }
              ]
            });
            await alertTerminado.present();    
        } else {
          const alertTerminado = await this.alertCtrl.create({
            header: 'Tarea modificada con éxito',
            backdropDismiss: false,
            message: 'Se modificó la tarea ' + this.FrmItem.get('Titulo').value,
            buttons: [
              {
                text: 'Continuar', handler: () =>  this.closeModal()
              }
            ]
          });
          await alertTerminado.present();
        }
    }
    catch(error){

      loading.dismiss();

      const alertTerminado = await this.alertCtrl.create({
        header: 'Tuvimos unos detalles en la creación de la tarea, inténtelo de nuevo.',
        backdropDismiss: false,
        message: error["message"],
        buttons: [
          {
            text: 'Continuar', handler: () =>  this.closeModal()
          }
        ]
      });
      await alertTerminado.present();    
    }
  }

  onFileChange($event: any) {
    if( $event.target.files &&  $event.target.files.length) {
      const re = new RegExp('image\/(png|jpg|bmp|jpeg|gif|svg+xml)', 'g');      
      
      //Solo se permiten formatos de imagen;
      if(re.test($event.target.files[0].type)==false) {
        this.presentToast("Archivo no valido, solo se permite subir imágenes.");
        this.texto_adjuntar_portada = 'Foto de Portada';
        return;
      }

      this.texto_adjuntar_portada = 'Foto de Portada Seleccionada';

      this.FrmItem.patchValue({
        Image: $event.target.files[0]
      });

      this.files = $event.target.files[0];
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

  async openPickerGrupos() {

    this.grupos = await this.apiChat.getGruposMaestros().toPromise();
    //console.log(this.grupos);
    let checkBoxes: HTMLCollection;

    this.filtrosGrupos.open().then(alert => {
      console.log(alert);
      checkBoxes = alert.getElementsByClassName("alert-checkbox-button");
      console.log(checkBoxes);

      let index=0;
      for(let item of checkBoxes) {
        this.renderer.setAttribute(item,"data-id",index.toString());
        this.renderer.listen(item,"click",(evt) => {
          const idCheck =(item as HTMLButtonElement).attributes["data-id"].value;
          this.triggerMe(item,idCheck);
        });
        console.log(index);
        index += 1;
      }

    });

    return;

    const picker = await this.pickerController.create({
        mode : 'ios',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Aceptar',
            handler:  (value: any) => {
                console.log("entro");
                console.log(value);
                const gradoGrupo = value.Grupos.value.split("/");
                //this.txtGradoGrupo.value = gradoGrupo[0] + ' / ' + gradoGrupo[1];
                this.txtGradoGrupo.value = value.Grupos.text;
                this.gradoSeleccionado = gradoGrupo[0];
                this.grupoSeleccionado = gradoGrupo[1];
                this.EscolaridadSeleccionada = gradoGrupo[2];
                this.GrupoIngles =gradoGrupo[3];

                this.txtMateria.value = "";
                this.MateriaSeleccionada = "";
                
            }
          }
        ],
        columns: [{
            name: 'Grupos',
            options: await this.getColumnGrupos()
          }
        ]
    });
    
    picker.present();

  }
  triggerMe(item,index) {
    /*console.log(item);
    console.log("selected value", this.grupos[index]);
    console.log(this.gruposSeleccionados);*/
    
    if(this.tempGradoSeleccionado == 0)
    {
        this.tempGradoSeleccionado = this.grupos[index].Grado;
        this.gruposSeleccionados.push({...this.grupos[index]});
        return;
    }
    if(this.tempGradoSeleccionado != this.grupos[index].Grado) {
      console.log("grados diferentes");
      this.presentToast("No puede seleccionar dos grupos de grados diferentes.");
      (item as HTMLButtonElement).click();
    }
  }

  ionChangeFiltrosGrupos(event){
    console.log("ionChangeFiltrosGrupos");
    console.log(event);
    let text="";

    if(!Array.isArray(event.detail.value))
      return;

    console.log(event.detail.value.length);
    event.detail.value.forEach((element,idx,array) => {
      if (idx === array.length - 1){ 
        text += `${element.Grado}${element.Grupo} ${element.Escolaridad}`;
      }
      else {
        //text += element.Id + ",";
        text += `${element.Grado}${element.Grupo} ${element.Escolaridad},`;
      }
    });

    console.log(text);
    //const gradoGrupo = value.Grupos.value.split("/");
    this.txtGradoGrupo.value = text;
    this.gradoSeleccionado = event.detail.value[0].Grado;
    this.grupoSeleccionado = event.detail.value.map(u => u.Grupo).join(', ');
    this.EscolaridadSeleccionada = event.detail.value[0].Escolaridad;
    this.GrupoIngles = event.detail.value[0].GrupoIngles;

    this.txtMateria.value = "";
    this.MateriaSeleccionada = "";
  }

  
  compareWith(o1: any, o2: any | any[]) {
    console.log(o2);
    
    if (!o1 || !o2) {
      //Entra la primera vez que no se ha seleccionado nada
      return o1 === o2;
    }

    if (Array.isArray(o2)) {
      return o2.some((u: any) => u.Grado == o1.Grado && u.Grupo == o1.Grupo && u.Escolaridad == o1.Escolaridad && u.GrupoIngles== o1.GrupoIngles);
    }

    return o1.Id === o2.Id;
  }

  async getColumnGrupos() {
    const options = [];

    
    this.grupos = await this.apiChat.getGruposMaestros().toPromise();
    
    //options.push({text: 'Todas' , value: 0});

    this.grupos.forEach(x => {
      if(x.GrupoIngles=="NO") {
        options.push({text: x.Grado + x.Grupo + ' ' + x.Escolaridad, value: x.Grado+'/'+x.Grupo+'/'+x.Escolaridad+'/'+x.GrupoIngles});
        //this.GrupoIngles="NO";
      }
      else {
        options.push({text: 'Level ' + x.Grado + x.Grupo + ' ' + x.Escolaridad, value: x.Grado+'/'+x.Grupo+'/'+x.Escolaridad+'/'+x.GrupoIngles});
        //this.GrupoIngles="SI";
      }
    });

    return options;
  }

  async openPickerMaterias() {
    const picker = await this.pickerController.create({
        mode : 'ios',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Aceptar',
            handler:  (value: any) => {
                this.txtMateria.value = value.Materias.text;
                this.MateriaSeleccionada = value.Materias.value;
            }
          }
        ],
        columns: [{
            name: 'Materias',
            options: await this.getColumnMaterias()
          }
        ]
    });
    
    picker.present();

  }

  async getColumnMaterias() {
    const options = [];
    console.log(this.GrupoIngles);
    this.grupos = await this.apiMaterias.getMateriasProfesor(this.EscolaridadSeleccionada,this.gradoSeleccionado,this.grupoSeleccionado,this.GrupoIngles).toPromise();

    this.grupos.forEach(x => {
      options.push({text: x.Nombre , value: x.Id});
    });

    return options;
  }

  closeModal() {
    this.modalCtrl.dismiss({
      banderaEdito : this.banderaEdito
    });
  }

}
