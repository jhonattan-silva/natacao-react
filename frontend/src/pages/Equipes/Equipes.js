import React, { useState, useEffect } from 'react';
import api from '../../servicos/api';
import Botao from '../../componentes/Botao/Botao';
import style from './Equipes.module.css';
import TabelaEdicao from '../../componentes/TabelaEdicao/TabelaEdicao';
import Formulario from '../../componentes/Formulario/Formulario';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import stylesBotao from '../../componentes/Botao/Botao.module.css';
import Busca from '../../componentes/Busca/Busca';

const Equipes = () => {
  const [equipes, setEquipes] = useState([]);
  const [formVisivel, setFormVisivel] = useState(false); // Controla visibilidade do form de cadastro
  const apiListaEquipes = `equipes/listarEquipes`;
  const apiCadastraEquipe = `equipes/cadastrarEquipe`;
  const apiListaTreinadores = `equipes/listarTreinadores`;
  const apiInativarEquipe = `equipes/inativarEquipe`;

  const [nomeEquipe, setNomeEquipe] = useState(''); // Para input de nome
  const [cidadeEquipe, setCidadeEquipe] = useState(''); // Para input de cidade
  const [treinadorEquipe, setTreinadorEquipe] = useState(''); // Para o treinador escolhido
  const [listaTreinadores, setListaTreinadores] = useState([]); // Para listar os treinadores
  const [busca, setBusca] = useState('');
  const [logoEquipe, setLogoEquipe] = useState(''); // Para o logo da equipe
  const [logoPreview, setLogoPreview] = useState(''); // Para preview da imagem
  const backendOrigin = process.env.REACT_APP_API_URL.replace('/api', '');

  useEffect(() => { // Busca as equipes e treinadores ao carregar a página
    const fetchData = async () => {
      try {
        const response = await api.get(`${apiListaEquipes}`);
        // Mapeia Ativo para ativo para garantir consistência
        const equipesTratadas = response.data.map(e => ({
          ...e,
          ativo: e.ativo !== undefined ? e.ativo : (e.Ativo !== undefined ? e.Ativo : 1)
        }));
        setEquipes(equipesTratadas);

        const responseTreinadores = await api.get(`${apiListaTreinadores}`);
        setListaTreinadores(responseTreinadores.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };
    fetchData();
  }, []);

  const handleEdit = async (id) => {
    try {
      const equipe = equipes.find(equipe => equipe.id === id);
            
      if (!equipe) {
          throw new Error('Equipe não encontrada.');
      }

      // Preenche os campos do formulário com os dados da equipe
      setNomeEquipe(equipe.Equipe);
      setCidadeEquipe(equipe.Cidade);
      setLogoEquipe(equipe.logo || '');
      setLogoPreview(equipe.logo ? `${backendOrigin}${equipe.logo}` : '');

      // Busca o treinador da equipe pelo nome
      const treinador = listaTreinadores.find(treinador => treinador.nome === equipe.Treinador);
      setTreinadorEquipe(treinador ? treinador.id : null); // Define o ID do treinador
      
      // Ativa o formulário em modo de edição
      setEditTeamId(id);
      setIsEditing(true);
      setTimeout(() => setFormVisivel(true), 0); // Abre o formulário após o estado ser atualizado

    } catch (error) {
      console.error('Erro ao editar equipe:', error);
    }
  };

  const [editTeamId, setEditTeamId] = useState(null); // Armazena o ID da equipe em edição
  const [isEditing, setIsEditing] = useState(false); // Controla o modo de edição

  const fecharFormulario = () => {
    limparFormulario();
    setFormVisivel(false);
  };

  const limparFormulario = () => {
    setNomeEquipe('');
    setCidadeEquipe('');
    setTreinadorEquipe('');
    setLogoEquipe('');
    setLogoPreview('');
    setFormVisivel(false);
  };

  const handleInativar = async (id, ativo) => {
    try {
      const novoStatus = ativo ? 0 : 1;
      await api.put(`${apiInativarEquipe}/${id}`, { ativo: novoStatus });
      setEquipes(prevEquipes =>
        prevEquipes.map(equipe =>
          equipe.id === id ? { ...equipe, ativo: novoStatus } : equipe
        )
      );
      alert(`Equipe ${ativo ? 'inativada' : 'ativada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao inativar/ativar equipe:', error);
      alert('Erro ao inativar/ativar equipe. Verifique os logs.');
    }
  };

  const handleAdicionar = () => {
    setFormVisivel(true);
  };

  const treinadorSelecionado = (id) => {
    setTreinadorEquipe(id);
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('imagem', file);

    try {
      const response = await api.post('/upload/equipe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLogoEquipe(response.data.url);
      setLogoPreview(`${backendOrigin}${response.data.url}`);
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      alert('Erro ao fazer upload da imagem.');
    }
  };

  const removeLogo = () => {
    setLogoEquipe('');
    setLogoPreview('');
  };


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

  const aoSalvar = async (evento) => {
    evento.preventDefault();

    // Validações
    if (!nomeEquipe || !cidadeEquipe) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return; // Interrompe o processo de salvamento se houver campos vazios
    }

    const equipeDados = {
      nome: nomeEquipe,
      cidade: cidadeEquipe,
      treinadorId: treinadorEquipe ? treinadorEquipe : null,
      logo: logoEquipe || null
    };

    try {
      if (isEditing) {
        // Edita a equipe
        await api.put(`equipes/atualizarEquipe/${editTeamId}`, equipeDados);
        alert('Equipe atualizada com sucesso!');
      } else {
        // Cria uma nova equipe
        await api.post(apiCadastraEquipe, equipeDados);
        alert('Equipe cadastrada com sucesso!');
      }

      const response = await api.get(`${apiListaEquipes}`);
      setEquipes(response.data);
      limparFormulario(); // Reseta o formulário
    } catch (error) {
      console.error('Erro ao salvar a equipe:', error);
      alert('Erro ao salvar a equipe. Verifique os logs.');
    }
  };

  // Filtra equipes pelo nome digitado na busca
  const equipesFiltradas = equipes.filter(equipe =>
    equipe.Equipe?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <CabecalhoAdmin />
      <div className={style.equipesPage}>
        <h1>EQUIPES</h1>
        <div className={style.centralizarBotao}>
          <Busca valor={busca} aoAlterar={setBusca} placeholder="Buscar equipe pelo nome..." />
        </div>
        {!formVisivel && (
          <>
            <TabelaEdicao
              dados={equipesFiltradas}
              onEdit={handleEdit}
              colunasOcultas={['id', 'Ativo', 'logo']}
              funcExtra={(equipe) => (
                <Botao onClick={() => handleInativar(equipe.id, equipe.ativo)}>
                  {equipe.ativo ? 'Inativar' : 'Ativar'}
                </Botao>
              )}
              renderLinha={(equipe) => ({
                style: { backgroundColor: equipe.ativo === 0 ? '#f44336' : 'transparent' }
              })}
            />
            <div className={style.centralizarBotao}>
              <Botao className={stylesBotao.botao} onClick={handleAdicionar}>Adicionar Nova Equipe</Botao>
            </div>
          </>
        )}
        {formVisivel && (
          <div className={style.formularioContainer}>
            <div>
              <Formulario inputs={inputs} aoSalvar={aoSalvar} />
              <div className={style.treinadorContainer}>
                <label className={style.treinadorLabel}>Treinador Responsável:</label>
                <ListaSuspensa
                  textoPlaceholder={"Escolha o treinador"}
                  fonteDados={apiListaTreinadores}
                  valorSelecionado={treinadorEquipe} // ID do treinador
                  onChange={treinadorSelecionado}
                />
              </div>
              <div className={style.logoUploadContainer}>
                <label htmlFor="logo-upload" className={style.logoLabel}>Logo da Equipe:</label>
                <input 
                  type="file" 
                  id="logo-upload" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                  className={style.fileInput}
                />
                {logoPreview && (
                  <div className={style.logoPreview}>
                    <img src={logoPreview} alt="Logo preview" className={style.previewImage} />
                    <button type="button" onClick={removeLogo} className={style.removeButton}>Remover</button>
                  </div>
                )}
              </div>
              <div className={style['button-group']}>
                <Botao onClick={aoSalvar}>
                  {isEditing ? 'Atualizar' : 'Cadastrar'}
                </Botao>
                <Botao onClick={fecharFormulario}>
                  Voltar
                </Botao>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Equipes;
