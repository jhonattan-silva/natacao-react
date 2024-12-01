import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import Formulario from '../../componentes/Formulario/Formulario';
import { useEffect, useMemo, useState } from 'react';
import style from './ResultadosEntrada.style.css';
import api from '../../servicos/api';
import Botao from '../../componentes/Botao/Botao';

const ResultadosEntrada = () => {
    const [eventos, setEventos] = useState();//recebe todos eventos pela api
    const [eventoId, setEventoId] = useState(); //recebe o evento escolhido
    const [provas, setProvas] = useState(); //recebe todas provas pela api
    const [provaId, setProvaId] = useState(); //estado da prova selecionada
    const [baterias, setBaterias] = useState({}); //recebe as baterias de cada prova
    const [erro, setErro] = useState(null); //estado para erros

    const apiEventos = '/resultadosEntrada/listarEventos';
    const apiProvasEvento = '/resultadosEntrada/listarProvasEvento';
    const apiBateriasProva = '/resultadosEntrada/listarBateriasProva';

    // URL dinâmica para buscar provas
    //useMemo cria a URL de forma eficiente, recalculando-a apenas quando o eventoId mudar.
    //Isso evita problemas de renderização desnecessária.
    const urlProvasEvento = useMemo(() => {
        return eventoId ? `${apiProvasEvento}/${eventoId}` : null; // Somente define a URL quando há um evento selecionado
    }, [eventoId]);

    //Listar os eventos
    useEffect(() => {
        const fetchEventos = async () => {
            try {
                const response = await api.get(apiEventos);
                if (Array.isArray(response.data)) { //verificação se a resposta está no formato desejado
                    setEventos(response.data[0]?.id || ''); //recebe o campo id da resposta da api
                    setErro(null);
                } else {
                    console.error('ERRO: A resposta dos eventos não é array');
                    setErro('Erro nos dados do banco');
                }
            } catch (err) {
                console.error('Erro ao buscar eventos');
                setErro('Erro ao buscar os eventos', err.message);
            }
        };
        fetchEventos();
    }, []);

    //Listar as Provas do evento escolhido acima
    useEffect(() => {
        if (!eventoId) return; // Não busca provas sem um evento selecionado

        const fetchProvas = async () => {
            try {
                const response = await api.get(urlProvasEvento);

                // Validação com base na estrutura da resposta
                if (Array.isArray(response.data)) {
                    setProvas(response.data); // Atualiza o estado com o array completo
                    setErro(null); // Nenhum erro
                } else {
                    console.error('ERRO: A resposta das provas não é array', response.data);
                    setErro('Erro nos dados vindos do banco');
                }
            } catch (err) {
                console.error('Erro ao buscar provas:', err.message);
                setErro(`Erro ao buscar provas: ${err.message}`);
            }
        };

        fetchProvas();
    }, [eventoId]);     //para recarregar toda vez que mudar o ID DO EVENTO

    useEffect(() => {
        if (!provaId) return; //se não tiver escolhido a prova ainda

        const fetchBaterias = async () => {
            try {
                const urlBateriasEvento = `${apiBateriasProva}/${provaId}`;
                console.log("Buscando baterias da prova", urlBateriasEvento);
                const response = await api.get(urlBateriasEvento);

                if (Array.isArray(response.data)) {
                    setBaterias(response.data);
                    setErro(null);
                } else {
                    console.error("ERRO: A resposta da bateria não é array");
                    setErro("Erro na busca das baterias no banco !Array");
                }
            } catch (err) {
                console.error("Erro ao buscar baterias, mesmo sendo array", err);
                setErro("Erro na busca das baterias no banco Array");
            }
        };
        fetchBaterias();
    }, [provaId]);
    /*
        const inputs = [
            {
                obrigatorio: true,
                label: "Nome",
                placeholder: "Digite o nome",
                valor: nomeNadador,
                aoAlterar: setNomeNadador
            },
        ]
    */
        const aoSalvar = async (evento) => {
            evento.preventDefault();
 
            alert('Resultado salvo com sucesso!');
        };
    

        
    return (
        <div className={style.resultadosEntrada}>
            <div className={style.opcoesContainer}>
                <ListaSuspensa
                    fonteDados={apiEventos}
                    textoPlaceholder="Escolha o evento"
                    onChange={setEventoId}
                    obrigatorio={true}
                />
                {eventoId && ( //se já selecionou o evento
                    <ListaSuspensa
                        fonteDados={urlProvasEvento}
                        textoPlaceholder="Escolha a prova disputada"
                        onChange={setProvaId}
                    />)}
            </div>
            <div className={style.listagemContainer}>
                {baterias.length > 0 && (
                    <section>
                        <h1>Prova: {baterias[0]?.nomeProva}</h1> {/* Nome da prova */}
                        {baterias.map((bateria) => (
                            <div key={bateria.numeroBateria}>
                                <h2>Bateria {bateria.numeroBateria}</h2>
                                <Formulario
                                    inputs={bateria.nadadores.map((nadador) => ({
                                        id: nadador.id,
                                        label: nadador.nome,
                                        tipo: 'text',
                                        placeholder: 'Digite o tempo realizado',
                                        valor: nadador.tempo || '', // Valor inicial do tempo
                                        obrigatorio: true,
                                        aoAlterar: (novoTempo) => {
                                            // Atualiza o tempo no estado
                                            setBaterias((prev) =>
                                                prev.map((b) =>
                                                    b.numeroBateria === bateria.numeroBateria
                                                        ? {
                                                            ...b,
                                                            nadadores: b.nadadores.map((n) =>
                                                                n.id === nadador.id
                                                                    ? { ...n, tempo: novoTempo }
                                                                    : n
                                                            ),
                                                        }
                                                        : b
                                                )
                                            );
                                        },
                                    }))}
                                    aoSalvar={(e) => {
                                        e.preventDefault();
                                        console.log('Salvando dados da bateria:', bateria.nadadores);
                                    }}
                                />
                            </div>
                        ))}
                    </section>
                )}
                <Botao onClick={aoSalvar} classBtn={style.btnSalvar} />
            </div>
        </div>
    );
}
export default ResultadosEntrada;