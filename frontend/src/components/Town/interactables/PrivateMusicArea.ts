import PrivateMusicAreaController from '../../../classes/interactable/PrivateMusicAreaController';
import { KnownInteractableTypes } from '../Interactable';
import MusicArea from './MusicArea';

export default class PrivateMusicArea extends MusicArea {
  public get isPrivateSession() {
    if (!this._musicArea) return false;
    else {
      const privateMusicAreaController = this._musicArea as PrivateMusicAreaController;
      console.log(`PrivateMusicArea interactable: ${privateMusicAreaController.isPrivateSession}`);
      return privateMusicAreaController.isPrivateSession;
    }
  }

  addedToScene() {
    super.addedToScene();
    /* Set musicArea to be a private room controller */
    this._musicArea = this.townController.getPrivateMusicAreaController(this);
  }

  overlap(): void {
    super.overlap();
    if (this.isPrivateSession) {
      const spawnPoint = { x: 832.333166666666, y: 900.3335 };
      this._scene.moveOurPlayerTo({
        rotation: 'front',
        moving: false,
        x: spawnPoint.x,
        y: spawnPoint.y,
      });
      this.emit('requestJoinRoom');
    }
  }

  getType(): KnownInteractableTypes {
    return 'privateMusicArea';
  }
}
