export default function TypingIndicator({ names }) {
  const text =
    names.length === 0 ? '' : names.length === 1 ? `${names[0]} is typing` : names.length === 2 ? `${names[0]} and ${names[1]} are typing` : 'Several people are typing';
  return (
    <div className="h-7 px-4 sm:px-6" aria-live="polite" data-testid="typing">
      {names.length > 0 && (
        <p className="flex items-center gap-2 text-[13px] font-medium text-muted">
          <span className="flex gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) => <span key={i} className="dot h-1.5 w-1.5 rounded-full bg-accent" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </span>
          {text}…
        </p>
      )}
    </div>
  );
}
