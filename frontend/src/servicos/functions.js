// Converter o tempo para milissegundos
export function timeToMilliseconds(time) {
    if (time === "00:00") return Infinity; // Alterado: agora compara "00:00"
    const [minutes, seconds, centiseconds] = time.split(':').map(Number);
    return (minutes * 60 + seconds + centiseconds / 100) * 1000;
}

// Helper: Calcula a idade a partir da data de nascimento
function getAge(dataNasc) {
    const diff = Date.now() - new Date(dataNasc).getTime();
    return new Date(diff).getUTCFullYear() - 1970;
}

// Função para dividir nadadores em baterias, garantindo que cada bateria tenha no mínimo 3 nadadores
export function dividirEmBaterias(nadadores, quantidadeRaias) {
    const nadadoresOrdenados = [...nadadores]; // Clona o array para evitar modificações indesejadas
    const baterias = [];
    let start = 0;

    while (start < nadadoresOrdenados.length) {
        let tamanhoBateria = Math.min(quantidadeRaias, nadadoresOrdenados.length - start);
        let restantes = nadadoresOrdenados.length - (start + tamanhoBateria);

        if (restantes > 0 && restantes < 3) {
            tamanhoBateria -= (3 - restantes);
        }
        //console.log('nadadoresOrdenados:', nadadoresOrdenados); //AQUI AINDA ESTÁ OK
        nadadoresOrdenados.reverse(); // Inverte a ordem dos nadadores
        baterias.push(nadadoresOrdenados.slice(start, start + tamanhoBateria)); // Adiciona a bateria 
        start += tamanhoBateria;
    }
    return baterias.reverse(); // Inverte para que os mais rápidos fiquem na última bateria
}

// Função para distribuir os nadadores nas raias de acordo com a classificação
export function distribuirNadadoresNasRaias(nadadores, provaId, quantidadeRaias) {
    const raiasDistribuicao = {
        3: [2, 1, 3],
        4: [2, 1, 3, 4],
        5: [3, 1, 4, 2, 5],
        6: [3, 1, 4, 2, 5, 6],
        7: [4, 2, 5, 1, 6, 3, 7],
        8: [4, 2, 5, 1, 6, 3, 7, 8],
        9: [5, 3, 6, 1, 7, 2, 8, 4, 9],
        10: [5, 3, 6, 1, 7, 2, 8, 4, 9, 10],
    };

    // Instead of inverting the array, use the already sorted swimmers
    const nadadoresOrdenados = [...nadadores]; // Mantém a ordem como está  

    // Definir a ordem das raias conforme o número de nadadores disponíveis
    let ordemRaias = raiasDistribuicao[quantidadeRaias] || [];

    if (nadadoresOrdenados.length < quantidadeRaias) { // Se houver menos nadadores do que raias
        const totalLanes = quantidadeRaias; // Total de raias
        const center = Math.ceil(totalLanes / 2); // Raia central
        ordemRaias = [center]; // Raia central
        let left = center - 1, right = center + 1; // Raia à esquerda e à direita
        while (ordemRaias.length < nadadoresOrdenados.length) { // Enquanto houver nadadores não distribuídos
            if (right <= totalLanes) ordemRaias.push(right); // Adiciona à direita
            if (ordemRaias.length >= nadadoresOrdenados.length) break; // Se já distribuiu todos, sai do loop
            if (left >= 1) ordemRaias.push(left); // Adiciona à esquerda
            right++; // Incrementa a raia à direita
            left--; // Decrementa a raia à esquerda
        }
    }

    // Distribuir os nadadores nas raias
    const distribuicao = nadadoresOrdenados.map((nadador, index) => ({
        ...nadador,
        raia: ordemRaias[index] || (index + 1),
        prova_id: provaId,
    }));

    return distribuicao.sort((a, b) => a.raia - b.raia);
}

// Função para validar CPF
export function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false; // Verifica se tem 11 dígitos ou se todos são iguais

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let digitoVerificador1 = 11 - (soma % 11);
    if (digitoVerificador1 > 9) digitoVerificador1 = 0;
    if (digitoVerificador1 !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    let digitoVerificador2 = 11 - (soma % 11);
    if (digitoVerificador2 > 9) digitoVerificador2 = 0;
    return digitoVerificador2 === parseInt(cpf.charAt(10));
}

// Função para aplicar máscara de CPF
export function aplicarMascaraCPF(cpf) {
    cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
    cpf = cpf.substring(0, 11); // Limita a 11 caracteres
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); // Aplica a máscara
}

// Função para aplicar máscara de celular
export function aplicarMascaraCelular(celular) {
    celular = celular.replace(/\D/g, ''); // Remove caracteres não numéricos
    celular = celular.substring(0, 11); // Limita a 11 caracteres
    return celular.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'); // Aplica a máscara
}

// Função para validar celular
export function validarCelular(celular) {
    celular = celular.replace(/\D/g, ''); // Remove caracteres não numéricos

    // Verifica se o comprimento do número é 10 ou 11
    if (celular.length !== 10 && celular.length !== 11) return false;

    // Verifica se todos os dígitos são iguais (por exemplo, 11111111111)
    if (/^(\d)\1+$/.test(celular)) return false;

    // Se passar pelas validações acima, o número é considerado válido
    return true;
}

// Função para formatar data e hora
export function formataData(dateString) {
    const adjustedDate = new Date(dateString);
    adjustedDate.setHours(adjustedDate.getHours() + 3); // Adiciona 3 horas

    const optionsDate = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' };

    const dataEvento = adjustedDate.toLocaleDateString('pt-BR', optionsDate);
    const horario = adjustedDate.toLocaleTimeString('pt-BR', optionsTime);

    return { dataEvento, horario };
}

