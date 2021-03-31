import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class IdentifyDataDardHelper {

  constructor() {}

  async getTypeData (value: string) {
    switch (value) {
      case 'B1':
      case 'B2':
      case 'B3':
      case 'B4':
      case 'P1':
      case 'P2':
        return 'base';
      case 'ti':
      case 'tf':
        return 'test';
      default:
        return null;
    }  
  }
}
