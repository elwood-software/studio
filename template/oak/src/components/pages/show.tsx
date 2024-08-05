import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {Feed} from '@/components/feed';
import {Link, PlayIcon} from 'lucide-react';

export function ShowPage(): JSX.Element {
  return (
    <div className="grid grid-cols-[3fr_1fr] grid-rows-[auto_1fr] size-full">
      <div className="border-b px-12 col-span-2">
        <h2 className="text-xl font-medium">The Latest</h2>
        <h3 className="text-muted-foreground">
          Highlights from recent episodes
        </h3>
        <Carousel className="mx-0 my-6">
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
      <div className="border-r px-12 py-6">
        <h2 className="text-xl font-medium">Updates</h2>
        <h3 className="text-muted-foreground">Direct from the team.</h3>
        <div className="mt-6">
          <Feed />
        </div>
      </div>
      <div className="">
        <header className="py-6 px-6">
          <h2 className="text-xl font-medium">Episode</h2>
          <h3 className="text-muted-foreground">Listen now</h3>
        </header>
        <div className="divide-y divide-border border-t space-y-6 mx-6 overflow-y-auto">
          <div className="pt-6">
            <time className="text-muted-foreground font-medium text-xs uppercase">
              Aug 1, 2021
            </time>

            <h4 className="font-bold mt-2 mb-1">1. Episode Title</h4>
            <p className="text-sm text-foreground/75">
              He’s going to need you to go ahead and come in on Saturday, but
              there’s a lot more to the story than you think.
            </p>
          </div>

          <div className="pt-6">
            <time className="text-muted-foreground font-medium text-xs uppercase">
              Aug 1, 2021
            </time>
            <h4 className="font-bold mt-2 mb-1">1. Episode Title</h4>
            <p className="text-sm text-foreground/75 mb-3">
              He’s going to need you to go ahead and come in on Saturday, but
              there’s a lot more to the story than you think.
            </p>

            <button className="flex items-center space-x-1 font-bold text-xs uppercase text-accent-foreground">
              <PlayIcon className="size-[0.9em]" />
              <span>Listen</span>
            </button>
          </div>

          <div className="pt-6">
            <time className="text-muted-foreground font-medium text-xs uppercase">
              Aug 1, 2021
            </time>

            <h4 className="font-bold mt-2 mb-1">1. Episode Title</h4>
            <p className="text-sm text-foreground/75">
              He’s going to need you to go ahead and come in on Saturday, but
              there’s a lot more to the story than you think.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
