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

// Nova função: Ordena nadadores por idade (dos mais jovens para os mais velhos)
export function ordenarNadadoresPorIdade(nadadores) {
    const sorted = [...nadadores].sort((a, b) => getAge(a.data_nasc) - getAge(b.data_nasc));
    console.log("Nadadores ordenados por idade (dos mais jovens para os mais velhos):");
    sorted.forEach(n => console.log(`${n.nome} - Idade: ${getAge(n.data_nasc)}`));
    return sorted;
}

// Função para ordenar nadadores com e sem tempo registrado
export function ordenarNadadoresPorTempo(nadadores) {
    // Separar nadadores com tempo "00:00" e com tempo definido
    const nadadoresSemTempo = nadadores.filter(n => n.melhor_tempo === "00:00");
    const nadadoresComTempo = nadadores.filter(n => n.melhor_tempo !== "00:00")
        .sort((a, b) => timeToMilliseconds(b.melhor_tempo) - timeToMilliseconds(a.melhor_tempo)); // Ordenação decrescente dos tempos

    // Combina a lista dos sem recorde com a dos tempos ordenados
    return [...nadadoresSemTempo, ...nadadoresComTempo];
}

// Função para dividir nadadores em baterias com o mínimo de 3 nadadores na última bateria
export function dividirEmBaterias(nadadores) {
    // Ordenar os nadadores por idade
    const nadadoresOrdenados = ordenarNadadoresPorIdade(nadadores);
    const totalNadadores = nadadoresOrdenados.length;
    const baterias = [];

    // Cálculo inicial das baterias
    let numeroDeBaterias = Math.ceil(totalNadadores / 6);
    let tamanhoBateriaPadrao = 6; // Tamanho padrão da bateria

    // Ajustar o número de nadadores nas últimas baterias
    const resto = totalNadadores % 6;
    const tamanhosBaterias = Array(numeroDeBaterias).fill(tamanhoBateriaPadrao);

    // Ajustes finais para garantir que a última bateria tenha no mínimo 3 nadadores
    if (resto === 2) {
        tamanhosBaterias[numeroDeBaterias - 2] = 5; // Penúltima bateria com 5
        tamanhosBaterias[numeroDeBaterias - 1] = 3; // Última bateria com 3
    } else if (resto === 1) {
        tamanhosBaterias[numeroDeBaterias - 2] = 4; // Penúltima bateria com 4
        tamanhosBaterias[numeroDeBaterias - 1] = 3; // Última bateria com 3
    } else if (resto !== 0) {
        tamanhosBaterias[numeroDeBaterias - 1] = resto; // Última bateria com o valor do resto
    }

    // Distribuir os nadadores nas baterias conforme o tamanho calculado
    let index = 0;
    for (let i = 0; i < numeroDeBaterias; i++) {
        const tamanhoBateria = tamanhosBaterias[i];
        const grupo = nadadoresOrdenados.slice(index, index + tamanhoBateria);
        baterias.push(grupo);
        index += tamanhoBateria;
    }
    return baterias;
}

// Função para distribuir os nadadores nas raias de acordo com a classificação
export function distribuirNadadoresNasRaias(nadadores, provaId) {
    const nadadoresPorRaia = Array(6).fill(null).map(() => []); // Cria as raias vazias
    const raias = []; // Armazena as raias de acordo com o número de nadadores

    // Define as raias manualmente com base no número de nadadores
    switch (nadadores.length) {
        case 6:
            raias.push(6, 5, 4, 3, 2, 1); // Para 6 nadadores
            break;
        case 5:
            raias.push(4, 5, 2, 3, 1); // Para 5 nadadores
            break;
        case 4:
            raias.push(4, 3, 2, 1); // Para 4 nadadores
            break;
        case 3:
            raias.push(2, 3, 1); // Para 3 nadadores
            break;
        default:
            console.error(`Número de nadadores não suportado: ${nadadores.length}`);
            return []; // Retorna vazio para números não suportados
    }

    // Distribui os nadadores nas raias
    nadadores.forEach((nadador, index) => {
        const raiaIndex = index; // O índice corresponde diretamente ao índice de "raias"
        if (raias[raiaIndex] === undefined) {
            console.error(`Raia não encontrada para índice ${index}`);
            return;
        }
        nadadoresPorRaia[raias[raiaIndex] - 1].push({
            ...nadador,
            raia: raias[raiaIndex],
            prova_id: provaId,
        });
        console.log(`Nadador ${nadador.nome} (Idade: ${getAge(nadador.data_nasc)}) atribuído à raia ${raias[raiaIndex]}`);
    });

    const resultado = nadadoresPorRaia.filter(raia => raia.length > 0);
    console.log("Distribuição final nas raias:", resultado.map((r, idx) => `Raia ${idx + 1}: ${r.map(n => n.nome).join(", ")}`).join(" | "));
    return resultado;
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

