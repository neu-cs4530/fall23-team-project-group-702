import { Modal, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import { useInteractable, useInteractableAreaController } from "../../../../classes/TownController";
import useTownController from "../../../../hooks/useTownController";
import MusicAreaInteractable from "../MusicArea";
import { useCallback } from "react";

/**
 * A wrapper component for the TicTacToeArea component.
 * Determines if the player is currently in a tic tac toe area on the map, and if so,
 * renders the TicTacToeArea component in a modal.
 *
 */
 export default function FirstMusic(): JSX.Element {
    const musicArea = useInteractable<MusicAreaInteractable>('musicArea');
    const townController = useTownController();
    const closeModal = useCallback(() => {
      if (musicArea) {
        townController.interactEnd(musicArea);
      }
    }, [townController, musicArea]);
    console.log('First Music render...')
    if (musicArea) {
      return (
        <Modal isOpen={true} onClose={closeModal} closeOnOverlayClick={false}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{musicArea.name ? musicArea.name : musicArea.id }</ModalHeader>
            <ModalCloseButton />
            This is modal content, hello world.
          </ModalContent>
        </Modal>
      );
    }
    return <></>;
  }