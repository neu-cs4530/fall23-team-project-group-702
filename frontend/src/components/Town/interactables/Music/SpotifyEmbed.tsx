import { Box, Button, ResponsiveValue } from '@chakra-ui/react';
import React from 'react';
import { useEffect, useState } from 'react';

export default function SpotifyEmbed() {
  const [isPaused, setIsPaused] = useState(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [controller, setController] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);

  //   function colorChange(): ResponsiveValue<visuallyHiddenStyle> | undefined {
  //     let visibility;
  //     if (isVisible) {
  //       visibility = 'visible';
  //     } else {
  //       visibility = 'hidden';
  //     }
  //     return visibility;
  //   };

  const handleVisibilityChange = () => {
    setIsVisible(!isVisible);
  };

  useEffect(() => {
    console.log('Is Playing: ', !isPaused);
  }, [isPaused]);

  useEffect(() => {
    if (controller) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      controller.addListener('playback_update', (e: any) => {
        if (e.data.isPaused !== isPaused) {
          setIsPaused(e.data.isPaused);
        }
      });
    }
  }, [controller]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    document.body.appendChild(script);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).onSpotifyIframeApiReady = (IFrameAPI: any) => {
      const element = document.getElementById('embed-iframe');
      const options = {
        width: isVisible ? '100%' : '0',
        height: isVisible ? '100%' : '0',
        uri: 'spotify:track:4mn5HdatHKN7iFGDes9G8i',
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callback = (EmbedController: any) => {
        EmbedController.addListener('ready', () => {
          console.log('The Embed has initialized');
          setController(EmbedController);
          EmbedController.togglePlay();
        });
      };
      IFrameAPI.createController(element, options, callback);
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);
  //   return (
  //     <>
  //       <div>
  //         <Box
  //           id='embed-iframe'
  //           sx={{
  //             // display: !controller ? 'block' : 'none',
  //             display: 'none',
  //           }}></Box>
  //       </div>
  //     </>
  //   );
  if (!controller) {
    return (
      <>
        <Box id='embed-iframe'></Box>
      </>
    );
  } else {
    return (
      <>
        <Box
          id='embed-iframe'
          sx={
            {
              // display: !isVisible ? 'block' : 'none',
              // display: 'none',
              // visibility={isVisible ? 'visible' : 'hidden'}
            }
          }></Box>
        <Button onClick={handleVisibilityChange}>Adjust Visibility</Button>
        {JSON.stringify(isVisible)}
      </>
    );
  }
}
