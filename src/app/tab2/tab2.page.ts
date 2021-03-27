import { ChangeDetectorRef, Component } from '@angular/core';
import { LoadingController } from '@ionic/angular';
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
  public data: string[];
  public subscribed;
  public baseStatus: {id: string, status: string}[];
  public errorMessage = 'FALLA/DESCONECTADA';
  public datum;

  constructor(
    private loadingController: LoadingController,
    private bluetoothProvider: BluetoothProvider,
    private toastProvider: ToastProvider,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.baseStatus = [];
    this.data = [];
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
    this.connected = await this.bluetoothProvider.verifyConnectedDevice()
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
    this.subscribed = await this.bluetoothProvider.subscribeToDevice();
    this.toastProvider.presentToast(`Recibiendo datos..`, 700, 'success');
    this.subscribed = await this.subscribed.subscribe( async value => {
      this.datum = value;
      let status: string;
      let values: string[];
      if (value == 'INICIANDO TESTEO DARD' || value == 'TI' || value == 'TF') {
        alert(value)
      }
      if (value.includes("=")) {
        values = value.split('=');
        let baseFinded = this.baseStatus.find(element => element.id === values[0])
        status = values[1].split("\n")[0];
        if (baseFinded) {
          baseFinded.status = status;
        } else {
          this.baseStatus.push({id: values[0], status: status})
        }
      }
      this.data.push(value);
      this.changeDetectorRef.detectChanges();
    })
    this.changeDetectorRef.detectChanges();
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
