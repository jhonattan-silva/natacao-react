import { useState, useEffect } from 'react';
import style from './Balizamento.module.css';
import Botao from '../../componentes/Botao/Botao';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import Tabela from '../../componentes/Tabela/Tabela';
import axios from 'axios';
import { ordenarNadadoresPorTempo, dividirEmBaterias, distribuirNadadoresNasRaias } from '../../servicos/functions'; // Importe as funções
import { balizamentoPDF, gerarFilipetas } from '../../servicos/pdf';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';

const Balizamento = () => {
    const [eventoId, setEventoId] = useState(''); //captura o id do evento
    const [inscritos, setInscritos] = useState([]); //listagem dos inscritos
    const baseUrl = 'http://localhost:5000/api/balizamento';

    const apiEventos = `${baseUrl}/listarEventos`;
    const apiInscritos = `${baseUrl}/listarInscritos`;

    //buscar eventos para a listasuspensa = SELECT
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(apiEventos);
                setEventoId(response.data); // Preenche os eventos para a lista suspensa
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };
        fetchData();
    }, [apiEventos]);

    /* EVENTO DO BOTÃO  - Capturar id do evento*/
    const eventoSelecionado = (id) => {
        setEventoId(id);
    };

    const aoClicar = async () => {
        if (!eventoId) {
            alert("Por favor, selecione um evento.");
            return;
        }
        try { //tendo selecionado um evento...
            const response = await axios.get(`${apiInscritos}/${eventoId}`); //api+idEvento
            const inscritos = response.data; //inscritos recebe os todos os dados retornados
            const nadadoresPorProva = {};

            inscritos.forEach(inscrito => {
                if (!nadadoresPorProva[inscrito.nome_prova]) { //se a prova atual ainda não tem um array
                    nadadoresPorProva[inscrito.nome_prova] = []; //cria o array do balizamento da prova especifica
                }
                nadadoresPorProva[inscrito.nome_prova].push(inscrito); //joga o nadador dentro do array da prova em que ele ta inscrito
            });

            const resultado = {};
            Object.keys(nadadoresPorProva).forEach(prova => {
                const nadadores = nadadoresPorProva[prova];
                const todosNadadores = ordenarNadadoresPorTempo(nadadores); // Rankear nadadores
                const baterias = dividirEmBaterias(todosNadadores); // Dividir em baterias

                resultado[prova] = baterias.map(bateria => distribuirNadadoresNasRaias(bateria)); // Distribuir nas raias
                console.log("Só resultado=>", todosNadadores);
                console.log("Só as baterias=>", baterias);

            });
            setInscritos(resultado);
            balizamentoPDF(resultado);
            gerarFilipetas(resultado);
            console.log('Estrutura de dadosBalizamento:', JSON.stringify(resultado, null, 2));
        } catch (error) {
            console.error('Erro ao buscar inscritos:', error);
        }
    };

    return (
        <>
            <CabecalhoAdmin />
            <div className={style.balizamento}>
                <ListaSuspensa
                    textoPlaceholder="Selecione o Evento"
                    fonteDados={apiEventos}
                    onChange={eventoSelecionado} />
                <Botao onClick={aoClicar}>BALIZAR</Botao>
                {Object.keys(inscritos).map(prova => (
                    <div key={prova}>
                        <h2>{`Balizamento - ${prova}`}</h2>
                        {inscritos[prova].map((bateria, index) => (
                            <div key={index}>
                                <h3>{`Bateria ${index + 1}`}</h3>
                                <Tabela dados={bateria.flat()} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </>
    );
}

export default Balizamento;