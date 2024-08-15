import {useShow, UseShowResult} from '@/data/use-show';

export type WithShowProps = {
  id: string;
  children(props: UseShowResult): JSX.Element;
};

export function WithShow(props: WithShowProps): JSX.Element {
  const result = useShow(props.id);
  return props.children(result);
}
