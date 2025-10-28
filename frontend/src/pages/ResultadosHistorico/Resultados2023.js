import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';
import Botao from '../../componentes/Botao/Botao';
import Tabela from '../../componentes/Tabela/Tabela';
import Card from '../../componentes/Card/Card';
import style from './ResultadosHistorico.module.css';
import eventos2023 from './2023/eventos2023.json';

const Resultados2023 = () => {
  const navigate = useNavigate();
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [resultadosAgrupados, setResultadosAgrupados] = useState({});
  const [loading, setLoading] = useState(false);

  const handleEventoClick = async (etapaNumero) => {
    setLoading(true);
    try {
      // Carrega dinamicamente apenas o JSON da etapa selecionada - atualizado para nova estrutura
      const dados = await import(`./2023/2023-etapa${etapaNumero}.json`);
      
      // Agrupar por Nado
      const agrupados = dados.default.reduce((acc, resultado) => {
        const nado = resultado.Nado;
        if (!acc[nado]) {
          acc[nado] = [];
        }
        acc[nado].push(resultado);
        return acc;
      }, {});

      setResultadosAgrupados(agrupados);
      setEventoSelecionado(etapaNumero);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar resultados da etapa');
    } finally {
      setLoading(false);
    }
  };

  const voltarParaEventos = () => {
    setEventoSelecionado(null);
    setResultadosAgrupados({});
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  };

  const handleDownload = (arquivo) => {
    // Caminho atualizado para a nova estrutura de pastas
    const downloadPath = `${process.env.PUBLIC_URL}/resultadosHistorico/2023/${arquivo}`;
    
    // Criar link temporário e fazer download
    const link = document.createElement('a');
    link.href = downloadPath;
    link.download = arquivo;
    link.target = '_blank'; // Abre em nova aba se não conseguir baixar
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Cabecalho />
      <div className={style.container}>
        <h1 className={style.titulo}>Resultados 2023</h1>
        
        <Botao 
          onClick={() => navigate('/resultados')}
          className={style.botaoVoltar}
        >
          ← Voltar para Resultados
        </Botao>

        <div className={style.conteudo}>
          {loading ? (
            <p className={style.loadingMessage}>Carregando resultados...</p>
          ) : !eventoSelecionado ? (
            <div className={style.eventosContainer}>
              <h2 className={style.subtitulo}>Selecione uma etapa:</h2>
              <div className={style.cardsContainer}>
                {eventos2023.map(evento => (
                  <Card
                    key={evento.id}
                    className={style.eventoCard}
                    nome={evento.nome}
                    data={`Data: ${formatarData(evento.data)}`}
                    local={`Sede: ${evento.sede}`}
                    cidade={`Cidade: ${evento.cidade}`}
                    onClick={() => handleEventoClick(evento.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className={style.headerResultados}>
                <Botao 
                  onClick={voltarParaEventos}
                  className={style.botaoVoltar}
                >
                  ← Voltar para Etapas
                </Botao>
                
                <h2 className={style.subtitulo}>
                  {eventos2023.find(e => e.id === eventoSelecionado)?.nome}
                </h2>

                <Botao
                  onClick={() => handleDownload(eventos2023.find(e => e.id === eventoSelecionado)?.arquivo)}
                  className={style.botaoDownload}
                >
                  📥 Baixar Resulttado Completo
                </Botao>
              </div>
              
              {Object.keys(resultadosAgrupados).length > 0 ? (
                Object.entries(resultadosAgrupados)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([nado, resultados]) => (
                    <div key={nado} className={style.provaContainer}>
                      <h2 className={style.tituloProva}>{nado}</h2>
                      <Tabela
                        dados={resultados.map((r, index) => ({
                          Posição: index + 1,
                          Nome: r.Nome,
                          Categoria: r.Categoria,
                          Equipe: r.Equipe,
                          Tempo: r.Tempo,
                          Pontuação: r['Pontuação Absoluta']
                        }))}
                        textoExibicao={{
                          Posição: 'Posição',
                          Nome: 'Nome',
                          Categoria: 'Categoria',
                          Equipe: 'Equipe',
                          Tempo: 'Tempo',
                          Pontuação: 'Pontuação'
                        }}
                        colunasOcultas={[]}
                      />
                    </div>
                  ))
              ) : (
                <p>Nenhum resultado encontrado para esta etapa.</p>
              )}
            </>
          )}
        </div>
      </div>
      <Rodape />
    </>
  );
};

export default Resultados2023;
