import { pdfMake, logo } from './pdf.js';

export { pdfMake }; // Reexportar pdfMake para uso externo

// Função para gerar o relatório de inscritos em PDF
export const relatorioInscritosPDF = (inscritos, inscritosEquipe, inscritosEquipeSexo, evento) => {
    let totalMasculino = 0;
    let totalFeminino = 0;
    let totalGeral = 0;
    if (Array.isArray(inscritosEquipeSexo)) {
        inscritosEquipeSexo.forEach(item => {
            totalMasculino += Number(item.atletas_masculinos);
            totalFeminino += Number(item.atletas_femininas);
            totalGeral += Number(item.total_atletas);
        });
    }
    const bodyTotal = [
      ['Categoria', 'Total de Inscritos'],
      ['Masculino', String(totalMasculino)],
      ['Feminino', String(totalFeminino)],
      ['Total Geral', String(totalGeral)]
    ];

    // Tabela por Prova
    const provas = {};
    inscritos.forEach(item => {
        const prova = item.nome_prova ? item.nome_prova.trim() : 'N/D';
        provas[prova] = (provas[prova] || 0) + 1;
    });
    const bodyProva = [['Prova', 'Total de Inscritos']];
    Object.keys(provas).forEach(prova => {
        bodyProva.push([prova, String(provas[prova])]);
    });

    // Tabela "Inscritos por Equipe e por Sexo"
    const bodyEquipeSexo = [['Equipe', 'Atletas Masculinos', 'Atletas Femininas', 'Total Atletas', 'Revezamentos']];
    if (Array.isArray(inscritosEquipeSexo)) {
        inscritosEquipeSexo.forEach(item => {
            bodyEquipeSexo.push([
                item.equipe ? item.equipe.trim() : 'N/D',
                String(item.atletas_masculinos),
                String(item.atletas_femininas),
                String(item.total_atletas),
                String(item.revezamentos)
            ]);
        });
    }

    // Tabela dos inscritos por equipe (Dados Brutos)
    const bodyEquipe = [['Equipe', 'Total de Inscritos']];
    if (Array.isArray(inscritosEquipe)) {
        inscritosEquipe.forEach(item => {
            bodyEquipe.push([
                item.equipe ? item.equipe.trim() : 'N/D',
                String(item.total_inscritos)
            ]);
        });
    }

    // Processar data e hora do evento a partir de evento.data com formato dd/MM/aaaa
    let formattedDate = 'N/D';
    let formattedTime = 'N/D';
    if (evento?.data) {
      const dt = new Date(evento.data);
      const dia = dt.getDate().toString().padStart(2, '0');
      const mes = (dt.getMonth() + 1).toString().padStart(2, '0');
      const ano = dt.getFullYear();
      formattedDate = `${dia}/${mes}/${ano}`;
      formattedTime = dt.toISOString().split('T')[1]?.split('.')[0] || 'N/D';
    }

    const docDefinition = {
        pageMargins: [40, 150, 40, 60],
        header: {
            stack: [
                { image: logo, width: 100, alignment: 'center', margin: [0, 10, 0, 10] },
                { text: 'Relatório Total de Inscritos', style: 'header', alignment: 'center' }
            ]
        },
        content: [
            // Dados do Evento com data e hora separados
            { text: 'Dados do Evento', style: 'subheader', margin: [0, 0, 0, 10] },
            {
                table: {
                    body: [
                        ['Nome do Evento', evento?.nome || 'N/D'],
                        ['Cidade', evento?.cidade || 'N/D'],
                        ['Data', formattedDate],
                        ['Hora', formattedTime]
                    ]
                },
                layout: 'noBorders'
            },
            { text: '\n' },
            // Total de Participantes por Sexo
            { text: 'Total de Participantes', style: 'subheader', margin: [0, 0, 0, 10] },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto'],
                    body: bodyTotal
                },
                layout: 'lightHorizontalLines'
            },
            { text: '\n' },
            // Inscritos por Prova
            { text: 'Inscritos por Prova', style: 'subheader', margin: [0, 0, 0, 10] },
            { table: { headerRows: 1, widths: ['*', 'auto'], body: bodyProva }, layout: 'lightHorizontalLines' },
            { text: '\n' },
            // Inscritos por Equipe e por Sexo
            { text: 'Inscritos por Equipe e por Sexo', style: 'subheader', margin: [0, 20, 0, 10] },
            { table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto', 'auto'], body: bodyEquipeSexo }, layout: 'lightHorizontalLines' },
            { text: '\n' },
            // Inscrições por Equipe (Dados Brutos)
            { text: 'Inscrições por Equipe (Dados Brutos)', style: 'subheader', margin: [0, 20, 0, 10] },
            { table: { headerRows: 1, widths: ['*', 'auto'], body: bodyEquipe }, layout: 'lightHorizontalLines' }
        ],
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 10, 0, 10] },
            subheader: { fontSize: 16, bold: true }
        }
    };

    const anoAtual = new Date().getFullYear();
    const fileName = `LPN-Relatorio ${evento?.nome?.replace(/\s+/g, ' ') || 'Relatorio'}_${anoAtual}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
};

export const gerarPDFInscricoes = (inscricoes, evento, equipeNome, geradorNome, inscricoesRevezamento, provas) => {
    const bodyInscricoes = [
        ['Nadador', 'Prova', 'Sexo']
    ];

    // Preencher linhas com os dados detalhados das inscrições individuais
    inscricoes.forEach(inscricao => {
        bodyInscricoes.push([
            inscricao.nadadorNome || 'N/D',
            `${inscricao.distancia || ''}m ${inscricao.estilo || ''}`.trim(),
            inscricao.sexo === 'M' ? 'Masculino' : inscricao.sexo === 'F' ? 'Feminino' : (inscricao.sexo || 'N/D')
        ]);
    });

    // Adicionar inscrições de revezamento ao PDF
    if (inscricoesRevezamento && inscricoesRevezamento.length > 0) {
        bodyInscricoes.push(['', '', '']); // Linha vazia para separação
        inscricoesRevezamento.forEach(inscricao => {
            const provaDescricao = `${inscricao.distancia || ''}m ${inscricao.estilo || ''}`.trim();
            bodyInscricoes.push([
                'Revezamento',
                provaDescricao,
                inscricao.sexo === 'M' ? 'Masculino' : inscricao.sexo === 'F' ? 'Feminino' : (inscricao.sexo || 'N/D') // Adicionada a coluna Sexo
            ]);
        });
    }

    // Ano atual para o título
    const anoAtual = new Date().getFullYear();
    const equipe = (equipeNome !== undefined && equipeNome !== null && String(equipeNome).trim()) ? String(equipeNome).trim() : 'N/D';

    // Data e hora de geração
    const geradoEm = new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const docDefinition = {
        pageMargins: [40, 150, 40, 60],
        header: {
            stack: [
                { image: logo, width: 100, alignment: 'center', margin: [0, 10, 0, 10] },
                {
                    text: `Relatório de Inscrições - ${evento?.nome || 'Evento'} - ${anoAtual}\n${equipe}`,
                    style: 'header',
                    alignment: 'center'
                }
            ]
        },
        content: [
            { text: '\n' },
            { text: 'Detalhes das Inscrições', style: 'subheader' },
            { 
                table: { 
                    headerRows: 1, 
                    widths: ['*', '*', 'auto'], 
                    body: bodyInscricoes 
                }, 
                layout: 'lightHorizontalLines' 
            },
            { text: '\n' },
            { text: `Gerado em: ${geradoEm} por: ${geradorNome}`, style: 'subfooter', alignment: 'right' }
        ],
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 10, 0, 10] },
            subheader: { fontSize: 14, bold: true },
            subfooter: { fontSize: 10, italics: true, margin: [0, 5, 0, 0] }
        }
    };

    const fileName = `Relatorio_Inscricoes_${evento?.nome?.replace(/\s+/g, '_') || 'Evento'}_${equipe}_${anoAtual}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
};

// Função para gerar PDF do Relatório de Resultados da Equipe
export const gerarPDFResultadosEquipe = (evento, provas, estatisticas, equipeNome) => {
    const anoAtual = new Date().getFullYear();
    
    // Formatar data do evento
    let formattedDate = 'N/D';
    if (evento?.data) {
        const dt = new Date(evento.data);
        const dia = dt.getDate().toString().padStart(2, '0');
        const mes = (dt.getMonth() + 1).toString().padStart(2, '0');
        const ano = dt.getFullYear();
        formattedDate = `${dia}/${mes}/${ano}`;
    }

    // Corpo da tabela de provas
    const bodyProvas = [
        ['Prova', 'Nadador', 'Categoria', 'Tempo', 'Classificação']
    ];

    provas.forEach(prova => {
        const classificacao = prova.classificacao === 1 ? '🥇' :
                            prova.classificacao === 2 ? '🥈' :
                            prova.classificacao === 3 ? '🥉' :
                            prova.classificacao || '-';
        
        bodyProvas.push([
            prova.prova || '-',
            prova.nadador || '-',
            prova.categoria || '-',
            prova.tempo || '-',
            String(classificacao)
        ]);
    });

    const docDefinition = {
        pageMargins: [40, 150, 40, 60],
        header: {
            stack: [
                { image: logo, width: 100, alignment: 'center', margin: [0, 10, 0, 10] },
                {
                    text: `Relatório de Resultados - ${equipeNome}\n${evento?.evento || 'Evento'} - ${anoAtual}`,
                    style: 'header',
                    alignment: 'center'
                }
            ]
        },
        content: [
            // Dados do Evento
            { text: 'Dados do Evento', style: 'subheader', margin: [0, 0, 0, 10] },
            {
                table: {
                    body: [
                        ['Nome do Evento', evento?.evento || 'N/D'],
                        ['Data', formattedDate],
                        ['Cidade', evento?.cidade || 'N/D'],
                        ['Sede', evento?.sede || 'N/D']
                    ]
                },
                layout: 'noBorders'
            },
            { text: '\n' },
            // Estatísticas
            { text: 'Resumo Geral', style: 'subheader', margin: [0, 0, 0, 10] },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto'],
                    body: [
                        ['Métrica', 'Valor'],
                        ['Total de Nadadores', String(estatisticas?.total_nadadores || 0)],
                        ['Total de Provas', String(estatisticas?.total_provas || 0)],
                        ['🥇 Ouro', String(estatisticas?.total_ouro || 0)],
                        ['🥈 Prata', String(estatisticas?.total_prata || 0)],
                        ['🥉 Bronze', String(estatisticas?.total_bronze || 0)],
                        ['Pontos Individuais', String(estatisticas?.total_pontos_individuais || 0)],
                        ['Pontos Equipe', String(estatisticas?.total_pontos_equipe || 0)]
                    ]
                },
                layout: 'lightHorizontalLines'
            },
            { text: '\n' },
            // Resultados das Provas
            { text: 'Resultados das Provas', style: 'subheader', margin: [0, 0, 0, 10] },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', '*', 'auto', 'auto', 'auto'],
                    body: bodyProvas
                },
                layout: 'lightHorizontalLines'
            }
        ],
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 10, 0, 10] },
            subheader: { fontSize: 14, bold: true }
        }
    };

    const fileName = `Relatorio_Resultados_${equipeNome}_${evento?.evento?.replace(/\s+/g, '_') || 'Evento'}_${anoAtual}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
};

// Função para gerar PDF dos Melhores Tempos por Nadador
export const gerarPDFMelhoresTempos = (melhoresTempos, equipeNome) => {
    const anoAtual = new Date().getFullYear();

    const bodyTempos = [
        ['Nadador', 'Categoria', 'Prova', 'Melhor Tempo', 'Evento', 'Data']
    ];

    melhoresTempos.forEach(tempo => {
        const dataFormatada = new Date(tempo.evento_data).toLocaleDateString('pt-BR');
        bodyTempos.push([
            tempo.nadador_nome || '-',
            tempo.categoria_nome || '-',
            tempo.prova_nome || '-',
            tempo.melhor_tempo || '-',
            tempo.evento_nome || '-',
            dataFormatada
        ]);
    });

    const docDefinition = {
        pageOrientation: 'landscape',
        pageMargins: [40, 150, 40, 60],
        header: {
            stack: [
                { image: logo, width: 100, alignment: 'center', margin: [0, 10, 0, 10] },
                {
                    text: `Melhores Tempos por Nadador - ${equipeNome} - ${anoAtual}`,
                    style: 'header',
                    alignment: 'center'
                }
            ]
        },
        content: [
            { text: 'Melhores Tempos por Nadador', style: 'subheader', margin: [0, 0, 0, 10] },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', '*', 'auto', '*', 'auto'],
                    body: bodyTempos
                },
                layout: 'lightHorizontalLines'
            }
        ],
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 10, 0, 10] },
            subheader: { fontSize: 14, bold: true }
        }
    };

    const fileName = `Melhores_Tempos_Nadador_${equipeNome}_${anoAtual}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
};

// Função para gerar PDF dos Records por Prova
export const gerarPDFRecordsPorProva = (records, equipeNome, filtros) => {
    const anoAtual = new Date().getFullYear();

    const bodyRecords = [
        ['Prova', 'Sexo', 'Nadador', 'Categoria', 'Tempo', 'Evento', 'Data']
    ];

    records.forEach(record => {
        const sexo = record.sexo_prova === 'M' ? 'Masculino' : 'Feminino';
        const dataFormatada = new Date(record.evento_data).toLocaleDateString('pt-BR');
        bodyRecords.push([
            record.prova_nome || '-',
            sexo,
            record.nadador_nome || '-',
            record.categoria_nome || '-',
            record.tempo_record || '-',
            record.evento_nome || '-',
            dataFormatada
        ]);
    });

    // Informação sobre filtros aplicados
    const filtrosAplicados = [];
    if (filtros.sexo !== 'todos') {
        filtrosAplicados.push(`Sexo: ${filtros.sexo === 'M' ? 'Masculino' : 'Feminino'}`);
    }
    if (filtros.provas && filtros.provas.length > 0) {
        filtrosAplicados.push(`${filtros.provas.length} prova(s) selecionada(s)`);
    }

    const docDefinition = {
        pageOrientation: 'landscape',
        pageMargins: [40, 150, 40, 60],
        header: {
            stack: [
                { image: logo, width: 100, alignment: 'center', margin: [0, 10, 0, 10] },
                {
                    text: `Melhores Tempos por Prova - ${equipeNome} - ${anoAtual}`,
                    style: 'header',
                    alignment: 'center'
                }
            ]
        },
        content: [
            ...(filtrosAplicados.length > 0 ? [
                { text: 'Filtros Aplicados:', style: 'subheader', margin: [0, 0, 0, 5] },
                { text: filtrosAplicados.join(', '), margin: [0, 0, 0, 10] }
            ] : []),
            { text: 'Melhores Tempos por Prova', style: 'subheader', margin: [0, 0, 0, 10] },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', '*', 'auto', 'auto', '*', 'auto'],
                    body: bodyRecords
                },
                layout: 'lightHorizontalLines'
            }
        ],
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 10, 0, 10] },
            subheader: { fontSize: 14, bold: true }
        }
    };

    const fileName = `Melhores_Tempos_Prova_${equipeNome}_${anoAtual}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
};
