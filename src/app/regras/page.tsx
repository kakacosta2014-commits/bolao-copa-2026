export default function RulesPage() {
  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <h1>Regras do Bolao</h1>
      <section className="card stack">
        <h2>Como participar</h2>
        <ol className="stack" style={{ paddingLeft: "1.25rem" }}>
          <li>Faca seu cadastro.</li>
          <li>Pague R$ 50,00 via PIX.</li>
          <li>Envie o comprovante ao organizador.</li>
          <li>Aguarde a confirmacao.</li>
          <li>Faca seus palpites antes dos jogos.</li>
          <li>Acompanhe o ranking.</li>
        </ol>
        <h2>Participacao</h2>
        <p>O valor de entrada e R$ 50,00. O pagamento e feito via PIX manual e confirmado pelo administrador.</p>
        <h2>Premiacao</h2>
        <p>Do total arrecadado, os percentuais de premiacao podem variar por disputa e sempre somam 100%.</p>
        <h2>Palpites dos jogos</h2>
        <p>Palpites podem ser criados ou editados somente antes do horario de inicio da partida.</p>
        <p>Placar exato vale 10 pontos. Resultado correto sem placar exato vale 5 pontos. Jogador que marcou gol vale 5 pontos extras.</p>
        <h2>Palpites especiais</h2>
        <p>Campeao e artilheiro valem 20 pontos cada, somados ao final. Em caso de empate na artilharia, qualquer jogador empatado e valido.</p>
      </section>
    </main>
  );
}
