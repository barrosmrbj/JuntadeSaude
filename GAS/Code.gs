/**
 * Google Apps Script - Sistema Junta de Saúde
 * ARQUIVO ÚNICO CONSOLIDADO
 *
 * Planilha Inspecionandos: 11IgiIAjSwYfK-F_rQrVqXhmI83ACaQbjRFwG2wiADtU
 * Planilha Configurações: 1D1UzzVA_RRkM8Qcg1gmBnEaq0JY8fKYYJnMXu9wCxxU
 */

// ============================================================
// CONFIGURAÇÕES - IDs DAS PLANILHAS
// ============================================================
const PLANILHA_ID = "11IgiIAjSwYfK-F_rQrVqXhmI83ACaQbjRFwG2wiADtU";
const ABA_INSPECIONANDOS = "ARQUIVO";

const PLANILHA_CONFIG_ID = "1D1UzzVA_RRkM8Qcg1gmBnEaq0JY8fKYYJnMXu9wCxxU";

// ============================================================
// FUNÇÃO PRINCIPAL - doGet
// ============================================================
function doGet(e) {
  const action = e.parameter.action;
  let resultado;

  try {
    switch (action) {
      case "buscarCPF":
        resultado = buscarCPF(e.parameter.cpf);
        break;
      case "getDadosIniciais":
        resultado = getDadosIniciais();
        break;
      case "salvarInspecionando":
        resultado = salvarInspecionando(e.parameter);
        break;
      case "atualizarCadastroNoBanco":
        resultado = atualizarCadastroNoBanco(e.parameter.dados);
        break;
      case "debugColunas":
        resultado = debugColunas();
        break;
      default:
        resultado = { success: false, message: "Ação não reconhecida: " + action };
    }
  } catch (error) {
    resultado = { success: false, message: "Erro no servidor: " + error.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(resultado))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// FUNÇÕES DE TRATAMENTO DE CPF
// ============================================================

function normalizarCPF(cpf) {
  if (!cpf) return "";
  let cpfLimpo = cpf.toString().replace(/\D/g, "");
  return cpfLimpo.padStart(11, "0");
}

function formatarCPF(cpf) {
  if (!cpf) return "";
  let cpfLimpo = normalizarCPF(cpf);
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function gerarCodigoUnico() {
  const hexa = Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, "0");
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `INSP-${hexa}-${ano}${mes}${dia}`;
}

function formatarDataParaBR(data) {
  if (!data) return "";
  if (data instanceof Date) {
    return Utilities.formatDate(data, Session.getScriptTimeZone(), "dd/MM/yyyy");
  }
  if (typeof data === "string" && data.includes("-")) {
    const partes = data.split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
  }
  if (typeof data === "string" && data.includes("/")) {
    return data;
  }
  return data.toString();
}

// ============================================================
// FUNÇÕES DE GRUPOS E FINALIDADES (Planilha de Configurações)
// ============================================================

function carregarGrupos() {
  try {
    const ss = SpreadsheetApp.openById(PLANILHA_CONFIG_ID);
    const aba = ss.getSheetByName("GRUPOS");

    if (!aba) {
      Logger.log("Aba 'GRUPOS' não encontrada.");
      return [];
    }

    const ultimaLinha = aba.getLastRow();
    if (ultimaLinha < 2) return [];

    const range = aba.getRange(2, 1, ultimaLinha - 1, 1);
    const valores = range.getValues();

    const grupos = [];
    for (let i = 0; i < valores.length; i++) {
      const valor = valores[i][0];
      if (valor && valor.toString().trim() !== "") {
        grupos.push(valor.toString().trim());
      }
    }
    return grupos;
  } catch (error) {
    Logger.log("Erro ao carregar grupos: " + error.message);
    return [];
  }
}

function carregarFinalidades() {
  try {
    const ss = SpreadsheetApp.openById(PLANILHA_CONFIG_ID);
    const aba = ss.getSheetByName("FINALIDADES");

    if (!aba) {
      Logger.log("Aba 'FINALIDADES' não encontrada.");
      return [];
    }

    const ultimaLinha = aba.getLastRow();
    if (ultimaLinha < 2) return [];

    const range = aba.getRange(2, 1, ultimaLinha - 1, 1);
    const valores = range.getValues();

    const finalidades = [];
    for (let i = 0; i < valores.length; i++) {
      const valor = valores[i][0];
      if (valor && valor.toString().trim() !== "") {
        finalidades.push(valor.toString().trim());
      }
    }
    return finalidades;
  } catch (error) {
    Logger.log("Erro ao carregar finalidades: " + error.message);
    return [];
  }
}

function carregarGruposEFinalidades() {
  return {
    grupos: carregarGrupos(),
    finalidades: carregarFinalidades()
  };
}

// ============================================================
// FUNÇÃO BUSCAR CPF
// ============================================================

function buscarCPF(cpfBusca) {
  if (!cpfBusca) {
    return { success: false, message: "CPF não informado." };
  }

  const cpfNormalizado = normalizarCPF(cpfBusca);
  const ss = SpreadsheetApp.openById(PLANILHA_ID);
  const aba = ss.getSheetByName(ABA_INSPECIONANDOS);

  if (!aba) {
    return { success: false, message: "Aba '" + ABA_INSPECIONANDOS + "' não encontrada." };
  }

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const colCPF = cabecalho.findIndex(col => col.toString().toLowerCase().trim() === "cpf");

  if (colCPF === -1) {
    return { success: false, message: "Coluna 'cpf' não encontrada." };
  }

  for (let i = 1; i < dados.length; i++) {
    const cpfPlanilha = normalizarCPF(dados[i][colCPF]);

    if (cpfPlanilha === cpfNormalizado) {
      const registro = {};
      for (let j = 0; j < cabecalho.length; j++) {
        const chave = cabecalho[j].toString().toLowerCase().trim();
        let valor = dados[i][j];

        if (valor instanceof Date) {
          valor = Utilities.formatDate(valor, Session.getScriptTimeZone(), "dd/MM/yyyy");
        }

        const valorFinal = valor !== undefined && valor !== null ? valor.toString() : "";
        registro[chave] = valorFinal;

        // Alias para compatibilidade
        if (chave === "orgão") registro["orgao"] = valorFinal;
        if (chave === "data de nascimento") registro["nascimento"] = valorFinal;
      }

      registro.cpf = formatarCPF(cpfNormalizado);
      return { success: true, data: registro };
    }
  }

  return { success: false, message: "Inspecionando não encontrado." };
}

// ============================================================
// FUNÇÃO SALVAR INSPECIONANDO
// ============================================================

function salvarInspecionando(params) {
  const ss = SpreadsheetApp.openById(PLANILHA_ID);
  const aba = ss.getSheetByName(ABA_INSPECIONANDOS);

  if (!aba) {
    return { success: false, message: "Aba não encontrada." };
  }

  const cpfFormatado = formatarCPF(params.cpf);
  const verificacao = buscarCPF(params.cpf);
  if (verificacao.success) {
    return { success: false, message: "CPF já cadastrado no sistema." };
  }

  const cabecalho = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
  const novoCod = gerarCodigoUnico();

  const novaLinha = cabecalho.map(col => {
    const chave = col.toString().toLowerCase().trim();
    switch (chave) {
      case "cod": return novoCod;
      case "cpf": return cpfFormatado;
      case "nome": return (params.nome || "").toUpperCase();
      case "rg": return params.rg || "";
      case "orgao":
      case "orgão":
        return (params.orgao || "").toUpperCase();
      case "nascimento":
      case "dt_nascimento":
      case "data_nascimento":
      case "data de nascimento":
        return formatarDataParaBR(params.dt_nascimento);
      case "naturalidade": return params.naturalidade || "";
      case "sexo": return params.sexo || "";
      case "email": return (params.email || "").toLowerCase();
      case "telefone": return params.telefone || "";
      case "tp_sang": return params.tp_sang || "";
      case "cor": return params.cor || "";
      case "nacionalidade": return params.nacionalidade || "";
      case "endereco": return params.endereco || "";
      case "vinculo": return params.vinculo || "";
      case "posto": return params.posto || "";
      case "om": return params.om || "";
      case "saram": return params.saram || "";
      case "quadro": return params.quadro || "";
      case "especialidade": return params.especialidade || "";
      case "grupo": return params.grupo || "";
      case "dt_praca": return formatarDataParaBR(params.dt_praca);
      case "senha": return params.senha || "";
      default: return "";
    }
  });

  aba.appendRow(novaLinha);

  return {
    success: true,
    id: novoCod,
    cod: novoCod,
    nome: (params.nome || "").toUpperCase(),
    cpf: cpfFormatado,
    message: "Cadastro realizado com sucesso!"
  };
}

// ============================================================
// FUNÇÃO ATUALIZAR CADASTRO
// ============================================================

function atualizarCadastroNoBanco(dadosJSON) {
  const dados = typeof dadosJSON === "string" ? JSON.parse(dadosJSON) : dadosJSON;

  if (!dados.cpf) {
    return { success: false, message: "CPF não informado para atualização." };
  }

  const cpfNormalizado = normalizarCPF(dados.cpf);
  const cpfFormatado = formatarCPF(dados.cpf);
  const ss = SpreadsheetApp.openById(PLANILHA_ID);
  const aba = ss.getSheetByName(ABA_INSPECIONANDOS);

  if (!aba) {
    return { success: false, message: "Aba não encontrada." };
  }

  const todosOsDados = aba.getDataRange().getValues();
  const cabecalho = todosOsDados[0];
  const colCPF = cabecalho.findIndex(col => col.toString().toLowerCase().trim() === "cpf");

  if (colCPF === -1) {
    return { success: false, message: "Coluna 'cpf' não encontrada." };
  }

  let linhaEncontrada = -1;
  for (let i = 1; i < todosOsDados.length; i++) {
    if (normalizarCPF(todosOsDados[i][colCPF]) === cpfNormalizado) {
      linhaEncontrada = i + 1;
      break;
    }
  }

  if (linhaEncontrada === -1) {
    return { success: false, message: "Registro não encontrado para atualização." };
  }

  const dadosExistentes = todosOsDados[linhaEncontrada - 1];
  const colCod = cabecalho.findIndex(col => col.toString().toLowerCase().trim() === "cod");
  const colNome = cabecalho.findIndex(col => col.toString().toLowerCase().trim() === "nome");

  let codigoFinal = colCod !== -1 ? dadosExistentes[colCod] : "";
  if (!codigoFinal || codigoFinal.toString().trim() === "") {
    codigoFinal = gerarCodigoUnico();
  }

  const nomeFinal = dados.nome ? dados.nome.toUpperCase() : (colNome !== -1 ? dadosExistentes[colNome] : "");

  const linhaAtualizada = cabecalho.map((col, idx) => {
    const chave = col.toString().toLowerCase().trim();
    const valorExistente = dadosExistentes[idx];

    switch (chave) {
      case "cod": return codigoFinal;
      case "cpf": return cpfFormatado;
      case "nome": return dados.nome ? dados.nome.toUpperCase() : valorExistente;
      case "rg": return dados.rg !== undefined ? dados.rg : valorExistente;
      case "orgao":
      case "orgão":
        return dados.orgao ? dados.orgao.toUpperCase() : valorExistente;
      case "nascimento":
      case "dt_nascimento":
      case "data_nascimento":
      case "data de nascimento":
        return dados.nascimento ? formatarDataParaBR(dados.nascimento) : valorExistente || "";
      case "naturalidade": return dados.naturalidade !== undefined ? dados.naturalidade : valorExistente;
      case "sexo": return dados.sexo !== undefined ? dados.sexo : valorExistente;
      case "email": return dados.email ? dados.email.toLowerCase() : valorExistente;
      case "telefone": return dados.telefone !== undefined ? dados.telefone : valorExistente;
      case "tp_sang": return dados.tp_sang !== undefined ? dados.tp_sang : valorExistente;
      case "cor": return dados.cor !== undefined ? dados.cor : valorExistente;
      case "nacionalidade": return dados.nacionalidade !== undefined ? dados.nacionalidade : valorExistente;
      case "endereco": return dados.endereco !== undefined ? dados.endereco : valorExistente;
      case "vinculo": return dados.vinculo !== undefined ? dados.vinculo : valorExistente;
      case "posto": return dados.posto !== undefined ? dados.posto : valorExistente;
      case "om": return dados.om !== undefined ? dados.om : valorExistente;
      case "saram": return dados.saram !== undefined ? dados.saram : valorExistente;
      case "quadro": return dados.quadro !== undefined ? dados.quadro : valorExistente;
      case "especialidade": return dados.especialidade !== undefined ? dados.especialidade : valorExistente;
      case "grupo": return dados.grupo !== undefined ? dados.grupo : valorExistente;
      case "dt_praca": return dados.dt_praca ? formatarDataParaBR(dados.dt_praca) : valorExistente;
      case "senha": return dados.senha || valorExistente || "";
      default: return valorExistente || "";
    }
  });

  aba.getRange(linhaEncontrada, 1, 1, linhaAtualizada.length).setValues([linhaAtualizada]);

  return {
    success: true,
    cod: codigoFinal,
    nome: nomeFinal,
    cpf: cpfFormatado,
    message: "Cadastro atualizado com sucesso!"
  };
}

// ============================================================
// FUNÇÃO DADOS INICIAIS (Listas para formulários)
// ============================================================

function getDadosIniciais() {
  const ss = SpreadsheetApp.openById(PLANILHA_ID);
  const configListas = carregarGruposEFinalidades();

  return {
    success: true,
    oms: carregarLista(ss, "OMs", 0),
    postos: carregarLista(ss, "Postos", 0),
    quadro: carregarLista(ss, "Quadros", 0),
    esp: carregarLista(ss, "Especialidades", 0),
    grupos: configListas.grupos,
    finalidades: configListas.finalidades
  };
}

function carregarLista(ss, nomeAba, coluna) {
  const aba = ss.getSheetByName(nomeAba);
  if (!aba) return [];

  const dados = aba.getDataRange().getValues();
  const lista = [];

  for (let i = 1; i < dados.length; i++) {
    const valor = dados[i][coluna];
    if (valor && valor.toString().trim() !== "") {
      lista.push(valor.toString().trim());
    }
  }
  return lista;
}

// ============================================================
// FUNÇÃO DEBUG
// ============================================================

function debugColunas() {
  const ss = SpreadsheetApp.openById(PLANILHA_ID);
  const aba = ss.getSheetByName(ABA_INSPECIONANDOS);

  if (!aba) {
    return { success: false, message: "Aba não encontrada." };
  }

  const cabecalho = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];

  const colunas = cabecalho.map((col, idx) => ({
    coluna: String.fromCharCode(65 + idx),
    indice: idx,
    nome: col.toString(),
    nomeLower: col.toString().toLowerCase().trim()
  }));

  return {
    success: true,
    aba: ABA_INSPECIONANDOS,
    totalColunas: cabecalho.length,
    colunas: colunas
  };
}

// ============================================================
// FUNÇÕES DE TESTE
// ============================================================

function testarGruposEFinalidades() {
  Logger.log("=== TESTE DE GRUPOS ===");
  const grupos = carregarGrupos();
  Logger.log("Total: " + grupos.length);
  Logger.log(JSON.stringify(grupos));

  Logger.log("=== TESTE DE FINALIDADES ===");
  const finalidades = carregarFinalidades();
  Logger.log("Total: " + finalidades.length);
  Logger.log(JSON.stringify(finalidades));
}
