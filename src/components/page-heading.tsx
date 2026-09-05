export function PageHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <div className="page-heading"><h1 className="page-title">{title}</h1>{action && <div className="page-heading-action">{action}</div>}</div>;
}
