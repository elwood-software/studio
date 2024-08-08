export type CurrencyProps = {
  value: number;
  decimal?: string;
};

export function Currency(props: CurrencyProps) {
  const num = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(props.value / 100);

  return <>{num}</>;
}
