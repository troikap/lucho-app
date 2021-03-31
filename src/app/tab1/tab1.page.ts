import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { BluetoothDeviceModel } from 'src/models/bluetooth-device.model';
import { BluetoothProvider } from 'src/services/providers/bluetooth.provider';
import { ToastProvider } from 'src/services/providers/toast.provider';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  public listDevice: BluetoothDeviceModel[];
  public listUnpairedDevices: BluetoothDeviceModel[];
  public activated;
  public connected = false;
  public conection: Observable<any>;
  private loading: HTMLIonLoadingElement;
  public numberAvailable: any;
  public bluetooth;
  public readed;
  private intervalConnected;
  public showDevices = false;

  constructor(
    private toastProvider: ToastProvider,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private bluetoothProvider: BluetoothProvider,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
  }

  ionViewDidEnter() {
    console.log('ionViewDidEnter Bluetooth')
    this.verifyBluetoothEnabled();
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
        return;
      }
      await this.onScanBluetooth();
    }, 500);
  }

  async verifyConnectedDevice() {
    this.loading = await this.loadingController.create({
      message: 'Verificando si esta conectado ...'
    });
    await this.loading.present();
    this.connected = await this.bluetoothProvider.verifyConnectedDevice();
    console.log('CONECTADO A ALGUN DISPOSITIVO ???? ', this.connected)
    await this.loading.dismiss();
  }

  public async onScanBluetooth() {
    const isEnabled = await this.bluetoothProvider.verifyBluetoothIsEnabled();
    if (!isEnabled) {
      this.toastProvider.presentToast(`(ERROR) Active bluetooth`, 1500, 'warning');
      return;
    }
    this.listDevice = await this.bluetoothProvider.listBluetoothDevices();
    if (this.listDevice === null) {
      this.toastProvider.presentToast(`(ERROR) No se encontraron dispositivos`, 1500, 'warning');
      return;
    }
    this.changeDetectorRef.detectChanges();
  }

  public async onActivateBluetooth() {
    await this.verifyBluetoothEnabled();
    if (!this.activated) {
      this.activated = await this.bluetoothProvider.activateBluetooth();
    }
    this.onScanBluetooth();
  }

  public async onDisconnectToDevice() {
    this.loading = await this.loadingController.create({
      message: 'Desconectando dispositivo ...'
    });
    await this.loading.present();
    try {
      const desconectar = await this.bluetoothProvider.disconnectToDevice();
      console.log('DESCONECTADO ', desconectar)
      await this.loading.dismiss();
      if (desconectar) {
        this.listDevice = null;
        this.connected = false;
        this.onScanBluetooth();
        this.changeDetectorRef.detectChanges();
      }
    } catch (err) {
      console.log('NO SE PUDO DESCONECTAR ', err)
      await this.loading.dismiss();
    }
  }

  public async onConnectToDevice(device?: BluetoothDeviceModel) {
    let defaultDevice: BluetoothDeviceModel;
    if (!this.listDevice) { this.listDevice = []; }
    console.log('devices ', device)
    if (!device) {
      defaultDevice = this.listDevice.find( element => element.name === 'D.A.R.D')
      console.log('defaultDevice ', defaultDevice)

      if (!defaultDevice) {
        this.toastProvider.presentToast('No se encontro el dispositivo DARD, escanee nuevamente y vuelva a intentarlo', 1500, 'warning');
        return;
      }
      device = defaultDevice;
    }
    this.connected = false;
    const alert = await this.alertController.create({
      header: 'Confirmacion',
      message: `Conectarse a ${device.name}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Conectar',
          handler: async () => {
            this.loading = await this.loadingController.create({
              message: 'Conectando al dispositivo ...'
            });
            await this.loading.present();
            this.intervalConnected = setInterval( async ()=>{
              await this.loading.dismiss();
              this.toastProvider.presentToast('No se pudo conectar al dispositivo', 1000, 'warning');
              clearInterval(this.intervalConnected);
            },5000);
            this.bluetooth = await this.bluetoothProvider.getBluetoothSerial();
            this.bluetooth.connect(device.address).subscribe(async connected => {
              clearInterval(this.intervalConnected);
              await this.loading.dismiss();
              this.connected = true;
              this.changeDetectorRef.detectChanges();
            })
          }
        },
      ]
    });
    await alert.present();
  }

  async onGetNumberBytesAvailable() {
    this.numberAvailable = await this.bluetoothProvider.getNumberBytesAvailable();
    console.log(' NUMERO ', this.numberAvailable)
  }

  async readRSSI() {
    this.readed = await this.bluetoothProvider.readRSSI()
  }

  cleanData() {
    this.listDevice = null;
    this.listUnpairedDevices = null;
    this.conection = null;
    this.connected = false;
    this.bluetooth = null;
  }
}
