import PrivateMusicAreaController from '../../../classes/interactable/PrivateMusicAreaController';
import TownController from '../../../classes/TownController';
import MusicArea from './MusicArea';
import Interactable, { KnownInteractableTypes } from '../Interactable';

export default class PrivateMusicArea extends MusicArea {
  public get isPrivateSession() {
    if (!this._musicArea) return false;
    else {
      return this._musicArea.isPrivateSession;
    }
  }

  addedToScene() {
    super.addedToScene();
    /* Set musicArea to be a private room controller */
    this._musicArea = this.townController.getPrivateMusicAreaController(this);
    console.log('Private room created.. creating controller..');
  }

  overlap(): void {
    super.overlap();
    console.log('overlapping in a private session...');
    if (this.isPrivateSession) {
      const spawnPoint = { x: 832.333166666666, y: 900.3335 };
      this._scene.moveOurPlayerTo({
        rotation: 'front',
        moving: false,
        x: spawnPoint.x,
        y: spawnPoint.y,
      });
    }
  }

  getType(): KnownInteractableTypes {
    return 'privateMusicArea';
  }
}
