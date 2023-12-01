import MusicAreaController from './MusicAreaController';
import { PrivateMusicArea as PrivateMusicAreaModel } from '../../types/CoveyTownSocket';
import TownController from '../TownController';

export default class PrivateMusicAreaController extends MusicAreaController {
  private _isPrivateSession: boolean;

  private _toggle: boolean;

  constructor(musicAreaModel: PrivateMusicAreaModel, townController: TownController) {
    super(musicAreaModel, townController);
    this._isPrivateSession = musicAreaModel.isPrivate;
    this._toggle = false;
  }

  public get toggle() {
    return this._toggle;
  }

  // public set toggle(toggleState: boolean) {
  //   this._toggle = toggleState;
  //   console.log(`toggleState emitting and setting: ${toggleState}`);
  //   this.emit('requestJoinRoom', toggleState);
  // }

  public get isPrivateSession() {
    return this._isPrivateSession;
  }

  public set isPrivateSession(privateState: boolean) {
    this._isPrivateSession = privateState;
    this.emit('roomVisibilityChange', privateState);
  }

  public async setPrivacy(privacyState: boolean) {
    await this._townController.sendInteractableCommand(this.id, {
      type: 'SetRoomPrivacy',
      isPrivate: privacyState,
    });
  }

  public async requestJoinRoom(toggle: boolean) {
    // this._toggle = toggle;
    await this._townController.sendInteractableCommand(this.id, {
      type: 'RequestJoinRoom',
      toggle,
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
    // this._toggle = updatedModel.toggle;
    console.log(
      `updatedModel.toggle: ${updatedModel.toggle} | updatedModel.isPrivate: ${updatedModel.isPrivate} | this._toggle ${this._toggle}`,
    );
    if (updatedModel.toggle !== undefined) {
      console.log(`toggleState emitting and setting: ${updatedModel.toggle}`);
      this.emit('requestJoinRoom', updatedModel.toggle);
    }
    if (updatedModel.isPrivate !== undefined) this.isPrivateSession = updatedModel.isPrivate;
  }
}
