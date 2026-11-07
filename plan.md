# Senário Clean — cadastro e painel administrativo

## Objetivo
Adicionar ao site público da Senário Clean um cadastro por telefone e PIN numérico de exatamente 6 dígitos, login persistente, envio autenticado de orçamentos e painel administrativo protegido. Cada orçamento enviado conta como uma contratação, conforme definido pelo cliente.

## Decisões
- Manter o visual, catálogo e fluxo de orçamento atuais.
- Usar servidor Express no mesmo projeto e banco MySQL gerenciado.
- Armazenar somente hash bcrypt do PIN; nunca guardar PIN em texto puro.
- Normalizar telefones para 10 ou 11 dígitos brasileiros.
- Usar sessão própria com token aleatório; no banco fica apenas o hash do token.
- Usar cookie de sessão `senario_session` com `HttpOnly`, `SameSite=None` e `Secure` em HTTPS, compatível com o Preview incorporado.
- Usar proteção CSRF por token de cookie + cabeçalho nas mutações.
- Aplicar limite em memória por IP/telefone para cadastro e login.
- Definir como administrador o telefone configurado em `ADMIN_PHONE`, inicialmente `5511927533791`; a primeira conta desse telefone deve ser criada pelo proprietário.
- Contabilizar cada envio autenticado de orçamento como uma contratação e salvar o resumo do pedido.

## Estrutura
- `src/App.tsx`: tela atual, autenticação, envio autenticado e painel admin.
- `src/styles.css`: componentes visuais de conta e administração.
- `server/index.ts`: Express, endpoints de auth, orçamento, admin e arquivos estáticos.
- `server/db.ts`: conexão MySQL, schema e consultas.
- `server/dev.ts`: servidor Vite em middleware para o Preview.
- `migrations/001_init.sql`: tabelas de clientes, sessões e orçamentos.

## Privacidade e segurança
O painel só retorna telefone e contagem para a conta administradora. Respostas de login/cadastro evitam confirmar se um telefone já existe. O endpoint de orçamento exige sessão e CSRF. Os dados de pedido são armazenados para o painel e enviados ao WhatsApp somente após a ação do cliente.
