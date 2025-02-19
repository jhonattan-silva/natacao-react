import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const relatorioInscritosPDF = (inscritos, inscritosEquipe, inscritosEquipeSexo) => {
	// Tabela por Prova (todos os inscritos)
	const provas = {};
	inscritos.forEach(item => {
		const prova = item.nome_prova ? item.nome_prova.trim() : 'N/D';
		provas[prova] = (provas[prova] || 0) + 1;
	});
	const bodyProva = [['Prova', 'Total de Inscritos']];
	Object.keys(provas).forEach(prova => {
		bodyProva.push([prova, String(provas[prova])]);
	});

	// Construção da tabela "Inscritos por Equipe e por Sexo" usando dados da rota listarInscritosEquipeSexo
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

	// Tabela dos inscritos por equipe (Dados Brutos) permanece inalterada
	const bodyEquipe = [['Equipe', 'Total de Inscritos']];
	if (Array.isArray(inscritosEquipe)) {
		inscritosEquipe.forEach(item => {
			bodyEquipe.push([
				item.equipe ? item.equipe.trim() : 'N/D',
				String(item.total_inscritos)
			]);
		});
	}

	const docDefinition = {
		header: { text: 'Relatório Total de Inscritos', style: 'header' },
		content: [
			// Início do relatório: Inscritos por Prova
			{ text: 'Inscritos por Prova', style: 'subheader', margin: [0, 0, 0, 10] },
			{
				table: {
					headerRows: 1,
					widths: ['*', 'auto'],
					body: bodyProva
				},
				layout: 'lightHorizontalLines'
			},
			// Fim do relatório: Inscritos por Prova
			
			{ text: '\n' },
			
			// Início do relatório: Inscritos por Equipe e por Sexo
			{ text: 'Inscritos por Equipe e por Sexo', style: 'subheader', margin: [0, 20, 0, 10] },
			{
				table: {
					headerRows: 1,
					widths: ['*', 'auto', 'auto', 'auto', 'auto'],
					body: bodyEquipeSexo
				},
				layout: 'lightHorizontalLines'
			},
			// Fim do relatório: Inscritos por Equipe e por Sexo
			
			{ text: '\n' },
			
			// Início do relatório: Inscrições por Equipe (Dados Brutos)
			{ text: 'Inscrições por Equipe (Dados Brutos)', style: 'subheader', margin: [0, 20, 0, 10] },
			{
				table: {
					headerRows: 1,
					widths: ['*', 'auto'],
					body: bodyEquipe
				},
				layout: 'lightHorizontalLines'
			}
			// Fim do relatório: Inscrições por Equipe (Dados Brutos)
		],
		styles: {
			header: {
				fontSize: 18,
				bold: true,
				margin: [0, 10, 0, 10]
			},
			subheader: {
				fontSize: 16,
				bold: true
			}
		}
	};

	pdfMake.createPdf(docDefinition).download('Relatorio_Total_Inscritos.pdf');
};
