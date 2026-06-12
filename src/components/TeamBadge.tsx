import { getTeamFlag } from "@/lib/team-flags";

export function TeamBadge({ teamName }: { teamName: string }) {
  const flag = getTeamFlag(teamName);

  return (
    <span className="team-badge">
      {flag ? <span className="team-flag" aria-hidden="true">{flag}</span> : null}
      <span>{teamName}</span>
    </span>
  );
}
