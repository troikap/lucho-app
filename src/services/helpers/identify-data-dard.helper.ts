import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class IdentifyDataDardHelper {

  constructor() {}

  async getTypeData (value: string) {
    console.log('VALUE DATA ', value)
    switch (value) {
      case 'B1':
      case 'B2':
      case 'B3':
      case 'B4':
      case 'P1':
      case 'P2':
        return 'base';
      case 'ti':
      console.log('TEST INICIAL ')

        return 'initTest';
      case 'tf':
      console.log('TEST FINAL ')

        return 'finalizeTest';
      default:
        return null;
    }  
  }
}
