import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { AlertController, LoadingController, ModalController, IonInfiniteScroll, IonVirtualScroll,ActionSheetController } from '@ionic/angular';
import { TareasService } from 'src/app/api/tareas.service';
import { DetallePage } from 'src/app/detalle/detalle.page';
import { NuevoRecursoPage } from 'src/app/nuevo-recurso/nuevo-recurso.page';
import { HomePage } from '../../home/home.page';


@Component({
  selector: 'app-list-tareas',
  templateUrl: './list-tareas.component.html',
  styleUrls: ['./list-tareas.component.scss'],
})
export class ListTareasComponent implements OnInit {
  LstTareas: any[] = [];
  materiaId: any;
  loading: any;
  visto = false;
  visto2 = false;
  cargarConFiltro = false;
  spiner = true;
  contadorInfinieScroll = 0;
  @Output() updateAutoHeightSlider = new EventEmitter();
  @ViewChild(IonInfiniteScroll, {static: false}) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonVirtualScroll, {static: false}) virtualScroll: IonVirtualScroll;

  
  constructor(private apiTareas: TareasService, private modalCrl: ModalController, private loadingController: LoadingController,private alertController: AlertController, public actionSheetController: ActionSheetController ) {
  }

  ngOnInit() {
    // this.cargar(0);
     this.apiTareas.getInfinite(this.contadorInfinieScroll, 10).subscribe(data => {
      this.LstTareas = data;
      this.contadorInfinieScroll += 10;
      this.updateAutoHeightSlider.emit();
      this.spiner =false;
      console.log(data);
    });
  }

   public async cargar(materiaId) {
    // 0=todas 1=Filtrado por materia
    console.log("materiaId",materiaId);
    this.materiaId = materiaId;

    await this.cargandoAnimation('Cargando...');
    this.infiniteScroll.disabled= false;
    if (materiaId == 0) {
      this.contadorInfinieScroll = 0;
      this.LstTareas = [];
      this.infiniteScroll.disabled= false;

      this.apiTareas.getInfinite(this.contadorInfinieScroll, 10).subscribe(data => {
        if (data.length != 0) {
          for (let i = 0; i < data.length; i++) {
            console.log('dentro');
            this.LstTareas.push(data[i]);
          }
          setTimeout(() => {
            this.updateAutoHeightSlider.emit();
          }, 300);
          this.contadorInfinieScroll += 10;

          this.virtualScroll.checkEnd();
         
          this.loadingController.dismiss();
        }
      });
      this.cargarConFiltro = false;

    } else {
      this.contadorInfinieScroll = 0;
      this.LstTareas = [];
      this.infiniteScroll.disabled= false;

      this.apiTareas.getTareasMateriasInfinite(materiaId, this.contadorInfinieScroll, 10).subscribe(data => {
        for (let i = 0; i < data.length; i++) {
          console.log('dentro');
          this.LstTareas.push(data[i]);
        }
        setTimeout(() => {
          this.updateAutoHeightSlider.emit();
        }, 300);
        this.contadorInfinieScroll += 10;

        this.virtualScroll.checkEnd();
        this.loadingController.dismiss();
      });
      this.cargarConFiltro = true;
    }
  }

  async openDetail(event: Event, item) {
    const modal = await this.modalCrl.create({
        component: DetallePage,
        cssClass: 'my-custom-modal-css',
        mode: 'ios',
        backdropDismiss: true,
        componentProps: {item}
      });
      setTimeout(() => {
        console.log(item.Id);
        if(item.Id== 14170){
          this.visto2 = true;
        }
        else{
          this.visto= true;
        }
      }, 1000);

    return await modal.present();
   
  }

  public async clonarTarea(event, item){
    event.stopPropagation();
    
    const modal = await this.modalCrl.create({
      component: NuevoRecursoPage,
      cssClass: 'my-custom-modal-css-capturas',
      showBackdrop: false,
      componentProps: { item: {...item}, estadoFormulario: "clonar"},
      mode: 'ios',
      backdropDismiss: true
    });

    await modal.present();

    modal.onDidDismiss().then(async (data) => {
      if (data.data.banderaEdito == true) {
          await this.cargandoAnimation('Cargando...');
          this.LstTareas = await this.apiTareas.get().toPromise();
          this.loadingController.dismiss();
      }
    });
  }

  public async editaTarea(event, item) {
    event.stopPropagation();

    const modal = await this.modalCrl.create({
      component: NuevoRecursoPage,
      // cssClass: 'my-custom-modal-css',
      cssClass: 'my-custom-modal-css-capturas',
      showBackdrop: false,
      componentProps: {item:{...item}},
      mode: 'ios',
      backdropDismiss: true
    });

    await modal.present();

    modal.onDidDismiss().then( async (data) => {

        if (data.data.banderaEdito == true) {
            await this.cargandoAnimation('Cargando...');
            this.LstTareas = await this.apiTareas.get().toPromise();
            this.loadingController.dismiss();
        }
    });
  }

  async presentActionSheet(event,item) {	
    event.stopPropagation();	
    //e.preventDefault();	
  const actionSheet = await this.actionSheetController.create({	
    mode: 'ios', 	
    header: 'Opciones',	
    cssClass: 'my-custom-class',	
    buttons: [	
      {	
        text: 'Clonar',	
        icon: 'documents',	
        //cssClass: 'disable-action-sheet-btns', 	        
        handler: () => {	
          this.clonarTarea(event,item);	
        },	
      },	
      {	
        text: 'Editar',	
        icon: 'create',	
        //cssClass: 'disable-action-sheet-btns', 	
        handler: () => {	
          this.editaTarea(event,item);	
        },	
      },	
      {	
        text: 'Eliminar',	
        icon: 'close-circle',	
        //cssClass: 'my-custom-class', 	
        handler: () => {	
          this.eliminar(event,item);	
        },	
      }],	
  });	
  await actionSheet.present();	
  const { role } = await actionSheet.onDidDismiss();	
  console.log('onDidDismiss resolved with role', role);	
}

  public permisoEditar() {
    const jwt_temp = localStorage.getItem('USER_INFO_TEMP');
    if (jwt_temp != null) {
        return false;
    }

    if (this.getKeyToken('tipo') == 'Profesor') {
      return true;
    }
    else {
      return false;
    }
  }

  // Eliminar tarea
  public async eliminar(event, item) {
    
    event.stopPropagation();
    console.log(item);
    const alertTerminado = await this.alertController.create({
      header: 'ELIMINAR',
      message: '¿Está seguro de ELIMINAR la tarea?, si la tarea ya cuenta con evidencia serán eliminadas',
      buttons: [
        {
          text: 'No', handler: () =>  {
            return;
          }
        },
        {
          text: 'Si', handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Eliminando...'
            });

            await loading.present();

            await this.apiTareas.delete(item.Id).toPromise();

            this.LstTareas = this.LstTareas.filter(obj => obj !== item);

            this.loadingController.dismiss();

            this.alertController.dismiss();
          }
        }
      ]
    });

    alertTerminado.present();
  }

  async cargandoAnimation(text) {
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


  loadData(event) {
     console.log('loaddata');
     if (this.cargarConFiltro) {

      this.getApiTareasConFiltro(event);

    } else {

      this.getApiTareasSinFiltro(event);

    }
  }
    getApiTareasSinFiltro(event) {
      console.log('cargarSinfiltro');
      this.apiTareas.getInfinite(this.contadorInfinieScroll, 10).subscribe(data => {
        console.log('getInfinite');
        console.log(data);
        if (data.length != 0) {
          for (let i = 0; i < data.length; i++) {
            console.log('dentro');
            this.LstTareas.push(data[i]);
          }

          event.target.complete();
          this.contadorInfinieScroll += 10;
          setTimeout(() => {
            this.updateAutoHeightSlider.emit();
          }, 300);
          this.virtualScroll.checkEnd();
        } else {
          console.log('fin scroll');
          event.target.disabled = true;
          setTimeout(() => {
            this.updateAutoHeightSlider.emit();
            }, 300);
        }
      });

    }
    getApiTareasConFiltro(event) {
      console.log('cargarConfiltro');
      console.log(event);

      this.apiTareas.getTareasMateriasInfinite(this.materiaId, this.contadorInfinieScroll, 10).subscribe(data => {
        console.log('getInfinite');
        console.log(data);
        if (data.length != 0) {
          for (let i = 0; i < data.length; i++) {
            console.log('dentro');
            this.LstTareas.push(data[i]);
          }

          event.target.complete();
          this.contadorInfinieScroll += 10;
          setTimeout(() => {
            this.updateAutoHeightSlider.emit();
          }, 300);
          this.virtualScroll.checkEnd();
        } else {
          console.log('fin scroll');
          event.target.disabled = true;
          setTimeout(() => {
        this.updateAutoHeightSlider.emit();
        }, 300);
        }
      });
    }

  }



