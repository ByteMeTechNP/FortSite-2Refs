import { AlertCircleIcon, CheckCircle2Icon, InfoIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const palette = [
  { name: 'Construction Amber', token: '--primary', hex: '#F59E0B' },
  {
    name: 'Primary text on amber',
    token: '--primary-foreground',
    hex: '#111827',
  },
  { name: 'Graphite sidebar', token: '--sidebar', hex: '#1F2937' },
  { name: 'Page text', token: '--foreground', hex: '#0F172A' },
  { name: 'Muted text', token: '--muted-foreground', hex: '#64748B' },
  { name: 'Blueprint', token: '--blueprint', hex: '#2563EB' },
  { name: 'Canvas', token: '--background', hex: '#F8FAFC' },
  { name: 'Surface', token: '--card', hex: '#FFFFFF' },
  { name: 'Muted surface', token: '--muted', hex: '#F1F5F9' },
  { name: 'Border', token: '--border', hex: '#E2E8F0' },
  { name: 'Input border', token: '--input', hex: '#64748B' },
  { name: 'Focus ring', token: '--ring', hex: '#D97706' },
] as const;

const sampleRows = [
  { id: 'EX-001', label: 'Example item A', status: 'Ready' },
  { id: 'EX-002', label: 'Example item B', status: 'Review' },
  { id: 'EX-003', label: 'Example item C', status: 'Draft' },
] as const;

function Section({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-foreground text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function DesignSystemPage() {
  return (
    <main className="mx-auto flex w-full max-w-[var(--fs-content-max)] flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Development only
        </p>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          FortSite Design System — Development Preview
        </h1>
        <p className="text-muted-foreground max-w-3xl text-base leading-relaxed">
          This gallery demonstrates shared UI components and styles only.
          Examples are illustrative; nothing here is saved or connected to
          production data.
        </p>
        <p>
          <Link
            to={ROUTE_PATHS.home}
            className="text-link font-medium underline-offset-4"
          >
            Back to foundation home
          </Link>
        </p>
      </header>

      <Separator />

      <Section title="Brand palette">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {palette.map((swatch) => (
            <div
              key={swatch.token}
              className="border-border bg-card overflow-hidden rounded-xl border"
            >
              <div
                className="border-border h-16 border-b"
                style={{ backgroundColor: swatch.hex }}
                aria-hidden="true"
              />
              <div className="flex flex-col gap-1 p-3 text-sm">
                <span className="text-foreground font-medium">
                  {swatch.name}
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  {swatch.token}
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  {swatch.hex}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4">
          <h1 className="text-2xl font-semibold tracking-tight">Page title</h1>
          <h2 className="text-xl font-semibold">Section title</h2>
          <h3 className="text-lg font-semibold">Subsection title</h3>
          <p className="text-base leading-relaxed">
            Body text uses primary `#0F172A` on Canvas or Surface with a
            readable line height.
          </p>
          <p className="text-muted-foreground text-sm">
            Captions use secondary `#475569` (required on subtle surfaces).
            Muted `#64748B` is only for helpers on white or canvas.
          </p>
          <p className="font-mono text-sm tabular-nums">
            Numeric sample: 1,234.50 · 98,765.00
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link action</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Icon example">
              <InfoIcon />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled>Disabled</Button>
            <Button loading>Saving</Button>
            <Button variant="outline">
              <CheckCircle2Icon aria-hidden="true" />
              With icon
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            Default and large buttons use a 44px-tall target. Small is a denser
            desktop size.
          </p>
        </div>
      </Section>

      <Section title="Cards and spacing">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Surface card</CardTitle>
              <CardDescription>
                White surface, steel border, 14px radius, restrained shadow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              Cards are for interactive or grouped content containers, not every
              row of data.
            </CardContent>
          </Card>
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle>Muted surface</CardTitle>
              <CardDescription>
                Use muted surfaces for secondary groupings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="mb-3" />
              Divider example above this sentence.
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid max-w-xl gap-4">
          <div className="grid gap-2">
            <Label htmlFor="gallery-name">Sample name</Label>
            <Input id="gallery-name" placeholder="Example value" />
            <p id="gallery-name-hint" className="text-muted-foreground text-sm">
              Helper text stays associated with the field visually.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gallery-notes">
              Notes <span className="text-muted-foreground">(required)</span>
            </Label>
            <Textarea
              id="gallery-notes"
              aria-required="true"
              placeholder="Short note"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gallery-invalid">Invalid example</Label>
            <Input
              id="gallery-invalid"
              aria-invalid="true"
              aria-describedby="gallery-invalid-error"
              defaultValue="Missing required detail"
            />
            <p id="gallery-invalid-error" className="text-danger text-sm">
              Enter a complete value. The red border alone is not the message.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="gallery-check" />
            <Label htmlFor="gallery-check">Sample checkbox</Label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gallery-disabled">Disabled field</Label>
            <Input id="gallery-disabled" disabled defaultValue="Not editable" />
          </div>
        </div>
      </Section>

      <Section title="Status badges">
        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Informational</Badge>
        </div>
      </Section>

      <Section title="Alerts">
        <div className="grid gap-3">
          <Alert>
            <InfoIcon aria-hidden="true" />
            <AlertTitle>Neutral notice</AlertTitle>
            <AlertDescription>
              Use alerts for short system messages, not for business workflows.
            </AlertDescription>
          </Alert>
          <Alert variant="success">
            <CheckCircle2Icon aria-hidden="true" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              A successful example with text and an icon.
            </AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertCircleIcon aria-hidden="true" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Warning uses dark text on a pale surface, not white on Amber.
            </AlertDescription>
          </Alert>
          <Alert variant="danger">
            <AlertCircleIcon aria-hidden="true" />
            <AlertTitle>Danger</AlertTitle>
            <AlertDescription>
              Danger alerts keep readable text and a clear title.
            </AlertDescription>
          </Alert>
        </div>
      </Section>

      <Section title="Table">
        <p className="text-muted-foreground text-sm">
          Fictitious example rows only. On narrow widths, scroll inside the
          table region.
        </p>
        <div
          className="border-border w-full overflow-x-auto rounded-xl border"
          role="region"
          aria-label="Example data table"
          tabIndex={0}
        >
          <Table className="min-w-[36rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono tabular-nums">
                    {row.id}
                  </TableCell>
                  <TableCell>{row.label}</TableCell>
                  <TableCell>{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      <Section title="Dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open sample dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sample dialog</DialogTitle>
              <DialogDescription>
                This dialog demonstrates focus management only. It does not save
                data or call a network service.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Navigation examples">
        <p className="text-muted-foreground text-sm">
          Generic section labels only. These are not product role menus.
        </p>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Section</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Example</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Tabs defaultValue="one" className="max-w-xl">
          <TabsList>
            <TabsTrigger value="one">Example one</TabsTrigger>
            <TabsTrigger value="two">Example two</TabsTrigger>
          </TabsList>
          <TabsContent
            value="one"
            className="text-muted-foreground pt-3 text-sm"
          >
            First sample tab panel.
          </TabsContent>
          <TabsContent
            value="two"
            className="text-muted-foreground pt-3 text-sm"
          >
            Second sample tab panel.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Generic states">
        <div className="grid gap-6 md:grid-cols-3">
          <LoadingState message="Loading example…" />
          <EmptyState
            title="Nothing here"
            description="An empty illustrative state for the gallery."
          />
          <ErrorState message="A safe illustrative error message." />
        </div>
      </Section>

      <Section title="Responsive notes">
        <Card>
          <CardHeader>
            <CardTitle>Viewport behavior</CardTitle>
            <CardDescription>
              Tailwind breakpoints: sm 640, md 768, lg 1024, xl 1280, 2xl 1536.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Resize this page. The palette grid collapses, the table scrolls
            inside its region, and dialogs stay within the viewport. Reduced
            motion preferences disable non-essential animation.
          </CardContent>
        </Card>
      </Section>
    </main>
  );
}
