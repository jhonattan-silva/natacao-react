import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

const logo = 'data:image/png;base64,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';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

//***************** */ Função para gerar o PDF de balizamento /******************************* */
export const balizamentoPDF = (dados) => {
  // Formata os dados para exibir no PDF
  const formattedData = Object.keys(dados).map(prova => ({
    nome: prova,
    baterias: dados[prova].map(bateria => (
      bateria.flat().map(nadador => ({
        nome_nadador: nadador.nome_nadador || 'N/D', 
        melhor_tempo: nadador.melhor_tempo || 'N/D', 
        raia: nadador.raia || 'N/D'
      }))
    ))
  }));
  

  // Definição do conteúdo do PDF
  const docDefinition = {
    header:{
        columns:[
            {
                image: logo,
                width: 130,
                margin: [40, 5, 0 , 0],//left, top, right, bottom
            },
        ],
    },
    content: [
      { text: 'Balizamento de Prova', style: 'header' },

      // Mapeia cada prova para exibir o nome e as baterias
      ...formattedData.map((prova, provaIndex) => [
        { text: `Prova: ${prova.nome}`, style: 'subheader', pageBreak: provaIndex === 0 ? undefined : 'before', margin: provaIndex === 0 ? [0, 0, 0, 0] : [0, 50, 0, 0] },

        // Mapeia cada bateria e exibe seu índice
        ...prova.baterias.map((bateria, index) => [
          { text: `Bateria ${index + 1}`, style: 'tableHeader', margin: [0, 10, 0, 5] },

          // Define a tabela com o cabeçalho e linhas para cada nadador
          {
            table: {
              body: [
                ['Nadador', 'Tempo', 'Raia'], // Cabeçalho da tabela

                // Mapeia cada nadador na bateria para preencher as linhas
                ...bateria.map(nadador => [
                  nadador.nome_nadador || 'N/D',   // Nome do nadador
                  nadador.melhor_tempo || 'N/D',   // Melhor tempo
                  nadador.raia || 'N/D'            // Raia
                ])
              ]
            },
            layout: 'lightHorizontalLines' // Layout com linhas horizontais leves
          }
        ])
      ])
    ],

    // Estilos para cabeçalho, subcabeçalho e tabelas
    styles: {
      header: {
        fontSize: 22,
        bold: true,
        margin: [0, 35, 0, 5]
      },
      subheader: {
        fontSize: 18,
        bold: true,
        margin: [0, 5, 0, 5]
      },
      tableHeader: {
        fontSize: 16,
        bold: true
      },
      tableExample: {
        margin: [0, 5, 0, 15]
      }
    }
  };

  // Gera e faz o download do PDF com o nome 'Balizamento.pdf'
  pdfMake.createPdf(docDefinition).download('Balizamento.pdf');
};


/********************************************************************************** */
/************GERAÇÃO DA FILEPETA************************ */
export const gerarFilipetas = (dadosBalizamento) => {
  const nadadoresData = [];

  // Extrai as informações de cada nadador para cada bateria e raia
  Object.keys(dadosBalizamento).forEach((tipoProva) => {
    dadosBalizamento[tipoProva].forEach((bateria, indiceBateria) => {
      bateria.flat().forEach((nadador) => {
        nadadoresData.push({
          tipoProva,
          bateria: indiceBateria + 1,
          raia: nadador.raia || 'N/D',
          nome: nadador.nome_nadador || 'N/D',
          categoria: nadador.categoria || 'N/D',
          equipe: nadador.equipe || 'N/D'
        });
      });
    });
  });

  // Agrupa nadadores para criar páginas com 5 registros por coluna e 2 colunas por página
  const pages = [];
  let currentPage = [];
  let currentColumn = [];

  nadadoresData.forEach((nadador) => {
    const registro = {
      table: {
        widths: ['100%'], // Garante que a tabela ocupe toda a célula
        body: [[
          {
            stack: [
              { image: logo, width: 50, alignment: 'center', margin: [0, 0, 0, 10] },
              { text: `Prova: ${nadador.tipoProva}`, style: 'tableHeader' },
              { text: `Bateria: ${nadador.bateria}`, style: 'tableHeader' },
              { text: `Raia: ${nadador.raia}`, style: 'tableHeader' },
              { text: `Nadador: ${nadador.nome}`, style: 'tableHeader' },
              { text: `Categoria: ${nadador.categoria}`, style: 'tableHeader' },
              { text: `Equipe: ${nadador.equipe}`, style: 'tableHeader' },
              { text: 'TEMPO: ________________', style: 'tableHeader' }
            ],
            margin: [5, 5, 5, 5]
          }
        ]]
      },
      layout: {
        hLineWidth: () => 1, // Define a largura da linha horizontal
        vLineWidth: () => 1, // Define a largura da linha vertical
        hLineColor: () => 'black', // Cor da linha horizontal
        vLineColor: () => 'black'  // Cor da linha vertical
      },
      width: '45%' // Mantém o tamanho adequado para 2 colunas
    };    

    currentColumn.push(registro);

    // Verifica se a coluna atingiu 2 registros
    if (currentColumn.length === 2) {
      currentPage.push({ columnGap: 10, columns: currentColumn });
      currentColumn = [];
    }

    // Verifica se a página atingiu 5 linhas completas
    if (currentPage.length === 5) {
      pages.push({ stack: currentPage, pageBreak: 'after' });
      currentPage = [];
    }
  });

  // Adiciona a última coluna e página, se não estiver vazia
  if (currentColumn.length > 0) currentPage.push({ columnGap: 10, columns: currentColumn });
  if (currentPage.length > 0) pages.push({ stack: currentPage });

  // Definição do conteúdo do PDF
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [10, 10, 10, 10],
    content: pages,
    styles: {
      tableHeader: {
        bold: true,
        fontSize: 8,
        color: 'black',
        margin: [0, 2, 0, 2]
      },
      recordBorder: {
        border: [true, true, true, true], // Ensure borders are applied by default
        margin: [5, 5, 5, 5] // Add margin to separate records
      }
    },
    defaultStyle: {
      border: [true, true, true, true] // Ensure borders are applied by default
    }
  };

  // Gera e baixa o PDF
  pdfMake.createPdf(docDefinition).download('Filipetas_Nadadores.pdf');
};
