export type CurrencyProps = {
  value: number;
};

export function Currency(props: CurrencyProps) {
  const num = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(props.value);

  return <>{num}</>;
}
