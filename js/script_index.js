const API_URL = "https://script.google.com/macros/s/AKfycbyJ8o423Mi_JoLq2z6LqvV1H-2DycjywLzCfGz3PPl4Mw4DQkKw0kenYnhi47wVbk4N/exec";

// No window.onload do INDEX.HTML
window.onload = () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const cpfCadastrado = urlParams.get('cpf');
    const status = urlParams.get('status');

    if (cpfCadastrado) {
        const campoCPF = document.getElementById('cpfInput'); // Use o ID real do seu campo no index
        if (campoCPF) campoCPF.value = cpfCadastrado;
        
        if (status === 'cadastrado') {
            // Exemplo: exibe um alerta ou muda uma label para avisar que deu certo
            console.log("Usuário acabou de se cadastrar.");
            // Você pode disparar a busca automática aqui se quiser:
            // buscarCPF(); 
        }
    }
    

};

// Função que salva no "bolso" do navegador e muda de página
window.irParaFicha = () => {
    // Agora usamos a variável global que criamos lá em cima
    if (dadosTemporariosInspecionando) {
        sessionStorage.setItem('dadosInspecionando', JSON.stringify(dadosTemporariosInspecionando));
        window.location.href = 'Fichas.html';
    } else {
        alert("Erro: Dados do inspecionando não carregados. Tente pesquisar novamente.");
    }
};

function limparCampos(){
    document.getElementById('cpfInput').value = '';
    document.getElementById('resultado').innerHTML = '';
    document.getElementById('btnPesquisar').disabled = true; // Bloqueia novamente
    document.getElementById('cpfInput').focus();
}

async function buscarInspecionando() {
    const cpf = document.getElementById('cpfInput').value;
    if(!cpf) return alert("Por favor, digite o CPF.");
    
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('resultado').innerHTML = '';
    
    // Construímos a URL com os parâmetros
    const urlCompleta = `${API_URL}?action=buscarCPF&cpf=${encodeURIComponent(cpf)}`;

    try {
        // FETCH SIMPLIFICADO - Sem headers customizados para evitar pré-vôo de CORS
        const response = await fetch(urlCompleta, {
            method: "GET",
            mode: "cors",
            redirect: "follow"
        });
        
        if (!response.ok) throw new Error('Falha na rede');

        const res = await response.json();
        
        if(res.success) {
            dadosTemporariosInspecionando = res.data;
            // Armazena os dados do inspecionando para uso posterior
            sessionStorage.setItem('dados_inspecionando', JSON.stringify(res.data));
            document.getElementById('resultado').innerHTML = `
                <div class="alert alert-success shadow-sm">
                    <strong>Inspecionando Encontrado:</strong><br>
                    ${res.data.nome}<br>
                    <small>Posto/Grad/Cat: ${res.data.posto} ${res.data.quadro} ${res.data.especialidade} </small><br>
                    <small>Data_Nasc: ${res.data.nascimento} Saram: ${res.data.saram}</small>
                    
                    <button class="btn btn-sm btn-success d-block w-100 mt-3" onclick="irParaFicha()">Iniciar Ficha de Inspeção</button>
                </div>`;                    
        } else {
            document.getElementById('resultado').innerHTML = `
                <div class="alert alert-warning shadow-sm">
                    Inspecionando não encontrado no banco de dados.<br>
                    <button class="btn btn-sm btn-primary mt-2" onclick="window.location.href='Cadastro.html?cpf='+document.getElementById('cpfInput').value">Cadastrar Novo</button>
                </div>`;
        }
    } catch (error) {
        alert("Erro na comunicação com o servidor. Verifique a conexão.");
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
}



// Atalho: Enter no teclado aciona a pesquisa
document.getElementById('cpfInput').addEventListener('keyup', (e) => {
    if(e.key === 'Enter') buscarInspecionando();
});

function calcularCPF(input) {
    let cpf = (input.value || "").toString().replace(/\D/g, "");
    input.value = cpf; // mantém só números
    
    const erro = document.getElementById("CampoCPF-error");
    const btnPesquisar = document.getElementById("btnPesquisar");

    // Função interna para bloquear o botão e mostrar erro
    const invalidar = (msg) => {
        if (erro) erro.innerText = msg;
        if (btnPesquisar) btnPesquisar.disabled = true;
        return false;
    };

    // Estilo do erro
    if (erro) {
        erro.style.color = "red";
        erro.style.fontSize = "12px";
        erro.style.fontWeight = "bold";
    }

    // 1. Validação de Tamanho
    if (cpf.length < 11) {
        return invalidar("CPF incompleto.");
    }

    if (cpf.length > 11) {
        input.value = cpf.slice(0, 11);
        return false;
    }

    // 2. Elimina CPFs repetidos (Ex: 111.111...)
    if (/^(\d)\1{10}$/.test(cpf)) {
        return invalidar("CPF inválido.");
    }

    // 3. Algoritmo de Cálculo dos Dígitos
    function calcDV(base, fator) {
        let total = 0;
        for (let i = 0; i < base.length; i++) {
            total += parseInt(base[i], 10) * (fator - i);
        }
        let resto = (total * 10) % 11;
        return resto === 10 ? 0 : resto;
    }

    const dv1 = calcDV(cpf.slice(0, 9), 10);
    const dv2 = calcDV(cpf.slice(0, 10), 11);

    if (dv1 !== parseInt(cpf[9], 10) || dv2 !== parseInt(cpf[10], 10)) {
        return invalidar("CPF inválido.");
    }

    // 4. CPF VÁLIDO: Limpa erro e habilita o botão
    if (erro) erro.innerText = "";
    if (btnPesquisar) btnPesquisar.disabled = false;
    return true;
}
