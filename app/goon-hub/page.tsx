import PageShell from '../components/ui/PageShell';
import SiteMapTerminal from '../components/SiteMapTerminal';

export default function SiteMapPage() {
  return (
    <PageShell maxWidth="lg" noPadding>
      <div className="flex items-start md:items-center justify-center h-[calc(100dvh-3.5rem)] overflow-hidden px-4 md:px-6">
        <div className="w-full" style={{ maxWidth: '1020px' }}>
          <SiteMapTerminal />
        </div>
      </div>
    </PageShell>
  );
}
