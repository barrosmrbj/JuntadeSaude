const API_URL = "https://script.google.com/macros/s/AKfycbwFsMusddUIVVxtD7xC3GuSQlq4Q0njnC0JjEJeiAgvnxxk5IJJNzC3zV2eITOXr_Ne5Q/exec";

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
    input.value = cpf; // mantém só números no campo
    const erro = document.getElementById("CampoCPF-error");

    // Configura a cor vermelha caso o elemento exista
    if (erro) {
        erro.style.color = "red";
        erro.style.fontSize = "12px"; // Opcional: ajusta o tamanho para não quebrar o layout
        erro.style.fontWeight = "bold"; // Opcional: destaca o erro
    }    

    if (cpf.length < 11) {
        if (erro) erro.innerText = "CPF incompleto.";
        return false;
    }

    if (cpf.length > 11) {
        input.value = cpf.slice(0, 11);
        return false;
    }

    // Elimina CPFs repetidos
    if (/^(\d)\1{10}$/.test(cpf)) {
        if (erro) erro.innerText = "CPF inválido.";
        return false;
    }

    // Função para cálculo dos dígitos verificadores
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
        if (erro) erro.innerText = "CPF inválido.";
        return false;
    }

    // CPF válido
    if (erro) erro.innerText = "";
    return true;
}

