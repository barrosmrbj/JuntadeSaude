/** ============================================
 *  CONFIGURAÇÕES DO BANCO - ARQUIVO
 *  ============================================ */
const URL_ARQUIVO = "https://docs.google.com/spreadsheets/d/1CWXzs_J1tTITIZ52_0t02tUb8tBewKSBNWNyaHb6z8M/edit#gid=2022556060";
const ABA_ARQUIVO = "ARQUIVO";
const ABA_FICHAS = "FICHAS";
const ABA_LOGS = "LOGS";  
const LINHA_INICIAL = 2;
const COLUNA_CPF = 7;
const TOTAL_COLUNAS = 24;

/** ============================================
 *  FUNÇÕES DE SUPORTE
 *  ============================================ */
function openSheet(url, aba) {
  const ss = SpreadsheetApp.openByUrl(url);
  return ss.getSheetByName(aba);
}

function response(success, message, data = null) {
  return {
    success: success,
    message: message,
    data: data
  };
}
function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}


function normalizeCPF(cpf) {
  if (cpf === null || cpf === undefined || cpf === "") return "";
  
  // Converte para string e remove tudo o que não é número
  let strCpf = cpf.toString().replace(/\D/g, "");
  
  // O SEGREDO: Se tiver menos de 11 dígitos, preenche com "0" à esquerda
  return strCpf.padStart(11, "0");
}


/** ============================================
 *  PESQUISAR CPF NO ARQUIVO
 *  ============================================ */
function PesquisarDadosARQUIVO(cpfHtml) {
  // Criamos uma variável para rastrear o que está acontecendo
  let debugLog = "Iniciando busca... ";

  console.log("acessando o PesuisarDadosArquivo");
  const cpfBuscado = normalizeCPF(cpfHtml);
  if (!cpfBuscado) return response(false, "CPF inválido.");

  debugLog += "CPF Normalizado: " + cpfBuscado + " | ";

  const sheet = openSheet(URL_ARQUIVO, ABA_ARQUIVO);
  const last = sheet.getLastRow();
  if (last < LINHA_INICIAL) return response(false, "Arquivo vazio.");

  const colCpf = sheet.getRange(LINHA_INICIAL, COLUNA_CPF, last - LINHA_INICIAL + 1, 1).getValues();

  const reg = cpfBuscado; //ESSA PARTE DO REG NAO TINHA

  for (let i = 0; i < colCpf.length; i++) {

    const cpfPlanilha = normalizeCPF(colCpf[i][0]);
    console.log("cpfPlanilha:  " + cpfPlanilha);

    if (cpfPlanilha === cpfBuscado) {

      console.log("Encontrou ---------  cpfBuscado " + cpfBuscado);

      const linha = i + LINHA_INICIAL;
      const dados = sheet.getRange(linha, 1, 1, TOTAL_COLUNAS).getValues()[0];

      const reg = {
        cod: dados[0],
        arqv: dados[1],
        rg: dados[2],
        orgao: dados[3],
        nascimento: isValidDate(dados[4])
          ? Utilities.formatDate(dados[4], Session.getScriptTimeZone(), "dd/MM/yyyy")
          : "",
        naturalidade: dados[5],
        cpf: dados[6],
        sexo: dados[7],
        posto: dados[8],
        quadro: dados[9],
        especialidade: dados[10],
        nome: dados[11],
        saram: dados[12],
        om: dados[13],
        email: dados[14],
        endereco: dados[15],
        telefone: dados[16],
        grupo: dados[17],
        tp_sang: dados[18],
        cor: dados[19],
        nacionalidade: dados[20],
        vinculo: dados[21],
        clinica_restricao: dados[22],
        data_inicio_restricao: dados[23],
        val_ultm_insp: dados[24],
        possui_jss: dados[25],
        senha: dados[26]
      };
      console.log("Encontrado:", reg);
      return JSON.parse(JSON.stringify(response(true, "Encontrado!", reg)));
    }
  }


return {
    success: false,
    data: reg,
    debug: debugLog // Envia o log para o navegador
  };
  //return response(false, "Não encontrado.");
}


function TESTE_DIRETO_FICHA() {
  const payload = {
    // dados básicos trazidos da pesquisa (CURRENT_DATA)
    arqv: "456",
    rg: "123456",
    orgao: "COMAER",
    dt_nascimento: "05/09/1984",
    naturalidade: "AM",
    cpf: "752.177.912-68",
    sexo: "MASC",
    posto: "3S",
    quadro: "QESA",
    especialidade: "SEF",
    nome: "MARCELINO",
    saram: "3999483",
    om: "HAMN",
    vinculo: "AERONAUTICA",
    dec_judicial: "",           //---------------------------- a ser implementada depois
    email: "hkmjunior@gmail.com",
    endereco: "Rua itobi, 25 - Novo Aleixo",
    telefone: "92991225210",
    tp_sang: "O+",
    cor: "PARDO",
    nacionalidade: "BRASILEIRA",

    // dados coletados no Wizard
    grupo: "GRUPO",
    finalidades: ['A2 – Incorporação de candidatos à prestação do Serviço Militar Voluntário na condição de Oficial, Sargento ou Cabo, todos Temporários, da NSCA 160-9/2025, de 15AGO2025'],
    clinica_restricao: "NEURO",
    data_inicio_restricao: "01/01/2025",
    obs_dis: "DESCRICAO DO CURSO",
    obs_cartao: "01/01 A 04/01/2025"
  };
  const resultado = SalvarAlteracoesFicha(payload);
  Logger.log(resultado); // Verifique no "Execuções" se retornou Success: true
}


/** ============================================
 *  SALVAR DADOS NO ARQUIVO
 *  ============================================ */
function SalvarAlteracoesFicha(payload) {

  console.log(payload);
  try {
    const controle = Criar_CodCadastro("FICH");

    const ss = SpreadsheetApp.openByUrl(URL_ARQUIVO);
    
    const sheetFicha = ss.getSheetByName(ABA_FICHAS);
    const sheetLog = ss.getSheetByName(ABA_LOGS);

    if (!sheetFicha) {
      RegistrarLog(sheetLog, "ERRO", payload.cpf, "", "Aba FICHAS não encontrada");
      return { success: false, message: "Aba FICHAS não encontrada." };
    }

    if (!sheetLog) {
      console.log("sheetLog");
      return { success: false, message: "Aba LOGS não encontrada." };
    }

    // Data da inspeção
    const dtAgora = Utilities.formatDate(new Date(), "America/Manaus", "dd/MM/yyyy HH:mm");
    //const dt_inicio_restricao = Utilities.formatDate(payload.data_inicio_restricao, "America/Manaus", "dd/MM/yyyy HH:mm");

    //console.log("data inicio restricao   ",dt_inicio_restricao);

    // Converter finalidades para string
    const finalidadesTxt = (payload.finalidades || []).join("; ");

    // Montar linha de 38 colunas
    const linha = [
      dtAgora,                              // 1 - DT_INSP
      payload.arqv || "",                   // 2 - ARQV
      payload.rg || "",                     // 3 - RG
      payload.orgao || "",                  // 4 - ORGAO
      payload.dt_nascimento || "",          // 5 - DT_NASCIMENTO
      payload.naturalidade || "",           // 6 - NATURALIDADE
      payload.cpf || "",                    // 7 - CPF
      payload.sexo || "",                   // 8 - SEXO
      payload.posto || "",                  // 9 - POSTO
      payload.quadro || "",                 // 10 - QUADRO
      payload.especialidade || "",          // 11 - ESPECIALIDADE
      payload.nome || "",                   // 12 - NOME
      payload.saram || "",                  // 13 - SARAM
      payload.om || "",                     // 14 - OM
      payload.vinculo || "",                // 15 - VINCULO
      finalidadesTxt,                       // 16 - FINALIDADE
      "",                                   // 17 - DEC_JUDICIAL
      payload.email || "",                  // 18 - EMAIL
      payload.endereco || "",               // 19 - ENDERECO
      payload.telefone || "",               // 20 - TELEFONE
      payload.grupo || "",                  // 21 - GRUPO
      payload.tp_sang || "",                // 22 - TIPO_SANG
      payload.cor || "",                    // 23 - COR
      payload.nacionalidade || "",          // 24 - NACIONALIDADE
      payload.clinica_restricao || "",      // 25 - CLINICA_RESTRICAO
      payload.data_inicio_restricao || "",  // 26 - DATA_INICIO_RESTRICAO
      "",                                   // 27 - POSSUI_JSS
      "",                                   // 28 - PARECER
      "",                                   // 29 - CID_TRA
      "",                                   // 30 - CID_REST
      "",                                   // 31 - CID_INCA
      payload.obs_dis || "",                // 32 - OBS_DIS
      payload.obs_cartao || "",             // 33 - OBS_CARTAO
      "",                                   // 34 - SESSÃO
      "",                                   // 35 - DATA
      "",                                   // 36 - VALIDADE
      controle                              // 37 - CONTROLE
    ];
    
    // Salvar no final da planilha
    sheetFicha.appendRow(linha);

    // REGISTRAR LOG DE SUCESSO
    RegistrarLog(sheetLog, "SALVAR", payload.cpf, controle, "Ficha salva com sucesso");
    console.log("Ficha salva com sucesso");
    
    return {
      success: true,
      message: "Ficha salva com sucesso.",
      controle: controle,
      orientacao: "Marque/acompanhe sua inspeção por meio do ROTEIRO."
    };


  } catch (err) {
    console.log("eRRO");
   // TENTAR registrar log do erro
    try {
      const ss = SpreadsheetApp.openByUrl(URL_ARQUIVO);
      const sheetLog = ss.getSheetByName("LOGS");      
      if (sheetLog) {
        RegistrarLog(sheetLog, "ERRO", payload.cpf, "", err.toString());
      }
    } catch (_) {}

    return {
      success: false,
      message: "Erro ao salvar ficha: " + err,
      orientacao: "Tente novamente ou contate o setor responsável."
    };
  }
}

function RegistrarLog(sheetLog, acao, cpf, controle, mensagem) {
  console.log("RegistrarLog");
  const dt = Utilities.formatDate(new Date(), "America/Manaus", "dd/MM/yyyy HH:mm:ss");

  sheetLog.appendRow([
    dt,            // DATA/HORA
    acao,          // SALVAR / ERRO / OUTROS
    cpf,           // CPF do militar
    controle,      // Código único
    acao === "ERRO" ? "FALHA" : "OK",  // STATUS
    mensagem       // Detalhes
  ]);
}


function SalvarInspecionando(payload){

   const id = Criar_CodCadastro("INSP-");

    try {

      const ss = SpreadsheetApp.openByUrl(URL_ARQUIVO);
      
      const sheetArquivo = ss.getSheetByName(ABA_ARQUIVO);
      const sheetLog = ss.getSheetByName(ABA_LOGS);

      if (!ss) {
      return { success: false, message: "Arquivo (Spreadsheet) não encontrado." };
      }      

      if (!sheetArquivo) {
        console.log("sheetArquivo");
        RegistrarLog(sheetLog, "ERRO", payload.cpf, "", "Aba ARQUIVO não encontrada");
        return { success: false, message: "Aba ARQUIVO não encontrada." };
      }
      if (!sheetLog) {
        console.log("sheetLog");
        return { success: false, message: "Aba LOGS não encontrada." };
      }
      // ⚠️ Verifique se a ordem das colunas abaixo corresponde exatamente à sua planilha
      const linha = [
        id,                               // 0 - COD_UNICO
        "",                               // 1 - ARQV
        payload.rg || "",                 // 2 - RG
        payload.orgao || "",              // 3 - ORGAO
        payload.dt_nascimento || "",      // 4 - DT_NASCIMENTO
        payload.naturalidade || "",       // 5 - NATURALIDADE
        payload.cpf || "",                // 6 - CPF
        payload.sexo || "",               // 7 - SEXO
        payload.posto || "",              // 8 - POSTO
        payload.quadro || "",             // 9 - QUADRO
        payload.especialidade || "",      // 10 - ESPECIALIDADE
        payload.nome || "",               // 11 - NOME
        payload.saram || "",              // 12 - SARAM      
        payload.om || "",                 // 13 - OM      
        payload.email || "",              // 14 - EMAIL
        payload.endereco || "",           // 15 - ENDERECO      
        payload.telefone || "",           // 16 - TELEFONE
        payload.grupo || "",              // 17 - GRUPO
        payload.tp_sang || "",            // 18 - TIPO_SANG
        payload.cor || "",                // 19 - COR
        payload.nacionalidade || "",      // 20 - NACIONALIDADE
        payload.vinculo || "",            // 21 - VINCULO
        "", // 22
        "", // 23
        "", // 24
        "", // 25
        payload.senha                     // 26 - SENHA
      ];
      
      console.log("Linha a ser salva:", linha);


      // Salvar no final da planilha
      sheetArquivo.appendRow(linha);


      // REGISTRAR LOG DE SUCESSO
      RegistrarLog(sheetLog, "SALVAR", payload.cpf, id, "Cadastro salvo com sucesso");
      console.log("Cadastro salvo com sucesso");

      return {
        
        success: true,
        message: "Cadastro salvo com sucesso.",
        id: id,
        orientacao: "Agora pode abrir sua inspeção, digite seu CPF cadastrado."
        
      };
    } catch (err) {
      console.error("Erro no SalvarInspecionando:", err);
    // TENTAR registrar log do erro
      try {
        const ss = SpreadsheetApp.openByUrl(URL_ARQUIVO);
        const sheetLog = ss.getSheetByName("LOGS");      
        if (sheetLog) {
          RegistrarLog(sheetLog, "ERRO", payload.cpf, "", err.toString());
        }
      } catch (logErr) {
        console.error("Erro ao registrar log de erro:", logErr);
      }

      return {
        success: false,
        message: "Erro ao Cadastrar Inspecionando. Tente novamente ou contate o setor responsável.",
        detalhe: err.message || err.toString()
      };

    }
}

function TESTE_DIRETO_Cadastro() {
  const payloadTeste = {
      // dados básicos trazidos da pesquisa (CURRENT_DATA)
        codFinal: "",                     // Coluna A (Sempre preenchida)
        arqv: "",                         // Coluna B
        rg: "123456",                     // Coluna C
        orgao: "SSP",                     // Coluna D
        dt_nascimento: "05/09/1984", // Coluna E
        naturalidade: "AM",  // Coluna F
        cpf: "05217791268",           // Coluna G
        sexo: "MASC",         // Coluna H
        posto: "3S",         // Coluna I
        quadro: "QESA",        // Coluna J
        especialidade: "SEF", // Coluna K
        nome: "MARCELINO R BARROS JR",          // Coluna L
        saram: "3999483",         // Coluna M
        om: "HAMN",            // Coluna N
        email: "hkmjunior@fab.mil.br",         // Coluna O
        endereco: "Rua itobi",      // Coluna P
        telefone: "92991225210",      // Coluna Q
        grupo: "",         // Coluna R
        tp_sang: "O+",       // Coluna S
        cor: "PARDA",           // Coluna T
        nacionalidade: "BRASILEIRA", // Coluna U
        vinculo: "AERONAUTICA",       // Coluna V
        senha:""          // Coluna AA    
  }
  
  const resultado = EditarInspecionando(payloadTeste);
  Logger.log(resultado); // Verifique no "Execuções" se retornou Success: true
}

function EditarInspecionando(payload) {

  try {
    const ss = SpreadsheetApp.openByUrl(URL_ARQUIVO);
    const sheetArquivo = ss.getSheetByName(ABA_ARQUIVO);
    const data = sheetArquivo.getDataRange().getValues(); 
    
    // 1. Localizar o índice da coluna CPF e COD (ajuste os índices conforme sua planilha)
    // Índices das colunas (Ajuste se necessário)
    const COL_COD = 0; // Coluna A
    const COL_CPF = 6; // // Coluna G (Se seu CPF for a 7ª coluna, o índice é 6)

    let linhaIndex = -1;

    // 2. Procurar a linha pelo CPF
    for (let i = 1; i < data.length; i++) {
      if (data[i][COL_CPF].toString().replace(/\D/g, "") === payload.cpf.toString().replace(/\D/g, "")) {

        console.log("cpf do banco");  

        linhaIndex = i + 1; 
        break;
      }
    }

    if (linhaIndex === -1) {
      return { success: false, message: "Inspecionando não encontrado pelo CPF." };
    }

    // 2. Lógica do COD: Se vier vazio do banco, gera um novo. Se já existir, mantém o atual.
    let codFinal = data[linhaIndex - 1][COL_COD];
    console.log("cod final", codFinal);

    
    if (!codFinal || codFinal === "" || codFinal === null) {
      codFinal = Criar_CodCadastro("INSP");
      console.log("ENTROU NO Criar cOD",codFinal);
    }

    // 3. Montagem da Array de dados (O COD entra na primeira posição)
    // Usamos o codFinal (existente ou recém-gerado)
    const dadosAtualizados = [
      codFinal,                    // Coluna A (Sempre preenchida)
      payload.arqv || "",          // Coluna B
      payload.rg || "",            // Coluna C
      payload.orgao || "",         // Coluna D
      payload.dt_nascimento || "", // Coluna E
      payload.naturalidade || "",  // Coluna F
      payload.cpf || "",           // Coluna G
      payload.sexo || "" ,         // Coluna H
      payload.posto || "",         // Coluna I
      payload.quadro || "",        // Coluna J
      payload.especialidade || "", // Coluna K
      payload.nome || "",          // Coluna L
      payload.saram || "",         // Coluna M
      payload.om || "",            // Coluna N
      payload.email || "",         // Coluna O
      payload.endereco || "",      // Coluna P
      payload.telefone || "",      // Coluna Q
      payload.grupo || "",         // Coluna R
      payload.tp_sang || "",       // Coluna S
      payload.cor || "",           // Coluna T
      payload.nacionalidade || "", // Coluna U
      payload.vinculo || "",       // Coluna V
      "", "", "", "",              // Colunas W, X, Y, Z (Vazias)
      payload.senha || ""          // Coluna AA
    ];


    console.log("Ddos Atualziado   ",dadosAtualizados);
    // 4. Grava a linha inteira de uma vez (Mais performático)
    // getRange(linha, coluna, numLinhas, numColunas)
    sheetArquivo.getRange(linhaIndex, 1, 1, dadosAtualizados.length).setValues([dadosAtualizados]);

    return { 
      success: true, 
      message: "Atualizado com sucesso!", 
      cod: codFinal 
    };

  } catch (err) {
    console.error(err);
    return { success: false, message: "Erro no servidor: " + err.message };
  }
}
function Criar_CodCadastro(tipo) {

  const data = Utilities.formatDate(new Date(), "GMT", "yyyyMMdd");
  
  // Gera 6 caracteres hexadecimais aleatórios
  const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
  
  // ORDEM INVERTIDA: Hexadecimal primeiro, depois a Data
  const codigoFinal = tipo + hex + "-" + data;
  
  return codigoFinal;
}