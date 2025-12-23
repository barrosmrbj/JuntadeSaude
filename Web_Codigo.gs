/** ============================================================
 *  doGet — versão final e estável
 *  ============================================================
 *  Carrega:
 *     - Web_Principal (SPA)
 *     - Lista de OM
 *     - Lista de grupos
 *  Envia para o frontend via template:
 *     page.list      → OM_LIST
 *     page.grupos    → GRUPOS_LIST
 * ============================================================ */

function doGet(e) {
  try {

    // ----------- Abrir a planilha -----------
    const url = "https://docs.google.com/spreadsheets/d/1CWXzs_J1tTITIZ52_0t02tUb8tBewKSBNWNyaHb6z8M/edit#gid=604402005";
    const ss = SpreadsheetApp.openByUrl(url);

    const guiaGrupos = ss.getSheetByName("GRUPOS");  
    const guiaFinalidades = ss.getSheetByName("FINALIDADES");
    const guiaOM = ss.getSheetByName("OM");


    if (!guiaOM) {
      throw new Error('A aba "OM" não foi encontrada.');
    }

    // ----------- Coletar lista de OM (coluna J = coluna 10) -----------
    const lastRow = guiaOM.getLastRow();
    const numRows = Math.max(0, lastRow - 1);

    let listaOM = [];

    if (numRows > 0) {
      const data = guiaOM.getRange(1, 1, numRows, 1).getValues();

      listaOM = [...new Set(
        data
          .map(r => r[0])
          .filter(v => v && v.toString().trim() !== "")
          .map(v => v.toString().trim())
      )];
    }

    // ----------- Coletar grupos -----------
    let grupos = [];

    if (guiaGrupos && guiaGrupos.getLastRow() > 1) {
      const dadosGrupos = guiaGrupos.getRange(2, 1, guiaGrupos.getLastRow() - 1, 1).getValues();

      grupos = dadosGrupos
        .map(r => r[0])
        .filter(v => v && v.toString().trim() !== "");
    }

    // ----------- Coletar finalidades -----------
    let finalidades = [];

    if (guiaFinalidades && guiaFinalidades.getLastRow() > 1) {
      const dadosFinalidades  = guiaFinalidades.getRange(2, 1, guiaFinalidades.getLastRow() - 1, 1).getValues();

      finalidades = dadosFinalidades
        .map(r => r[0])
        .filter(v => v && v.toString().trim() !== "");
    }


    // ----------- Carregar o HTML principal da aplicação -----------

    const page = HtmlService.createTemplateFromFile("Web_Principal_SPA");

    // Passa os dados para o template
    page.list = listaOM;              // OM_LIST
    page.grupos = grupos;             // GRUPOS_LIST
    page.finalidades = finalidades;   // GRUPOS_FINALIDADES

    // Primeiro avaliamos o template para gerar o HtmlOutput
    const output = page.evaluate();

    // Agora sim aplicamos as configurações de tela e título no "output"
    output.addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
          .setTitle("Junta de Saúde - AppWeb");

    return output;
    
  } catch (err) {
    Logger.log("Erro no doGet: " + err);
    return HtmlService.createHtmlOutput("Erro ao carregar: " + err);
  }
}

/** ============================================================
 *  include(filename)
 *  Função essencial p/ SPA carregar subpáginas e scripts
 * ============================================================ */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
