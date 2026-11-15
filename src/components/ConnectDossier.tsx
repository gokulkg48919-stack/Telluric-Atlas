import { AlertCircle, Check, Copy, Loader2, Mail, Send, Sparkles } from 'lucide-react';
import { FormEvent, useState } from 'react';

type CollaborationScope =
  | 'Software Development'
  | 'AI Automation'
  | 'Web Engineering'
  | 'Hackathon Partnership';

const COLLABORATION_SCOPES: CollaborationScope[] = [
  'Software Development',
  'AI Automation',
  'Web Engineering',
  'Hackathon Partnership',
];

const COLLABORATION_PILLARS: Array<{ title: string; summary: string }> = [
  {
    title: 'Software Architecture',
    summary: 'Resilient full-stack systems engineered for clarity, speed, and real-world scale.',
  },
  {
    title: 'Intelligent Automation',
    summary: 'Streamlined workflows, smart pipelines, and purposeful algorithmic tooling.',
  },
  {
    title: 'Interactive Web & 3D',
    summary: 'High-craft browser experiences uniting WebGL precision with modern interfaces.',
  },
  {
    title: 'Hackathon & R&D Sprints',
    summary: 'Rapid collaborative prototyping from first principles to polished production.',
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ConnectDossier() {
  const [copied, setCopied] = useState(false);
  const [scope, setScope] = useState<CollaborationScope>('Software Development');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'error' | 'relay_unavailable';
    text: string;
    mailtoHref?: string;
  } | null>(null);

  const emailInvalid =
    touchedEmail && email.trim().length > 0 && !EMAIL_PATTERN.test(email.trim());

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('codegava@gmail.com');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouchedEmail(true);
    setSubmitStatus(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      setSubmitStatus({
        type: 'error',
        text: 'Please complete Full Name, Email Address, Project Type / Subject, and Message.',
      });
      return;
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setSubmitStatus({
        type: 'error',
        text: 'Please enter a valid email address.',
      });
      return;
    }

    setSubmitting(true);
    const compiledSubject = `[${scope}] ${trimmedSubject}`;
    const compiledBody = `Full Name: ${trimmedName}\nReply Email: ${trimmedEmail}\nCollaboration Scope: ${scope}\n\n${trimmedMessage}`;
    const mailtoHref = `mailto:codegava@gmail.com?subject=${encodeURIComponent(
      compiledSubject
    )}&body=${encodeURIComponent(compiledBody)}`;

    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitStatus({
        type: 'relay_unavailable',
        text: 'No live mail relay is configured in this browser sandbox. Launch your email client pre-addressed to codegava@gmail.com:',
        mailtoHref,
      });
    }, 350);
  };

  return (
    <aside
      aria-label="CODE GAVA Let's Connect Hub"
      className="flex h-full w-full flex-col border-t border-white/10 bg-[#05070d]/35 lg:border-t-0 lg:border-r lg:border-white/10 [text-shadow:0_1px_12px_rgba(0,0,0,0.92)]"
    >
      {/* Fixed Executive Brand Header */}
      <div className="shrink-0 border-b border-white/12 px-6 pt-5 pb-4">
        <p className="font-mono-tabular text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300/90">
          Collaborative Engineering Collective
        </p>

        <div className="mt-1.5 flex items-baseline justify-between gap-4">
          <h2 className="font-display bg-gradient-to-r from-white via-sky-100 to-cyan-300 bg-clip-text text-[26px] font-bold tracking-tight text-transparent">
            CODE GAVA
          </h2>
          <span className="font-mono-tabular text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
            Let&apos;s Connect
          </span>
        </div>

        <dl className="mt-3.5 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-white/12 pt-3.5">
          <div className="col-span-2">
            <dt className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Brand Identity
            </dt>
            <dd className="font-display mt-0.5 text-[13px] font-semibold tracking-[0.12em] text-slate-100">
              THINK. BUILD. AUTOMATE. INNOVATE.
            </dd>
          </div>
          <div>
            <dt className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Focus
            </dt>
            <dd className="mt-0.5 text-[13px] font-medium text-white">
              Systems &amp; Automation
            </dd>
          </div>
          <div>
            <dt className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Direct Mail
            </dt>
            <dd className="mt-0.5 text-[13px] font-medium">
              <a
                href="mailto:codegava@gmail.com"
                className="text-sky-300 underline decoration-sky-300/40 underline-offset-4 transition-colors hover:text-white"
              >
                codegava@gmail.com
              </a>
            </dd>
          </div>
        </dl>
      </div>

      {/* Scrollable Team Vision, Pillars & Multi-Channel Connection Hub */}
      <div className="dossier-scroll flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Hero Vision */}
        <section className="border-b border-white/10 pb-5">
          <h3 className="font-display text-xl font-semibold leading-snug tracking-tight text-white">
            Have an Idea? Let&apos;s Build{' '}
            <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
              Something Extraordinary.
            </span>
          </h3>
          <p className="mt-3 text-[14.5px] leading-[1.72] text-slate-200/95">
            We are <strong className="font-semibold text-white">CODE GAVA</strong>, a collaborative
            team passionate about technology, software development, innovation and automation. We
            believe in transforming creative ideas into meaningful digital experiences through
            teamwork, experimentation and technology. Have an interesting idea, collaboration
            opportunity or something exciting to discuss? Let&apos;s connect!
          </p>
        </section>

        {/* Core Engineering Pillars */}
        <section className="border-b border-white/10 pb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300/90 shrink-0" aria-hidden="true" />
            <h3 className="font-mono-tabular text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/90">
              What We Build Together
            </h3>
          </div>
          <ul className="mt-3 space-y-2.5">
            {COLLABORATION_PILLARS.map((pillar) => (
              <li
                key={pillar.title}
                className="border-l-2 border-cyan-400/35 pl-3.5 text-[13.5px] leading-relaxed text-slate-200/95"
              >
                <span className="font-display font-semibold text-white">{pillar.title}</span>
                <span className="text-slate-400"> — </span>
                <span>{pillar.summary}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Multi-Channel Connection Hub */}
        <section className="space-y-4">
          <div>
            <h3 className="font-mono-tabular text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/90">
              Multi-Channel Connection Hub
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
              Reach <span className="font-medium text-white">Contact CODE GAVA</span> directly or
              send a structured project brief below.
            </p>
          </div>

          {/* Direct Email Card */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-400/25 bg-white/[0.04] px-3.5 py-2.5 transition-colors hover:border-cyan-300/45">
            <div className="flex items-center gap-2.5 text-sm">
              <Mail className="h-4 w-4 text-cyan-300 shrink-0" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="font-mono-tabular text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  Contact CODE GAVA
                </span>
                <a
                  href="mailto:codegava@gmail.com"
                  className="font-medium text-sky-300 underline decoration-sky-300/40 underline-offset-4 transition-colors hover:text-white"
                >
                  codegava@gmail.com
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:border-cyan-300/60 hover:bg-cyan-500/15 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                  <span>Copied to clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                  <span>Copy email</span>
                </>
              )}
            </button>
          </div>

          {/* Collaboration Scope Selector */}
          <div>
            <p className="font-mono-tabular mb-2 text-[10.5px] font-medium uppercase tracking-[0.15em] text-slate-300">
              Collaboration Scope
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COLLABORATION_SCOPES.map((item) => {
                const active = scope === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setScope(item)}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'border-cyan-300/70 bg-cyan-500/20 text-white'
                        : 'border-white/15 bg-white/[0.03] text-slate-300 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validated Project Inquiry Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="cg-full-name"
                  className="block text-xs font-medium text-slate-200"
                >
                  Full Name
                </label>
                <input
                  id="cg-full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name or team"
                  className="mt-1 w-full rounded-md border border-white/15 bg-[#05070d]/60 px-3 py-2 text-xs text-white placeholder:text-slate-500 transition-colors focus:border-cyan-400/75 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="cg-email"
                  className="block text-xs font-medium text-slate-200"
                >
                  Email Address
                </label>
                <input
                  id="cg-email"
                  type="email"
                  required
                  value={email}
                  onBlur={() => setTouchedEmail(true)}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className={`mt-1 w-full rounded-md border bg-[#05070d]/60 px-3 py-2 text-xs text-white placeholder:text-slate-500 transition-colors focus:outline-none ${
                    emailInvalid
                      ? 'border-rose-400/80 focus:border-rose-400'
                      : 'border-white/15 focus:border-cyan-400/75'
                  }`}
                />
                {emailInvalid && (
                  <p className="mt-1 text-[11px] text-rose-300">
                    Enter a valid email format.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="cg-subject"
                className="block text-xs font-medium text-slate-200"
              >
                Project Type / Subject
              </label>
              <input
                id="cg-subject"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={`${scope} inquiry`}
                className="mt-1 w-full rounded-md border border-white/15 bg-[#05070d]/60 px-3 py-2 text-xs text-white placeholder:text-slate-500 transition-colors focus:border-cyan-400/75 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="cg-message"
                className="block text-xs font-medium text-slate-200"
              >
                Message
              </label>
              <textarea
                id="cg-message"
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your idea, timeline, or collaboration goals..."
                className="mt-1 w-full rounded-md border border-white/15 bg-[#05070d]/60 px-3 py-2 text-xs text-white placeholder:text-slate-500 transition-colors focus:border-cyan-400/75 focus:outline-none"
              />
            </div>

            {submitStatus && (
              <div
                role="status"
                className={`rounded-md border px-3 py-2 text-xs ${
                  submitStatus.type === 'error'
                    ? 'border-rose-400/40 bg-rose-500/10 text-rose-200'
                    : 'border-amber-400/40 bg-amber-500/10 text-amber-100'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="space-y-1.5">
                    <p>{submitStatus.text}</p>
                    {submitStatus.mailtoHref && (
                      <a
                        href={submitStatus.mailtoHref}
                        className="inline-flex items-center gap-1.5 font-medium text-sky-300 underline decoration-sky-300/50 underline-offset-4 hover:text-white"
                      >
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Open pre-filled email to codegava@gmail.com</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border border-cyan-400/45 bg-cyan-500/20 px-4 py-2 text-xs font-medium text-white transition-colors hover:border-cyan-300/80 hover:bg-cyan-500/30 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>Preparing Dispatch...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </aside>
  );
}
