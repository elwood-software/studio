'use client';

import {PlayIcon} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {randomUUID} from 'crypto';
import {MouseEvent} from 'react';
import {usePlayController} from '@/hooks/use-play-controller';

const episodes = [
  {
    id: 'a',
    number: 1,
    title: 'Episode Title',
    description:
      'He’s going to need you to go ahead and come in on Saturday, but there’s a lot more to the story than you think.',
    date: new Date(),
  },
  {
    id: 'b',
    number: 2,
    title: 'Episode Title',
    description:
      'He’s going to need you to go ahead and come in on Saturday, but there’s a lot more to the story than you think.',
    date: new Date(),
  },
  {
    id: 'c',
    number: 2,
    title: 'Episode Title',
    description:
      'He’s going to need you to go ahead and come in on Saturday, but there’s a lot more to the story than you think.',
    date: new Date(),
  },
  {
    id: 'aa',
    number: 1,
    title: 'Episode Title',
    description:
      'He’s going to need you to go ahead and come in on Saturday, but there’s a lot more to the story than you think.',
    date: new Date(),
  },
  {
    id: 'bb',
    number: 2,
    title: 'Episode Title',
    description:
      'He’s going to need you to go ahead and come in on Saturday, but there’s a lot more to the story than you think.',
    date: new Date(),
  },
  {
    id: 'cc',
    number: 2,
    title: 'Episode Title',
    description:
      'He’s going to need you to go ahead and come in on Saturday, but there’s a lot more to the story than you think.',
    date: new Date(),
  },
];

export function ShowPage(): JSX.Element {
  const playController = usePlayController();

  function onPlayPauseClick(id: string, e: MouseEvent) {
    e.preventDefault();

    if (playController.playing && playController.currentId === id) {
      playController.pause();
      return;
    }

    playController.play(id);
  }

  return (
    <div className="grid grid-cols-[3fr_1fr] grid-rows-[auto_1fr] size-full">
      <div className="border-b px-12 py-12 col-span-2">
        <h2 className="text-xl font-medium">The Latest</h2>
        <h3 className="text-muted-foreground">
          Highlights, recent episodes, exclusives, and more
        </h3>
        <Carousel className="mx-0 mt-6">
          <CarouselContent>
            <CarouselItem className="basis-1/3">
              <a href="/podcast/asdasd/episode/asdasd/video/asdasd">
                <img src="https://placehold.co/600x400" />
                <h3>Poop</h3>
              </a>
            </CarouselItem>
            <CarouselItem className="basis-1/3">
              <a href="/epsiode/asdadasd">
                <img src="https://placehold.co/600x400" />
              </a>
            </CarouselItem>
            <CarouselItem className="basis-1/3">
              <img src="https://placehold.co/600x400" />
            </CarouselItem>
            <CarouselItem className="basis-1/3">
              <img src="https://placehold.co/600x400" />
            </CarouselItem>
            <CarouselItem className="basis-1/3">
              <img src="https://placehold.co/600x400" />
            </CarouselItem>
            <CarouselItem className="basis-1/3">
              <img src="https://placehold.co/600x400" />
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>

      <div className="p-12">
        <header className="pb-6">
          <h2 className="text-xl font-medium">Episode</h2>
          <h3 className="text-muted-foreground">Listen now</h3>
        </header>
        <div className="space-y-6 overflow-y-auto">
          {episodes.map(episode => (
            <div className="pt-6" key={`ShowPage-Episode-${episode.id}`}>
              <time className="text-muted-foreground font-medium text-xs uppercase">
                {episode.date.toDateString()}
              </time>

              <h4 className="font-bold mt-2 mb-1">
                {episode.number}. {episode.title}
              </h4>
              <p className="text-sm text-foreground/75 mb-3">
                {episode.description}
              </p>
              <button
                onClick={e => onPlayPauseClick(episode.id, e)}
                className="flex items-center space-x-1 font-bold text-xs uppercase text-accent-foreground text-brand hover:text-underline">
                <PlayIcon className="size-[0.9em]" />
                <span>Listen</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
