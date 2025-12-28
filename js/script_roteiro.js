// Chame ao carregar a página
window.onload = inicializarRoteiro;

function inicializarRoteiro() {
    // Recupera os dados salvos na "mochila"
    const rawData = localStorage.getItem("dadosRoteiro");
    
    if (!rawData) {
        alert("Dados não encontrados. Retornando à consulta.");
        window.location.href = "index.html";
        return;
    }

    window.CURRENT_DATA = JSON.parse(rawData);
    renderizarRoteiro(); // Chama a função que montamos na resposta anterior
}

// Atualiza a barra de progresso sempre que clicar num setor
function atualizarBarra() {
    const total = document.querySelectorAll(".chkRoteiro").length;
    const marcados = document.querySelectorAll(".chkRoteiro:checked").length;
    const percentual = Math.round((marcados / total) * 100);

    document.getElementById("progresso-barra").style.width = percentual + "%";
    document.getElementById("percentual").innerText = percentual + "%";
}

// Modifique a função toggleSetor para chamar a atualização da barra
function toggleSetor(elemento) {
    elemento.classList.toggle("ativo");
    const chk = elemento.querySelector(".chkRoteiro");
    chk.checked = !chk.checked;
    
    atualizarBarra(); // <--- Nova linha
}

function renderizarRoteiro() {
    const data = window.CURRENT_DATA || {};
    const listaEl = document.getElementById("listaRoteiro");
    
    if (!data.cpf) {
        listaEl.innerHTML = "<p class='text-danger'>Erro: Dados não encontrados.</p>";
        return;
    }

    const sexo = (data.sexo || "").toUpperCase();
    const finalidades = Array.isArray(data.finalidades) ? data.finalidades : [];

    // 1. Setores Fixos
    const setoresFixos = ["LABORATÓRIO", "COPA", "RAIO-X", "ODONTOLOGIA", "AUDIOMETRIA", 
                          "OTORRINO", "OFTALMOLOGIA", "CLÍNICA MÉDICA", "NEUROLOGIA", "PSIQUIATRIA"];
    
    let meusSetores = [];

    // REGRA 2, 4 e 5: Verificar se existe alguma finalidade "G" (Curso)
    const temFichaG = finalidades.some(f => f.trim().toUpperCase().startsWith("G"));

    if (temFichaG) {
        // Se tem G, adicionamos a Clínica Específica
        meusSetores.push("CLÍNICA ESPECÍFICA");
        
        // REGRA 4: Se o usuário escolheu APENAS fichas do tipo G, 
        // mas o nome da clínica da ficha G for um dos setores fixos, ele habilita.
        // (Nota: Aqui assume-se que se houver outras fichas, os fixos entram)
        if (finalidades.length > 0) {
            setoresFixos.forEach(s => meusSetores.push(s));
        }
    } else {
        // Se não tem G, apenas os setores fixos padrão
        setoresFixos.forEach(s => meusSetores.push(s));
    }

    // REGRA 1 e 3: Ginecologia apenas para sexo Feminino
    if (sexo === "F") {
        meusSetores.push("GINECOLOGIA");
    }

    // Remover duplicatas caso a lógica dê push repetido
    const setoresUnicos = [...new Set(meusSetores)];

    // Montar o Grid
    listaEl.innerHTML = setoresUnicos.map(setor => `
        <div class="roteiro-item" onclick="toggleSetor(this)">
            <div class="check-custom"></div>
            <span class="rot-label">${setor}</span>
            <input type="checkbox" class="chkRoteiro" value="${setor}">
        </div>
    `).join("");
}

function finalizarRoteiro() {
    const marcados = document.querySelectorAll(".chkRoteiro:checked").length;
    const total = document.querySelectorAll(".chkRoteiro").length;

    if (marcados === 0) {
        alert("Selecione ao menos um setor visitado.");
        return;
    }

    const msg = document.getElementById("msgFinalizar");
    msg.style.display = "block";
    
    // Rolar para a mensagem
    msg.scrollIntoView({ behavior: 'smooth' });
}

function finalizarEResetar() {
    if (confirm("Deseja realmente finalizar sua conferência e sair?")) {
        // 1. Limpa a "mochila" de dados do navegador
        localStorage.removeItem("dadosRoteiro");
        localStorage.clear(); 

        // 2. Limpa variáveis globais por segurança
        window.CURRENT_DATA = null;

        // 3. Redireciona para o início (Consulta de CPF)
        window.location.href = "index.html";
    }
}