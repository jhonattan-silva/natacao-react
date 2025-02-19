import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const relatorioInscritosPDF = (inscritos, inscritosEquipe) => {
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

  // Nova tabela: Inscritos por Equipe e por Sexo (colunas solicitadas)
  const equipeData = {};
  inscritos.forEach(item => {
    const equipe = item.equipe ? item.equipe.trim() : 'N/D';
    if (!equipeData[equipe]) {
      equipeData[equipe] = { masculino: 0, feminino: 0, total: 0, revezamento: 0 };
    }
    // Identifica o sexo. Tenta item.sexo; se ausente, tenta derivar de nome_prova
    let sexo = item.sexo ? item.sexo.trim().toLowerCase() : '';
    if (!sexo) {
      const nomeProva = item.nome_prova ? item.nome_prova.trim().toLowerCase() : '';
      if (nomeProva.includes('individual m')) {
        sexo = 'm';
      } else if (nomeProva.includes('individual f')) {
        sexo = 'f';
      }
    }
    if (sexo === 'm' || sexo === 'masculino') {
      equipeData[equipe].masculino++;
    } else if (sexo === 'f' || sexo === 'feminino') {
      equipeData[equipe].feminino++;
    }
    equipeData[equipe].total++;
    // Incrementa revezamentos se a prova conter a palavra "revezamento"
    if (item.nome_prova && item.nome_prova.trim().toLowerCase().includes('revezamento')) {
      equipeData[equipe].revezamento++;
    }
  });
  const bodyEquipeSexo = [['Equipe', 'Atletas Masculinos', 'Atletas Femininas', 'Total Atletas', 'Revezamentos']];
  Object.keys(equipeData).forEach(equipe => {
    const data = equipeData[equipe];
    bodyEquipeSexo.push([
      equipe,
      String(data.masculino),
      String(data.feminino),
      String(data.total),
      String(data.revezamento)
    ]);
  });

  // Tabela dos inscritos por equipe (já existente, usando dados da rota listarInscritosEquipe)
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
      { text: 'Inscritos por Prova', style: 'subheader', margin: [0, 0, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto'],
          body: bodyProva
        },
        layout: 'lightHorizontalLines'
      },
      { text: '\n' },
      { text: 'Inscritos por Equipe e por Sexo', style: 'subheader', margin: [0, 20, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: bodyEquipeSexo
        },
        layout: 'lightHorizontalLines'
      },
      { text: '\n' },
      { text: 'Inscrições por Equipe (Dados Brutos)', style: 'subheader', margin: [0, 20, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto'],
          body: bodyEquipe
        },
        layout: 'lightHorizontalLines'
      }
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
