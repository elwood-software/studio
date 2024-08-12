'use client';
import {useEffect, useRef, useState} from 'react';
import {useMeasure} from 'react-use';

import {VideoPlayer} from '@/components/player/video';

import {usePlayerControl} from '@/hooks/use-player-control';

export function VideoPage() {
  const {video} = usePlayerControl();
  function play() {
    video.play();
  }

  return (
    <>
      <VideoPlayer name="video-page" />

      <button onClick={play}>Play</button>

      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
      <div>asadasd</div>
    </>
  );
}
