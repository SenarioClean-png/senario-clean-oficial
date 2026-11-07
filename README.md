# senario.clean — site

Site da **senario.clean**, empresa de limpeza e impermeabilização de estofados. O visitante escolhe os itens (sofá, colchão, tapete, cadeira etc.), configura cada um e envia o pedido de orçamento pelo **WhatsApp** ou por **e-mail**. Não há servidor nem banco de dados: o site é estático e pode ser hospedado de graça.

Feito com React 18, TypeScript e Vite.

## Rodar no computador

Requer [Node.js](https://nodejs.org) 20 ou superior.

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente `http://localhost:3000`).

> Abrir o `index.html` com dois cliques ou pelo Live Server mostra uma página em branco. O projeto precisa passar pelo Vite (`npm run dev` ou `npm run build`).

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run typecheck` | Verifica os tipos do TypeScript |
| `npm run build` | Verifica os tipos e gera o site final em `dist/` |
| `npm run preview` | Serve a pasta `dist/` localmente para conferir o build |

## Onde editar

| Quero mudar… | Arquivo |
| --- | --- |
| Telefone, WhatsApp, e-mail, Instagram, nome | `src/config.ts` |
| Lista de serviços e ícones | `src/data/catalog.json` + `public/icons/` |
| Opções de cada serviço (tamanhos, materiais, modelos) | `src/data/catalog.ts` |
| Ordem dos "Mais agendados" | `popularNames` em `src/data/catalog.ts` e `enterprisePopularNames` em `src/App.tsx` |
| Texto da mensagem de orçamento | `src/lib/quote.ts` |
| Política de privacidade e Termos de uso | final de `src/App.tsx` (painéis `privacy` e `terms`) |
| Cores, fontes, espaçamentos | `src/styles.css` |
| Título e descrição para o Google | `index.html` |

Para adicionar um serviço: coloque o ícone em `public/icons/nome.png`, adicione `{ "id": "nome", "name": "Nome", "icon": "icons/nome.png" }` em `catalog.json` e, se tiver opções próprias, uma entrada com o mesmo `name` em `productProfiles` (`catalog.ts`).

## Estrutura

```
├── .github/workflows/deploy.yml   Build e publicação automática no GitHub Pages
├── public/                        Arquivos copiados como estão (ícones, logo, robots.txt)
├── src/
│   ├── App.tsx                    Página: cabeçalho, catálogo, Casa/Empresa, formulários, rodapé
│   ├── config.ts                  Dados de contato da empresa
│   ├── components/                Modal de serviço, carrinho, ícones, comportamento dos diálogos
│   ├── data/                      Catálogo e opções de cada serviço
│   ├── lib/quote.ts               Monta a mensagem do pedido de orçamento
│   ├── assets/fonts/              Fonte Lato
│   └── styles.css
├── index.html
└── vite.config.ts
```

## Publicar

### GitHub Pages (automático)

1. Envie o projeto para um repositório no GitHub (veja abaixo).
2. No repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Cada `push` na branch `main` gera e publica o site. O endereço aparece em **Actions** ao final do deploy (ex.: `https://sua-empresa.github.io/nome-do-repo/`).

O workflow ajusta sozinho o caminho da subpasta. Com domínio próprio configurado no Pages, o site passa a usar a raiz.

Pull requests também rodam a verificação de tipos e o build, sem publicar.

### Vercel ou Netlify

Importe o repositório e use: comando de build `npm run build`, pasta de saída `dist`. Nenhuma variável de ambiente é necessária.

## Enviar para o GitHub

```bash
git init
git add .
git commit -m "Primeira versão do site"
git branch -M main
git remote add origin https://github.com/SUA-EMPRESA/NOME-DO-REPO.git
git push -u origin main
```

## Como funciona o pedido

1. O visitante escolhe **Para Casa** ou **Para Empresa**. Cada modo tem seu próprio carrinho.
2. Configura os itens e informa o CEP (empresa: preenche também CNPJ e contato).
3. Revisa o resumo e envia pelo WhatsApp (`wa.me` com a mensagem pronta) ou pelo app de e-mail.

Nada é gravado pelo site. Preços não aparecem: o valor é passado pela equipe no atendimento.
