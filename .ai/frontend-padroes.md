# Frontend - Padroes e Modelos

Este documento complementa o `AGENTS.md` com decisoes praticas do frontend. Use como referencia ao criar telas, ajustar estilos ou integrar novas chamadas de API.

## Objetivo Visual

O app deve parecer uma ferramenta operacional de gestao condominial: claro, organizado, direto e facil de escanear.

- Preferir base clara (`slate-50`, branco, bordas `slate`) com acentos por modulo.
- Evitar visual de landing page, excesso de gradientes, efeitos neon ou cards decorativos.
- Usar cards para itens, paineis de formulario, modais e blocos repetidos; evitar card dentro de card.
- Textos da interface devem permanecer em portugues.
- Manter componentes densos e funcionais para uso recorrente.

## Temas

As cores principais passam por variaveis CSS em `src/index.css`.

- Tema padrao/gas: verdes (`theme-gas`).
- Tema agua: azuis (`theme-water`).
- Tema financeiro: usar a classe `theme-finance` quando existir ou manter neutro com acentos do modulo.
- Classes Tailwind `primary-*` usam as variaveis `--primary-*`.

Ao criar uma tela dentro do layout autenticado, respeite o tema ativo vindo de `App.tsx`.

## Telas de Autenticacao

As telas `LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage` e `SetupPasswordPage` compartilham classes `login-*` em `src/index.css`.

Padrao atual:

- Fundo claro com acentos suaves de verde e azul.
- Card branco/translucido com borda leve e sombra discreta.
- Verde como cor principal da marca e azul como apoio.
- Inputs claros com foco verde.
- Links usam `.login-link`.
- Mensagens de sucesso usam `.login-error.login-success`.

Evite voltar o login para paletas roxo/indigo escuras ou visual glassmorphism muito contrastante, pois fica distante do produto principal.

## Componentizacao

Arquivos de referencia:

- `src/App.tsx`: rotas, modulo ativo, layout autenticado e redirecionamentos.
- `src/context/AuthContext.tsx`: login, logout, refresh e condominio ativo.
- `src/hooks/useAuthenticatedFetch.ts`: wrapper para chamadas autenticadas.
- `src/components/ControlPanel.tsx`: tela compartilhada para gas e agua.
- `src/components/ReadingsList.tsx`: listagem/edicao de leituras.
- `src/components/FinancialDashboard.tsx`: modulo financeiro.
- `src/components/Icon.tsx`: helpers de icones pequenos/normais.
- `src/types.ts`: tipos compartilhados entre telas e componentes.

Preferir evoluir componentes existentes antes de criar novas abstracoes.

## Integracao com API

- API base: `import.meta.env.VITE_API_URL`.
- Para rotas autenticadas, usar `useAuthenticatedFetch()`.
- Incluir `Authorization: Bearer ${token}` quando a rota exigir autenticacao.
- Incluir `Content-Type: application/json` em requests com body JSON.
- Usar `activeCondominiumId` em telas condominiais quando o endpoint aceitar filtro por condominio.
- Tratar `401` deixando `useAuthenticatedFetch` acionar logout.

Modelo:

```tsx
const API_BASE = import.meta.env.VITE_API_URL;
const { token, activeCondominiumId } = useAuth();
const authenticatedFetch = useAuthenticatedFetch();

const res = await authenticatedFetch(`${API_BASE}/api/recurso?condominiumId=${activeCondominiumId}`, {
    headers: { Authorization: `Bearer ${token}` },
});
```

## Estado e Dados

- Usar `useCallback` para funcoes chamadas por `useEffect` ou repassadas a componentes quando isso evitar refetch/render desnecessario.
- Usar `useMemo` para dados derivados custosos ou listas filtradas/agrupadas.
- Loading de tela/acao deve usar `LoadingOverlay` ou estado visual proporcional.
- Meses devem circular como string `YYYY-MM`.
- Leituras possuem `previousReading`, mas no backend ele nao e persistido; quando necessario, calcular consumo comparando leituras.

## Roles e Permissoes na UI

Roles: `Admin`, `Sindico`, `Morador`.

- Morador nao deve ver modulos administrativos ou financeiros.
- Admin e Sindico podem acessar telas de gestao conforme autorizacao do backend.
- A UI ajuda a esconder fluxos indisponiveis, mas a regra final vem do backend.
- Ao adicionar rota protegida, envolve-la com `PrivateRoute`.

## Rotas

Rotas publicas:

- `/login`
- `/forgot-password`
- `/reset-password`

Rotas protegidas:

- `/setup-password`
- `/select-condominium`
- `/gas`
- `/water`
- `/finance`
- `/members`
- `/apartments/:id`

O modulo ativo e derivado da URL em `App.tsx`.

## Formularios

- Labels sempre visiveis.
- Placeholders apenas como exemplo, nao como unica descricao do campo.
- Botoes devem ter estado de carregamento quando enviam dados.
- Mensagens de erro devem ser objetivas e em portugues.
- Evitar estilos inline; preferir classes existentes ou pequenas classes em `index.css`.

## Icones

Lucide React esta disponivel.

- Preferir icones Lucide em botoes e campos quando houver um equivalente claro.
- Usar helpers de `src/components/Icon.tsx` quando se encaixarem.
- Nao usar emoji como icone em novas telas, salvo em casos pontuais ja existentes que nao merecam refatoracao imediata.

## Checklist para Mudancas Frontend

Antes de finalizar:

1. Conferir se a tela respeita tema, roles e condominio ativo.
2. Conferir se chamadas autenticadas usam `useAuthenticatedFetch`.
3. Conferir se textos estao em portugues.
4. Conferir responsividade basica em mobile e desktop.
5. Rodar `npm run build`.
6. Rodar `npm run lint` quando a mudanca envolver logica, hooks ou muitos arquivos.
