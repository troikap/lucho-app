import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { BluetoothDevice } from 'src/models/bluetooth-device';
import { bluetooth_devices } from 'src/models/mocks/bluetooth-device';
import { BluetoothProvider } from 'src/services/providers/bluetooth.provider';
import { ToastProvider } from 'src/services/providers/toast.provider';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  public listDevice: BluetoothDevice[] | void;
  public listUnpairedDevices: BluetoothDevice[] | void;
  public activated;
  public connected = false;
  public conection: Observable<any>;
  private loading: HTMLIonLoadingElement;
  public numberAvailable: any;
  public bluetooth;
  public datum;
  public readed;
  public data: string[];
  public subscribed;
  public value_b1;
  public value_b2;
  public value_b3;
  public value_b4;
  public value_p1;
  public value_p2;


  constructor(
    private toastProvider: ToastProvider,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private bluetoothProvider: BluetoothProvider,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
  }

  ionViewDidEnter() {
    console.log('ionViewDidEnter')
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
      message: 'Desconectado dispositivo ...'
    });
    await this.loading.present();
    try {
      const desconectar = await this.bluetoothProvider.disconnectToDevice();
      if (desconectar) {
        await this.loading.dismiss();
        this.cleanData();
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

  public async onConnectToDevice(device: BluetoothDevice) {
    this.connected = false;
    this.data = [];
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
            this.bluetooth = await this.bluetoothProvider.getBluetoothSerial();
            this.bluetooth.connect(device.address).subscribe(async connected => {
              await this.loading.dismiss();
              this.connected = true;
              this.listDevice = null;
              this.changeDetectorRef.detectChanges();
            })
          }
        },
      ]
    });
    await alert.present();
  }

  public async onSubscribe() {
    this.subscribed = await this.bluetoothProvider.subscribeToDevice();
    this.toastProvider.presentToast(`Recibiendo datos..`, 700, 'success');
    this.subscribed = await this.subscribed.subscribe( async value => {
      console.log('VALOR LEIDO ', value)
      this.datum = value;
      if (value == 'INICIANDO TESTEO DARD' || value == 'TI' || value == 'TF') {
        alert(value)
      }
      if (value.includes("B1=")) {
        console.log('LEYENDO B1 ', value.includes("B1="))
        this.value_b1 = value.split('=')[1];
      }
      if (value.includes("B2=")) {
        console.log('LEYENDO B2 ', value.includes("B2="))
        this.value_b2 = value.split('=')[1];
      }
      if (value.includes("B3=")) {
        console.log('LEYENDO B3 ', value.includes("B3="))
        this.value_b3 = value.split('=')[1];
      }
      if (value.includes("B4=")) {
        console.log('LEYENDO B4 ', value.includes("B4="))
        this.value_b4 = value.split('=')[1];
      }
      if (value.includes("P1=")) {
        console.log('LEYENDO P1 ', value.includes("P1="))
        this.value_p1 = value.split('=')[1];
      }
      if (value.includes("P2=")) {
        console.log('LEYENDO P2 ', value.includes("P2="))
        this.value_p2 = value.split('=')[1];
      }
      await this.data.push(value);
      await this.changeDetectorRef.detectChanges();
    })
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
    this.datum = null;
    this.data = [];
  }

  async onGetNumberBytesAvailable() {
    this.numberAvailable = await this.bluetoothProvider.getNumberBytesAvailable();
    console.log(' NUMERO ', this.numberAvailable)
  }

  async readRSSI() {
    this.readed = await this.bluetoothProvider.readRSSI()
  }
}
