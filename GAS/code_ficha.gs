/**
 * SIGIS - GAS para BANCO FICHAS
 * Planilha: BANCO FICHAS 2026
 * ID: 1CWXzs_J1tTITIZ52_0t02tUb8tBewKSBNWNyaHb6z8M
 *
 * Implantar como: App da Web -> Executar como: "Eu" -> Acesso: "Qualquer pessoa"
 *
 * IMPORTANTE: Esta planilha DEVE conter as abas TEMPLATE e IMPRESSAO
 */

const IDS = {
  FICHAS: "1CWXzs_J1tTITIZ52_0t02tUb8tBewKSBNWNyaHb6z8M",
  ARQUIVO: "1s41r4hqE0qUgs7i49klZEMjtQXrXDko1gJpi2Hq9ZtE"
};

const PLANILHA_FICHAS_ID = "1CWXzs_J1tTITIZ52_0t02tUb8tBewKSBNWNyaHb6z8M";
const ABA_FICHAS = "FICHAS";

// ID da planilha onde este script esta vinculado (mesma que FICHAS, contem TEMPLATE e IMPRESSAO)
const TEMPLATE_SHEET_ID = "1CWXzs_J1tTITIZ52_0t02tUb8tBewKSBNWNyaHb6z8M";

// ============================================================
// FUNÇÃO doGet - Requisições GET
// ============================================================
function doGet(e) {
  const action = e.parameter.action;

  try {
    if (action === 'ping') {
      return createResponse({ success: true, message: "Pong! Motor FICHAS GET ativo." });
    }

    if (action === 'salvarFichaInspeção' || action === 'salvarFichaInspecao') {
      return createResponse(salvarFichaInspecao(e.parameter.dados));
    }

    if (action === 'buscarFichas') {
      return createResponse(buscarFichas(e.parameter.cpf));
    }

    if (action === 'debugColunasFichas') {
      return createResponse(debugColunasFichas());
    }

    return createResponse({ success: false, message: "Acao invalida: " + action });
  } catch (err) {
    return createResponse({ success: false, error: err.toString() });
  }
}

// ============================================================
// FUNÇÃO doPost - Requisições POST
// ============================================================
function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(20000);

    if (!e.postData || !e.postData.contents) {
      return createResponse({ success: false, error: "Dados vazios" });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === 'ping') {
      return createResponse({ success: true, message: "Pong! Motor FICHAS POST ativo." });
    }

    if (action === 'salvarFichaInspeção' || action === 'salvarFichaInspecao') {
      return createResponse(salvarFichaInspecao(JSON.stringify(payload.dados || payload)));
    }

    if (action === 'updateStatus') {
      const index = payload.index;
      const status = payload.status;
      const ss = SpreadsheetApp.openById(IDS.FICHAS);
      const sheet = ss.getSheetByName("FICHAS") || ss.getSheets()[0];
      sheet.getRange(index, 40).setValue(status);
      return createResponse({ success: true });
    }

    if (action === 'deleteFicha') {
      const index = payload.index;
      const ss = SpreadsheetApp.openById(IDS.FICHAS);
      const sheet = ss.getSheetByName("FICHAS") || ss.getSheets()[0];
      sheet.deleteRow(index);
      return createResponse({ success: true });
    }

    if (action === 'generateFichas') {
      return createResponse(generateFichasAction(payload.codigos));
    }

    return createResponse({ success: false, error: "Acao desconhecida: " + action });

  } catch (err) {
    console.error("Erro no doPost:", err.toString());
    return createResponse({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// ============================================================
// FUNÇÃO SALVAR FICHA DE INSPEÇÃO
// ============================================================
function salvarFichaInspecao(dadosJSON) {
  const dados = typeof dadosJSON === "string" ? JSON.parse(dadosJSON) : dadosJSON;

  if (!dados.cpf) {
    return { success: false, message: "CPF não informado." };
  }

  const ss = SpreadsheetApp.openById(PLANILHA_FICHAS_ID);
  const aba = ss.getSheetByName(ABA_FICHAS);

  if (!aba) {
    return { success: false, message: "Aba '" + ABA_FICHAS + "' não encontrada." };
  }

  // Gera número de controle único: FICH-HEXA6-AAAAMMDD
  const controle = gerarNumeroControle();

  // Data e hora atual no formato brasileiro
  const agora = new Date();
  const dtInspecao = Utilities.formatDate(agora, Session.getScriptTimeZone(), "dd/MM/yyyy");
  const horaInspecao = Utilities.formatDate(agora, Session.getScriptTimeZone(), "HH:mm:ss");

  // Pega o cabeçalho da planilha
  const cabecalho = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];

  // Finalidades pode ser array, converte para string separada por vírgula
  const finalidadesStr = Array.isArray(dados.finalidades)
    ? dados.finalidades.join(", ")
    : (dados.finalidades || "");

  // Monta a linha a ser inserida
  const novaLinha = cabecalho.map(col => {
    const chave = col.toString().toLowerCase().trim();

    switch (chave) {
      case "controle":
        return controle;
      case "dt_inspecao":
      case "dt_insp":
      case "data_inspecao":
      case "data":
        return dtInspecao;
      case "hora":
      case "hora_inspecao":
        return horaInspecao;
      case "cod":
        return dados.cod || "";
      case "cpf":
        return dados.cpf || "";
      case "nome":
        return (dados.nome || "").toUpperCase();
      case "rg":
        return dados.rg || "";
      case "orgao":
      case "orgão":
        return (dados.orgao || "").toUpperCase();
      case "dt_nascimento":
      case "nascimento":
      case "data de nascimento":
        return dados.dt_nascimento || "";
      case "naturalidade":
        return dados.naturalidade || "";
      case "sexo":
        return dados.sexo || "";
      case "posto":
        return dados.posto || "";
      case "quadro":
        return dados.quadro || "";
      case "especialidade":
        return dados.especialidade || "";
      case "saram":
        return dados.saram || "";
      case "om":
        return dados.om || "";
      case "dt_praca":
        return dados.dt_praca || "";
      case "vinculo":
        return dados.vinculo || "";
      case "email":
        return (dados.email || "").toLowerCase();
      case "endereco":
        return dados.endereco || "";
      case "telefone":
        return dados.telefone || "";
      case "tp_sang":
        return dados.tp_sang || "";
      case "cor":
        return dados.cor || "";
      case "nacionalidade":
        return dados.nacionalidade || "";
      case "grupo":
        return dados.grupo || "";
      case "finalidade":
      case "finalidades":
        return finalidadesStr;
      case "clinica_restricao":
      case "clinica":
        return dados.clinica_restricao || "";
      case "data_inicio_restricao":
      case "dt_inicio_restricao":
        return dados.data_inicio_restricao || "";
      case "obs_dis":
      case "observacao_dis":
        return dados.obs_dis || "";
      case "obs_cartao":
      case "observacao_cartao":
        return dados.obs_cartao || "";
      case "dec_judicial":
        return dados.dec_judicial || "";
      case "status":
        return "PENDENTE";
      default:
        return "";
    }
  });

  // Adiciona a nova linha na planilha
  aba.appendRow(novaLinha);

  return {
    success: true,
    controle: [controle],
    message: "Ficha de inspeção salva com sucesso!",
    dados: {
      controle: controle,
      cpf: dados.cpf,
      nome: dados.nome,
      dt_inspecao: dtInspecao
    }
  };
}

// ============================================================
// FUNÇÃO GERAR NÚMERO DE CONTROLE: FICH-HEXA6-AAAAMMDD
// ============================================================
function gerarNumeroControle() {
  const hexa = Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, "0");
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `FICH-${hexa}-${ano}${mes}${dia}`;
}

// ============================================================
// FUNÇÃO BUSCAR FICHAS POR CPF
// ============================================================
function buscarFichas(cpf) {
  if (!cpf) {
    return { success: false, message: "CPF não informado." };
  }

  const cpfNormalizado = cpf.toString().replace(/\D/g, "").padStart(11, "0");
  const ss = SpreadsheetApp.openById(PLANILHA_FICHAS_ID);
  const aba = ss.getSheetByName(ABA_FICHAS);

  if (!aba) {
    return { success: false, message: "Aba não encontrada." };
  }

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const colCPF = cabecalho.findIndex(col => col.toString().toLowerCase().trim() === "cpf");

  if (colCPF === -1) {
    return { success: false, message: "Coluna 'cpf' não encontrada." };
  }

  const fichas = [];

  for (let i = 1; i < dados.length; i++) {
    const cpfLinha = dados[i][colCPF].toString().replace(/\D/g, "").padStart(11, "0");

    if (cpfLinha === cpfNormalizado) {
      const ficha = {};
      for (let j = 0; j < cabecalho.length; j++) {
        const chave = cabecalho[j].toString().toLowerCase().trim();
        let valor = dados[i][j];

        if (valor instanceof Date) {
          valor = Utilities.formatDate(valor, Session.getScriptTimeZone(), "dd/MM/yyyy");
        }

        ficha[chave] = valor !== undefined && valor !== null ? valor.toString() : "";
      }
      fichas.push(ficha);
    }
  }

  return {
    success: true,
    total: fichas.length,
    fichas: fichas
  };
}

// ============================================================
// FUNÇÃO DEBUG - VER COLUNAS DA PLANILHA
// ============================================================
function debugColunasFichas() {
  const ss = SpreadsheetApp.openById(PLANILHA_FICHAS_ID);
  const aba = ss.getSheetByName(ABA_FICHAS);

  if (!aba) {
    return { success: false, message: "Aba não encontrada." };
  }

  const cabecalho = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];

  const colunas = cabecalho.map((col, idx) => ({
    coluna: String.fromCharCode(65 + (idx % 26)) + (idx >= 26 ? String.fromCharCode(65 + Math.floor(idx / 26) - 1) : ""),
    indice: idx,
    nome: col.toString(),
    nomeLower: col.toString().toLowerCase().trim()
  }));

  return {
    success: true,
    aba: ABA_FICHAS,
    totalColunas: cabecalho.length,
    colunas: colunas
  };
}

// ============================================================
// FUNÇÃO GERAR FICHAS PARA IMPRESSÃO
// ============================================================
function generateFichasAction(codigos) {
  try {
    const ssApp = SpreadsheetApp.openById(TEMPLATE_SHEET_ID);
    const sheetTemplate = ssApp.getSheetByName("TEMPLATE");
    const sheetImpressao = ssApp.getSheetByName("IMPRESSAO");

    if (!sheetTemplate || !sheetImpressao) {
      return { success: false, error: "Abas TEMPLATE ou IMPRESSAO nao encontradas na planilha " + TEMPLATE_SHEET_ID };
    }

    sheetImpressao.clear();

    const sheetDados = ssApp.getSheetByName("FICHAS");
    if (!sheetDados) {
      return { success: false, error: "Aba FICHAS nao encontrada" };
    }
    const rawDados = sheetDados.getDataRange().getValues();

    const COLUNA_CONTROLE = 37;
    const COLUNA_STATUS = 39;

    const fichasPorCodigo = {};
    for (let i = 1; i < rawDados.length; i++) {
      const codigo = String(rawDados[i][COLUNA_CONTROLE] || "").trim();
      if (codigo) {
        fichasPorCodigo[codigo] = { row: rawDados[i], rowIndex: i + 1 };
      }
    }

    let archiveCache = {};
    try {
      const ssArquivo = SpreadsheetApp.openById(IDS.ARQUIVO);
      const dataArq = ssArquivo.getSheets()[0].getDataRange().getValues();
      dataArq.forEach((r, i) => {
        if (i >= 3) {
          const cpfKey = String(r[4] || "").replace(/\D/g, '').padStart(11, '0');
          if (cpfKey !== "00000000000") archiveCache[cpfKey] = r[5];
        }
      });
    } catch(e) {}

    let rowCount = 1;
    let processados = 0;

    codigos.forEach(codigo => {
      const ficha = fichasPorCodigo[codigo];
      if (ficha) {
        populateTemplateLogic(ficha.row, sheetTemplate, sheetImpressao, rowCount, archiveCache);
        sheetDados.getRange(ficha.rowIndex, COLUNA_STATUS + 1).setValue("IMPRESSO");
        rowCount += 64;
        processados++;
      }
    });

    if (processados === 0) {
      return { success: false, error: "Nenhuma ficha encontrada com os codigos informados" };
    }

    const ssId = ssApp.getId();
    const sheetId = sheetImpressao.getSheetId();
    const pdfUrl = `https://docs.google.com/spreadsheets/d/${ssId}/export?format=pdf&size=A4&portrait=true&fitw=true&gridlines=false&printtitle=false&sheetnames=false&fzr=false&gid=${sheetId}&top_margin=0.2&bottom_margin=0.2&left_margin=0.2&right_margin=0.2`;

    return { success: true, printUrl: pdfUrl, processados: processados };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ============================================================
// FUNÇÃO POPULAR TEMPLATE PARA IMPRESSÃO
// ============================================================
function populateTemplateLogic(row, template, target, startRow, archiveCache) {
  template.getRangeList(["S4", "Q4", "N1", "A15", "N5", "Q11", "A13", "H4", "H5", "G15", "F11", "Q9", "A9", "O8", "M15", "D6", "H2", "G11", "L11"]).clearContent();
  const cpf = String(row[6] || "").replace(/\D/g, '').padStart(11, '0');

  let dtNasc = row[4];
  if (dtNasc instanceof Date) {
    template.getRange("A11").setValue(calculateAge(dtNasc));
    template.getRange("B11").setValue(dtNasc);
  }

  let dtPraca = row[14];
  if (dtPraca instanceof Date) {
    template.getRange("A15").setValue(Utilities.formatDate(dtPraca, Session.getScriptTimeZone(), "dd/MM/yyyy") + " - " + calcServiceFull(dtPraca));
  }

  const postoCompleto = [row[8], row[9], row[10]].filter(Boolean).join(" ");
  template.getRange("H4").setValue(String((row[2] || "") + " " + (row[3] || "")));
  template.getRange("H5").setValue(String(row[15] || ""));
  template.getRange("A13").setValue(String(row[19] || ""));
  template.getRange("Q11").setValue(String(row[18] || ""));
  template.getRange("G15").setValue(String(row[6] || ""));
  template.getRange("F11").setValue(String(row[7] || ""));
  template.getRange("Q9").setValue(postoCompleto);
  template.getRange("A9").setValue(String(row[11] || ""));
  template.getRange("O8").setValue(String(row[12] || ""));
  template.getRange("M15").setValue(String(row[13] || ""));
  template.getRange("D6").setValue("Letra(s) " + (row[16] || ""));
  template.getRange("H2").setValue(String(row[21] || ""));
  template.getRange("L11").setValue(String(row[5] || ""));

  if (archiveCache[cpf]) template.getRange("S4").setValue(archiveCache[cpf]);

  const isSGPO = ["BCT", "BCO", "CTA", "PTA", "OEA", "ATCO"].some(esp => ` ${postoCompleto} `.includes(` ${esp} `));
  if (row[13] === "4 BAVEX") template.getRange("N1").setValue("4 BAVEX");
  else if (isSGPO) template.getRange("N1").setValue("SGPO");

  template.getRange("A1:T63").copyTo(target.getRange(startRow, 1));
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================
function calculateAge(dt) {
  const today = new Date();
  let age = today.getFullYear() - dt.getFullYear();
  if (today.getMonth() < dt.getMonth() || (today.getMonth() === dt.getMonth() && today.getDate() < dt.getDate())) age--;
  return age;
}

function calcServiceFull(dtPraca) {
  const hoje = new Date();
  let y = hoje.getFullYear() - dtPraca.getFullYear();
  let m = hoje.getMonth() - dtPraca.getMonth();
  let d = hoje.getDate() - dtPraca.getDate();
  if (d < 0) { m--; d += new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return `${y} anos ${m} meses e ${d} dias`;
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// FUNÇÕES DE TESTE
// ============================================================
function testarSalvarFicha() {
  const dadosTeste = {
    cpf: "123.456.789-00",
    nome: "TESTE DA SILVA",
    grupo: "IA - AERONAVEGANTES",
    finalidades: ["A - ANUAL", "B - ESPECIAL"]
  };

  const resultado = salvarFichaInspecao(JSON.stringify(dadosTeste));
  Logger.log(JSON.stringify(resultado));
}

function testarGerarControle() {
  for (let i = 0; i < 5; i++) {
    Logger.log(gerarNumeroControle());
  }
}
