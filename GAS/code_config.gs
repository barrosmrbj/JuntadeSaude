/**
 * Google Apps Script - Configurações (Grupos, Finalidades, etc)
 * Planilha de Configurações: 1D1UzzVA_RRkM8Qcg1gmBnEaq0JY8fKYYJnMXu9wCxxU
 */

const PLANILHA_CONFIG_ID = "1D1UzzVA_RRkM8Qcg1gmBnEaq0JY8fKYYJnMXu9wCxxU";

// ============================================================
// FUNÇÕES PARA CARREGAR GRUPOS E FINALIDADES
// ============================================================

/**
 * Carrega a lista de grupos da planilha de configurações
 * Aba: GRUPOS, Coluna A, a partir da linha 2
 */
function carregarGrupos() {
  try {
    const ss = SpreadsheetApp.openById(PLANILHA_CONFIG_ID);
    const aba = ss.getSheetByName("GRUPOS");

    if (!aba) {
      Logger.log("Aba 'GRUPOS' não encontrada na planilha de configurações.");
      return [];
    }

    const ultimaLinha = aba.getLastRow();
    if (ultimaLinha < 2) return []; // Sem dados (só cabeçalho)

    // Pega coluna A, da linha 2 até a última
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

/**
 * Carrega a lista de finalidades da planilha de configurações
 * Aba: FINALIDADES, Coluna A, a partir da linha 2
 */
function carregarFinalidades() {
  try {
    const ss = SpreadsheetApp.openById(PLANILHA_CONFIG_ID);
    const aba = ss.getSheetByName("FINALIDADES");

    if (!aba) {
      Logger.log("Aba 'FINALIDADES' não encontrada na planilha de configurações.");
      return [];
    }

    const ultimaLinha = aba.getLastRow();
    if (ultimaLinha < 2) return []; // Sem dados (só cabeçalho)

    // Pega coluna A, da linha 2 até a última
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

/**
 * Retorna grupos e finalidades juntos
 * Usado pela função getDadosIniciais
 */
function carregarGruposEFinalidades() {
  return {
    grupos: carregarGrupos(),
    finalidades: carregarFinalidades()
  };
}

// ============================================================
// FUNÇÃO DE TESTE (para debug no editor do GAS)
// ============================================================

function testarConfigListas() {
  Logger.log("=== TESTE DE GRUPOS ===");
  const grupos = carregarGrupos();
  Logger.log("Total de grupos: " + grupos.length);
  Logger.log("Grupos: " + JSON.stringify(grupos));

  Logger.log("=== TESTE DE FINALIDADES ===");
  const finalidades = carregarFinalidades();
  Logger.log("Total de finalidades: " + finalidades.length);
  Logger.log("Finalidades: " + JSON.stringify(finalidades));
}
