import {makeProject} from '@revideo/core';

import {Audio, Img, makeScene2D, Video, Rect} from '@revideo/2d';
import {all, chain, useScene, createRef, waitFor} from '@revideo/core';

/**
 * The Revideo scene
 */
const scene = makeScene2D('scene', function* (view) {
  const logoRef = createRef<Img>();
  const scene = useScene();

  yield view.add(
    <>
      <Rect
        size={['100%', '100%']}
        fill={scene.variables.get('backgroundColor', '#E2FF31')()}
      />
      <Audio
        src={'https://revideo-example-assets.s3.amazonaws.com/chill-beat.mp3'}
        play={true}
        time={17.0}
      />
    </>,
  );

  yield* waitFor(1);

  view.add(
    <Img
      width={'1%'}
      ref={logoRef}
      src={
        'https://revideo-example-assets.s3.amazonaws.com/revideo-logo-white.png'
      }
    />,
  );

  yield* chain(
    all(logoRef().scale(40, 2), logoRef().rotation(360, 2)),
    logoRef().scale(60, 1),
  );
});

export default makeProject({
  scenes: [scene],
  settings: {
    shared: {
      size: {x: 1920, y: 1080},
    },
  },
});
