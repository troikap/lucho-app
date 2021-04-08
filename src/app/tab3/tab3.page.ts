import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { DardModel } from 'src/models/dard.model';
import { IdentifyDataDardHelper } from 'src/services/helpers/identify-data-dard.helper';
import { BluetoothProvider } from 'src/services/providers/bluetooth.provider';
import { ToastProvider } from 'src/services/providers/toast.provider';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {
  public bluetooth;
  public activated;
  public connected;
  private changeDetectorRef: ChangeDetectorRef;
  public subscribed;
  public data: any[];
  public myForm: FormGroup;

  constructor(
    private bluetoothProvider: BluetoothProvider,
    private identifyDataDardHelper: IdentifyDataDardHelper,
    private toastProvider: ToastProvider,
    private formBuilder: FormBuilder,
    private alertController: AlertController
  ) {}

 async ionViewWillEnter() {
    console.log('ionViewWillEnter DE Resultado')
    await this.verifyBluetoothEnabled();
    await this.getBluetoothProvider();
    await this.verifyConnectedDevice();
    await this.onSubscribe();
    this.initForm();
  }

  initForm() {
    this.myForm = this.formBuilder.group({
      repeticion: new FormControl('', Validators.required),
      distancia: new FormControl('', Validators.required),
    });
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
    this.subscribed = await this.bluetoothProvider.subscribeToDevice();
    this.toastProvider.presentToast(`Recibiendo datos..`, 700, 'success');
    let datum: DardModel;
    this.subscribed = await this.subscribed.subscribe( async (value: any) => {
      console.log('value ', value)
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
          break;
        case 'initTest':
          break;
        case 'finalizeTest':
        default:
          console.log('ENTRO EN NINGUNO')
          this.toastProvider.presentToast('DATO DESCONOCIDO ...', 1000, 'warning')
          break;
      }
      this.data.push(datum);
      this.changeDetectorRef.detectChanges();
    })
    this.changeDetectorRef.detectChanges();
  }

  public onClickStart () {
    console.log('onClickStart');
    this.bluetoothProvider.writeToDevice('E');
  }

  cleanData() {
    this.connected = false;
    this.bluetooth = null;
    this.activated = false;
    this.subscribed = null;
    this.data = [];
  }

  async otro() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Prompt!',
      inputs: [
        {
          name: 'name1',
          type: 'text',
          placeholder: 'Info a enviar'
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Ok',
          handler: (data) => {
            console.log('Confirm Ok , ', data);

            this.bluetoothProvider.writeToDevice(data.name1);
          }
        }
      ]
    });

    await alert.present();

  }
}
