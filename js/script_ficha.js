/* =====================================================================
   CONFIGURAÇÕES GERAIS (Antigo config.js)
   ===================================================================== */
// URL Gerada no Google Apps Script (Implantar > Gerenciar Implantações)
const API_URL_GAS = "https://script.google.com/macros/s/AKfycbwFsMusddUIVVxtD7xC3GuSQlq4Q0njnC0JjEJeiAgvnxxk5IJJNzC3zV2eITOXr_Ne5Q/exec";

/* =====================================================================
   VARIÁVEIS DE ESTADO DO WIZARD
   ===================================================================== */
let CURRENT_DATA = null;
let CURRENT_STEP = 1;
let selectedFinalidades = new Set();

/* =====================================================================
   INICIALIZAÇÃO (Ao carregar a página)
   ===================================================================== */
window.onload = async () => {
    try {
        loader.style.display = 'flex';

        // Passo a passo da inicialização       
        // 1. Pega dados do sessionStorage
        const rawData = sessionStorage.getItem('dadosInspecionando');
        if (!rawData) {
            alert("Dados não encontrados. Voltando...");
            window.location.href = 'index.html';
            return;
        }
        CURRENT_DATA = JSON.parse(rawData);


        // 2. Preenche o CPF que já está visível
        const campoCPF = document.getElementById("CampoCPF");
        if (campoCPF) campoCPF.value = CURRENT_DATA.cpf;

        // 3. Força a exibição do container principal
        const container = document.getElementById("wizardContainer");
        if (container) {
            container.style.display = "block";
            // Pequeno delay para a transição de opacidade funcionar
            setTimeout(() => { container.style.opacity = "1"; }, 50);
        }

        // 4. Renderiza o Step 1 IMEDIATAMENTE
        renderStep1(CURRENT_DATA);

        // 5. Só depois busca as listas do servidor (que demoram mais)
        await carregarListasParaFicha();

        // 6. Atualiza os botões após renderizar
        const btnEdicao = document.getElementById("btnEdicao");
        const btnContinuar = document.getElementById("toStep2");

        if (CURRENT_DATA.cod) {
            btnEdicao.innerText = "Editar Cadastro";
            btnContinuar.style.display = "inline-block";
        } else {
            btnEdicao.innerText = "Atualizar Cadastro";
            btnContinuar.style.display = "none";
        }

        // 7. Garante que o indicador do passo 1 fique ativo
        if (typeof updateStepIndicators === "function") {
            updateStepIndicators(1);
        }
        loader.style.display = 'none';
    } catch (erro) {
        loader.style.display = 'none';
        console.error("Erro na inicialização:", erro);
    }
};

async function carregarListasParaFicha() {
    try {
        // Chamada ao GAS para pegar Grupos e Finalidades
        const response = await fetch(`${API_URL_GAS}?action=getDadosIniciais`);
        const res = await response.json();

        if (res.success) {
            // CRIAMOS O OBJETO APP QUE SUAS FUNÇÕES PRECISAM
            window.APP = {
                GRUPOS_LIST: res.grupos || [],
                FINALIDADES_LIST: res.finalidades || [] // Garanta que o GAS retorne 'finalidades'
            };

            // AGORA chamamos suas funções de renderização
            renderGroupOptions();
            renderFinalidadesOptions();
            //console.log("✅ Listas carregadas e renders chamados.");
        }
    } catch (err) {
        console.error("Erro ao carregar listas:", err);
    }
}

async function salvarFichaCompleta() {
    // 1. Mostra um loader ou desabilita o botão para evitar cliques duplos
    const btn = document.getElementById("btnSalvarFinal");
    if (!btn) return;

    // Bloqueia cliques duplos
    btn.disabled = true;
    btn.innerText = "Enviando...";

    // Loader e Payload
    const dadosFicha = {
        // dados básicos trazidos da pesquisa (CURRENT_DATA)
        //dt_insp: new Date().toISOString(),  será substituído no GAS pelo padrão BR
        cod: CURRENT_DATA?.cod || "",
        arqv: CURRENT_DATA?.arqv || "",
        rg: CURRENT_DATA?.rg || "",
        orgao: CURRENT_DATA?.orgao || "",
        dt_nascimento: CURRENT_DATA?.nascimento || "",
        naturalidade: CURRENT_DATA?.naturalidade || "",
        cpf: CURRENT_DATA?.cpf || document.getElementById("CampoCPF").value,
        sexo: CURRENT_DATA?.sexo || "",
        posto: CURRENT_DATA?.posto || "",
        quadro: CURRENT_DATA?.quadro || "",
        especialidade: CURRENT_DATA?.especialidade || "",
        nome: CURRENT_DATA?.nome || "",
        saram: CURRENT_DATA?.saram || "",
        om: CURRENT_DATA?.om || "",
        vinculo: CURRENT_DATA?.vinculo || "",
        dec_judicial: "",           //---------------------------- a ser implementada depois
        email: CURRENT_DATA?.email || "",
        endereco: CURRENT_DATA?.endereco || "",
        telefone: CURRENT_DATA?.telefone || "",
        tp_sang: CURRENT_DATA?.tp_sang || "",
        cor: CURRENT_DATA?.cor || "",
        nacionalidade: CURRENT_DATA?.nacionalidade || "",

        // dados coletados no Wizard
        grupo: document.getElementById("selectGrupo").value || "",
        finalidades: Array.from(selectedFinalidades),
        clinica_restricao: document.getElementById("clinica_restricao")?.value || "",
        data_inicio_restricao: document.getElementById("data_inicio_restricao")?.value || "",
        obs_dis: document.getElementById("descricao_curso")?.value || "",
        obs_cartao: document.getElementById("periodo_curso")?.value || ""
    };

try {
        // 2. IMPORTANTE: No Google Apps Script, usamos GET ou enviamos via URLSearchParams
        // para evitar problemas de CORS em redirecionamentos.
        const params = new URLSearchParams({
            action: "salvarFichaInspeção",
            dados: JSON.stringify(dadosFicha)
        });

        const response = await fetch(`${API_URL_GAS}?${params.toString()}`, {
            method: "GET" // O doGet do seu GAS processará isso perfeitamente
        });

        const res = await response.json();

        if (res.success) {
            // 1. Prepara a "mochila" de dados para o roteiro
            const dadosParaRoteiro = {
                cpf: dadosFicha.cpf,
                nome: dadosFicha.nome,
                posto: dadosFicha.posto,
                sexo: dadosFicha.sexo,
                dt_nascimento: dadosFicha.dt_nascimento,
                finalidades: dadosFicha.finalidades // Essencial para a regra da letra "G"
            };

            // 2. Salva no navegador (Persistência)
            localStorage.setItem("dadosRoteiro", JSON.stringify(dadosParaRoteiro));
               
            alert("✅ Ficha salva com sucesso!\nControle(s): " + res.controle.join(", "));
            // 3. Redireciona para a página do roteiro
            window.location.href = "./Roteiro.html";
        } else {
            throw new Error(res.message);
        }
    } catch (err) {
        console.error("Erro ao salvar:", err);
        alert("❌ Erro ao salvar: " + err.message);
        btn.disabled = false;
        btn.innerText = "Salvar Ficha";
    }
}


function cancelarEReiniciar() {
    if (confirm("Deseja realmente cancelar? Todos os dados preenchidos nesta sessão serão perdidos.")) {
        // Limpa os dados do militar salvos nesta sessão
        sessionStorage.clear(); 
        
        // Se houver algo em cache específico do seu app, limpa aqui
        // localStorage.removeItem('seu_item_especifico');

        // Volta para a página inicial
        window.location.href = 'index.html';
    }
}

function limparCampos() {
    // Limpa o campo de entrada do CPF
    const cpfInput = document.getElementById("cpfInput");
    if (cpfInput) {
        cpfInput.value = "";
        cpfInput.classList.remove("is-invalid", "is-valid");
    }

    // Limpa a div de mensagens de erro
    const errorDiv = document.getElementById("CampoCPF-error");
    if (errorDiv) errorDiv.innerText = "";

    // Limpa a área de resultados da pesquisa
    const resultadoDiv = document.getElementById("resultado");
    if (resultadoDiv) resultadoDiv.innerText = "";

    // Reseta o objeto global de dados do militar pesquisado
    window.CURRENT_DATA = null;

    console.log("Campos limpos e prontos para nova consulta.");
}