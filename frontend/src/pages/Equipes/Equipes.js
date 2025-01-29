import React, { useState, useEffect } from 'react';
import api from '../../servicos/api';
import Botao from '../../componentes/Botao/Botao';
import style from './Equipes.module.css';
import TabelaEdicao from '../../componentes/TabelaEdicao/TabelaEdicao';
import Formulario from '../../componentes/Formulario/Formulario';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';

const Equipes = () => {
  const [equipes, setEquipes] = useState([]);
  const [formVisivel, setFormVisivel] = useState(false); // Controla visibilidade do form de cadastro
  const apiListaEquipes = "equipes/listarEquipes";
  const apiCadastraEquipe = `equipes/cadastrarEquipe`;
  const apiListaTreinadores = `equipes/listarTreinadores`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`${apiListaEquipes}`);
        setEquipes(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };
    fetchData();
  }, []);

  const handleEdit = (id) => {
    console.log(`Editando equipe com ID: ${id}`);
    // Lógica de edição aqui
  };

  const handleInativar = (id) => {
    console.log(`Inativando equipe com ID: ${id}`);
    // Lógica de inativação aqui
  };

  const handleAdicionar = () => {
    setFormVisivel(true);
  };

  const treinadorSelecionado = (id) => {
    setTreinadorEquipe(id);
  };

  const adicionarEquipe = async (dados) => {
    try {
      const response = await api.post(apiCadastraEquipe, dados);
      setEquipes([...equipes, response.data]);
      setFormVisivel(false);
    } catch (error) {
      console.error('Erro ao cadastrar equipe:', error);
    }
  };

  const [nomeEquipe, setNomeEquipe] = useState(''); // Para input de nome
  const [cidadeEquipe, setCidadeEquipe] = useState(''); // Para input de cidade
  const [treinadorEquipe, setTreinadorEquipe] = useState(''); // Para o treinador escolhido
  const [listaTreinadores, setListaTreinadores] = useState([]); // Para listar os treinadores

  useEffect(() => {
    const fetchTreinadores = async () => {
      try {
        const response = await api.get(`${apiListaTreinadores}`);
        setListaTreinadores(response.data);
      } catch (error) {
        console.error('Erro ao buscar treinadores:', error);
      }
    };
    fetchTreinadores();
  }, []);

  const inputs = [
    {
      obrigatorio: true,
      label: "Nome da Equipe",
      placeholder: "Digite o nome da equipe",
      valor: nomeEquipe,
      aoAlterar: setNomeEquipe
    },
    {
      obrigatorio: true,
      label: "Cidade",
      placeholder: "Digite a cidade da equipe",
      valor: cidadeEquipe,
      aoAlterar: setCidadeEquipe
    }
  ];

  const aoSalvar = (evento) => {
    evento.preventDefault();
    adicionarEquipe({ nome: nomeEquipe, cidade: cidadeEquipe, treinadorId: treinadorEquipe });
  };

  return (
    <>
    <CabecalhoAdmin/>
      <div className={style.equipesPage}>
        <h2>EQUIPES</h2>
        <TabelaEdicao dados={equipes} onEdit={handleEdit} onInativar={handleInativar} />
        <Botao onClick={handleAdicionar}>Adicionar Nova Equipe</Botao>
        {formVisivel && (
          <div>
            <Formulario inputs={inputs} aoSalvar={aoSalvar} />
            <ListaSuspensa
              textoPlaceholder={"Escolha o treinador"}
              fonteDados={apiListaTreinadores}
              onChange={treinadorSelecionado}
            />
            <Botao onClick={aoSalvar}>SALVAR</Botao>
          </div>
        )}
      </div>
    </>
  );
};

export default Equipes;
