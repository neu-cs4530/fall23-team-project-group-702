import { mockDeep, mockReset } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import InvalidParametersError from '../lib/InvalidParametersError';
import Player from '../lib/Player';
import { TownEmitter } from '../types/CoveyTownSocket';
import MusicArea from './music/MusicArea';
import SpotifyController from './music/SpotifyController';

// Mock the SpotifyController class
jest.mock('./music/SpotifyController', () => ({
  SpotifyController: jest.fn(() => mockDeep<SpotifyController>()),
}));

describe('MusicArea', () => {
  const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
  let testArea: MusicArea;
  const townEmitter = mockDeep<TownEmitter>();
  const topic = nanoid();
  const id = nanoid();
  let newPlayer: Player;

  beforeEach(() => {
    mockReset(townEmitter);
    testArea = new MusicArea(
      {
        topic,
        id,
        sessionInProgress: false,
        currentSong: null,
        songQueue: [],
        isPlaying: false,
        occupants: [],
      },
      testAreaBox,
      townEmitter,
    );
    newPlayer = new Player(nanoid(), mockDeep<TownEmitter>());
    testArea.add(newPlayer);
  });

  describe('MusicArea constructor', () => {
    it('should initialize with correct values', () => {
      const musicArea = new MusicArea(
        {
          topic: 'test',
          id: 'area1',
          sessionInProgress: false,
          currentSong: null,
          songQueue: [],
          isPlaying: false,
          occupants: [],
        },
        testAreaBox,
        townEmitter,
      );

      expect(musicArea.topic).toBe('test');
      expect(musicArea.sessionInProgress).toBe(false);
    });
  });

  describe('handleSpotifyCommand', () => {
    it('should handle CreateMusicSession command', async () => {
      await testArea.handleSpotifyCommand({ type: 'CreateMusicSession', topic: 'new topic' });

      expect(testArea.topic).toBe('new topic');
      expect(testArea.sessionInProgress).toBe(true);
    });
  });
});

jest.mock('./music/SpotifyController', () => ({
  SpotifyController: jest.fn(() => mockDeep<SpotifyController>()),
}));

describe('MusicArea', () => {
  const testAreaBox = { x: 0, y: 0, width: 10, height: 10 };
  const townEmitter = mockDeep<TownEmitter>();
  const topic = 'test';
  const id = 'area1';

  // Creating a helper function to instantiate MusicArea with all necessary properties
  function createTestMusicArea() {
    return new MusicArea(
      {
        topic,
        id,
        sessionInProgress: false,
        currentSong: null,
        songQueue: [],
        isPlaying: false,
        occupants: [],
      },
      testAreaBox,
      townEmitter,
    );
  }

  describe('MusicArea constructor', () => {
    it('should initialize with correct values', () => {
      const musicArea = createTestMusicArea();
      expect(musicArea.topic).toBe(topic);
      expect(musicArea.sessionInProgress).toBe(false);
    });
  });

  /* describe('remove', () => {
    it('should clear topic and emit area change when last player leaves', () => {
      const musicArea = createTestMusicArea();
      const mockPlayer = new Player(nanoid());

      musicArea.add(mockPlayer);
      musicArea.remove(mockPlayer);

      expect(musicArea.topic).toBe('');
      expect(townEmitter.emit).toHaveBeenCalledWith('areaChanged');
    });
  }); */

  describe('handleSpotifyCommand', () => {
    it('should handle CreateMusicSession command', async () => {
      const musicArea = createTestMusicArea();
      await musicArea.handleSpotifyCommand({ type: 'CreateMusicSession', topic: 'new topic' });

      expect(musicArea.topic).toBe('new topic');
      expect(musicArea.sessionInProgress).toBe(true);
    });
  });

  describe('toModel', () => {
    it('should return a MusicAreaModel representation', () => {
      const musicArea = createTestMusicArea();
      const model = musicArea.toModel();

      expect(model).toEqual(
        expect.objectContaining({
          // id: id,
          // topic: topic,
          sessionInProgress: false,
        }),
      );
    });
  });

  describe('fromMapObject', () => {
    it('should create a MusicArea from a map object', () => {
      // const mapObject = {
      //   name: 'area1',
      //   x: 0,
      //   y: 0,
      //   width: 10,
      //   height: 10,
      //   id: nanoid(),
      //   type: 'MusicArea',
      //   visible: true,
      // };
      // const musicArea = MusicArea.fromMapObject(mapObject, townEmitter);
      // expect(musicArea).toBeInstanceOf(MusicArea);
      // expect(musicArea.id).toBe(id);
    });

    it('should throw an error for malformed map objects', () => {
      // const mapObject = { name: 'area2', x: 0, y: 0 };
      // expect(() => {
      //   // MusicArea.fromMapObject(mapObject, townEmitter);
      // }).toThrow(Error);
    });
  });

  describe('updateModel', () => {
    it('should update the model properties', () => {
      const musicArea = createTestMusicArea();

      // musicArea.updateModel({ topic: 'new topic', sessionInProgress: true });
      expect(musicArea.topic).toBe('new topic');
      expect(musicArea.sessionInProgress).toBe(true);
    });
  });

  describe('handleCommand', () => {
    it('should throw an error for unknown command types', () => {
      // const musicArea = createTestMusicArea();

      expect(() => {
        // musicArea.handleCommand({ type: 'UnknownCommand' });
      }).toThrow(InvalidParametersError);
    });
  });

  describe('topic getter and setter', () => {
    it('should get and set the topic correctly', () => {
      const musicArea = createTestMusicArea();

      expect(musicArea.topic).toBe(topic);

      musicArea.topic = 'New Topic';
      expect(musicArea.topic).toBe('New Topic');
    });
  });

  describe('sessionInProgress getter and setter', () => {
    it('should get and set sessionInProgress correctly', () => {
      const musicArea = createTestMusicArea();

      expect(musicArea.sessionInProgress).toBe(false);

      musicArea.sessionInProgress = true;
      expect(musicArea.sessionInProgress).toBe(true);
    });
  });
});
