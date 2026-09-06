export default function FormCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-semibold text-foreground">{title}</h1>
      <div className="border border-border bg-card p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
