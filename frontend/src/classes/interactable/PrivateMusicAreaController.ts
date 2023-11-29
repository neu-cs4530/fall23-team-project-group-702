import MusicAreaController from "./MusicAreaController";
import {
    PrivateMusicArea as PrivateMusicAreaModel,
  } from '../../types/CoveyTownSocket';
import TownController from "../TownController";

export default class PrivateMusicAreaController extends MusicAreaController {

    private _isPrivateSession : boolean;

    constructor(musicAreaModel: PrivateMusicAreaModel, townController: TownController) {
        super(musicAreaModel, townController);
        this._isPrivateSession = musicAreaModel.isPrivate;
        console.log('private room state initially: ' + this._isPrivateSession);
        this._isPrivateSession = true;
        console.log('now it is: ' + this._isPrivateSession);
        console.log('Private controller created..')
      }

      public get isPrivateSession() {
          return this._isPrivateSession;
      }

      public set isPrivateSession(privateState : boolean) {
          this._isPrivateSession = privateState;
          this.emit('roomVisibilityChange', privateState);
    }

    /**
   * Applies updates to this music area controller's model, setting the fields
   *
   *
   * @param updatedModel
   */
  protected _updateFrom(updatedModel: PrivateMusicAreaModel): void {
    super._updateFrom(updatedModel);
    if(updatedModel.isPrivate !== undefined) this.isPrivateSession = updatedModel.isPrivate;
}
}