/**
 * Google Apps Script - Cadastro de Inspecionandos
 * Planilha: 11IgiIAjSwYfK-F_rQrVqXhmI83ACaQbjRFwG2wiADtU
 */

const PLANILHA_ID = "11IgiIAjSwYfK-F_rQrVqXhmI83ACaQbjRFwG2wiADtU";
const ABA_INSPECIONANDOS = "ARQUIVO"; // Nome da aba principal

/**
 * Função principal que recebe requisições GET
 */
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

/**
 * Normaliza o CPF para busca: remove formatação e garante 11 dígitos
 * Entrada: "123.456.789-01" ou "12345678901" ou "1234567890"
 * Saída: "01234567890" (sempre 11 dígitos, com zeros à esquerda se necessário)
 */
function normalizarCPF(cpf) {
  if (!cpf) return "";
  // Remove tudo que não for número
  let cpfLimpo = cpf.toString().replace(/\D/g, "");
  // Garante 11 dígitos adicionando zeros à esquerda
  return cpfLimpo.padStart(11, "0");
}

/**
 * Formata o CPF para visualização: xxx.xxx.xxx-xx
 * Entrada: "12345678901"
 * Saída: "123.456.789-01"
 */
function formatarCPF(cpf) {
  if (!cpf) return "";
  let cpfLimpo = normalizarCPF(cpf);
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Gera código único no formato: INSP-HEXA6-AAAAMMDD
 * Exemplo: "INSP-F9BA64-20260120"
 */
function gerarCodigoUnico() {
  // Gera 6 caracteres hexadecimais aleatórios (maiúsculos)
  const hexa = Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, "0");

  // Data atual no formato AAAAMMDD
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  const dataFormatada = `${ano}${mes}${dia}`;

  return `INSP-${hexa}-${dataFormatada}`;
}

/**
 * Converte data de YYYY-MM-DD para DD/MM/AAAA (formato brasileiro)
 * Entrada: "2026-01-20" ou Date object
 * Saída: "20/01/2026"
 */
function formatarDataParaBR(data) {
  if (!data) return "";

  // Se for objeto Date
  if (data instanceof Date) {
    return Utilities.formatDate(data, Session.getScriptTimeZone(), "dd/MM/yyyy");
  }

  // Se for string no formato YYYY-MM-DD
  if (typeof data === "string" && data.includes("-")) {
    const partes = data.split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
  }

  // Se já estiver no formato DD/MM/AAAA, retorna como está
  if (typeof data === "string" && data.includes("/")) {
    return data;
  }

  return data.toString();
}

// ============================================================
// FUNÇÃO PRINCIPAL DE BUSCA POR CPF (usada por index e cadastro)
// ============================================================

/**
 * Busca um inspecionando pelo CPF na planilha
 * Funciona tanto para o index.html quanto para o modo edição do cadastro
 * @param {string} cpfBusca - CPF a ser buscado (com ou sem formatação)
 * @returns {Object} - { success: true/false, data: {...} ou message: "..." }
 */
function buscarCPF(cpfBusca) {
  if (!cpfBusca) {
    return { success: false, message: "CPF não informado." };
  }

  // Normaliza o CPF de busca (sempre 11 dígitos, sem formatação)
  const cpfNormalizado = normalizarCPF(cpfBusca);

  const ss = SpreadsheetApp.openById(PLANILHA_ID);
  const aba = ss.getSheetByName(ABA_INSPECIONANDOS);

  if (!aba) {
    return { success: false, message: "Aba '" + ABA_INSPECIONANDOS + "' não encontrada." };
  }

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];

  // Encontra o índice da coluna CPF (case-insensitive)
  const colCPF = cabecalho.findIndex(col => col.toString().toLowerCase().trim() === "cpf");
  if (colCPF === -1) {
    return { success: false, message: "Coluna 'cpf' não encontrada na planilha." };
  }

  // Busca a linha com o CPF correspondente
  for (let i = 1; i < dados.length; i++) {
    const cpfPlanilha = normalizarCPF(dados[i][colCPF]);

    if (cpfPlanilha === cpfNormalizado) {
      // Monta o objeto com todos os dados da linha
      const registro = {};
      for (let j = 0; j < cabecalho.length; j++) {
        const chave = cabecalho[j].toString().toLowerCase().trim();
        let valor = dados[i][j];

        // Formata datas para DD/MM/YYYY
        if (valor instanceof Date) {
          valor = Utilities.formatDate(valor, Session.getScriptTimeZone(), "dd/MM/yyyy");
        }

        const valorFinal = valor !== undefined && valor !== null ? valor.toString() : "";
        registro[chave] = valorFinal;

        // Adiciona alias para chaves com variações (para compatibilidade com front-end)
        if (chave === "orgão") {
          registro["orgao"] = valorFinal;
        }
        if (chave === "data de nascimento") {
          registro["nascimento"] = valorFinal;
        }
      }

      // Garante que o CPF seja retornado formatado para visualização
      registro.cpf = formatarCPF(cpfNormalizado);

      return {
        success: true,
        data: registro
      };
    }
  }

  return { success: false, message: "Inspecionando não encontrado." };
}

// ============================================================
// FUNÇÕES DE CADASTRO E ATUALIZAÇÃO
// ============================================================

/**
 * Salva um novo inspecionando na planilha
 */
function salvarInspecionando(params) {
  const ss = SpreadsheetApp.openById(PLANILHA_ID);
  const aba = ss.getSheetByName(ABA_INSPECIONANDOS);

  if (!aba) {
    return { success: false, message: "Aba não encontrada." };
  }

  // Normaliza e formata o CPF para armazenamento
  const cpfFormatado = formatarCPF(params.cpf);

  // Verifica se já existe
  const verificacao = buscarCPF(params.cpf);
  if (verificacao.success) {
    return { success: false, message: "CPF já cadastrado no sistema." };
  }

  const cabecalho = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];

  // Gera novo código único: INSP-HEXA6-AAAAMMDD
  const novoCod = gerarCodigoUnico();

  // Monta a linha a ser inserida
  const novaLinha = cabecalho.map(col => {
    const chave = col.toString().toLowerCase().trim();
    switch (chave) {
      case "cod":
        return novoCod;
      case "cpf":
        return cpfFormatado;
      case "nome":
        return (params.nome || "").toUpperCase();
      case "rg":
        return params.rg || "";
      case "orgao":
      case "orgão":
      case "orgao_rg":
      case "orgao_identidade":
        return (params.orgao || "").toUpperCase();
      case "nascimento":
      case "dt_nascimento":
      case "data_nascimento":
      case "data de nascimento":
        return formatarDataParaBR(params.dt_nascimento);
      case "naturalidade":
        return params.naturalidade || "";
      case "sexo":
        return params.sexo || "";
      case "email":
        return (params.email || "").toLowerCase();
      case "telefone":
        return params.telefone || "";
      case "tp_sang":
        return params.tp_sang || "";
      case "cor":
        return params.cor || "";
      case "nacionalidade":
        return params.nacionalidade || "";
      case "endereco":
        return params.endereco || "";
      case "vinculo":
        return params.vinculo || "";
      case "posto":
        return params.posto || "";
      case "om":
        return params.om || "";
      case "saram":
        return params.saram || "";
      case "quadro":
        return params.quadro || "";
      case "especialidade":
        return params.especialidade || "";
      case "grupo":
        return params.grupo || "";
      case "dt_praca":
        return formatarDataParaBR(params.dt_praca);
      case "senha":
        return params.senha || "";
      default:
        return "";
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

/**
 * Atualiza um cadastro existente na planilha
 */
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

  // Encontra a linha do registro
  let linhaEncontrada = -1;
  for (let i = 1; i < todosOsDados.length; i++) {
    if (normalizarCPF(todosOsDados[i][colCPF]) === cpfNormalizado) {
      linhaEncontrada = i + 1; // +1 porque a planilha começa em 1
      break;
    }
  }

  if (linhaEncontrada === -1) {
    return { success: false, message: "Registro não encontrado para atualização." };
  }

  // Pega os dados existentes da linha encontrada
  const dadosExistentes = todosOsDados[linhaEncontrada - 1];

  // Encontra índices das colunas importantes
  const colCod = cabecalho.findIndex(col => col.toString().toLowerCase().trim() === "cod");
  const colNome = cabecalho.findIndex(col => col.toString().toLowerCase().trim() === "nome");

  // Pega código existente ou gera um novo se não existir
  let codigoFinal = colCod !== -1 ? dadosExistentes[colCod] : "";
  if (!codigoFinal || codigoFinal.toString().trim() === "") {
    codigoFinal = gerarCodigoUnico();
  }

  // Pega nome existente ou usa o enviado
  const nomeFinal = dados.nome ? dados.nome.toUpperCase() : (colNome !== -1 ? dadosExistentes[colNome] : "");

  // Atualiza os campos
  const linhaAtualizada = cabecalho.map((col, idx) => {
    const chave = col.toString().toLowerCase().trim();

    // Mantém valores existentes se não fornecidos
    const valorExistente = dadosExistentes[idx];

    switch (chave) {
      case "cod":
        return codigoFinal;
      case "cpf":
        return cpfFormatado;
      case "nome":
        return dados.nome ? dados.nome.toUpperCase() : valorExistente;
      case "rg":
        return dados.rg !== undefined ? dados.rg : valorExistente;
      case "orgao":
      case "orgão":
      case "orgao_rg":
      case "orgao_identidade":
        return dados.orgao ? dados.orgao.toUpperCase() : valorExistente;
      case "nascimento":
      case "dt_nascimento":
      case "data_nascimento":
      case "data de nascimento":
        return dados.nascimento ? formatarDataParaBR(dados.nascimento) : valorExistente || "";
      case "naturalidade":
        return dados.naturalidade !== undefined ? dados.naturalidade : valorExistente;
      case "sexo":
        return dados.sexo !== undefined ? dados.sexo : valorExistente;
      case "email":
        return dados.email ? dados.email.toLowerCase() : valorExistente;
      case "telefone":
        return dados.telefone !== undefined ? dados.telefone : valorExistente;
      case "tp_sang":
        return dados.tp_sang !== undefined ? dados.tp_sang : valorExistente;
      case "cor":
        return dados.cor !== undefined ? dados.cor : valorExistente;
      case "nacionalidade":
        return dados.nacionalidade !== undefined ? dados.nacionalidade : valorExistente;
      case "endereco":
        return dados.endereco !== undefined ? dados.endereco : valorExistente;
      case "vinculo":
        return dados.vinculo !== undefined ? dados.vinculo : valorExistente;
      case "posto":
        return dados.posto !== undefined ? dados.posto : valorExistente;
      case "om":
        return dados.om !== undefined ? dados.om : valorExistente;
      case "saram":
        return dados.saram !== undefined ? dados.saram : valorExistente;
      case "quadro":
        return dados.quadro !== undefined ? dados.quadro : valorExistente;
      case "especialidade":
        return dados.especialidade !== undefined ? dados.especialidade : valorExistente;
      case "grupo":
        return dados.grupo !== undefined ? dados.grupo : valorExistente;
      case "dt_praca":
        return dados.dt_praca ? formatarDataParaBR(dados.dt_praca) : valorExistente;
      case "senha":
        return dados.senha || valorExistente || "";
      default:
        return valorExistente || "";
    }
  });

  // Atualiza a linha na planilha
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
// FUNÇÃO PARA CARREGAR DADOS INICIAIS (Listas de OMs, Postos, etc)
// ============================================================

/**
 * Retorna as listas para popular os datalists do formulário
 * Inclui dados da planilha de inspecionandos E da planilha de configurações
 */
function getDadosIniciais() {
  const ss = SpreadsheetApp.openById(PLANILHA_ID);

  // Carrega grupos e finalidades da planilha de configurações
  const configListas = carregarGruposEFinalidades();

  // Ajuste os nomes das abas conforme sua planilha
  const resultado = {
    success: true,
    oms: carregarLista(ss, "OMs", 0),
    postos: carregarLista(ss, "Postos", 0),
    quadro: carregarLista(ss, "Quadros", 0),
    esp: carregarLista(ss, "Especialidades", 0),
    grupos: configListas.grupos,        // Da planilha de configurações
    finalidades: configListas.finalidades  // Da planilha de configurações
  };

  return resultado;
}

/**
 * Carrega uma lista de uma aba específica
 */
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
// FUNÇÃO DE TESTE (para debug no editor do GAS)
// ============================================================

/**
 * Função para debug - retorna os nomes das colunas da planilha
 * Chame via: ?action=debugColunas
 */
function debugColunas() {
  const ss = SpreadsheetApp.openById(PLANILHA_ID);
  const aba = ss.getSheetByName(ABA_INSPECIONANDOS);

  if (!aba) {
    return { success: false, message: "Aba '" + ABA_INSPECIONANDOS + "' não encontrada." };
  }

  const cabecalho = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];

  const colunas = cabecalho.map((col, idx) => {
    const letra = String.fromCharCode(65 + idx); // A, B, C, D...
    return {
      coluna: letra,
      indice: idx,
      nome: col.toString(),
      nomeLower: col.toString().toLowerCase().trim()
    };
  });

  return {
    success: true,
    aba: ABA_INSPECIONANDOS,
    totalColunas: cabecalho.length,
    colunas: colunas
  };
}

function testarFuncoes() {
  // Teste com diferentes formatos de CPF
  const testesCPF = [
    "123.456.789-01",  // formatado
    "12345678901",     // sem formatação
    "1234567890",      // com 10 dígitos (deve adicionar zero à esquerda)
    "01234567890"      // com zero à esquerda
  ];

  Logger.log("=== TESTE DE CPF ===");
  testesCPF.forEach(cpf => {
    Logger.log("Testando CPF: " + cpf);
    Logger.log("Normalizado: " + normalizarCPF(cpf));
    Logger.log("Formatado: " + formatarCPF(cpf));
    Logger.log("---");
  });

  Logger.log("=== TESTE DE CÓDIGO ÚNICO ===");
  for (let i = 0; i < 3; i++) {
    Logger.log("Código gerado: " + gerarCodigoUnico());
  }

  Logger.log("=== TESTE DE FORMATAÇÃO DE DATA ===");
  const testesDatas = [
    "2026-01-20",      // formato input date
    "20/01/2026",      // já formatado BR
    new Date()         // objeto Date
  ];

  testesDatas.forEach(data => {
    Logger.log("Data original: " + data);
    Logger.log("Data formatada BR: " + formatarDataParaBR(data));
    Logger.log("---");
  });
}
