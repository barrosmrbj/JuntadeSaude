const API_URL_INSP =
  "https://docs.google.com/spreadsheets/d/11IgiIAjSwYfK-F_rQrVqXhmI83ACaQbjRFwG2wiADtU/"; //banco inspecionandos
const API_URL_GAS =
  "https://script.google.com/macros/s/AKfycbwFsMusddUIVVxtD7xC3GuSQlq4Q0njnC0JjEJeiAgvnxxk5IJJNzC3zV2eITOXr_Ne5Q/exec";
let vinculoSelecionado = "";

window.onload = async () => {
  const loader = document.getElementById("loader");
  try {
    loader.style.display = "flex";
    const urlParams = new URLSearchParams(window.location.search);
    const cpfUrl = urlParams.get("cpf");

    const modo = urlParams.get("modo");

    // Preenche o CPF e mantém readonly
    if (cpfUrl) {
      const fieldCPF = document.getElementById("cadCPF");
      fieldCPF.value = formatarCPF(cpfUrl);
    }

    configurarBotoesVinculo();
    await carregarListasDoGAS();

    document.getElementById("btnSalvar").onclick = salvar;

    if (cpfUrl && modo === "edicao") {
      console.log("Modo EDIÇÃO ativado para CPF:", cpfUrl);
      await carregarDadosParaEdicao(cpfUrl);
    } else {
      // Se for cadastro novo, o botão padrão é Salvar
      document.getElementById("btnSalvar").onclick = salvar;
    }
  } catch (err) {
    console.error("Erro no window.onload: ", err);
    alert("Erro de conexão. Atualize a página ou verifique sua internet.");
  } finally {
    loader.style.display = "none";
  }
};

function formatarCPF(cpf) {
    // 1. Remove qualquer coisa que não seja número
    // 2. Garante que tenha 11 dígitos (padStart)
    let v = cpf.toString().replace(/\D/g, "").padStart(11, "0");
    // 3. Aplica a máscara xxx.xxx.xxx-xx
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

async function carregarDadosParaEdicao(cpf) {

  console.log("Carregando dados para edição do CPF:", cpf);
  const loader = document.getElementById("loader");
  loader.style.display = "flex";

  try {
    const resp = await fetch(`${API_URL_GAS}?action=buscarCPF&cpf=${cpf}`);
    const resJSON = await resp.json(); // Renomeei para resJSON para não confundir
    console.log("Dados recebidos para edição:", resJSON);

    if (resJSON.success) {
      // ESTA É A LINHA CHAVE: pegamos o objeto interno
      const dados = resJSON.data;

      if (dados.vinculo) {
        const btnVinculo = document.querySelector(
          `#btnVinculo button[data-v="${dados.vinculo}"]`
        );
        if (btnVinculo) btnVinculo.click();
      }

      console.log("Preenchendo VINCULO...");
      console.log(dados.vinculo); //TA DANDO ERRO AQUI undefined

      // 2. Preenche Dados Pessoais (Mapeando IDs do seu HTML)
      document.getElementById("cadCod").value = dados.cod || "";
      document.getElementById("cadNome").value = dados.nome || "";
      document.getElementById("cadRG").value = dados.rg || "";
      document.getElementById("cadORGAO").value = dados.orgao || "";
      document.getElementById("cadDtNascimento").value = formatarDataParaInput(
        dados.nascimento
      );
      document.getElementById("cadNaturalidade").value =
        dados.naturalidade || "";
      document.getElementById("cadSexo").value = dados.sexo || "";
      document.getElementById("cadEndereco").value = dados.endereco || "";
      document.getElementById("cadEmail").value = dados.email || "";
      document.getElementById("cadTelefone").value = dados.telefone || "";
      document.getElementById("cadTpSang").value = dados.tp_sang || "";
      document.getElementById("cadCor").value = dados.cor || "";
      // 3. Preenche Dados Militares (campos que aparecem após o clique no vínculo)
      // Aguarda um pequeno tempo para o DOM renderizar os campos dinâmicos
      setTimeout(() => {
        if (document.getElementById("cadSaram"))
          document.getElementById("cadSaram").value = dados.saram || "";
        if (document.getElementById("cadPosto"))
          document.getElementById("cadPosto").value = dados.posto || "";
        if (document.getElementById("cadOM"))
          document.getElementById("cadOM").value = dados.om || "";
        if (document.getElementById("cadDt_praca"))
          document.getElementById("cadDt_praca").value = dados.dt_praca || "";
        if (document.getElementById("cadQuadro"))
          document.getElementById("cadQuadro").value = dados.quadro || "";
        if (document.getElementById("cadEspecialidade"))
          document.getElementById("cadEspecialidade").value = dados.especialidade || "";
        if (document.getElementById("cadGrupo"))
          document.getElementById("cadGrupo").value = dados.grupo || "";
      }, 200);

      // 4. Transforma o botão em ATUALIZAR
      const btn = document.getElementById("btnSalvar");
      btn.innerText = "Atualizar Cadastro";
      btn.classList.replace("btn-primary", "btn-warning"); // Muda cor para atenção
      btn.onclick = finalizarAtualizacao;
    } else {
      alert("Militar não encontrado para edição.");
    }
  } catch (e) {
    console.error("Erro ao carregar dados:", e);
  } finally {
    loader.style.display = "none";
  }
}

async function finalizarAtualizacao() {
    const loader = document.getElementById("loader");
    loader.style.display = "flex";

    // 2. Validação de campos obrigatórios (considerando exceções)
    if (!validarFormulario()) {
      alert("Preencha todos os campos obrigatórios (marcados em vermelho).");
      return;
    }

    // 3. Validação final do E-mail
    const campoEmail = document.getElementById("cadEmail");
    if (!validarEmail(campoEmail)) {
      alert("O e-mail informado é inválido.");
      campoEmail.focus();
      return;
    }

    try {
        // 1. Captura o vínculo selecionado (ajuste a classe se não for .ativo)
        const btnAtivo = document.querySelector("#btnVinculo button.ativo");
        const vinculoSelecionado = btnAtivo ? btnAtivo.getAttribute("data-v") : "";

        // 2. Monta o objeto com as IDs do seu Cadastro.html
        const dados = {
            cod: document.getElementById("cadCod").value || "", // Mantém o código original
            cpf: document.getElementById("cadCPF").value, // Key principal
            nome: document.getElementById("cadNome").value.toUpperCase(),
            rg: document.getElementById("cadRG").value,
            orgao: document.getElementById("cadORGAO").value.toUpperCase(),
            nascimento: document.getElementById("cadDtNascimento").value, // YYYY-MM-DD
            naturalidade: document.getElementById("cadNaturalidade").value,
            sexo: document.getElementById("cadSexo").value,
            email: document.getElementById("cadEmail").value.toLowerCase(),
            telefone: document.getElementById("cadTelefone").value,
            tp_sang: document.getElementById("cadTpSang").value,
            cor: document.getElementById("cadCor").value,
            nacionalidade: document.getElementById("cadNacionalidade").value,
            endereco: document.getElementById("cadEndereco")?.value || "",
            vinculo: vinculoSelecionado,
            // Campos Militares/Específicos
            grupo: document.getElementById("cadGrupo")?.value || "",
            saram: document.getElementById("cadSaram")?.value || "",
            posto: document.getElementById("cadPosto")?.value || "",
            om: document.getElementById("cadOM")?.value || "",
            dt_praca: document.getElementById("cadDt_praca")?.value || "",
            quadro: document.getElementById("cadQuadro")?.value || "",
            senha: document.getElementById("cadCPF").value.substring(0, 4), // Mantém a senha inicial
            especialidade: document.getElementById("cadEspecialidade")?.value || ""
        };

        // 3. Envio para o GAS
        const params = new URLSearchParams({
            action: "atualizarCadastroNoBanco",
            dados: JSON.stringify(dados)
        });

        const resp = await fetch(`${API_URL_GAS}?${params.toString()}`);
        const textResponse = await resp.text();
        const res = JSON.parse(textResponse);

        if (res.success) {
            alert(`✅ Atualizado com Sucesso!\nCódigo: ${res.cod}`);
            
            // O segredo está em passar o CPF na URL para a Fichas.html saber quem carregar
            window.location.href = `./Fichas.html?cpf=${dados.cpf}&refresh=${Date.now()}`;
        } else {
            alert("❌ Erro ao atualizar: " + res.message);
        }

    } catch (e) {
        console.error("Erro na atualização:", e);
        alert("Erro técnico ao salvar. Verifique o console.");
    } finally {
        loader.style.display = "none";
    }
}

// Função auxiliar para converter DD/MM/YYYY para YYYY-MM-DD (formato do input date)
function formatarDataParaInput(dataBr) {
  if (!dataBr || !dataBr.includes("/")) return "";
  const partes = dataBr.split("/");
  return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

function configurarBotoesVinculo() {
  document.querySelectorAll("#btnVinculo button").forEach((btn) => {
    btn.onclick = () => {
      document
        .querySelectorAll("#btnVinculo button")
        .forEach((b) => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      vinculoSelecionado = btn.dataset.v;
      document.getElementById("campoComum").style.display = "block";
      gerarCamposEspecificos(vinculoSelecionado);
    };
  });
}

function validarEmail(input) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // Cria ou seleciona o elemento de aviso
  let aviso = input.parentNode.querySelector(".aviso-erro");

  if (!aviso) {
    aviso = document.createElement("small");
    aviso.className = "aviso-erro";
    aviso.style.color = "red";
    aviso.innerText = " E-mail inválido (ex: nome@dominio.com)";
    input.parentNode.appendChild(aviso);
  }

  if (regex.test(input.value)) {
    input.classList.replace("invalido", "valido") ||
      input.classList.add("valido");
    aviso.style.display = "none";
    return true;
  } else {
    input.classList.replace("valido", "invalido") ||
      input.classList.add("invalido");
    aviso.style.display = "block";
    return false;
  }
}

function validarFormulario() {
  // IDs que NÃO são obrigatórios (mesmo se estiverem visíveis)
  const excessoes = ["cadCod","cadSaram", "cadEspecialidade", "cadQuadro", "cadORGAO"];

  const campos = document.querySelectorAll("input, select");
  let valido = true;

  campos.forEach((campo) => {
    // Só valida campos que estão visíveis para o usuário
    if (campo.offsetParent !== null && !excessoes.includes(campo.id)) {
      if (!campo.value || campo.value === "" || campo.value.includes("---")) {
        campo.classList.add("invalido");
        valido = false;
        console.log("Campo inválido:", campo.id);
      } else {
        campo.classList.remove("invalido");
      }
    }
  });

  return valido;
}

function gerarCamposEspecificos(v) {
  const container = document.getElementById("campoVinculo");
  container.innerHTML = ""; // Limpa

  let html = `<div class="grupo-campos"><h3>Dados de ${v}</h3>`;

  if (v === "AERONAUTICA") {
    html += `
                <div class="linha-campo"><label>SARAM/Ordem</label><input id="cadSaram" type="text" maxlength="7"></div>
                <div class="linha-campo"><label>OM</label><input id="cadOM" type="text" list="lista-oms"></div>
                <div class="linha-campo"><label>DATA DE PRAÇA</label><input id="cadDt_praca" type="date"></div>
                <div class="linha-campos-dupla">
                    <div class="linha-campo campo-metade"><label>Posto</label><input id="cadPosto" type="text" list="lista-postos"></div>
                    <div class="linha-campo campo-metade"><label>Quadro</label><input id="cadQuadro" style="text-align: center" list="lista-quadro"></div>
                    <div class="linha-campo campo-metade"><label>Especialidade</label><input id="cadEspecialidade" style="text-align: center" list="lista-esp"></div>
                </div>
                <div class="linha-campo"><label for="cadGrupo">Grupo</label><input id="cadGrupo" type="text" list="lista-grupos"></div> 
            `;
  } else if (v === "DEPENDENTE") {
    html += `
                <div class="linha-campo"><label>Grupo</label><input id="cadGrupo" value="VA - DEP MIL / PENSIONISTAS" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>Posto</label><input id="cadPosto" value="Dependente" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>SARAM do Responsável (7 dígitos)</label><input id="cadSaram" style="text-align: center" maxlength="7"></div>
            `;
  } else if (v === "PENSIONISTAS") {
    html += `
                <div class="linha-campo"><label>Grupo</label><input id="cadGrupo" value="VA - DEP MIL / PENSIONISTAS" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>Posto</label><input id="cadPosto" value="Pensionista" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>SARAM do Responsável (7 dígitos)</label><input id="cadSaram" style="text-align: center" maxlength="7"></div>
            `;
  }

  if (v === "EXERCITO") {
    html += `
                <div class="linha-campo"><label>OM</label><input id="cadOM" type="text" list="lista-oms"></div>
                <div class="linha-campo"><label>DATA DE PRAÇA</label><input id="cadDt_praca" type="date"></div>
                <div class="linha-campos-dupla">
                    <div class="linha-campo campo-metade"><label>Posto</label><input id="cadPosto" type="text" list="lista-postos"></div>
                    <div class="linha-campo campo-metade"><label>Especialidade</label><input id="cadEspecialidade" style="text-align: center" list="lista-esp"></div>
                </div>
                <div class="linha-campo"><label>Grupo</label><input id="cadGrupo" value="IB - AERONAVEGANTES INCLUSOS EM QT" style="text-align: center" readonly></div>  
            `;
  } else if (v === "EMPRESA") {
    html += `
                <div class="linha-campo"><label>Matrícula (7 dígitos)</label><input id="cadSaram" style="text-align: center" maxlength="7"></div>
                <div class="linha-campo"><label>OM</label><input id="cadOM" type="text" list="lista-oms"></div>
                <div class="linha-campo"><label>Grupo</label><input id="cadGrupo" value="IVB - Civil ATCO / OEA" style="text-align: center" readonly></div>
            `;
  } else if (v === "CONCURSO") {
    html += `
                <div class="linha-campo"> <label for="cadOM">OM VÍCULO</label> <input id="cadOM" value="SEREP-MN" style="text-align: center" readonly> </div>
                <div class="linha-campo"><label>Grupo</label><input id="cadGrupo" value="VB - CIVIS (CONCURSO)" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>Posto</label><input id="cadPosto" value="CANDIDATO" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>CONCURSO</label><input id="cadQuadro" style="text-align: center"></div>
                <div class="linha-campo"><label>Especialidade</label><input id="cadEspecialidade" style="text-align: center"></div>                

            `;
  } else if (v === "PROC_SELETIVO") {
    html += `
                <div class="linha-campo"> <label for="cadOM">OM VÍCULO</label> <input id="cadOM" value="SEREP-MN" style="text-align: center" readonly> </div>
                <div class="linha-campo"><label>Grupo</label><input id="cadGrupo" value="VB - CIVIS (CONCURSO)" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>Posto</label><input id="cadPosto" value="CONVOCADO" style="text-align: center" readonly></div>
            `;
  } else if (v === "RECRUTA") {
    html += `
                <div class="linha-campo"> <label for="cadOM">OM VÍCULO</label> <input id="cadOM" value="SEREP-MN" style="text-align: center" readonly> </div>
                <div class="linha-campo"><label>Grupo</label><input id="cadGrupo" value="VB - CIVIS (CONCURSO)" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>Posto</label><input id="cadPosto" value="RECRUTA" style="text-align: center" readonly></div>
            `;
  }

  html += `</div>`;
  container.innerHTML = html;
}

async function salvar() {
  // 1. Validação inicial de Vínculo
  if (!vinculoSelecionado) {
    return alert("Por favor, selecione o VÍNCULO antes de salvar.");
  }

  // 2. Validação de campos obrigatórios (considerando exceções)
  if (!validarFormulario()) {
    alert("Preencha todos os campos obrigatórios (marcados em vermelho).");
    return;
  }

  // 3. Validação final do E-mail
  const campoEmail = document.getElementById("cadEmail");
  if (!validarEmail(campoEmail)) {
    alert("O e-mail informado é inválido.");
    campoEmail.focus();
    return;
  }

  // 4. Ativar Loader visual
  document.getElementById("loader").style.display = "flex";

  // 5. Coleta de dados (Mapeado exatamente para as colunas da planilha)
  const payload = {
    action: "salvarInspecionando",
    cpf: document.getElementById("cadCPF").value,
    nome: document.getElementById("cadNome").value.toUpperCase(),
    rg: document.getElementById("cadRG").value,
    orgao: document.getElementById("cadORGAO").value.toUpperCase(),
    dt_nascimento: document.getElementById("cadDtNascimento").value,
    naturalidade: document.getElementById("cadNaturalidade").value,
    sexo: document.getElementById("cadSexo").value,
    email: document.getElementById("cadEmail").value.toLowerCase(),
    telefone: document.getElementById("cadTelefone").value,
    tp_sang: document.getElementById("cadTpSang").value,
    cor: document.getElementById("cadCor").value,
    nacionalidade: document.getElementById("cadNacionalidade").value,
    endereco: document.getElementById("cadEndereco").value,
    vinculo: vinculoSelecionado,

    // Campos dinâmicos (usam ?. para evitar erro se o campo não estiver na tela)
    posto: document.getElementById("cadPosto")?.value || "",
    om: document.getElementById("cadOM")?.value || "",
    saram: document.getElementById("cadSaram")?.value || "",
    quadro: document.getElementById("cadQuadro")?.value || "",
    especialidade: document.getElementById("cadEspecialidade")?.value || "",
    grupo: document.getElementById("cadGrupo")?.value || "",

    // Senha inicial: 4 primeiros dígitos do CPF
    senha: document.getElementById("cadCPF").value.substring(0, 4),
  };

  try {
    // Converte o objeto em parâmetros de URL (?cpf=...&nome=...)
    const params = new URLSearchParams(payload).toString();

    // Envio para o Google Apps Script (WebApp /exec)
    const response = await fetch(`${API_URL_GAS}?${params}`);

    // Pegamos como texto primeiro para evitar o erro de JSON "undefined"
    const textResponse = await response.text();
    const res = JSON.parse(textResponse);

    if (res.success) {
      alert(
        `Cadastro realizado com sucesso!\nID: ${res.id}\n\nAgora você será redirecionado para iniciar seu atendimento.`
      );
      // Padrão GitHub Pages com ponto
      window.location.href = `index.html?cpf=${payload.cpf}&status=cadastrado`;
    } else {
      alert("Erro ao salvar: " + res.message);
    }
  } catch (err) {
    console.error("Erro no fetch:", err);
    alert("Erro de conexão. Verifique sua internet ou o status do Script.");
  } finally {
    // Desativar Loader
    document.getElementById("loader").style.display = "none";
  }
} // fim da function salvar

// Chame esta função dentro do window.onload
async function carregarListasDoGAS() {
  try {
    const response = await fetch(`${API_URL_GAS}?action=getDadosIniciais`);
    const res = await response.json();

    if (res.success) {
      console.log("Dados recebidos do GAS:", res);
      // Preenche as OMs
      popularDatalist("lista-oms", res.oms);
      // Preenche os Postos
      popularDatalist("lista-postos", res.postos);
      // Preenche os Quadros
      popularDatalist("lista-quadro", res.quadro);
      // Preenche os Especialidades
      popularDatalist("lista-esp", res.esp);
      // Preenche os Grupos
      popularDatalist("lista-grupos", res.grupos);
    }
  } catch (error) {
    console.error("Erro ao carregar listas:", error);
  }
}

function popularDatalist(id, lista) {
  const elemento = document.getElementById(id);
  if (!elemento || !lista) return;

  // Transforma o array em várias tags <option>
  elemento.innerHTML = lista.map((item) => `<option value="${item}">`).join("");
}

function cancelarEReiniciar() {
  if (
    confirm(
      "Deseja realmente cancelar? Todos os dados preenchidos nesta sessão serão perdidos."
    )
  ) {
    // Limpa os dados do militar salvos nesta sessão
    sessionStorage.clear();

    // Se houver algo em cache específico do seu app, limpa aqui
    // localStorage.removeItem('seu_item_especifico');

    // Volta para a página inicial
    window.location.href = "index.html";
  }
}