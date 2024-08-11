export function FatalError(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-6xl">500</h1>
      <h2 className="text-2xl">Internal Server Error</h2>
    </div>
  );
}
