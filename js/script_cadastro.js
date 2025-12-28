const API_URL_INSP = "https://docs.google.com/spreadsheets/d/11IgiIAjSwYfK-F_rQrVqXhmI83ACaQbjRFwG2wiADtU/"; //banco inspecionandos
const API_URL_GAS = "https://script.google.com/macros/s/AKfycbwFsMusddUIVVxtD7xC3GuSQlq4Q0njnC0JjEJeiAgvnxxk5IJJNzC3zV2eITOXr_Ne5Q/exec";
let vinculoSelecionado = "";

window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const cpf = urlParams.get('cpf');
    if (cpf) document.getElementById('cadCPF').value = cpf;
    configurarBotoesVinculo();
    carregarListasDoGAS();
    document.getElementById("btnSalvar").onclick = salvar;
};

function configurarBotoesVinculo() {
    document.querySelectorAll("#btnVinculo button").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll("#btnVinculo button").forEach(b => b.classList.remove("ativo"));
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
        input.classList.replace("invalido", "valido") || input.classList.add("valido");
        aviso.style.display = "none";
        return true;
    } else {
        input.classList.replace("valido", "invalido") || input.classList.add("invalido");
        aviso.style.display = "block";
        return false;
    }
}

function validarFormulario() {
    // IDs que NÃO são obrigatórios (mesmo se estiverem visíveis)
    const excessoes = ["cadSaram", "cadEspecialidade", "cadQuadro", "cadORGAO"];
    
    const campos = document.querySelectorAll("input, select");
    let valido = true;

    campos.forEach(campo => {
        // Só valida campos que estão visíveis para o usuário
        if (campo.offsetParent !== null && !excessoes.includes(campo.id)) {
            if (!campo.value || campo.value === "" || campo.value.includes("---")) {
                campo.classList.add("invalido");
                valido = false;
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
        
        if (v === "AERONAUTICA" ) {
            html += `
                <div class="linha-campo"><label>SARAM/Ordem</label><input id="cadSaram" type="text"></div>
                <div class="linha-campo"><label>OM</label><input id="cadOM" type="text" list="lista-oms"></div>
                <div class="linha-campos-dupla">
                    <div class="linha-campo campo-metade"><label>Posto</label><input id="cadPosto" type="text" list="lista-postos"></div>
                    <div class="linha-campo campo-metade"><label>Quadro</label><input id="cadQuadro" style="text-align: center" list="lista-quadro"></div>
                    <div class="linha-campo campo-metade"><label>Especialidade</label><input id="cadEspecialidade" style="text-align: center" list="lista-esp"></div>
                </div>
                <div class="linha-campo"><label for="cadGrupo">Grupo</label><input id="cadGrupo" type="text" list="lista-grupos"></div> 
            `;
        }
        
        else if (v === "DEPENDENTE") {
            html += `
                <div class="linha-campo"><label>Grupo</label><input id="cadGrupo" value="VA - DEP MIL / PENSIONISTAS" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>Posto</label><input id="cadPosto" value="Dependente" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>SARAM do Responsável (7 dígitos)</label><input id="cadSaram" style="text-align: center"></div>
            `;
        }
        
        else if (v === "PENSIONISTAS") {
            html += `
                <div class="linha-campo"><label>Grupo</label><input id="cadGrupo" value="VA - DEP MIL / PENSIONISTAS" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>Posto</label><input id="cadPosto" value="Pensionista" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>SARAM do Responsável (7 dígitos)</label><input id="cadSaram" style="text-align: center"></div>
            `;
        }

        if (v === "EXERCITO") {
            html += `
                <div class="linha-campo"><label>OM</label><input id="cadOM" type="text" list="lista-oms"></div>
                <div class="linha-campos-dupla">
                    <div class="linha-campo campo-metade"><label>Posto</label><input id="cadPosto" type="text" list="lista-postos"></div>
                    <div class="linha-campo campo-metade"><label>Especialidade</label><input id="cadEspecialidade" style="text-align: center" list="lista-esp"></div>
                </div>
                <div class="linha-campo"><label for="cadGrupo">Grupo</label><input id="cadGrupo" type="text" list="lista-grupos"></div> 
            `;
        }

        else if (v === "EMPRESA") {
            html += `
                <div class="linha-campo"><label>Matrícula (7 dígitos)</label><input id="cadSaram" style="text-align: center"></div>
                <div class="linha-campo"><label>OM</label><input id="cadOM" type="text" list="lista-oms"></div>
                <div class="linha-campo"><label>Grupo</label><input id="cadGrupo" value="III - Servidores CIVIS" style="text-align: center" readonly></div>
            `;
        }
        
        else if (v === "CONCURSO") {
            html += `
                <div class="linha-campo"> <label for="cadOM">OM VÍCULO</label> <input id="cadOM" value="SEREP-MN" style="text-align: center" readonly> </div>
                <div class="linha-campo"><label>Grupo</label><input id="cadGrupo" value="VB - CIVIS (CONCURSO)" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>Posto</label><input id="cadPosto" value="CANDIDATO" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>CONCURSO</label><input id="cadQuadro" style="text-align: center"></div>
                <div class="linha-campo"><label>Especialidade</label><input id="cadEspecialidade" style="text-align: center"></div>                

            `;
        }

        else if (v === "PROC_SELETIVO") {
            html += `
                <div class="linha-campo"> <label for="cadOM">OM VÍCULO</label> <input id="cadOM" value="SEREP-MN" style="text-align: center" readonly> </div>
                <div class="linha-campo"><label>Grupo</label><input id="cadGrupo" value="VB - CIVIS (CONCURSO)" style="text-align: center" readonly></div>
                <div class="linha-campo"><label>Posto</label><input id="cadPosto" value="Proc_Seletivo" style="text-align: center" readonly></div>
            `;
        }

        else if (v === "RECRUTA") {
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
        if (!vinculoSelecionado) { return alert("Por favor, selecione o VÍNCULO antes de salvar.");}

        // 2. Validação de campos obrigatórios (considerando exceções)
        if (!validarFormulario()) { alert("Preencha todos os campos obrigatórios (marcados em vermelho)."); return; }

        // 3. Validação final do E-mail
        const campoEmail = document.getElementById("cadEmail");
        if (!validarEmail(campoEmail)) { alert("O e-mail informado é inválido."); campoEmail.focus(); return;}

        // 4. Ativar Loader visual
        document.getElementById('loader').style.display = 'flex';

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
            vinculo: vinculoSelecionado,
            
            // Campos dinâmicos (usam ?. para evitar erro se o campo não estiver na tela)
            posto: document.getElementById("cadPosto")?.value || "",
            om: document.getElementById("cadOM")?.value || "",
            saram: document.getElementById("cadSaram")?.value || "",
            quadro: document.getElementById("cadQuadro")?.value || "",
            especialidade: document.getElementById("cadEspecialidade")?.value || "",
            grupo: document.getElementById("cadGrupo")?.value || "",
            
            // Senha inicial: 4 primeiros dígitos do CPF
            senha: document.getElementById("cadCPF").value.substring(0, 4)
        };

        try {
            // Converte o objeto em parâmetros de URL (?cpf=...&nome=...)
            const params = new URLSearchParams(payload).toString();
            
            // Envio para o Google Apps Script (WebApp /exec)
            const response = await fetch(`${API_URL_GAS}?${params}`);
            const res = await response.json();

            if (res.success) {
                        alert(`Cadastro realizado com sucesso!\n\nAgora você será redirecionado para iniciar seu atendimento.`);
                        
                        // Redireciona de volta para o início
                        // O CPF é passado na URL para que o usuário não precise digitar de novo, 
                        // você pode capturar isso no onload do index.html se desejar.
                        window.location.href = `index.html?cpf=${payload.cpf}&status=cadastrado`;
            } else {
                        alert("Erro ao salvar: " + res.message);
            }

        } catch (err) {
            console.error("Erro no fetch:", err);
            alert("Erro de conexão. Verifique sua internet ou o status do Script.");
        } finally {
            // Desativar Loader
            document.getElementById('loader').style.display = 'none';
        }
    }// fim da function salvar
    
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
        elemento.innerHTML = lista.map(item => `<option value="${item}">`).join('');
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