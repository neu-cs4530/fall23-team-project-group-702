import MusicAreaController from '../../../classes/interactable/MusicAreaController';
import { Song } from '../../../types/CoveyTownSocket';
import Interactable, { KnownInteractableTypes } from '../Interactable';

export default class MusicArea extends Interactable {
  private _labelText?: Phaser.GameObjects.Text;

  private _defaultSong?: Song;

  private _musicArea?: MusicAreaController;

  private _isInteracting = false;

  public get defaultSong() {
    if (!this._defaultSong) {
      return 'No URL found';
    }
    return this._defaultSong;
  }

  addedToScene() {
    super.addedToScene();
    this.setTintFill();
    this.setAlpha(0.3);

    this._defaultSong = this.getData('song');
    this._labelText = this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y - this.displayHeight / 2,
      `Press space to start listening to the song: ${this._defaultSong?.name}`,
      { color: '#FFFFFF', backgroundColor: '#000000' },
    );
    this._musicArea = this.townController.getMusicAreaController(this);
    this._labelText.setVisible(false);
    this.setDepth(-1);
  }

  overlap(): void {
    if (!this._labelText) {
      throw new Error('Should not be able to overlap with this interactable before added to scene');
    }
    const location = this.townController.ourPlayer.location;
    this._labelText.setX(location.x);
    this._labelText.setY(location.y);
    this._labelText.setVisible(true);
  }

  overlapExit(): void {
    this._labelText?.setVisible(false);
    if (this._isInteracting) {
      console.log('interaction ended');
      this.townController.interactableEmitter.emit('endInteraction', this);
      this._isInteracting = false;
    }
  }

  interact(): void {
    console.log('inside interACT');
    this._labelText?.setVisible(false);
    this._isInteracting = true;
  }

  getType(): KnownInteractableTypes {
    return 'musicArea';
  }
}
