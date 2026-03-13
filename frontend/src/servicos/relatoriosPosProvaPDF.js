import { pdfMake, logo } from './pdf.js';

export const gerarPDFPosProvaEquipe = (relatorio) => {
    const anoAtual = new Date().getFullYear();
    const dataEvento = relatorio?.evento?.data
        ? new Date(relatorio.evento.data).toLocaleDateString('pt-BR')
        : '-';

    const extrairOrdemProva = (provaData) => {
        const ordemDireta = Number(provaData?.ordem);
        if (Number.isFinite(ordemDireta)) {
            return ordemDireta;
        }

        const nomeProva = `${provaData?.prova?.nome_prova || provaData?.nome_prova || ''}`;
        const match = nomeProva.match(/^(\d+)ª\s+PROVA/i);
        return match ? Number(match[1]) : 9999;
    };

    const formatarCelulaDiferenca = (texto, deltaCentesimos) => {
        if (!texto || texto === '-') {
            return { text: '-' };
        }

        let textoFormatado = String(texto).trim();

        const temSinalExplicito = textoFormatado.startsWith('+') || textoFormatado.startsWith('-');
        if (!temSinalExplicito && textoFormatado !== '00:00:00') {
            textoFormatado = `+${textoFormatado}`;
        }

        if (deltaCentesimos === null || deltaCentesimos === undefined) {
            if (textoFormatado.startsWith('-')) {
                return { text: textoFormatado, color: '#2e7d32', bold: true, alignment: 'center' };
            }
            if (textoFormatado.startsWith('+')) {
                return { text: textoFormatado, color: '#c62828', bold: true, alignment: 'center' };
            }
            return { text: textoFormatado, alignment: 'center' };
        }

        const valorDelta = Number(deltaCentesimos);
        if (Number.isNaN(valorDelta)) {
            return { text: textoFormatado, alignment: 'center' };
        }

        if (valorDelta < 0) {
            return { text: textoFormatado, color: '#2e7d32', bold: true, alignment: 'center' };
        }

        if (valorDelta > 0) {
            return { text: textoFormatado, color: '#c62828', bold: true, alignment: 'center' };
        }

        return { text: textoFormatado, alignment: 'center' };
    };

    const formatarCelulaTempo = (texto) => ({
        text: texto || '-',
        alignment: 'center'
    });

    const content = [];

    // Cabeçalho com dados do evento
    content.push(
        { text: 'Dados do Evento', style: 'subheader', margin: [0, 0, 0, 10] },
        {
            table: {
                body: [
                    ['Evento', relatorio?.evento?.nome || '-'],
                    ['Data', dataEvento],
                    ['Equipe', relatorio?.equipe?.nome || '-']
                ]
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 15]
        }
    );

    const provasOrdenadas = [...(relatorio?.provas || [])].sort((a, b) => {
        const ordemA = extrairOrdemProva(a);
        const ordemB = extrairOrdemProva(b);
        if (ordemA !== ordemB) return ordemA - ordemB;
        return String(a?.nome_prova || a?.prova?.nome_prova || '').localeCompare(
            String(b?.nome_prova || b?.prova?.nome_prova || '')
        );
    });

    // Para cada prova, adicionar seção
    provasOrdenadas.forEach((provaData, index) => {
        if (index > 0) {
            content.push({ text: '', pageBreak: 'before' });
        }

        const nomeProva = `${provaData?.prova?.nome_prova || provaData?.nome_prova || '-'}`;
        const sexoProva = provaData?.prova?.sexo_prova || provaData?.sexo_prova || 'M';
        const sexoTexto = sexoProva === 'M' ? 'Masculino' : 'Feminino';

        content.push(
            { text: `${nomeProva} - ${sexoTexto}`, style: 'provaHeader', margin: [0, 0, 0, 15] }
        );

        const ehRevezamento = Number(provaData?.prova?.eh_revezamento ?? provaData?.eh_revezamento ?? 0) === 1;

        // Atletas da prova
        const bodyAtletas = [
            [
                { text: ehRevezamento ? 'Equipe' : 'Atleta' },
                { text: 'Categoria', alignment: 'center' },
                { text: 'Tempo', alignment: 'center' },
                { text: 'Δ Record do Nadador', alignment: 'center' },
                { text: 'Δ Melhor Global', alignment: 'center' }
            ]
        ];

        (provaData?.atletas || []).forEach((atleta) => {
            bodyAtletas.push([
                atleta.nadador || '-',
                { text: atleta.categoria || '-', alignment: 'center' },
                formatarCelulaTempo(atleta.tempo_realizado),
                formatarCelulaDiferenca(atleta.diferenca_record_anterior, atleta.diferenca_record_anterior_centesimos),
                formatarCelulaDiferenca(atleta.diferenca_record_geral, atleta.diferenca_record_geral_centesimos)
            ]);
        });

        content.push(
            { text: 'Resultados da Equipe', style: 'subsubheader', margin: [0, 0, 0, 5] },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                    body: bodyAtletas
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            }
        );

        // Resumo da prova
        const resumoProva = provaData?.resumo || {};
        content.push(
            { text: 'Resumo Técnico', style: 'subsubheader', margin: [0, 0, 0, 5] },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto'],
                    body: [
                        ['Métrica', 'Quantidade'],
                        ['Total de nadadores', String(resumoProva?.total_nadadores || 0)],
                        ['Melhoraram o tempo', String(resumoProva?.melhoraram || 0)],
                        ['Pioraram o tempo', String(resumoProva?.pioraram || 0)],
                        ['Mantiveram o tempo', String(resumoProva?.mantiveram || 0)],
                        ['Primeira vez na prova', String(resumoProva?.primeira_vez || 0)]
                    ]
                },
                layout: 'lightHorizontalLines'
            }
        );
    });

    // Resumo geral no final
    if (relatorio?.resumo_geral) {
        content.push(
            { text: '', pageBreak: 'before' },
            { text: 'Resumo Geral do Evento', style: 'subheader', margin: [0, 0, 0, 15] },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto'],
                    body: [
                        ['Métrica', 'Quantidade'],
                        ['Total de nadadores', String(relatorio.resumo_geral.total_nadadores || 0)],
                        ['Melhoraram o tempo', String(relatorio.resumo_geral.melhoraram || 0)],
                        ['Pioraram o tempo', String(relatorio.resumo_geral.pioraram || 0)],
                        ['Mantiveram o tempo', String(relatorio.resumo_geral.mantiveram || 0)],
                        ['Primeira vez na prova', String(relatorio.resumo_geral.primeira_vez || 0)]
                    ]
                },
                layout: 'lightHorizontalLines'
            }
        );
    }

    const docDefinition = {
        pageMargins: [40, 150, 40, 60],
        header: {
            stack: [
                { image: logo, width: 100, alignment: 'center', margin: [0, 10, 0, 10] },
                {
                    text: `Relatório Pós-Prova - ${relatorio?.equipe?.nome || 'Equipe'} - ${anoAtual}`,
                    style: 'header',
                    alignment: 'center'
                }
            ]
        },
        content: content,
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 10, 0, 10] },
            subheader: { fontSize: 14, bold: true },
            provaHeader: { fontSize: 16, bold: true, color: '#0056b3' },
            subsubheader: { fontSize: 12, bold: true }
        }
    };

    const nomeEquipe = relatorio?.equipe?.nome?.replace(/\s+/g, '_') || 'Equipe';
    const nomeEvento = relatorio?.evento?.nome?.replace(/\s+/g, '_') || 'Evento';
    const fileName = `Relatorio_Pos_Prova_${nomeEquipe}_${nomeEvento}_${anoAtual}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
};
