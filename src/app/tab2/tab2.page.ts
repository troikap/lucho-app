import { ChangeDetectorRef, Component } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { DardModel } from 'src/models/dard.model';
import { IdentifyDataDardHelper } from 'src/services/helpers/identify-data-dard.helper';
import { BluetoothProvider } from 'src/services/providers/bluetooth.provider';
import { ToastProvider } from 'src/services/providers/toast.provider';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
  private loading: HTMLIonLoadingElement;
  public activated;
  public connected;
  public bluetooth;
  public data: any[];
  public subscribed;
  public baseStatus: DardModel[];
  public errorMessage = 'FALLA/DESCONECTADA';
  public datum: DardModel;
  public intervalConnected;

  constructor(
    private loadingController: LoadingController,
    private bluetoothProvider: BluetoothProvider,
    private toastProvider: ToastProvider,
    private changeDetectorRef: ChangeDetectorRef,
    private identifyDataDardHelper: IdentifyDataDardHelper
  ) { }

  ngOnInit() {
    this.baseStatus = [];
  }
  
  ionViewWillEnter() {
    console.log('ionViewWillEnter DE LECTURA')
    this.verifyBluetoothEnabled();
    this.getBluetoothProvider();
    this.verifyConnectedDevice();
  }

  async getBluetoothProvider() {
    this.bluetooth = await this.bluetoothProvider.getBluetoothSerial();
  }

  async verifyConnectedDevice() {
    this.connected = await this.bluetoothProvider.verifyConnectedDevice();

  }
  
  async verifyBluetoothEnabled() {
    this.loading = await this.loadingController.create({
      message: 'Cambiando estado de bluetooth ...'
    });
    await this.loading.present();
    setTimeout(async () => {
      await this.loading.dismiss();
      this.activated = await this.bluetoothProvider.verifyBluetoothIsEnabled();
      if (!this.activated) {
        this.cleanData();
      }
    }, 500);
  }

  public async onSubscribe() {
    this.subscribed = "";
    if (!this.data) { this.data = []; }
    if (!this.baseStatus) { this.baseStatus = []; }

    this.subscribed = await this.bluetoothProvider.subscribeToDevice();
    this.toastProvider.presentToast(`Recibiendo datos..`, 700, 'success');
    this.subscribed = await this.subscribed.subscribe( async (value: string) => {
      console.log('VALUE ', value)

      this.datum = JSON.parse(JSON.stringify(value));
      console.log('datum ', this.datum)
      console.log('datum id : ', this.datum.id)
      console.log('datum  status ', this.datum.status)


      const typeData =  await this.identifyDataDardHelper.getTypeData(this.datum.id);
      switch (typeData) {
        case 'base':
          console.log('ENTRO EN BASE')
          const baseFinded = this.baseStatus.find(element => element.id === this.datum.id);
          if (baseFinded) {
            console.log('base encontrada ', baseFinded)
            baseFinded.status = this.datum.status;
            baseFinded.data = this.datum.data;
          } else {
            console.log('base no encontrada ')
            this.baseStatus.push(this.datum);
          }
          break;
        case 'test':
          console.log('ENTRO EN TEST')
        
          break;
      
        default:
          console.log('ENTRO EN NINGUNO')

          break;
      }
      this.data.push(this.datum);
      this.changeDetectorRef.detectChanges();
    })
    this.bluetoothProvider.writeToDevice('S');
    this.changeDetectorRef.detectChanges();
  }

  public async onClickInitTest() {
    this.loading = await this.loadingController.create({
      message: 'Iniciando testeo ...'
    });
    await this.loading.present();
    this.intervalConnected = setInterval( async ()=>{
      await this.loading.dismiss();
      this.toastProvider.presentToast('No se obtuvo resultado', 1000, 'warning');
      clearInterval(this.intervalConnected);
    },5000);
    try {
      this.loading.dismiss();
      const response = await this.bluetoothProvider.writeToDevice('T');
      if (response) {
        console.log('RESPUESTA onClickInitTest ', response);
        clearInterval(this.intervalConnected);
        this.toastProvider.presentToast('Iniciando testeo ..', 1000, 'success');
      }
    } catch (err) {
      console.log('CATCH ', err);
      this.loading.dismiss();
      this.toastProvider.presentToast('Problemas al iniciar testeo', 1000, 'danger');
      clearInterval(this.intervalConnected);
    }
  }

  public async onUnsubscribe() {
    if (this.subscribed) {
      this.subscribed.unsubscribe();
      this.subscribed = null;
      this.toastProvider.presentToast(`Dejando de recibir datos..`, 700, 'warning');
      this.changeDetectorRef.detectChanges();
    }
  }

  cleanData() {
    this.connected = false;
    this.bluetooth = null;
    this.activated = false;
    this.subscribed = null;
    this.baseStatus = [];
    this.data = [];
  }
}
