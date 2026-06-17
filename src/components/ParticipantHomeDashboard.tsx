import Image from "next/image";
import Link from "next/link";
import { SwitchParticipantLink } from "@/components/SwitchParticipantLink";

type DashboardAction = {
  label: string;
  href: string;
  detail?: string;
};

export function ParticipantHomeDashboard({
  token,
  participantName,
  paymentConfirmed,
  totalPoints,
  pendingPredictions,
  completedPredictions,
  blockedGames,
  activeDisputes
}: {
  token: string;
  participantName: string;
  paymentConfirmed: boolean;
  totalPoints: number;
  pendingPredictions: number;
  completedPredictions: number;
  blockedGames: number;
  activeDisputes: number;
}) {
  const gameActions: DashboardAction[] = [
    {
      label: "Faltam fazer",
      href: `/participante/${token}/jogos/faltam`,
      detail: `${pendingPredictions} pendentes`
    },
    {
      label: "Palpites feitos",
      href: `/participante/${token}/jogos/feitos`,
      detail: `${completedPredictions} registrados`
    },
    {
      label: "Bloqueados",
      href: `/participante/${token}/jogos/bloqueados`,
      detail: `${blockedGames} jogos`
    },
    {
      label: "Todos os jogos",
      href: `/participante/${token}/jogos`,
      detail: "Visao geral"
    }
  ];

  const accountActions: DashboardAction[] = [
    {
      label: "Minhas disputas",
      href: `/participante/${token}/minhas-disputas`,
      detail: `${activeDisputes} ativas`
    },
    {
      label: "Palpites especiais",
      href: `/participante/${token}/especiais`,
      detail: `${totalPoints} pontos no total`
    }
  ];

  const otherActions: DashboardAction[] = [
    { label: "Ranking", href: "/ranking" },
    { label: "Regras", href: "/regras" }
  ];

  return (
    <div className="participant-dashboard stack">
      <section className="card participant-header participant-dashboard-header">
        <div className="participant-title">
          <Image
            src="/logo-bolao-copa-2026.png"
            alt="Bolao Copa 2026"
            width={56}
            height={56}
            className="participant-logo"
            priority
          />
          <div>
            <h1>Area de {participantName}</h1>
            <p className="muted">
              Status: {paymentConfirmed ? "pagamento confirmado" : "aguardando confirmacao de pagamento"}
            </p>
            <div className="participant-switch-action">
              <SwitchParticipantLink />
            </div>
          </div>
        </div>
      </section>

      <section className="card stack">
        <div>
          <h2>Resumo</h2>
          <p className="muted compact-text">Um painel rapido para escolher o proximo passo.</p>
        </div>
        <div className="participant-dashboard-summary">
          <Metric label="Seus pontos" value={totalPoints} />
          <Metric label="Palpites faltando" value={pendingPredictions} />
          <Metric label="Palpites feitos" value={completedPredictions} />
          <Metric label="Disputas ativas" value={activeDisputes} />
        </div>
      </section>

      <DashboardActionGroup title="Acoes principais" actions={gameActions} />
      <DashboardActionGroup title="Minha conta" actions={accountActions} />
      <DashboardActionGroup title="Outros" actions={otherActions} compact />
    </div>
  );
}

function DashboardActionGroup({
  title,
  actions,
  compact = false
}: {
  title: string;
  actions: DashboardAction[];
  compact?: boolean;
}) {
  return (
    <section className="card stack">
      <h2>{title}</h2>
      <div className={compact ? "participant-dashboard-actions compact-actions" : "participant-dashboard-actions"}>
        {actions.map((action) => (
          <Link key={action.href} className="participant-dashboard-action" href={action.href}>
            <strong>{action.label}</strong>
            {action.detail ? <span>{action.detail}</span> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
