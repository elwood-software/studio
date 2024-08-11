'use client';
import {useEffect, useRef, useState} from 'react';
import {useMeasure} from 'react-use';

import {usePlayerControl} from '@/hooks/use-player-control';

export function VideoPage() {
  const {video} = usePlayerControl();
  const ref = useRef<HTMLCanvasElement>(null);

  const [size, setSize] = useState([0, 0]);

  console.log(size);

  useEffect(() => {
    setSize([ref.current?.clientWidth ?? 0, ref.current?.clientHeight ?? 0]);
  }, [ref.current?.clientWidth, ref.current?.clientHeight]);

  useEffect(() => {
    if (video.ref?.current) {
      video.ref.current.style.width = `${size[0]}px`;
      video.ref.current.style.height = `${size[1]}px`;
    }
  }, [size]);

  useEffect(() => {
    const canvas_ = ref.current;
    const video_ = video.ref?.current;
    const context = canvas_!.getContext('2d');

    function draw() {
      context!.drawImage(video_!, 0, 0, size[0], size[1]);
      requestAnimationFrame(draw);
    }

    if (canvas_ && video_ && video_.readyState === video_.HAVE_ENOUGH_DATA) {
      draw();
    }
  }, [ref.current, video.ref?.current]);

  function play() {
    video.play();
  }

  return (
    <>
      <div className="bg-black border-b video-container relative">
        <div className="video-container-inner" />

        <canvas ref={ref} className="absolute inset-0 size-full" />
      </div>
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
