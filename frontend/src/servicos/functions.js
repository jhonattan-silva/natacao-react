// Converter o tempo para milissegundos
export function timeToMilliseconds(time) {
    if (time === "Sem recorde") return Infinity; // Para ordenar nadadores sem tempo registrado no final
    const [minutes, seconds, centiseconds] = time.split(':').map(Number);
    return (minutes * 60 + seconds + centiseconds / 100) * 1000;
}

// Função para ordenar nadadores com e sem tempo registrado
export function ordenarNadadoresPorTempo(nadadores) {
    // Separar nadadores sem recorde e com tempo
    const nadadoresSemTempo = nadadores.filter(n => n.melhor_tempo === "Sem recorde");
    const nadadoresComTempo = nadadores.filter(n => n.melhor_tempo !== "Sem recorde")
        .sort((a, b) => timeToMilliseconds(b.melhor_tempo) - timeToMilliseconds(a.melhor_tempo)); // Ordenação decrescente dos tempos

    // Combina a lista dos sem recorde com a dos tempos ordenados
    return [...nadadoresSemTempo, ...nadadoresComTempo];
}

// Função para dividir nadadores em baterias com o mínimo de 3 nadadores na última bateria
export function dividirEmBaterias(nadadores) {
    // Ordenar os nadadores por tempo
    const nadadoresOrdenados = ordenarNadadoresPorTempo(nadadores);
    console.log(nadadoresOrdenados);
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
    console.log("!BATERIAS______", baterias);
    return baterias;
}

// Função para distribuir os nadadores nas raias de acordo com a classificação
export function distribuirNadadoresNasRaias(nadadores) {
    const nadadoresPorRaia = Array(6).fill(null).map(() => []); // cria as raias vazias
    const ordemRaias = [6, 1, 5, 2, 4, 3]; // ordem de distribuição
    const raias = []; // array que irá armazenar as raias de acordo com a lógica


    // Definindo as raias manualmente com base no número de nadadores
    switch (nadadores.length) {
        case 6:
            raias.push(6, 5, 4, 3, 2, 1); // Para 6 nadadores
            console.log("TEM SEISSSSSSSSSSSS");
            console.log(raias);
            
            break;
        case 5:
            raias.push(4, 5, 2, 3, 1); // Para 5 nadadores
            console.log("CINCUUUUUUUUUUUM");
            
            break;
        case 4:
            raias.push(4, 3, 2, 1); // Para 4 nadadores
            console.log("FOOOOOOOOOOOUR");
            
            break;
        case 3:
            raias.push(2, 3, 1); // Para 3 nadadores
            console.log("ARVRESSSSSSSS");
            
            break;
        default:
            console.log("Número de nadadores não suportado");
            return []; // Retorna um array vazio se o número de nadadores não for suportado
    }


    nadadores.forEach((nadador, index) => {
        const raiaIndex = ordemRaias[index % ordemRaias.length] - 1; // usa ordemRaias para obter o índice desejado
        console.log("INDEX: ", index);
        console.log("RAIA INDEX: ", raias[index]);

        nadadoresPorRaia[raiaIndex].push({ ...nadador, raia: raias[index] });
    });

    return nadadoresPorRaia.filter(raia => raia.length > 0); // tira as raias vazias
}

