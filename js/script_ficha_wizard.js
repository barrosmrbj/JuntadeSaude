/* =====================================================================
   FUNÇÕES DO WIZARD (Lógica de Navegação e Regras G/I)
   ===================================================================== */
function renderStep1(r) {
    const out = document.getElementById("resultadoConsulta");
    if (!out) return;
    // LIMPA antes de adicionar, para não duplicar se a função for chamada duas vezes
    out.innerHTML = "";

    // Preenche a div com os dados para conferência
    out.innerHTML += `
        <div class="resultado-card">
            <h3>Dados Encontrados</h3>
                <strong>COD-ARQV:</strong> ${r.cod || ''} / ${r.arqv || ''}<br>
                <strong>Nome:</strong> ${r.nome || ''}<br>
                <strong>CPF:</strong> ${formatarCPF(r.cpf) || ''}              <strong>SARAM:</strong> ${r.saram || ''}<br>
                <strong>RG/Órgão:</strong> ${r.rg || ''} ${r.orgao || ''}<br>
                <strong>Data Nascimento:</strong> ${r.nascimento || ''} <strong>Naturalidade:</strong> ${r.naturalidade || ''}<br>
                <strong>Sexo:</strong> ${r.sexo || ''}<br>
                <strong>Posto/Quadro/Esp:</strong> ${r.posto || ''} ${r.quadro || ''} ${r.especialidade || ''}<br>
                <strong>OM:</strong> ${r.om || ''}<br>
                <strong>Email:</strong> ${r.email || ''} <strong>Tipo Sanguineo:</strong> ${r.tp_sang || ''}<br>
                <strong>Telefone:</strong> ${r.telefone || ''}<br>
                <strong>Endereço:</strong> ${r.endereco || ''}<br>
                <strong>Vínculo:</strong> ${r.vinculo || ''}<br>
                <strong>Grupo atual:</strong> ${r.grupo || ''}<br>
        </div>
    `;
    //console.log("✅ renderStep1() finalizado", out.innerHTML);
}

/* =====================================================================
  Renderizar opções de Grupo (step 2)
  ===================================================================== */
function renderGroupOptions() {
    const sel = document.getElementById("selectGrupo");
    if (!sel) return;

    // limpa e adiciona opção padrão
    sel.innerHTML = `<option value="">-- selecione --</option>`;

    if (!window.APP || !Array.isArray(APP.GRUPOS_LIST)) {
        console.warn("APP.GRUPOS_LIST vazio ou APP não disponível.");
        return;
    }

    // popular opções
    APP.GRUPOS_LIST.forEach(g => {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        sel.appendChild(opt);
    });

    // tentar pré-selecionar com base em CURRENT_DATA.grupo, apenas se houver correspondência
    if (CURRENT_DATA && CURRENT_DATA.grupo) {
        const wanted = CURRENT_DATA.grupo.toString().trim();
        if (wanted !== "") {
            // procurar opção existente (case-insensitive, trim)
            const opcao = Array.from(sel.options).find(o => {
                return o.value.toString().trim().toLowerCase() === wanted.toLowerCase();
            });

            if (opcao) {
                sel.value = opcao.value;
                //console.log("Grupo pré-selecionado:", opcao.value);
            } else {
                // não existe — não seleciona nada
                sel.value = "";
                console.warn("Grupo retornado não encontrado na lista:", wanted);
            }
        }
    }
}

function renderFinalidadesOptions() {
    const div = document.getElementById("finalidadeList");
    if (!div) return;

    div.innerHTML = ""; 
    selectedFinalidades = new Set();

    APP.FINALIDADES_LIST.forEach(fin => {
        const id = "fin_" + fin.replace(/\s+/g, "_");

        const wrapper = document.createElement("div");
        wrapper.className = "finalidade-item";
        
        // Clique no card expande o texto
        wrapper.onclick = (e) => {
            if (e.target.type !== 'checkbox') {
                wrapper.classList.toggle('expandido');
            }
        };

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.id = id;
        cb.value = fin;

        const lbl = document.createElement("label");
        lbl.htmlFor = id;
        lbl.className = "finalidade-label";
        lbl.textContent = fin;
        lbl.title = "Clique para ler o texto completo"; // Dica ao passar o mouse

        wrapper.appendChild(cb);
        wrapper.appendChild(lbl);
        div.appendChild(wrapper);

        // Lógica de pré-seleção mantida...
        if (CURRENT_DATA && CURRENT_DATA.finalidade) {
            let finals = Array.isArray(CURRENT_DATA.finalidade) ? CURRENT_DATA.finalidade : [CURRENT_DATA.finalidade];
            finals = finals.map(f => f.toString().trim().toLowerCase());
            if (finals.includes(fin.toString().trim().toLowerCase())) {
                cb.checked = true;
                selectedFinalidades.add(fin);
            }
        }

        // Listener do Checkbox
        cb.addEventListener("change", (e) => {
            if (cb.checked) {
                if (selectedFinalidades.size >= 3) {
                    cb.checked = false;
                    // Uso do seu toast
                    if(typeof toast === "function") toast("Máximo de 3 finalidades.", "red");
                    else alert("Máximo de 3 finalidades.");
                    return;
                }
                selectedFinalidades.add(fin);
            } else {
                selectedFinalidades.delete(fin);
            }
            atualizarFinalidadesSelecionadas();
            checkConditionalSteps();
        });
    });
    
    atualizarFinalidadesSelecionadas(); // Garante que as badges apareçam se houver pré-seleção
    checkConditionalSteps();
}

/* =====================================================================
Verifica se as abas condicionais devem existir (baseado nas listas)
===================================================================== */
function checkConditionalSteps() {
    const selecionadas = Array.from(selectedFinalidades).map(f => f.toUpperCase());
    const anyG = selecionadas.some(f => f.startsWith("G"));
    const anyI = selecionadas.some(f => f.startsWith("I"));

    const ind3 = document.getElementById("step3-ind");
    const ind4 = document.getElementById("step4-ind");

    if (ind3) ind3.style.opacity = anyG ? "1" : "0.3";
    if (ind4) ind4.style.opacity = anyI ? "1" : "0.3";
    
    // Feedback visual nos botões de "Continuar" pode ser adicionado aqui
}

/* =====================================================================
Manipulação das finalidades (máx 3)
===================================================================== */
function onFinalidadeChange(e) {
    const cb = e.target;
    const val = cb.value;

    if (cb.checked) {
        if (selectedFinalidades.size >= 3) {
        cb.checked = false;
        toast("Máximo de 3 finalidades permitidas.", "red");
        return;
        }
        selectedFinalidades.add(val);
    } else {
        selectedFinalidades.delete(val);
    }

    applyFinalidadesRules();
}

/* =====================================================================
Aplica regras para habilitar JSS / CURSO e controlar limites
===================================================================== */
function applyFinalidadesRules() {
    // Habilitar JSS se alguma finalidade começa com "G"
    const anyG = Array.from(selectedFinalidades).some(f => f && f.trim().charAt(0).toUpperCase() === "G");
    // Habilitar CURSO se alguma finalidade começa com "I"
    const anyI = Array.from(selectedFinalidades).some(f => f && f.trim().charAt(0).toUpperCase() === "I");

    // Mostrar/ocultar abas 3 e 4 visualmente (explicitar ao usuário)
    const ind3 = document.getElementById("step3-ind");
    if (ind3) ind3.style.opacity = anyG ? "1" : "0.4";

    const ind4 = document.getElementById("step4-ind");
    if (ind4) ind4.style.opacity = anyI ? "1" : "0.4";

    // Se selecionadas vazias e CURRENT_DATA indica finalidades atuais,
    // não forçar seleção aqui — o usuário escolhe
}

// Navegação Inteligente
function goToStep(n) {
    console.log("Tentando ir para o passo:", n);
    
    // 1. Validação de Regras G e I
    const selecionadas = Array.from(selectedFinalidades).map(f => f.toUpperCase());
    const anyG = selecionadas.some(f => f.startsWith("G"));
    const anyI = selecionadas.some(f => f.startsWith("I"));

    // --- LÓGICA DE SALTO (AVANÇO) ---
    // Se o usuário está no Passo 2 e quer avançar
    if (CURRENT_STEP === 2 && n > 2) {
        if (anyG) n = 3;               // Tem G? Vai para o 3 obrigatoriamente
        else if (anyI) n = 4;          // Não tem G, mas tem I? Pula o 3 e vai pro 4
        else n = 5;                    // Não tem nenhum? Vai pro final (Concluir)
    }
    
    // CORREÇÃO CRÍTICA: Se o usuário está no Passo 3 (Restrição) e quer avançar
    if (CURRENT_STEP === 3 && n > 3) {
        if (!anyI) n = 5;              // Se NÃO tem finalidade "I", pula o 4 e vai direto pro 5 (Concluir)
    }

    // --- LÓGICA DE SALTO (RECUO) ---
    if (n < CURRENT_STEP) {
        if (n === 4 && !anyI) n = 3;   // Se voltando do 5 e não tem I, pula pro 3
        if (n === 3 && !anyG) n = 2;   // Se voltando do 4/5 e não tem G, pula pro 2
    }

    // 2. Execução da troca de tela (Mantendo seu código de visibilidade)
    document.querySelectorAll('.wizard-step').forEach(el => {
        el.style.display = 'none';
        el.style.opacity = '0';
        el.classList.remove('active-step');
    });

    const target = document.getElementById(`step-${n}`);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => { 
            target.style.opacity = '1'; 
            target.classList.add('active-step');
        }, 10);
        
        CURRENT_STEP = n;
        updateStepIndicators(n); 
        window.scrollTo(0,0);
    }
}

function updateIndicators(n) {
    document.querySelectorAll('.step-item').forEach((el, idx) => {
        el.classList.remove('active', 'completed');
        if (idx + 1 < n) el.classList.add('completed');
        if (idx + 1 === n) el.classList.add('active');
    });
}

// Habilitar botão final
document.getElementById('consentCheckbox').addEventListener('change', function (e) {
    document.getElementById('btnSalvarFinal').disabled = !e.target.checked;
});


function getPreviousStep() {
    // sempre pode voltar da 5 para 4 ou 3 ou 2 
    const anyG = Array.from(selectedFinalidades)
        .some(f => f && f.trim().charAt(0).toUpperCase() === "G");

    const anyI = Array.from(selectedFinalidades)
        .some(f => f && f.trim().charAt(0).toUpperCase() === "I");

    if (anyI) return 4;// Se houver finalidade "I" → etapa 4 existe
    if (anyG) return 3;// Se houver finalidade "G" → etapa 3 existe
    return 2;// Se não tem G nem I → volta direto para etapa 2
}

/* =====================================================================
Gerencia a troca de telas e indicadores
===================================================================== */
function updateStepIndicators(n) {
    for (let i = 1; i <= 5; i++) {
        const item = document.getElementById(`step${i}-ind`);
        if (!item) continue;
        item.classList.remove("active", "completed");
        if (i < n) item.classList.add("completed");
        else if (i === n) item.classList.add("active");
    }
}

function atualizarFinalidadesSelecionadas() {
    const box = document.getElementById("finalidadesSelecionadasBox");
    const btnProximo = document.getElementById("btnProximoStep2"); // Captura o botão
    box.innerHTML = ""; // limpa

    if (selectedFinalidades.size === 0) {
        box.innerHTML = `<span style="color:#777; font-size:13px;">
            Nenhuma finalidade selecionada.
        </span>`;
        if (btnProximo) btnProximo.disabled = true; // Trava o botão se estiver vazio
        return;
    }

    // Se chegou aqui, há pelo menos uma finalidade selecionada
    if (btnProximo) btnProximo.disabled = false; // Liberta o botão
    
    selectedFinalidades.forEach(fin => {
        const tag = document.createElement("span");
        tag.style.cssText = `
            background:#2980b9;
            color:white;
            padding:6px 12px;
            border-radius:14px;
            font-size:13px;
            display:flex;
            align-items:center;
            gap:6px;
            animation: fadeIn .3s ease;
        `;
        tag.innerHTML = `${fin} <strong style="cursor:pointer;">×</strong>`;

        // remover clicando no X
        tag.querySelector("strong").onclick = () => {
            selectedFinalidades.delete(fin);

            // desmarca o checkbox correspondente
            const chk = document.querySelector(
                "#finalidadeList input[value='" + fin + "']"
            );
            if (chk) chk.checked = false;

            atualizarFinalidadesSelecionadas();
            checkConditionalSteps();
        };

        box.appendChild(tag);
    });
}

// Adicione ou atualize isso no final do seu script_ficha.js ou window.onload
document.addEventListener('change', function(e) { 
    if (e.target && e.target.id === 'consentCheckbox') {
        const btn = document.getElementById('btnSalvarFinal');
        // Se o checkbox estiver marcado, remove o 'disabled', senão adiciona.
        if (btn) btn.disabled = !e.target.checked;
    }
});

