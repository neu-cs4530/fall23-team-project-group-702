import { Button, FormControl, FormLabel, Input, Modal, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import { useInteractable, useInteractableAreaController } from "../../../../classes/TownController";
import useTownController from "../../../../hooks/useTownController";
import MusicAreaInteractable from "../MusicArea";
import { useCallback, useEffect, useState } from "react";
import SpotifyMain from "./SpotifyMain";
import { set } from "ramda";

/**
 * Jukebox Interface Component that handles rendering the join/create music session modal and the music playback interface modal.
 */
export default function FirstMusic(): JSX.Element {
  const musicArea = useInteractable<MusicAreaInteractable>('musicArea');
  const townController = useTownController();

  const [sessionName, setSessionName] = useState<string>('');
  const [sessionActive, setSessionActive] = useState<boolean>(false); // TODO should use environment by default

  const isOpen = musicArea !== undefined;

  useEffect(() => {
    (async () => {
      const loginResponse = await fetch("http://localhost:3000/api/login?hello=hello", {
        method: "POST",
      });
      const loginData = await loginResponse.json();
      if (!loginData) {
        throw new Error("Unable to get Spotify login URL");
      }
      if (loginData === 'Already created') {
        setSessionActive(true);
      } else {
        setSessionActive(true);
      }
    });
  }, []);

  useEffect(() => {
    if (musicArea) {
      townController.pause();
    } else {
      townController.unPause();
    }
  }, [townController, musicArea]);

  const closeModal = useCallback(() => {
    if (musicArea) {
      townController.interactEnd(musicArea);
    }
  }, [townController, musicArea]);

  const handleStartMusicSession = () => {
    setSessionActive(true);
  };

  if (musicArea && musicArea.getType() === 'musicArea') {
    console.log('Rendering first music');
    if (!sessionActive) {
      return (
        <Modal
          isOpen={isOpen}
          onClose={() => {
            closeModal();
            townController.unPause();
          }}
          closeOnOverlayClick={false}>
          <ModalOverlay />

          <ModalContent>
            <ModalHeader> Start a Music Session</ModalHeader>
            <ModalCloseButton />
            <p>Open Lounge Jukebox 1</p> {/* should be replaced with jukebox item name */}
            <form>
              <FormControl>
                <FormLabel htmlFor='topic'>Name of Music Session</FormLabel>
                <Input
                  id='name'
                  placeholder='What are the vibes'
                  name='name'
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                />
              </FormControl>
            </form>
            <Button colorScheme='blue' mr={3} onClick={handleStartMusicSession}>
              Create
            </Button>
            <Button>Cancel</Button>
          </ModalContent>
        </Modal>
      );
    } else {
      return (
        <Modal
          isOpen={isOpen}
          onClose={() => {
            closeModal();
            setSessionActive(false); // TODO should be based on when owner closes
            townController.unPause();
          }}
          closeOnOverlayClick={false}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{sessionName}</ModalHeader>
            <ModalCloseButton />
            <SpotifyMain />

          </ModalContent>
        </Modal>
      )
    }
  }
  return <></>;
}