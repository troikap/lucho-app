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
  public intervalConnected;
  public valueReaded: string;
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
  
  async ionViewWillEnter() {
    console.log('ionViewWillEnter DE LECTURA')
    await this.verifyBluetoothEnabled();
    await this.getBluetoothProvider();
    await this.verifyConnectedDevice();
  }

  async getBluetoothProvider() {
    this.bluetooth = await this.bluetoothProvider.getBluetoothSerial();
  }

  async verifyConnectedDevice() {
    this.connected = await this.bluetoothProvider.verifyConnectedDevice();
    this.changeDetectorRef.detectChanges();
  }
  
  async verifyBluetoothEnabled() {
    this.activated = await this.bluetoothProvider.verifyBluetoothIsEnabled();
    if (!this.activated) {
      this.cleanData();
    }
  }

  public async onSubscribe() {
    this.subscribed = "";
    if (!this.data) { this.data = []; }
    if (!this.baseStatus) { this.baseStatus = []; }
    this.subscribed = await this.bluetoothProvider.subscribeToDevice();
    this.toastProvider.presentToast(`Recibiendo datos..`, 700, 'success');
    let datum: DardModel;
    this.subscribed = await this.subscribed.subscribe( async (value: any) => {
      console.log('value ', value)
      this.valueReaded = value;
      try {
        console.log('Lectura correcta');
        datum = JSON.parse(String(value));
      } catch (err) {
        console.log('CATCH subscribed ', err);
        value = value.split('\r\n')[0]
        value = value.replace(/[^a-zA-Z 0-9.{}:',]+/g,' mierda ');
        value = value.replace(/:+/g,': ');
        value = value.replace(/'+/g,'"');
        value = value.replace(/id+/g,' "id"');
        value = value.replace(/status+/g,' "status"');
        value = value.replace(/data+/g,' "data"');
        datum = JSON.parse(String(value));
        console.log('DATUM ', datum)
      }
      const typeData =  await this.identifyDataDardHelper.getTypeData(datum.id);
      switch (typeData) {
        case 'base':
          console.log('ENTRO EN BASE')
          const baseFinded = this.baseStatus.find(element => element.id === datum.id);
          if (baseFinded) {
            console.log('base encontrada ', baseFinded)
            baseFinded.status = datum.status;
            baseFinded.data = datum.data;
          } else {
            console.log('base no encontrada ')
            this.baseStatus.push(datum);
          }
          break;
        case 'initTest':
          this.toastProvider.presentToast('Iniciando prueba ...', 1000, 'success')
          break;
        case 'finalizeTest':
          this.toastProvider.presentToast('Finalizando prueba ...', 1000, 'success')
        default:
          console.log('ENTRO EN NINGUNO')
          this.toastProvider.presentToast('DATO DESCONOCIDO ...', 1000, 'warning')
          break;
      }
      this.data.push(datum);
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
