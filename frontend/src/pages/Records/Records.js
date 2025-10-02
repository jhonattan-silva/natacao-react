import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../servicos/api';
import style from './Records.module.css';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';
import ButtonWall from '../../componentes/ButtonWall/ButtonWall';
import Tabela from '../../componentes/Tabela/Tabela';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';

const Records = () => {
    const navigate = useNavigate();
    const [anoSelecionado, setAnoSelecionado] = useState(2025);
    const [provas, setProvas] = useState({});
    const [categorias, setCategorias] = useState([]);
    const [nadadores, setNadadores] = useState([]);
    const [provaSelecionada, setProvaSelecionada] = useState(null);
    const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
    const [sexoSelecionado, setSexoSelecionado] = useState(null); 
    const [avisoSexo, setAvisoSexo] = useState(''); // Estado para armazenar o aviso dinâmico

    const isMobile = window.innerWidth <= 768;

    useEffect(() => {
        // Fetch inicial para carregar provas e categorias
        const fetchFiltros = async () => {
            try {
                const response = await api.get(`/records/filtros?ano=${anoSelecionado}`);
                setProvas(response.data.provas);
                setCategorias(response.data.categorias);
            } catch (error) {
                console.error('Erro ao buscar filtros:', error);
            }
        };
        fetchFiltros();
    }, [anoSelecionado]);

    useEffect(() => {
        // Atualiza os nadadores sempre que uma prova ou categoria é selecionada
        const fetchNadadores = async () => {
            try {
                const response = await api.get(`/records?ano=${anoSelecionado}&prova=${provaSelecionada}&categoria=${categoriaSelecionada}`);
                setNadadores(response.data);
            } catch (error) {
                console.error('Erro ao buscar nadadores:', error);
            }
        };

        if (provaSelecionada || categoriaSelecionada) {
            fetchNadadores();
        }
    }, [anoSelecionado, provaSelecionada, categoriaSelecionada]);

    const handleProvaSelecionada = (id, sexo) => {
        if (sexoSelecionado && sexoSelecionado !== sexo) {
            setAvisoSexo(`Você selecionou uma prova do sexo ${sexoSelecionado === 'M' ? 'MASCULINO' : 'FEMININO'}. A seleção do sexo ${sexo === 'M' ? 'MASCULINO' : 'FEMININO'} será ignorada.`);
        } else {
            setAvisoSexo(''); // Limpa o aviso se não houver conflito
        }
        setSexoSelecionado(sexo); // Atualiza o sexo selecionado
        setProvaSelecionada(id); // Atualiza a prova selecionada
    };

    const getH3Class = (sexo) => {
        if (!sexoSelecionado) return ''; // Nenhuma seleção ainda
        return sexoSelecionado === sexo ? style.ativo : `${style.inativo} ${style.ignorado}`;
    };

    const getListaSuspensaClass = (sexo) => {
        if (!sexoSelecionado) return ''; // Nenhuma seleção ainda
        return sexoSelecionado === sexo ? style.listaAtiva : `${style.listaInativa} ${style.listaIgnorada}`;
    };

    return (
        <>
            <Cabecalho />
            <div className={style.recordsContainer}>
                <aside className={style.filtros}>
                    <h2>Filtros</h2>
                    <div>
                        <h3>Ano</h3>
                        {isMobile ? (
                            <ListaSuspensa
                                opcoes={[{ id: 2025, nome: '2025' }]}
                                onChange={(id) => setAnoSelecionado(id)}
                                textoPlaceholder="Selecione o ano"
                                valorSelecionado={anoSelecionado}
                            />
                        ) : (
                            <ButtonWall
                                itens={[{ id: 2025, nome: '2025' }]}
                                onClick={(id) => setAnoSelecionado(id)}
                                selecionado={anoSelecionado}
                            />
                        )}
                    </div>
                    {Object.keys(provas).map(sexo => (
                        <div key={sexo}>
                            <h3 className={getH3Class(sexo)}>
                                Provas - {sexo === 'M' ? 'Masculino' : sexo === 'F' ? 'Feminino' : 'Outro'}
                            </h3>
                            {isMobile ? (
                                <ListaSuspensa
                                    className={getListaSuspensaClass(sexo)} // Aplica a classe dinâmica
                                    opcoes={provas[sexo]}
                                    onChange={(id) => handleProvaSelecionada(id, sexo)}
                                    textoPlaceholder="Selecione a prova"
                                    valorSelecionado={provaSelecionada}
                                />
                            ) : (
                                <ButtonWall
                                    itens={provas[sexo]}
                                    onClick={(id) => handleProvaSelecionada(id, sexo)}
                                    selecionado={provaSelecionada}
                                />
                            )}
                        </div>
                    ))}
                    {avisoSexo && (
                        <p className={style.avisoSexo}>{avisoSexo}</p> // Exibe o aviso dinâmico
                    )}
                    <div>
                        <h3>Categorias</h3>
                        {isMobile ? (
                            <ListaSuspensa
                                opcoes={[{ id: '*', nome: 'Absoluto' }, ...categorias]}
                                onChange={(id) => setCategoriaSelecionada(id)}
                                textoPlaceholder="Selecione a categoria"
                                valorSelecionado={categoriaSelecionada}
                            />
                        ) : (
                            <ButtonWall
                                itens={[{ id: '*', nome: 'Absoluto' }, ...categorias]}
                                onClick={(id) => setCategoriaSelecionada(id)}
                                selecionado={categoriaSelecionada}
                            />
                        )}
                    </div>
                </aside>
                <main className={style.resultados}>
                    <h2>Nadadores</h2>
                    {nadadores.length > 0 ? (
                        <Tabela
                            dados={nadadores.map((nadador, index) => ({
                                Colocação: index + 1,
                                Nome: nadador.nome_nadador,
                                Categoria: nadador.categoria || '-',
                                Equipe: nadador.equipe || '-',
                                Tempo: nadador.tempo
                            }))}
                            textoExibicao={{
                                Colocação: 'Colocação',
                                Nome: 'Nome',
                                Categoria: 'Categoria',
                                Equipe: 'Equipe',
                                Tempo: 'Tempo'
                            }}
                        />
                    ) : (
                        <p>Nenhum nadador encontrado.</p>
                    )}
                </main>
            </div>
            <Rodape />
        </>
    );
};

export default Records;