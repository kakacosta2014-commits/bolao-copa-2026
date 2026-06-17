import Image from "next/image";
import Link from "next/link";

const ruleSections = [
  {
    title: "1. Como participar",
    paragraphs: [
      "Para participar, faca seu cadastro informando nome completo, WhatsApp e escolhendo uma ou mais disputas disponiveis.",
      "Cada participante tem um unico acesso ao sistema. Com esse acesso, voce pode fazer palpites, acompanhar pontos, entrar em mais disputas, ver jogos por disputa, consultar ranking e recuperar o acesso usando nome e WhatsApp cadastrados.",
      "Apos o cadastro, o pagamento precisa ser confirmado pelo administrador para que o participante entre no ranking da disputa escolhida."
    ]
  },
  {
    title: "2. Disputas disponiveis",
    paragraphs: [
      "O Bolao Copa 2026 pode ter varias disputas separadas, como Bolao Geral, 1a Rodada, 2a Rodada, 3a Rodada e Mata-mata.",
      "O participante pode escolher apenas uma disputa ou participar de varias. Cada disputa possui valor, jogos, ranking, premiacao e status de pagamento proprios.",
      "Exemplo: uma pessoa pode participar apenas da 2a Rodada, enquanto outra pode participar do Bolao Geral e tambem do Mata-mata."
    ]
  },
  {
    title: "3. Pagamento e confirmacao",
    paragraphs: [
      "A participacao em cada disputa so e considerada valida apos confirmacao do pagamento pelo administrador.",
      "Enquanto o pagamento estiver pendente, o participante pode aparecer como pendente na disputa.",
      "O participante so entra no ranking publico da disputa depois que o pagamento daquela disputa for confirmado. Se estiver em mais de uma disputa, cada uma tera seu proprio status."
    ]
  },
  {
    title: "4. Como funcionam os palpites dos jogos",
    paragraphs: [
      "Para cada jogo, o participante informa o placar do time mandante, o placar do time visitante e um jogador para tentar ganhar o bonus de gol.",
      "O palpite deve ser feito antes do inicio da partida. Depois que o jogo comeca, o palpite fica bloqueado e nao pode mais ser alterado."
    ]
  },
  {
    title: "5. Regra do jogador-gol",
    paragraphs: [
      "Em cada jogo, o participante pode escolher apenas um jogador. Nao e permitido colocar varios jogadores no mesmo campo.",
      "O bonus de jogador-gol vale quando o jogador escolhido faz gol na partida.",
      "Pequenas variacoes de escrita, apelidos e acentos podem ser conferidos pelo administrador, como Vini Jr, Vinicius Junior ou formas equivalentes."
    ]
  },
  {
    title: "6. Palpites especiais",
    paragraphs: [
      "Alem dos jogos, o Bolao pode ter palpites especiais, como campeao da Copa e artilheiro da Copa.",
      "Os palpites especiais ficam em uma area propria dentro do acesso do participante.",
      "Nem toda disputa precisa incluir especiais. Quando uma disputa incluir especiais, isso sera indicado no sistema."
    ]
  },
  {
    title: "7. Prazo para palpitar",
    paragraphs: [
      "Cada jogo pode ser palpitado ate o horario de inicio da partida.",
      "Quando o jogo comeca, o palpite e bloqueado, nao pode mais ser editado e passa a ficar disponivel para conferencia futura.",
      "Por isso, faca seus palpites com antecedencia."
    ]
  },
  {
    title: "8. Transparencia dos palpites",
    paragraphs: [
      "Apos o inicio de cada jogo, os participantes podem visualizar os palpites da galera.",
      "Essa visualizacao da transparencia ao Bolao. Antes do inicio da partida, os palpites dos outros participantes ficam ocultos."
    ]
  },
  {
    title: "9. Ranking",
    paragraphs: [
      "Cada disputa possui seu proprio ranking, como ranking do Bolao Geral, ranking das rodadas e ranking do Mata-mata.",
      "O participante so aparece no ranking de uma disputa depois que o pagamento daquela disputa e confirmado.",
      "A pontuacao do ranking e calculada com base nos jogos e regras daquela disputa."
    ]
  },
  {
    title: "10. Premiacao",
    paragraphs: [
      "Cada disputa possui sua propria premiacao, calculada com base nos participantes pagos daquela disputa e nos percentuais definidos pelo administrador.",
      "Os percentuais podem variar entre as disputas e podem contemplar organizador, 1o lugar, 2o lugar e 3o lugar.",
      "A premiacao valida sera sempre aquela configurada no sistema para cada disputa."
    ]
  },
  {
    title: "11. Acesso do participante",
    paragraphs: [
      "O participante acessa sua area pelo link individual gerado no cadastro.",
      "Caso perca o link, e possivel recuperar o acesso pela tela Entrar, informando nome completo cadastrado e WhatsApp cadastrado.",
      "O sistema nao mostra dados de outros participantes durante a recuperacao de acesso."
    ]
  },
  {
    title: "12. Trocar participante",
    paragraphs: [
      "Se o mesmo celular for usado por mais de uma pessoa, use a opcao Trocar participante.",
      "Essa opcao apenas sai do acesso atual naquele aparelho e permite acessar outro participante. Ela nao apaga dados, palpites, pagamentos ou cadastro."
    ]
  },
  {
    title: "13. App no celular",
    paragraphs: [
      "O Bolao Copa 2026 pode ser instalado no celular como um app.",
      "No Android, o participante pode instalar pelo Chrome. No iPhone, pode usar a opcao Adicionar a Tela de Inicio pelo Safari.",
      "Mesmo instalado no celular, o app continua recebendo as atualizacoes do sistema normalmente."
    ]
  }
];

const scoreCards = [
  { label: "Placar exato", value: "10 pontos", detail: "Acertou o placar completo do jogo." },
  { label: "Resultado", value: "5 pontos", detail: "Acertou vencedor ou empate sem placar exato." },
  { label: "Jogador-gol", value: "5 pontos", detail: "O jogador escolhido fez gol na partida." },
  { label: "Campeao", value: "20 pontos", detail: "Acertou o campeao da Copa." },
  { label: "Artilheiro", value: "20 pontos", detail: "Acertou o artilheiro da Copa." }
];

const faqs = [
  {
    question: "Posso participar de mais de uma disputa?",
    answer: "Sim. Voce pode participar de uma ou mais disputas usando o mesmo acesso."
  },
  {
    question: "Posso participar so da 2a Rodada?",
    answer: "Sim. Voce pode escolher apenas a 2a Rodada, se essa disputa estiver disponivel."
  },
  {
    question: "Quando meus palpites travam?",
    answer: "Cada palpite trava no horario de inicio do jogo correspondente."
  },
  {
    question: "Posso editar um palpite?",
    answer: "Sim, desde que o jogo ainda nao tenha comecado. Depois do inicio do jogo, o palpite fica bloqueado."
  },
  {
    question: "Quando posso ver os palpites dos outros participantes?",
    answer: "Depois que o jogo comecar. Antes disso, os palpites dos outros participantes ficam ocultos."
  },
  {
    question: "O que acontece se meu pagamento estiver pendente?",
    answer: "Voce pode aparecer como pendente na disputa, mas so entra no ranking publico depois que o pagamento for confirmado pelo administrador."
  },
  {
    question: "Como recupero meu acesso?",
    answer: "Na tela Entrar, use a opcao Ja sou participante e informe nome completo e WhatsApp cadastrados."
  },
  {
    question: "O jogador-gol pode ter mais de um nome?",
    answer: "Nao. Cada participante deve escolher apenas um jogador por jogo."
  },
  {
    question: "Posso instalar o Bolao no celular?",
    answer: "Sim. O Bolao pode ser instalado como app no celular, sem precisar baixar pela Play Store ou App Store."
  }
];

export default function RulesPage() {
  return (
    <main className="container stack rules-page" style={{ padding: "2rem 0" }}>
      <section className="card rules-hero">
        <Image
          src="/logo-bolao-copa-2026.png"
          alt="Bolao Copa 2026"
          width={72}
          height={72}
          className="rules-logo"
          priority
        />
        <div className="stack">
          <p className="hero-kicker">Bolao Copa 2026</p>
          <h1>Regras do Bolao</h1>
          <p>
            Bem-vindo ao Bolao Copa 2026. Aqui voce acompanha seus palpites, participa de uma ou mais disputas,
            ve o ranking e acompanha sua pontuacao durante a Copa.
          </p>
          <div className="hero-actions rules-actions">
            <Link className="button" href="/entrar">Participar do Bolao</Link>
            <Link className="button secondary" href="/ranking">Ver ranking</Link>
          </div>
        </div>
      </section>

      <section className="card stack">
        <div>
          <h2>Pontuacao</h2>
          <p className="muted compact-text">A pontuacao maxima por jogo e de 15 pontos.</p>
        </div>
        <div className="rules-score-grid">
          {scoreCards.map((score) => (
            <div key={score.label} className="rules-score-card">
              <span>{score.label}</span>
              <strong>{score.value}</strong>
              <p>{score.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rules-section-grid">
        {ruleSections.map((section) => (
          <article key={section.title} className="card stack rules-card">
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}
      </section>

      <section className="card stack">
        <div>
          <h2>Duvidas frequentes</h2>
          <p className="muted compact-text">Respostas rapidas para as situacoes mais comuns.</p>
        </div>
        <div className="rules-faq-grid">
          {faqs.map((faq) => (
            <article key={faq.question} className="rules-faq-card">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card rules-footer-cta">
        <div>
          <h2>Pronto para jogar?</h2>
          <p className="muted">Cadastre-se, escolha suas disputas e acompanhe sua pontuacao rodada por rodada.</p>
        </div>
        <div className="rules-actions">
          <Link className="button" href="/entrar">Participar do Bolao</Link>
          <Link className="button secondary" href="/ranking">Ver ranking</Link>
        </div>
      </section>
    </main>
  );
}
