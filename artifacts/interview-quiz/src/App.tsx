import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, GripVertical, Lightbulb, RotateCcw, Shuffle, Target, X, Zap } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { questions, questionCount, type QuizQuestion } from '@/data/questions';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

type Screen = 'start' | 'quiz' | 'results' | 'review';
type Response = {
  correct: boolean;
  value: string | string[] | boolean[] | Record<string, string>;
};
type Session = {
  order: number[];
  choices: Record<string, string[]>;
  index: number;
  responses: Record<string, Response>;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
};
type Settings = { shuffleQuestions: boolean; shuffleAnswers: boolean };

const STORAGE_KEY = 'interview-quiz-session-v1';
const queryClient = new QueryClient();

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isSame(a: string[], b: string[]) {
  return a.length === b.length && a.every((value) => b.includes(value));
}

function Header({ onHome, compact = false }: { onHome?: () => void; compact?: boolean }) {
  return (
    <header className={`mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8 ${compact ? 'pb-3' : ''}`}>
      <button data-testid="button-home" onClick={onHome} className="group flex items-center gap-3 text-left">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[3px_3px_0_hsl(var(--accent))] transition-transform group-hover:-translate-y-0.5">
          <Target className="size-[18px]" strokeWidth={2.5} />
        </span>
        <span>
          <span className="block text-[15px] font-bold tracking-tight">Interview Quiz</span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground sm:block">Business fundamentals</span>
        </span>
      </button>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 sm:flex"><Zap className="size-3 text-accent" /> Focus mode</span>
        {onHome && <button data-testid="button-exit-quiz" onClick={onHome} className="rounded-lg px-2.5 py-1.5 font-medium transition-colors hover:bg-muted">Exit</button>}
      </div>
    </header>
  );
}

function Toggle({ label, checked, onChange, testId }: { label: string; checked: boolean; onChange: () => void; testId: string }) {
  return (
    <button data-testid={testId} onClick={onChange} className="flex items-center justify-between gap-5 text-left">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${checked ? 'border-primary bg-primary' : 'border-border bg-muted'}`}>
        <span className={`absolute top-1 size-4 rounded-full bg-card shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </span>
    </button>
  );
}

function StartScreen({ settings, setSettings, onStart, hasRecovery, onResume }: { settings: Settings; setSettings: (settings: Settings) => void; onStart: () => void; hasRecovery: boolean; onResume: () => void }) {
  return (
    <main className="study-grid min-h-[100dvh]">
      <Header />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-20 lg:pb-24 lg:pt-20">
        <section className="animate-rise-in">
          <div className="mb-7 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground"><span className="h-px w-8 bg-accent" /> A quieter way to prepare</div>
          <h1 className="max-w-xl text-[clamp(3.3rem,8vw,6.5rem)] font-bold leading-[.93] tracking-[-0.075em] text-primary">Know the<br /><span className="relative inline-block">business<span className="absolute -bottom-1 left-0 h-2 w-[76%] -rotate-2 rounded-full bg-accent/80 sm:h-3" /></span><br />behind the answer.</h1>
          <p className="mt-9 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">A focused practice session for your business and entrepreneurship exam. One question at a time, with clear feedback when it matters.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button data-testid="button-start-quiz" onClick={onStart} className="group inline-flex items-center justify-center gap-3 rounded-xl bg-primary px-6 py-4 text-sm font-bold text-primary-foreground shadow-[4px_4px_0_hsl(var(--accent))] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_hsl(var(--accent))] active:translate-y-0 active:shadow-[2px_2px_0_hsl(var(--accent))]">Start quiz <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" /></button>
            {hasRecovery && <button data-testid="button-resume-quiz" onClick={onResume} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-4 text-sm font-bold transition-colors hover:bg-muted"><RotateCcw className="size-4" /> Resume session</button>}
          </div>
          <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 border-t border-border/70 pt-5 text-xs text-muted-foreground">
            <span><strong className="font-mono text-foreground">42</strong> questions</span><span><strong className="font-mono text-foreground">5</strong> formats</span><span><strong className="font-mono text-foreground">100%</strong> private in your browser</span>
          </div>
        </section>
        <section className="animate-rise-in delay-2">
          <div className="rounded-2xl border border-border bg-card/85 p-5 shadow-[0_18px_50px_hsl(222_38%_19%_/_0.07)] backdrop-blur sm:p-7">
            <div className="mb-7 flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">Session setup</p><h2 className="mt-2 text-xl font-bold tracking-tight">Make it yours</h2></div><div className="grid size-10 place-items-center rounded-xl bg-accent/20 text-primary"><Shuffle className="size-5" /></div></div>
            <div className="space-y-5">
              <Toggle label="Shuffle questions" checked={settings.shuffleQuestions} onChange={() => setSettings({ ...settings, shuffleQuestions: !settings.shuffleQuestions })} testId="toggle-shuffle-questions" />
              <Toggle label="Shuffle answer choices" checked={settings.shuffleAnswers} onChange={() => setSettings({ ...settings, shuffleAnswers: !settings.shuffleAnswers })} testId="toggle-shuffle-answers" />
            </div>
            <div className="my-7 h-px bg-border" />
            <div className="rounded-xl bg-secondary/60 p-4"><div className="flex gap-3"><CircleHelp className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><p className="text-xs leading-5 text-muted-foreground">You’ll see single choice, multi-select, true or false, matching, and ordering questions. Your progress is saved automatically.</p></div></div>
            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground"><span>Estimated time</span><span className="font-mono font-bold text-foreground">20–30 min</span></div>
          </div>
          <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Built for steady progress, not pressure</p>
        </section>
      </div>
    </main>
  );
}

function FormatNote({ type }: { type: QuizQuestion['type'] }) {
  const labels = { single: 'Choose one', multi: 'Choose all that apply', boolean: 'True or false', matching: 'Match each item', ordering: 'Put in order' };
  return <span className="rounded-full bg-accent/20 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-primary">{labels[type]}</span>;
}

function OptionButton({ label, index, selected, submitted, correct, onClick }: { label: string; index: number; selected: boolean; submitted: boolean; correct: boolean; onClick: () => void }) {
  const state = submitted && correct ? 'border-emerald-600 bg-emerald-50 text-emerald-950' : submitted && selected ? 'border-red-500 bg-red-50 text-red-950' : selected ? 'border-primary bg-primary text-primary-foreground shadow-[3px_3px_0_hsl(var(--accent))]' : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary/50';
  return <button data-testid={`button-answer-${index + 1}`} disabled={submitted} onClick={onClick} className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${state}`}><span className={`grid size-8 shrink-0 place-items-center rounded-lg border font-mono text-xs font-bold ${selected ? 'border-current' : 'border-border text-muted-foreground group-hover:border-primary/40 group-hover:text-primary'}`}>{String.fromCharCode(65 + index)}</span><span className="flex-1 text-sm font-medium leading-6">{label}</span>{submitted && correct && <Check className="size-5 shrink-0 text-emerald-700" />}{submitted && selected && !correct && <X className="size-5 shrink-0 text-red-600" />}</button>;
}

function QuizScreen({ session, setSession, onExit, onFinish }: { session: Session; setSession: (session: Session) => void; onExit: () => void; onFinish: () => void }) {
  const question = questions.find((item) => item.id === session.order[session.index]) ?? questions[0];
  const response = session.responses[String(question.id)];
  const submitted = Boolean(response);
  const choiceOptions = session.choices[String(question.id)] ?? question.options ?? [];
  const [selected, setSelected] = useState<string[]>([]);
  const [booleans, setBooleans] = useState<(boolean | undefined)[]>(question.statements?.map(() => undefined) ?? []);
  const [matching, setMatching] = useState<Record<string, string>>({});
  const [ordering, setOrdering] = useState<string[]>(question.order ?? []);

  useEffect(() => {
    const existing = response?.value;
    setSelected(Array.isArray(existing) && question.type !== 'boolean' ? existing as string[] : typeof existing === 'string' ? [existing] : []);
    setBooleans(Array.isArray(existing) && question.type === 'boolean' ? existing as boolean[] : question.statements?.map(() => undefined) ?? []);
    setMatching(existing && !Array.isArray(existing) && typeof existing === 'object' ? existing as Record<string, string> : {});
    setOrdering(existing && Array.isArray(existing) && question.type === 'ordering' ? existing as string[] : session.choices[String(question.id)] ?? question.order ?? []);
  }, [question.id, response]);

  const isReady = question.type === 'single' ? selected.length === 1 : question.type === 'multi' ? selected.length > 0 : question.type === 'boolean' ? booleans.every((value, index) => value !== undefined && (response ? true : index >= 0)) : question.type === 'matching' ? Object.keys(matching).length === (question.pairs?.length ?? 0) : ordering.length > 0;
  const evaluate = () => {
    let value: Response['value'];
    let correct = false;
    if (question.type === 'single') { value = selected[0] ?? ''; correct = value === question.correct; }
    else if (question.type === 'multi') { value = selected; correct = isSame(selected, question.correct as string[]); }
    else if (question.type === 'boolean') { value = booleans as boolean[]; correct = booleans.every((answer, index) => answer === question.statements?.[index].answer); }
    else if (question.type === 'matching') { value = matching; correct = question.pairs?.every((pair) => matching[pair.left] === pair.right) ?? false; }
    else { value = ordering; correct = ordering.every((item, index) => item === question.order?.[index]); }
    setSession({ ...session, responses: { ...session.responses, [String(question.id)]: { value, correct } } });
  };
  const next = () => {
    if (session.index >= session.order.length - 1) onFinish();
    else setSession({ ...session, index: session.index + 1 });
  };
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && submitted) { event.preventDefault(); next(); return; }
      if (submitted || !/^[1-6]$/.test(event.key) || !['single', 'multi'].includes(question.type)) return;
      const index = Number(event.key) - 1;
      const value = choiceOptions[index];
      if (!value) return;
      setSelected((current) => question.type === 'single' ? [value] : current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  });
  const selectedFor = (value: string) => selected.includes(value);
  const correctFor = (value: string) => question.type === 'multi' ? (question.correct as string[]).includes(value) : value === question.correct;
  const typeLabel = question.type === 'multi' ? 'Select the best set of answers' : 'Select an answer to continue';

  return (
    <main className="study-grid min-h-[100dvh]">
      <Header onHome={onExit} compact />
      <div className="mx-auto max-w-4xl px-5 pb-14 pt-3 sm:px-8 sm:pt-8">
        <div className="mb-7 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="font-mono text-xs font-bold text-primary">{String(session.index + 1).padStart(2, '0')}</span><div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:w-48"><div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${((session.index + (submitted ? 1 : 0)) / session.order.length) * 100}%` }} /></div><span className="font-mono text-[10px] text-muted-foreground">of {session.order.length}</span></div><span className="rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[10px] text-muted-foreground">Score <b className="text-foreground">{Object.values(session.responses).filter((item) => item.correct).length}</b></span></div>
        <div key={question.id} className="animate-slide-in">
          <div className="mb-5 flex items-center justify-between gap-3"><FormatNote type={question.type} /><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{typeLabel}</span></div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_18px_50px_hsl(222_38%_19%_/_0.06)] sm:p-9">
            <h1 data-testid={`text-question-${question.id}`} className="max-w-3xl text-[clamp(1.35rem,3vw,2.25rem)] font-bold leading-[1.18] tracking-[-0.04em]">{question.prompt}</h1>
            {question.type === 'single' || question.type === 'multi' ? <div className="mt-8 grid gap-3">{choiceOptions.map((option, index) => <OptionButton key={option} label={option} index={index} selected={selectedFor(option)} submitted={submitted} correct={submitted && correctFor(option)} onClick={() => setSelected((current) => question.type === 'single' ? [option] : current.includes(option) ? current.filter((item) => item !== option) : [...current, option])} />)}</div> : null}
            {question.type === 'boolean' && <div className="mt-8 space-y-3">{question.statements?.map((statement, index) => <div key={statement.text} className="rounded-xl border border-border p-4"><p className="text-sm font-medium leading-6">{statement.text}</p><div className="mt-3 flex gap-2"><button data-testid={`button-true-${index}`} disabled={submitted} onClick={() => setBooleans((values) => values.map((value, i) => i === index ? true : value))} className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${booleans[index] === true ? submitted && statement.answer ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : submitted ? 'border-red-500 bg-red-50 text-red-800' : 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>True</button><button data-testid={`button-false-${index}`} disabled={submitted} onClick={() => setBooleans((values) => values.map((value, i) => i === index ? false : value))} className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${booleans[index] === false ? submitted && !statement.answer ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : submitted ? 'border-red-500 bg-red-50 text-red-800' : 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>False</button></div></div>)}</div>}
            {question.type === 'matching' && <div className="mt-8 space-y-3">{question.pairs?.map((pair, index) => <div key={pair.left} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr] sm:items-center"><span className="text-sm font-medium">{pair.left}</span><div className="relative"><select data-testid={`select-match-${index}`} disabled={submitted} value={matching[pair.left] ?? ''} onChange={(event) => setMatching({ ...matching, [pair.left]: event.target.value })} className={`w-full appearance-none rounded-lg border bg-background px-3 py-2.5 pr-9 text-sm ${submitted ? matching[pair.left] === pair.right ? 'border-emerald-600 text-emerald-800' : 'border-red-500 text-red-800' : 'border-input'}`}><option value="">Choose a description</option>{(session.choices[String(question.id)] ?? question.pairs?.map((item) => item.right) ?? []).map((description) => <option key={description} value={description}>{description}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div>)}</div>}
            {question.type === 'ordering' && <div className="mt-8 space-y-2">{ordering.map((item, index) => <div key={item} className="flex items-center gap-2 rounded-xl border border-border bg-background p-2"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary font-mono text-xs font-bold">{index + 1}</span><GripVertical className="size-4 text-muted-foreground" /><span className="flex-1 px-1 text-sm font-medium">{item}</span><button data-testid={`button-order-up-${index}`} disabled={submitted || index === 0} onClick={() => setOrdering((items) => { const nextItems = [...items]; [nextItems[index - 1], nextItems[index]] = [nextItems[index], nextItems[index - 1]]; return nextItems; })} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"><ChevronLeft className="size-4 rotate-90" /></button><button data-testid={`button-order-down-${index}`} disabled={submitted || index === ordering.length - 1} onClick={() => setOrdering((items) => { const nextItems = [...items]; [nextItems[index], nextItems[index + 1]] = [nextItems[index + 1], nextItems[index]]; return nextItems; })} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"><ChevronRight className="size-4 rotate-90" /></button></div>)}</div>}
            {submitted && <div className={`mt-7 rounded-xl border p-4 ${response.correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}><div className="flex items-center gap-2 text-sm font-bold">{response.correct ? <Check className="size-4 text-emerald-700" /> : <X className="size-4 text-red-700" />}{response.correct ? 'Correct — keep that momentum.' : 'Not quite. The correct answer is shown below.'}</div>{!response.correct && <p className="mt-2 border-l-2 border-red-300 pl-3 text-xs font-semibold leading-5 text-red-950"><span className="font-mono text-[9px] uppercase tracking-widest text-red-700">Correct answer</span><br />{formatCorrect(question)}</p>}{question.explanation && <p className="mt-2 pl-6 text-xs leading-5 text-muted-foreground">{question.explanation}</p>}</div>}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-muted-foreground">{!submitted && (question.type === 'multi' ? 'Select every answer that belongs.' : 'Press Enter after answering to continue.')}</span>{submitted ? <button data-testid="button-next-question" onClick={next} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5">{session.index === session.order.length - 1 ? 'See results' : 'Next question'} <ChevronRight className="size-4" /></button> : <button data-testid="button-submit-answer" disabled={!isReady} onClick={evaluate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40">Check answer <Check className="size-4" /></button>}</div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ResultsScreen({ session, onRestart, onReview, onHome }: { session: Session; onRestart: () => void; onReview: () => void; onHome: () => void }) {
  const correct = Object.values(session.responses).filter((item) => item.correct).length;
  const wrong = questionCount - correct;
  const percent = Math.round((correct / questionCount) * 100);
  const message = percent >= 80 ? 'A strong showing.' : percent >= 60 ? 'Good foundation. A little more review will sharpen it.' : 'Every miss is a useful place to focus next.';
  return <main className="study-grid min-h-[100dvh]"><Header onHome={onHome} compact /><div className="mx-auto max-w-4xl px-5 pb-16 pt-5 sm:px-8 sm:pt-14"><div className="animate-rise-in text-center"><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Session complete</span><h1 className="mt-4 text-5xl font-bold tracking-[-0.07em] text-primary sm:text-7xl">You showed up.</h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">{message}</p></div><div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_50px_hsl(222_38%_19%_/_0.07)]"><div className="border-r border-border p-5 text-center sm:p-8"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Score</p><p data-testid="text-final-score" className="mt-3 text-3xl font-bold text-primary sm:text-5xl">{correct}<span className="text-lg text-muted-foreground sm:text-2xl">/{questionCount}</span></p></div><div className="border-r border-border p-5 text-center sm:p-8"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Accuracy</p><p data-testid="text-final-percentage" className="mt-3 text-3xl font-bold text-primary sm:text-5xl">{percent}<span className="text-lg text-muted-foreground sm:text-2xl">%</span></p></div><div className="p-5 text-center sm:p-8"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">To review</p><p className="mt-3 text-3xl font-bold text-primary sm:text-5xl">{wrong}</p></div></div><div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border bg-card/75 p-5 sm:p-7"><div className="flex items-center justify-between text-xs font-medium"><span>Answer accuracy</span><span className="font-mono">{percent}%</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${percent}%` }} /></div><div className="mt-3 flex justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent" /> {correct} correct</span><span>{wrong} incorrect</span></div></div><div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"><button data-testid="button-restart-quiz" onClick={onRestart} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"><RotateCcw className="size-4" /> Restart quiz</button>{wrong > 0 && <button data-testid="button-review-wrong" onClick={onReview} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-bold transition-colors hover:bg-muted"><Lightbulb className="size-4" /> Review wrong answers</button>}</div></div></main>;
}

function ReviewScreen({ session, onBack, onRestart }: { session: Session; onBack: () => void; onRestart: () => void }) {
  const wrong = session.order.map((id) => questions.find((item) => item.id === id)).filter((question): question is QuizQuestion => Boolean(question && !session.responses[String(question.id)]?.correct));
  return <main className="study-grid min-h-[100dvh]"><Header onHome={onBack} compact /><div className="mx-auto max-w-4xl px-5 pb-16 pt-6 sm:px-8 sm:pt-12"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Reflection set</span><h1 className="mt-3 text-4xl font-bold tracking-[-0.06em] text-primary sm:text-5xl">Review the misses.</h1><p className="mt-3 text-sm text-muted-foreground">The questions worth one more quiet look.</p></div><button data-testid="button-back-results" onClick={onBack} className="inline-flex items-center gap-2 self-start rounded-lg px-2 py-2 text-sm font-bold transition-colors hover:bg-muted"><ChevronLeft className="size-4" /> Back to results</button></div>{wrong.length === 0 ? <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center"><Check className="mx-auto size-8 text-emerald-700" /><h2 className="mt-3 text-xl font-bold text-emerald-950">Nothing to review</h2><p className="mt-2 text-sm text-emerald-800">A clean sweep. Start a new session when you’re ready.</p></div> : <div className="mt-10 space-y-4">{wrong.map((question, index) => { const response = session.responses[String(question.id)]; const value = response?.value; return <article key={question.id} data-testid={`card-wrong-${question.id}`} className="animate-rise-in rounded-2xl border border-border bg-card p-5 sm:p-7" style={{ animationDelay: `${index * 45}ms` }}><div className="flex gap-4"><span className="font-mono text-xs font-bold text-red-600">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><div className="mb-4 flex flex-wrap items-center gap-2"><FormatNote type={question.type} /><span className="text-xs text-muted-foreground">Question {question.id}</span></div><h2 className="text-base font-bold leading-6 sm:text-lg">{question.prompt}</h2><div className="mt-5 grid gap-2 sm:grid-cols-2"><div className="rounded-xl border border-red-200 bg-red-50 p-3"><p className="font-mono text-[9px] uppercase tracking-widest text-red-700">Your answer</p><p className="mt-1 text-sm font-medium text-red-950">{formatResponse(question, value)}</p></div><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="font-mono text-[9px] uppercase tracking-widest text-emerald-700">Correct answer</p><p className="mt-1 text-sm font-medium text-emerald-950">{formatCorrect(question)}</p></div></div>{question.explanation && <p className="mt-4 border-l-2 border-accent pl-3 text-xs leading-5 text-muted-foreground">{question.explanation}</p>}</div></div></article>;})}</div>}<div className="mt-8 flex justify-center"><button data-testid="button-restart-from-review" onClick={onRestart} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold transition-colors hover:bg-muted"><RotateCcw className="size-4" /> Try a fresh session</button></div></div></main>;
}

function formatResponse(question: QuizQuestion, value: Response['value'] | undefined) {
  if (question.type === 'single') return String(value ?? 'No answer');
  if (question.type === 'multi') return Array.isArray(value) ? value.join(' · ') : 'No answer';
  if (question.type === 'boolean') return Array.isArray(value) ? value.map((item, index) => `${index + 1}. ${item ? 'True' : 'False'}`).join(' · ') : 'No answer';
  if (question.type === 'matching') return value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value).map(([key, answer]) => `${key}: ${answer}`).join(' · ') : 'No answer';
  return Array.isArray(value) ? value.join(' → ') : 'No answer';
}

function formatCorrect(question: QuizQuestion) {
  if (question.type === 'single') return String(question.correct);
  if (question.type === 'multi') return (question.correct as string[]).join(' · ');
  if (question.type === 'boolean') return question.statements?.map((item, index) => `${index + 1}. ${item.answer ? 'True' : 'False'}`).join(' · ');
  if (question.type === 'matching') return question.pairs?.map((item) => `${item.left}: ${item.right}`).join(' · ');
  return question.order?.join(' → ');
}

function Home() {
  const [screen, setScreen] = useState<Screen>('start');
  const [settings, setSettings] = useState<Settings>({ shuffleQuestions: true, shuffleAnswers: true });
  const [session, setSession] = useState<Session | null>(null);
  const [hasRecovery, setHasRecovery] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const saved = JSON.parse(raw) as Session & { screen?: Screen }; if (saved.order?.length && saved.screen === 'quiz') { setSession(saved); setSettings({ shuffleQuestions: saved.shuffleQuestions, shuffleAnswers: saved.shuffleAnswers }); setHasRecovery(true); } }
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }, []);
  useEffect(() => {
    if (session && screen === 'quiz') localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, screen }));
  }, [session, screen]);
  const start = () => {
    const ordered = settings.shuffleQuestions ? shuffle(questions) : [...questions];
    const choices: Record<string, string[]> = {};
    ordered.forEach((question) => {
      if (question.options) choices[String(question.id)] = settings.shuffleAnswers ? shuffle(question.options) : [...question.options];
      if (question.type === 'matching' && question.pairs) choices[String(question.id)] = settings.shuffleAnswers ? shuffle(question.pairs.map((pair) => pair.right)) : question.pairs.map((pair) => pair.right);
      if (question.type === 'ordering' && question.order) choices[String(question.id)] = settings.shuffleAnswers ? shuffle(question.order) : [...question.order];
    });
    setSession({ order: ordered.map((question) => question.id), choices, index: 0, responses: {}, ...settings });
    setScreen('quiz'); setHasRecovery(false);
  };
  const restart = () => { localStorage.removeItem(STORAGE_KEY); start(); };
  const home = () => { setScreen('start'); setSession(null); setHasRecovery(false); };
  const resume = () => { if (session) setScreen('quiz'); };
  const finish = () => { localStorage.removeItem(STORAGE_KEY); setScreen('results'); };
  const content = useMemo(() => {
    if (screen === 'start') return <StartScreen settings={settings} setSettings={setSettings} onStart={start} hasRecovery={hasRecovery} onResume={resume} />;
    if (!session) return <StartScreen settings={settings} setSettings={setSettings} onStart={start} hasRecovery={false} onResume={resume} />;
    if (screen === 'quiz') return <QuizScreen session={session} setSession={setSession} onExit={home} onFinish={finish} />;
    if (screen === 'results') return <ResultsScreen session={session} onRestart={restart} onReview={() => setScreen('review')} onHome={home} />;
    return <ReviewScreen session={session} onBack={() => setScreen('results')} onRestart={restart} />;
  }, [screen, settings, session, hasRecovery]);
  return content;
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><Router /></RoutedErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;