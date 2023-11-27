import { AccessToken } from '@spotify/web-api-ts-sdk';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SpotifySdk from './SpotifySdk';
import SpotifyPlayback from './SpotifyPlayback';

export default function SpotifyMain(props: { accessToken: AccessToken }) {
  const router = useRouter();

  useEffect(() => {
    const params = router.query;
    (async () => {
      if (!params.code) {
        throw new Error('User Must be Logged In');
      }
    })();
  }, [props.accessToken, router.query]);

  return (
    <>
      {!props.accessToken ? (
        <>User Access Tokens Not Loaded</>
      ) : (
        <>
          <div>
            <SpotifyPlayback />
          </div>
          <div>
            <SpotifySdk userAccessToken={props.accessToken} />
          </div>
        </>
      )}
    </>
  );
}
