export function HighlightText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return <>{text}</>;
  const end = index + q.length;
  return (
    <>
      {text.slice(0, index)}
      <span className="rounded bg-yellow-200/90 px-1 text-slate-950 shadow-[0_0_10px_rgba(250,204,21,0.6)]">
        {text.slice(index, end)}
      </span>
      {text.slice(end)}
    </>
  );
}
