import {
    Button,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useToast,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useInteractable } from '../../../classes/TownController';
import { Omit_MusicArea_type_ } from '../../../generated/client';
import useTownController from '../../../hooks/useTownController';

export default function NewConversationModal(): JSX.Element {
    const coveyTownController = useTownController();
    const musicArea = useInteractable('musicArea');

    const isOpen = musicArea !== undefined;

    useEffect(() => {
        if (musicArea) {
            coveyTownController.pause();
        } else {
            coveyTownController.unPause();
        }
    }, [coveyTownController, musicArea]);

    const closeModal = useCallback(() => {
        if (musicArea) {
            coveyTownController.interactEnd(musicArea);
        }
    }, [coveyTownController, musicArea]);

    const toast = useToast();

    const createMusicArea = useCallback(async () => {
        if (musicArea) {
            const musicAreaToCreate: Omit_MusicArea_type_ = {
                id: musicArea.name,
                occupants: [],
            };
            try {
                await coveyTownController.createMusicArea(musicAreaToCreate);
                toast({
                    title: 'Conversation Created!',
                    status: 'success',
                });
                coveyTownController.unPause();
                closeModal();
            } catch (err) {
                if (err instanceof Error) {
                    toast({
                        title: 'Unable to create conversation',
                        description: err.toString(),
                        status: 'error',
                    });
                } else {
                    console.trace(err);
                    toast({
                        title: 'Unexpected Error',
                        status: 'error',
                    });
                }
            }
        }
    }, [coveyTownController, musicArea, closeModal, toast]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                closeModal();
                coveyTownController.unPause();
            }}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader> Music Area </ModalHeader>
            </ModalContent>
        </Modal>
    );
}
