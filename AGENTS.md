# Gas Control - Agent Notes

Este arquivo guarda contexto operacional do projeto para agentes de codigo. Atualize-o quando houver mudancas relevantes de stack, arquitetura, banco, rotas ou convencoes.

## Visao Geral

Gas Control e uma aplicacao de gestao condominial para controle de leituras e cobrancas de gas, agua, apartamentos, usuarios e financeiro.

O projeto e dividido em:

- `backend/`: API ASP.NET Core Minimal APIs com EF Core e PostgreSQL.
- `frontend/`: aplicacao React/Vite/TypeScript com Tailwind CSS.
- `.ai/`: notas auxiliares do projeto.

## Stack

Backend:

- .NET `net10.0`
- ASP.NET Core Minimal APIs
- Entity Framework Core `10.x`
- PostgreSQL via `Npgsql.EntityFrameworkCore.PostgreSQL`
- JWT Bearer Auth
- BCrypt para hash de senha
- QuestPDF para exportacao PDF financeira

Frontend:

- React `19`
- TypeScript
- Vite `8`
- React Router `7`
- Tailwind CSS `4`
- Recharts para graficos
- Lucide React disponivel para icones

## Comandos Uteis

Frontend:

```sh
cd frontend
npm run dev
npm run build
npm run lint
```

Backend:

```sh
cd backend
dotnet build
dotnet run
dotnet ef migrations add NomeDaMigration
dotnet ef database update
```

Observacao: o backend aplica migrations automaticamente na inicializacao (`db.Database.Migrate()` em `Program.cs`).

## Configuracao

Backend:

- Connection string: `ConnectionStrings:DefaultConnection`.
- JWT: secao `Jwt` com `SecretKey`, `Issuer` e `Audience`.
- Existe `backend/appsettings.Development.json.example.json` como referencia.

Frontend:

- API base lida de `import.meta.env.VITE_API_URL`.
- Tokens e usuario ficam em `localStorage`:
  - `gascontrol_token`
  - `gascontrol_user`
  - `gascontrol_active_condo`

## Arquitetura Backend

Arquivos principais:

- `Program.cs`: registra DbContext, CORS, JWT, politicas de autorizacao, `TokenService`, aplica migrations e mapeia endpoints.
- `AppDbContext.cs`: DbSets, relacionamentos EF e Global Query Filters.
- `Endpoints/*.cs`: Minimal API endpoints separados por dominio.
- `Models/*`: entidades persistidas e enums.
- `Services/TokenService.cs`: geracao de JWT e claims.
- `Services/FinancePdfGenerator.cs`: PDF financeiro via QuestPDF.

Autorizacao:

- Roles: `Admin`, `Sindico`, `Morador`.
- Politica `ReadOnly`: Admin, Sindico e Morador.
- Politica `CanWrite`: Admin e Sindico.
- Use `RequireAuthorization("ReadOnly")` para leitura.
- Use `RequireAuthorization("CanWrite")` para escrita administrativa/condominial.

Isolamento de dados:

- `AppDbContext` injeta o `ClaimsPrincipal` atual via `Func<ClaimsPrincipal?>`.
- Global Query Filters restringem dados por role, condominios e apartamento do morador.
- Claims importantes: `ClaimTypes.Role`, `condominiumId`, `apartmentId`.
- Admin bypassa filtros.
- Sindico acessa condominios em `UserCondominiumIds`.
- Morador acessa apenas o proprio `ApartmentId` quando aplicavel.

## Entidades e Banco

`Condominium`

- `Id: string`
- `Name: string`

`Apartment`

- `Id: string`
- `Number: string`
- `Name: string`
- `IsActive: bool`
- `CondominiumId: string?`

`User`

- `Id: Guid`
- `Name: string`
- `Email: string` com indice unico
- `PasswordHash: string`
- `Role: UserRole` salvo como string
- `CondominiumIds: List<string>?` salvo como array PostgreSQL
- `ApartmentId: string?`
- `PasswordResetToken: string?`
- `PasswordResetExpiry: DateTime?`
- `MustChangePassword: bool`

`GasReading` / `WaterReading`

- `Id: string`
- `ApartmentId: string`
- `Month: string` no formato `YYYY-MM`
- `CurrentReading: double`
- `PreviousReading: double` e `[NotMapped]`; o consumo costuma ser calculado comparando leituras entre meses.

`GasPrice` / `WaterPrice`

- `Id: string`
- `Month: string` no formato `YYYY-MM`
- `PricePerCubicMeter: double`
- `CondominiumId: string?`

`FinanceCategory`

- `Id: string`
- `CondominiumId: string`
- `Year: int`
- `Name: string`
- `Type: EFinanceCategoryType` (`Forecast` ou `Realized`)
- `BaseValues: decimal[12]`
- `SubCategories: List<FinanceSubCategory>`

`FinanceSubCategory`

- `Id: string`
- `FinanceCategoryId: string`
- `Name: string`
- `Values: decimal[12]`

## Endpoints Principais

Auth (`/api/auth`):

- `POST /login`
- `POST /refresh`
- `POST /register`
- `POST /forgot-password`
- `POST /reset-password`
- `GET /users`
- `POST /change-password`

Apartamentos (`/api/apartments`):

- `GET /?condominiumId=...`
- `POST /`
- `PUT /{id}`
- `PATCH /{id}/state`
- `GET /{id}/history?limit=13`

Condominios (`/api/condominiums`):

- `GET /`
- `POST /`

Gas:

- `GET /api/gas/readings?month=YYYY-MM`
- `POST /api/gas/readings`
- `POST /api/gas/readings/bulk`
- `GET /api/gasprices/{month}?condominiumId=...`
- `POST /api/gasprices`

Agua:

- `GET /api/water/readings?month=YYYY-MM`
- `POST /api/water/readings`
- `POST /api/water/readings/bulk`
- `GET /api/waterprices/{month}?condominiumId=...`
- `POST /api/waterprices`

Financeiro:

- `GET /api/finance/{condominiumId}/{year}/{type}`
- `POST /api/finance/sync/{condominiumId}/{year}/{type}`
- `GET /api/finance/{condominiumId}/{year}/{type}/export`

## Arquitetura Frontend

Arquivos principais:

- `src/App.tsx`: rotas, layout autenticado e selecao de modulo.
- `src/context/AuthContext.tsx`: login, logout, refresh e condominio ativo.
- `src/hooks/useAuthenticatedFetch.ts`: wrapper que faz logout em resposta `401`.
- `src/components/NavigationHeader.tsx`: troca de modulos.
- `src/components/ControlPanel.tsx`: tela compartilhada de gas/agua.
- `src/components/ReadingsList.tsx`: lista/edit de leituras.
- `src/components/FinancialDashboard.tsx`: modulo financeiro.
- `src/pages/ApartmentDetailsPage.tsx`: historico/graficos de leituras por apartamento.
- `src/types.ts`: tipos compartilhados do frontend.

Rotas principais:

- `/login`
- `/forgot-password`
- `/reset-password`
- `/setup-password`
- `/select-condominium`
- `/gas`
- `/water`
- `/finance`
- `/members`
- `/apartments/:id`

Padroes do frontend:

- Sempre usar `useAuthenticatedFetch()` para chamadas autenticadas.
- Incluir header `Authorization: Bearer ${token}` quando a rota exige auth.
- Usar `activeCondominiumId` para filtrar dados condominiais quando necessario.
- Estado de carregamento costuma usar `LoadingOverlay`.
- O modulo atual e derivado da URL em `App.tsx`.
- Temas usam variaveis CSS `--primary-*` e classes `theme-gas`, `theme-water`, `theme-finance` quando disponivel.
- Meses sao tratados como string `YYYY-MM`.
- Para historico de consumo, buscar uma leitura extra como baseline quando precisar calcular N meses de consumo.

## Convencoes de Codigo

Backend:

- Preferir Minimal APIs por dominio em `backend/Endpoints`.
- Requests pequenos sao `record` no fim do arquivo de endpoint.
- Manter regras de role com as politicas existentes antes de criar novas.
- Respeitar os Global Query Filters; so usar `IgnoreQueryFilters()` quando houver motivo claro e seguro.
- Ao adicionar entidade persistida, atualizar `AppDbContext`, criar migration e revisar filtros multi-condominio.

Frontend:

- Componentes funcionais com hooks.
- Tipos em `src/types.ts` quando compartilhados entre telas/componentes.
- Manter textos da UI em portugues.
- Preferir Tailwind e variaveis de tema existentes.
- Evitar duplicar logica entre gas e agua; `ControlPanel` ja abstrai ambos via `moduleName`.
- Usar `useMemo`/`useCallback` para dados derivados e funcoes usadas em efeitos quando isso evitar refetch/render desnecessario.

## Cuidados Importantes

- Nao reverter alteracoes nao solicitadas pelo usuario.
- Verificar `git status --short` antes/depois de mudancas relevantes.
- A pasta `.ai/` pode conter notas do usuario; tratar como contexto auxiliar, nao como fonte unica de verdade.
- Qualquer mudanca em auth, roles ou filtros globais pode afetar isolamento de dados entre condominios.
- `PreviousReading` nas leituras nao e persistido; nao depender dele como dado salvo no banco.
- Para Morador, a UI deve evitar modulos administrativos/financeiros quando nao permitido.
- Exportacao financeira depende de QuestPDF com licenca Community configurada em `Program.cs`.

## Ao Comecar uma Tarefa

1. Leia este arquivo.
2. Rode `git status --short`.
3. Inspecione os arquivos diretamente envolvidos.
4. Preserve padroes existentes.
5. Depois de editar, rode verificacoes proporcionais ao risco (`npm run build`, `npm run lint`, `dotnet build`, testes se forem adicionados).
