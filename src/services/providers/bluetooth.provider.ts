
import { Injectable } from "@angular/core";
import { BluetoothSerial } from "@ionic-native/bluetooth-serial/ngx";
import { BluetoothDevice } from 'src/models/bluetooth-device';

@Injectable({ providedIn: "root" })
export class BluetoothProvider {

  constructor(
    private bluetoothSerial: BluetoothSerial,
  ) {}

  async activateBluetooth () {
    try {
      const active = await this.bluetoothSerial.enable();
      if (active) { return true; }
      else { return false; }
    } catch {
      return false;
    }
  }
  
  async verifyBluetoothIsEnabled () {
    try {
      const active = await this.bluetoothSerial.isEnabled();
      if (active) { return true; }
      else { return false; }
    } catch {
      return false; 
    }
  }

  async verifyConnectedDevice () {
    try {
      const connected = await this.bluetoothSerial.isConnected();
      console.log('DISPOSITIVO CONECTADO ', connected)
      return connected;
    } catch {
      console.log('NO SE ENCUENTRA CONECTADO ')
      return; 
    }
  }
  
  async disconnectToDevice () {
    try {
      const active = await this.bluetoothSerial.disconnect();
      if (active) { return true }
      else { return false; }
    } catch {
      console.log('catch BLUETOOTH DESCONECTADO ')
      return false;
    }
  }

  async connectToDevice (device: BluetoothDevice) {
    console.log('CONECTANDOSE CON ADDRES ', device.address);
    try {
      return this.bluetoothSerial.connect(device.address);
    } catch {
      console.log('PROBLEMAS AL INTENTAR CONECTAR CON EL DISPOSITIVO ');
    }
  }

  async connectInsecureToDevice (device: BluetoothDevice) {
    this.bluetoothSerial.connectInsecure(device.address).subscribe( connection => {
      console.log('CONEXION INSEGURA', connection);
      if (connection) { return true; }
    }, err => {
      console.log('ERROR ', err);
      return false;
    });
  }

  async subscribeToDevice () {
    return this.bluetoothSerial.subscribe('\n');
  }

  async getBluetoothSerial() {
    return this.bluetoothSerial;
  }


  async listBluetoothDevices() {
    try {
      const list: BluetoothDevice[] = await this.bluetoothSerial.list();
      if (list) { return list; }
      else { return; }
    } catch {
      console.log('CATCH listBluetoothDevices');
      return; 
    }
  }

  async listBluetoothDiscoverUnpairedDevices() {
    try {
      const list= await this.bluetoothSerial.discoverUnpaired();
      if (list) { return list; }
      else { return; }
    } catch {
      console.log('CATCH listBluetoothDiscoverUnpairedDevices');
      return; 
    }
  }

  async writeToDevice ( value: string ) {
    try {
      const writed = await this.bluetoothSerial.write(value);
      console.log('ESCRIBIENDO AL DISPOSITIVO ', writed)
      if (writed) { return true; }
      else { return false; }
    } catch {
      console.log('catch ESCRIBIENDO AL DISPOSITIVO ')
      return false;
    }
  }

  async getNumberBytesAvailable () {
    try {
      const available = await this.bluetoothSerial.available();
      return await available;
    } catch {
      console.log('catch NUMBERO DE BYTES DISPONIBLES ')
      return;
    }
  }

  async readRSSI() {
    try {
      console.log('que onda ', await this.bluetoothSerial.readRSSI())
      const readed = await this.bluetoothSerial.readRSSI();
      return await readed;
    } catch {
      console.log('readRSSI NADA LEIDO ')
      return;
    }
  }
}
