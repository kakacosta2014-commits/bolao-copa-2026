# Bolão da Copa 2026

MVP privado para bolão da Copa entre amigos, feito com Next.js 15, App Router, TypeScript, Tailwind CSS, Prisma ORM e PostgreSQL.

## Deploy com Neon Postgres e Vercel

O Neon é usado apenas como banco PostgreSQL acessado pelo Prisma. Este projeto não usa Neon SDK, Supabase, Supabase Auth ou Supabase Storage.

### 1. Criar banco no Neon

1. Crie uma conta no Neon.
2. Crie um novo projeto.
3. Crie ou use o banco padrão `neondb`.
4. Copie a connection string com pooling habilitado.
5. Use essa URL em `DATABASE_URL`.
6. Copie a connection string direta, sem pooling.
7. Use essa URL em `DIRECT_URL`.

`DATABASE_URL` é usada pela aplicação em runtime. `DIRECT_URL` é usada pelo Prisma para migrations e comandos diretos.

### 2. Configurar ambiente local

Crie `.env` baseado em `.env.example`:

```env
DATABASE_URL="pooled-connection-do-neon"
DIRECT_URL="direct-connection-do-neon"
ADMIN_PASSWORD="senha-admin-forte"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Aplicar migrations localmente no banco Neon

Para a primeira criação do banco:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Se as migrations já existirem e for apenas aplicar em produção:

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Rodar localmente

```bash
npm run dev
```

Acesse:

- Público: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/login`

### 5. Subir para GitHub

Se ainda não houver repositório remoto:

```bash
git init
git add .
git commit -m "MVP Bolão Copa 2026"
git branch -M main
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

Se o repositório já existir:

```bash
git add .
git commit -m "Prepara deploy com Neon e Vercel"
git push
```

### 6. Deploy na Vercel

1. Crie um projeto na Vercel.
2. Importe o repositório do GitHub.
3. Configure as variáveis de ambiente:

```env
DATABASE_URL="pooled-connection-do-neon"
DIRECT_URL="direct-connection-do-neon"
ADMIN_PASSWORD="senha-admin-forte"
NEXT_PUBLIC_APP_URL="https://seu-dominio.vercel.app"
```

4. Faça o deploy.
5. Confira os logs do build.
6. Acesse `/admin/login`.

O script de build roda `prisma generate && next build`, então o Prisma Client é gerado durante o deploy.

### 7. Configurar o bolão em produção

Após o deploy:

1. Entre no admin.
2. Configure:
   - Nome do bolão
   - Chave PIX
   - Nome do recebedor PIX
   - WhatsApp do organizador
   - Valor de entrada: R$ 50,00
   - Percentual organizador: 20%
   - Percentual 1º lugar: 40%
   - Percentual 2º lugar: 25%
   - Percentual 3º lugar: 15%
3. Cadastre ou importe jogos reais.
4. Cadastre um participante teste.
5. Confirme o pagamento teste.
6. Salve um palpite teste.
7. Verifique o ranking.

### 8. Importar jogos por CSV

Para importar jogos em lote:

1. Preencha o arquivo `prisma/data/world-cup-2026-games.csv`.
2. Mantenha o cabeçalho:

```txt
numero;fase;grupo;timeCasa;timeVisitante;dataHora
```

3. Use uma linha por jogo:

```txt
1;Fase de Grupos;A;México;África do Sul;2026-06-11T16:00:00-03:00
```

4. Rode:

```bash
npm run import:games
```

O importador faz upsert pelo campo `number`, cria jogos novos como `AGENDADO`, atualiza jogos existentes sem apagar palpites e preserva o status de jogos que já têm resultado lançado.

No painel `/admin/jogos`, o botão `Importar tabela padrão` roda a mesma importação usando `prisma/data/world-cup-2026-games.csv`.

Para jogos de mata-mata ainda indefinidos, use nomes como `Vencedor Grupo A`, `2º Grupo B` ou `Vencedor Jogo 73`.

### 9. Aviso importante sobre seed

`npm run seed` é apenas para ambiente local de desenvolvimento.

Não rode seed no banco de produção, pois ele cria participantes, jogos, palpites e resultados fictícios.

Para rodar localmente:

```bash
npm run seed
```

### 10. Checklist de produção

- [ ] Projeto criado no Neon
- [ ] `DATABASE_URL` pooled configurada
- [ ] `DIRECT_URL` direct configurada
- [ ] `.env` local criado
- [ ] Prisma schema validado
- [ ] Migration aplicada no Neon
- [ ] Projeto rodando localmente
- [ ] Repositório enviado para GitHub
- [ ] Projeto criado na Vercel
- [ ] Variáveis configuradas na Vercel
- [ ] Deploy concluído
- [ ] Admin acessando corretamente
- [ ] Settings configuradas
- [ ] PIX configurado
- [ ] WhatsApp do organizador configurado
- [ ] Jogos reais cadastrados
- [ ] Participante teste cadastrado
- [ ] Pagamento teste confirmado
- [ ] Palpite teste salvo
- [ ] Ranking conferido
- [ ] Link final pronto para enviar ao grupo

### 11. Mensagem pronta para WhatsApp

```txt
Galera, está aberto o Bolão da Copa 2026.

Valor: R$ 50,00 por pessoa.

Premiação:
1º lugar: 40% do total arrecadado
2º lugar: 25%
3º lugar: 15%
Organização: 20%

Pontuação:
Placar exato: 10 pontos
Resultado correto: 5 pontos
Jogador que marcar gol: 5 pontos
Campeão: 20 pontos
Artilheiro: 20 pontos

Os palpites dos jogos bloqueiam no horário de início de cada partida.

Link para participar:
[LINK_DO_SISTEMA]
```

## Segurança básica

- Rotas admin são protegidas por cookie HTTP-only.
- A senha admin fica apenas em `ADMIN_PASSWORD` e não é exposta no client.
- WhatsApp dos participantes não aparece no ranking público.
- Participantes pendentes não conseguem palpitar via backend.
- Palpites de jogos bloqueados são bloqueados via backend.
- Palpites especiais bloqueados são bloqueados via backend.
- O painel admin tem botão de logout.

## Regras do bolão

- Valor de entrada: R$ 50,00 por participante.
- Organizador: 20% do total arrecadado.
- 1º lugar: 40%.
- 2º lugar: 25%.
- 3º lugar: 15%.
- A soma dos percentuais deve ser obrigatoriamente 100%.

Pontuação por jogo:

- Placar exato: 10 pontos.
- Resultado correto, caso não tenha acertado placar exato: 5 pontos.
- Jogador que marcou gol: 5 pontos extras.
- Pontuação máxima por jogo: 15 pontos.

Bônus finais:

- Campeão correto: 20 pontos.
- Artilheiro correto: 20 pontos.
- Se houver mais de um artilheiro empatado, todos são considerados corretos.

Bloqueios:

- Palpites de jogo bloqueiam no horário de início da partida.
- Palpites especiais bloqueiam quando o admin ativar o bloqueio.
- As validações críticas são feitas no backend.

## Não implementado neste MVP

- Gateway PIX
- Upload de comprovante
- WhatsApp API oficial
- Supabase
- Supabase Auth
- Supabase Storage
- Neon SDK
- API FIFA
- Login social
- Multi-bolões
- App mobile
- Auditoria avançada
