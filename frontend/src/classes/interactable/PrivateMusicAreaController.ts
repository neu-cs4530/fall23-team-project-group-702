import MusicAreaController from './MusicAreaController';
import { PrivateMusicArea as PrivateMusicAreaModel } from '../../types/CoveyTownSocket';
import TownController from '../TownController';

export default class PrivateMusicAreaController extends MusicAreaController {
  private _isPrivateSession: boolean;

  constructor(musicAreaModel: PrivateMusicAreaModel, townController: TownController) {
    super(musicAreaModel, townController);
    this._isPrivateSession = musicAreaModel.isPrivate;
  }

  public get isPrivateSession() {
    return this._isPrivateSession;
  }

  public set isPrivateSession(privateState: boolean) {
    this._isPrivateSession = privateState;
    console.log(`privateState emitting and setting: ${privateState}`);
    this.emit('roomVisibilityChange', privateState);
  }

  public async setPrivacy(privacyState: boolean) {
    console.log(`in private music area controller, setting privacy to ${privacyState}`);
    await this._townController.sendInteractableCommand(this.id, {
      type: 'SetRoomPrivacy',
      isPrivate: privacyState,
    });
  }

  /**
   * Applies updates to this music area controller's model, setting the fields
   *
   *
   * @param updatedModel
   */
  protected _updateFrom(updatedModel: PrivateMusicAreaModel): void {
    super._updateFrom(updatedModel);
    if (updatedModel.isPrivate !== undefined) this.isPrivateSession = updatedModel.isPrivate;
  }
}
