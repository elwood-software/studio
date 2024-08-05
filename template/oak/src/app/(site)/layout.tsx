import {PropsWithChildren} from 'react';
import {Layout} from '@/components/layout';

export default async function SiteLayout(props: PropsWithChildren) {
  return <Layout sidebar={<>a</>}>{props.children}</Layout>;
}
