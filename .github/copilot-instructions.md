**Purpose**
- **What:** Help AI coding agents become productive quickly in this repo (Google Apps Script + SPA).
- **Scope:** architecture, runtime/deploy notes, important conventions, and concrete code examples.

**Big Picture**
- **Backend:** Google Apps Script (GAS) files implement server endpoints and spreadsheet access. See [Web_Codigo.gs](Web_Codigo.gs#L1) and [Web_Macro_BD.gs](Web_Macro_BD.gs#L1-L40).
- **Frontend:** Single Page App loaded by `doGet()` template [Web_Principal_SPA.html](Web_Principal_SPA.html#L1). Styles and shared scripts are in [Web_Estilos.html](Web_Estilos.html#L1) and [Web_Scripts.html](Web_Scripts.html#L1).
- **Views:** Subpages like `Consulta`, `Cadastro`, `Roteiro` are plain HTML files (e.g., [Consulta.html](Consulta.html#L1)). The SPA router dynamically includes them via the server `include()` helper.

**Key runtime flows & integration points**
- `doGet(e)` (in [Web_Codigo.gs](Web_Codigo.gs#L1)) returns the SPA template and injects three lists: `OM_LIST`, `GRUPOS_LIST`, `FINALIDADES_LIST` via template variables.
- Client → Server RPCs: front-end calls GAS functions with `google.script.run.withSuccessHandler(...).FUNCTION_NAME(payload)`. Important GAS functions:
  - `PesquisarDadosARQUIVO(cpf)` — search by CPF (see [Web_Macro_BD.gs](Web_Macro_BD.gs#L40)).
  - `SalvarAlteracoesFicha(payload)` — save inspection ficha (see [Web_Macro_BD.gs](Web_Macro_BD.gs#L100)).
  - `SalvarInspecionando(payload)` / `EditarInspecionando(payload)` — create/edit cadastro rows.

**Project-specific conventions & patterns**
- SPA view registration: subpage scripts must register an initializer at `window.__VIEW_REGISTRY['ViewName'] = function(exports, APP, Store){ ... }` and return optional `{ cleanup }` for router cleanup. See pattern in [Consulta.html](Consulta.html#L1) and [Cadastro.html](Cadastro.html#L1).
- Shared app state: use the built-in `Store` (simple pub/sub in `Web_Principal_SPA.html`) for passing data between views instead of globals.
- Includes: server `include(filename)` returns the HTML content for safe injection; the router uses `google.script.run.include(pageName)` to fetch subpages.
- Date formats: client `input[type=date]` produces `YYYY-MM-DD` and GAS expects some dates as `DD/MM/YYYY` — conversion helpers exist in views (e.g., `formatarDataBrasil`). Follow existing conversion functions.
- CPF handling: normalize with digits-only and padded to 11 (`normalizeCPF` / `calcularCPF`). Keep that behaviour when creating new helpers.
- Spreadsheet schema: constants in [Web_Macro_BD.gs](Web_Macro_BD.gs#L1-L20) — `URL_ARQUIVO`, `ABA_ARQUIVO`, `ABA_FICHAS`, `ABA_LOGS`, `COLUNA_CPF` (7). When updating row layout, update both the GAS mapping and any client field ordering.

**Developer workflows & debugging**
- Run/Deploy: Use the Apps Script Editor to run functions and create a Web App deployment (Deploy → New deployment → Web app). `doGet` is the entrypoint.
- Logs: use `Logger.log(...)` or `console.log(...)` in GAS and view executions in Apps Script `Executions` / `Logs` panels.
- Local editing: HTML and `.gs` files here are source; push changes to Apps Script using your sync tooling ( clasp or the Apps Script web editor ).
- Quick tests: GAS contains test helpers `TESTE_DIRETO_FICHA()` and `TESTE_DIRETO_Cadastro()` in [Web_Macro_BD.gs](Web_Macro_BD.gs#L1-L120) — call them from the Apps Script editor to exercise save/edit flows.

**Coding guidance for AI agents (actionable rules)**
- Prefer modifying existing helpers rather than adding parallel copies: keep `include()` pattern and `window.__VIEW_REGISTRY` usage.
- When adding a new view: create `NewView.html`, include only view HTML+inline script that registers to `__VIEW_REGISTRY`, and do not pollute global namespace. Provide `cleanup` that removes event listeners.
- When changing spreadsheet columns or sheet names, update the constants at the top of [Web_Macro_BD.gs](Web_Macro_BD.gs#L1-L20) and any client-side assumptions about column order.
- Keep client-server payload shapes compatible with GAS functions: GAS expects plain objects with string dates formatted as `DD/MM/YYYY` in places; check existing callers in [Consulta.html](Consulta.html#L700-L740) and [Cadastro.html](Cadastro.html#L550-L610).

**Examples (copy-paste safe)**
- Client call example: `google.script.run.withSuccessHandler(res => { ... }).PesquisarDadosARQUIVO(cpf);` (see [Consulta.html](Consulta.html#L250)).
- Registering a view example (pattern):
  ```js
  window.__VIEW_REGISTRY['MyView'] = function(exports, APP, Store){
    // bind handlers
    return { cleanup(){ /* remove handlers */ } };
  };
  ```

**If you need more info**
- Ask for missing deployment details (Apps Script project id, clasp setup, or intended access control for the Web App).
- I can also auto-generate a short CONTRIBUTING.md or an AGENT.md summarizing these points.

-- End of instructions
