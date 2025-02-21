import {makeProject} from '@revideo/core';
import {Audio, Img, makeScene2D, Rect} from '@revideo/2d';
import {tween, useScene, createRef} from '@revideo/core';

const scene = makeScene2D('scene', function* (view) {
  const logoRef = createRef<Img>();

  const url = useScene().variables.get('thumbnailUrl', '');
  const backgroundColor = useScene().variables.get('backgroundColor', '#000');

  yield view.add(
    <>
      <Rect size={['100%', '100%']} fill={backgroundColor} />
      <Img
        ref={logoRef}
        width={'20%'}
        src={url}
        shadowColor="rgba(0,0,0,0.4)"
        shadowBlur={100}
        shadowOffset={[0, 0]}
        radius={22}
        smoothCorners={true}
        position={[0, -100]}
      />
      <Audio
        src={'https://revideo-example-assets.s3.amazonaws.com/chill-beat.mp3'}
        play={true}
        time={17.0}
      />
    </>,
  );

  yield* tween(5, () =>
    logoRef().scale(1.01, 1.01).wait(1).to(0.99, 0.99).wait(1).to(1, 1),
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
