import { Component } from '@angular/core';
import { AlertController, createAnimation, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { BluetoothDevice } from 'src/models/bluetooth-device';
import { BluetoothProvider } from 'src/services/providers/bluetooth.provider';
import { ToastProvider } from 'src/services/providers/toast.provider';
import { ChangeDetectorRef } from '@angular/core';
import { bluetooth_devices } from 'src/models/mocks/bluetooth-device';
import { Animation, AnimationController } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  public listDevice: BluetoothDevice[];
  public listUnpairedDevices: BluetoothDevice[];
  public activated;
  public connected = false;
  public conection: Observable<any>;
  private loading: HTMLIonLoadingElement;
  public numberAvailable: any;
  public bluetooth;
  public readed;
  private intervalConnected;
  public showDevices = false;
  private animation: Animation;

  constructor(
    private toastProvider: ToastProvider,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private bluetoothProvider: BluetoothProvider,
    private changeDetectorRef: ChangeDetectorRef,
    private animationController: AnimationController
  ) {}

  ngOnInit() {
  }

  ionViewDidEnter() {
    console.log('ionViewDidEnter Bluetooth')
    this.verifyBluetoothEnabled();

    this.animation = this.animationController.create()
    .addElement(document.querySelectorAll('.list'))
    .duration(5000)
    .iterations(5)
    // .fromTo('opacity', '1', '0.5');
    .fromTo('opacity', '0', '1')
    .fromTo('width', '0', '100%');

    this.animation.play();
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
    this.animation.play();
    const isEnabled = await this.bluetoothProvider.verifyBluetoothIsEnabled();
    // if (!isEnabled) {
    //   this.toastProvider.presentToast(`(ERROR) Active bluetooth`, 1500, 'warning');
    //   return;
    // }
    // this.listDevice = await this.bluetoothProvider.listBluetoothDevices();
    // if (this.listDevice === null) {
    //   this.toastProvider.presentToast(`(ERROR) No se encontraron dispositivos`, 1500, 'warning');
    //   return;
    // }

    this.listDevice = bluetooth_devices;
    
    console.log('DISPOSITIVOS ', this.listDevice)
    


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

  public async onConnectToDevice(device?: BluetoothDevice) {
    let defaultDevice: BluetoothDevice;
    console.log('devices ', device)
    if (!device) {
      defaultDevice = this.listDevice.find( element => element.name === 'DARD')
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
