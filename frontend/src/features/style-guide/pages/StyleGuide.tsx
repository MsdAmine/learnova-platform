import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card';
import { Container } from '../../../components/ui/Container';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Stat } from '../../../components/ui/Stat';

// ─── helpers ─────────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-text-muted">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
  );
}

function Divider() {
  return <hr className="border-border-default" />;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function StyleGuide() {
  return (
    <div className="min-h-screen bg-surface py-16">
      <Container>

        {/* Page header */}
        <div className="mb-16">
          <SectionHeader
            eyebrow="Dev only"
            title="Style Guide"
            description="Every primitive from src/components/ui rendered in all variants and states."
          />
        </div>

        <div className="flex flex-col gap-16">

          {/* ── Button ──────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-8">
            <SectionHeader eyebrow="Primitive" title="Button" />
            <Divider />

            <Row label="Variants · size md">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <div className="bg-salem rounded-md p-3">
                <Button variant="inverted">Inverted</Button>
              </div>
            </Row>

            <Row label="Sizes · variant primary">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Row>

            <Row label="Loading state">
              <Button variant="primary" loading>Primary</Button>
              <Button variant="secondary" loading>Secondary</Button>
              <Button variant="ghost" loading>Ghost</Button>
            </Row>

            <Row label="Disabled state">
              <Button variant="primary" disabled>Primary</Button>
              <Button variant="secondary" disabled>Secondary</Button>
              <Button variant="ghost" disabled>Ghost</Button>
            </Row>

            <Row label="Sizes × loading">
              <Button size="sm" loading>Small</Button>
              <Button size="md" loading>Medium</Button>
              <Button size="lg" loading>Large</Button>
            </Row>
          </section>

          {/* ── Badge ───────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-8">
            <SectionHeader eyebrow="Primitive" title="Badge" />
            <Divider />

            <Row label="Variants">
              <Badge variant="default">Default</Badge>
              <Badge variant="salem">Enrolled</Badge>
              <Badge variant="coral">Alert</Badge>
              <Badge variant="anzac">Achievement</Badge>
              <Badge variant="azure">Informational</Badge>
            </Row>

            <Row label="Typical use-case labels">
              <Badge variant="salem">Active</Badge>
              <Badge variant="coral">Warning</Badge>
              <Badge variant="anzac">Completed</Badge>
              <Badge variant="azure">Analytics</Badge>
              <Badge variant="default">Neutral</Badge>
            </Row>
          </section>

          {/* ── Avatar ──────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-8">
            <SectionHeader eyebrow="Primitive" title="Avatar" />
            <Divider />

            <Row label="Sizes · initials">
              <Avatar size={24} name="Alice Baker" />
              <Avatar size={32} name="Charlie Doe" />
              <Avatar size={40} name="Eve Foster" />
              <Avatar size={56} name="Grace Hill" />
              <Avatar size={80} name="Ivan Jones" />
            </Row>

            <Row label="Palette sampling (initials)">
              <Avatar size={40} name="Alice Baker" />
              <Avatar size={40} name="Bob Chen" />
              <Avatar size={40} name="Carol Diaz" />
              <Avatar size={40} name="Daniel Evans" />
              <Avatar size={40} name="Eliza Ford" />
            </Row>

            <Row label="With stroke (stacking ring)">
              <Avatar size={40} name="Alice Baker" stroke />
              <Avatar size={40} name="Bob Chen" stroke />
              <Avatar size={40} name="Carol Diaz" stroke />
            </Row>

            <Row label="With image src">
              <Avatar
                size={40}
                name="Photo User"
                src="https://i.pravatar.cc/80?img=12"
              />
              <Avatar
                size={56}
                name="Photo User"
                src="https://i.pravatar.cc/112?img=33"
              />
              <Avatar
                size={80}
                name="Photo User"
                src="https://i.pravatar.cc/160?img=47"
              />
            </Row>

            <Row label="No content fallback (grey circle)">
              <Avatar size={40} />
              <Avatar size={56} />
            </Row>
          </section>

          {/* ── Stat ────────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-8">
            <SectionHeader eyebrow="Primitive" title="Stat" />
            <Divider />

            <Grid>
              <Card variant="stat">
                <Stat label="Total Learners" value="12,400" description="Across all active courses." />
              </Card>
              <Card variant="stat">
                <Stat label="Completion Rate" value="78%" description="Up 4 pts vs last month." />
              </Card>
              <Card variant="stat">
                <Stat label="Avg Rating" value="4.8" description="Based on 3,200 reviews." />
              </Card>
              <Card variant="stat">
                <Stat label="Revenue" value="$94,200" />
              </Card>
              <Card variant="stat">
                <Stat
                  label="Active Courses"
                  value={<span className="text-azure">42</span>}
                  description="Analytics context — azure value override."
                />
              </Card>
              <Card variant="stat">
                <Stat label="Label only, no description" value="100" />
              </Card>
            </Grid>
          </section>

          {/* ── Card ────────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-8">
            <SectionHeader eyebrow="Primitive" title="Card" />
            <Divider />

            <Row label="Variants">
              <span className="text-body-sm text-text-secondary">
                default · elevated · feature · stat
              </span>
            </Row>

            <Grid>
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Default card</CardTitle>
                  <CardDescription>Surface White, default border, 24 px padding.</CardDescription>
                </CardHeader>
                <CardContent className="mt-4">
                  <p className="text-body-sm text-text-secondary">General-purpose content area.</p>
                </CardContent>
                <CardFooter className="mt-4">
                  <Button size="sm">Action</Button>
                  <Button size="sm" variant="ghost">Cancel</Button>
                </CardFooter>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Elevated card</CardTitle>
                  <CardDescription>Tonal depth via tinted surface, no border.</CardDescription>
                </CardHeader>
                <CardContent className="mt-4">
                  <p className="text-body-sm text-text-secondary">Nested panels, tonal hierarchy.</p>
                </CardContent>
              </Card>

              <Card variant="feature">
                <CardHeader>
                  <CardTitle>Feature card</CardTitle>
                  <CardDescription>32 px padding — editorial / marketing use.</CardDescription>
                </CardHeader>
                <CardContent className="mt-4">
                  <p className="text-body-sm text-text-secondary">Wider breathing room for key content.</p>
                </CardContent>
                <CardFooter className="mt-6">
                  <Button size="sm">Learn more</Button>
                </CardFooter>
              </Card>

              <Card variant="stat">
                <CardHeader>
                  <CardTitle>Stat card</CardTitle>
                  <CardDescription>Compact 16 px padding for data display.</CardDescription>
                </CardHeader>
                <CardContent className="mt-3">
                  <Stat label="Example metric" value="99.9%" />
                </CardContent>
              </Card>
            </Grid>
          </section>

          {/* ── SectionHeader ───────────────────────────────────────────── */}
          <section className="flex flex-col gap-8">
            <SectionHeader eyebrow="Primitive" title="SectionHeader" />
            <Divider />

            <Row label="Align left (default) — with eyebrow + description" />
            <SectionHeader
              eyebrow="Eyebrow label"
              title="Left-aligned headline"
              description="Supporting description capped at 560 px. Body-lg scale, secondary ink."
            />

            <Row label="Align center — with eyebrow + description" />
            <SectionHeader
              eyebrow="Eyebrow label"
              title="Centered headline"
              description="Same structure, centered layout — typical for landing-page sections."
              align="center"
            />

            <Row label="onDark — on Salem surface (align left)" />
            <div className="bg-salem rounded-lg p-8">
              <SectionHeader
                eyebrow="On-dark label"
                title="Dark section headline"
                description="Text switches to the on-dark palette: white / 85% / 60%."
                onDark
              />
            </div>

            <Row label="onDark + align center" />
            <div className="bg-salem rounded-lg p-8">
              <SectionHeader
                eyebrow="On-dark centered"
                title="Centered dark headline"
                description="Centered layout, on-dark palette. Used in hero / brand-intro blocks."
                align="center"
                onDark
              />
            </div>

            <Row label="Title only (no eyebrow, no description)" />
            <SectionHeader title="Minimal headline" />
          </section>

          {/* ── Container ───────────────────────────────────────────────── */}
          <section className="flex flex-col gap-8">
            <SectionHeader eyebrow="Primitive" title="Container" />
            <Divider />

            <div className="flex flex-col gap-4">
              {(['prose', 'default', 'wide'] as const).map((size) => (
                <div key={size} className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-text-muted">
                    size="{size}"
                  </span>
                  <Container
                    size={size}
                    className="border border-dashed border-border-default rounded-md py-3 !px-3"
                  >
                    <p className="text-body-sm text-text-secondary text-center">
                      {size === 'prose' && 'max-w-container-prose — long-form reading'}
                      {size === 'default' && 'max-w-container — standard page layout'}
                      {size === 'wide' && 'max-w-container-wide — full dashboard / data tables'}
                    </p>
                  </Container>
                </div>
              ))}
            </div>
          </section>

        </div>
      </Container>
    </div>
  );
}
