import React, { useState, useEffect } from 'react';
import api from '../../servicos/api';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import Botao from '../../componentes/Botao/Botao';
import useAlerta from '../../hooks/useAlerta';
import style from './SuperAdmin.module.css';

const SuperAdmin = () => {
    const { mostrar: mostrarAlerta, componente: AlertaComponente } = useAlerta();
    const [regulamento, setRegulamento] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [masterUsers, setMasterUsers] = useState([]);
    const [loadingMasters, setLoadingMasters] = useState(false);
    const [loadingCategorias, setLoadingCategorias] = useState(false);

    // Buscar lista de usuários master e regulamento ao carregar a página
    useEffect(() => {
        fetchMasterUsers();
        fetchRegulamento();
    }, []);

    const fetchMasterUsers = async () => {
        try {
            setLoadingMasters(true);
            const response = await api.get('/usuarios/listarUsuarios');
            // Filtrar apenas usuários com perfil master
            const masters = response.data.filter(user => 
                user.perfis && user.perfis.toLowerCase().includes('master')
            );
            setMasterUsers(masters);
        } catch (error) {
            console.error('Erro ao buscar usuários master:', error);
            mostrarAlerta('Erro ao buscar usuários master');
        } finally {
            setLoadingMasters(false);
        }
    };

    const fetchRegulamento = async () => {
        try {
            const response = await api.get('/upload/regulamento');
            setRegulamento(response.data.url);
        } catch (error) {
            setRegulamento(null);
        }
    };

    // Manipular seleção de arquivo
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
        } else {
            mostrarAlerta('Por favor, selecione um arquivo PDF válido');
        }
    };

    // Upload de regulamento
    const handleUploadRegulamento = async (e) => {
        e.preventDefault();
        
        if (!file) {
            mostrarAlerta('Selecione um arquivo PDF para fazer o upload');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/upload/regulamento', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            mostrarAlerta('Regulamento enviado com sucesso!');
            setFile(null);
            setRegulamento(response.data.url);
            
            // Resetar input de arquivo
            document.getElementById('fileInput').value = '';
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            mostrarAlerta(error.response?.data?.message || 'Erro ao fazer upload do regulamento');
        } finally {
            setLoading(false);
        }
    };

    // Deletar regulamento
    const handleDeleteRegulamento = async () => {
        try {
            setLoading(true);
            await api.delete('/upload/regulamento');
            mostrarAlerta('Regulamento deletado com sucesso!');
            setRegulamento(null);
        } catch (error) {
            console.error('Erro ao deletar regulamento:', error);
            mostrarAlerta('Erro ao deletar regulamento');
        } finally {
            setLoading(false);
        }
    };

    // Inativar usuário master
    const handleInativarMaster = async (userId, ativo) => {
        try {
            const novoStatus = ativo ? 0 : 1;
            await api.put(`/usuarios/inativarUsuario/${userId}`, { ativo: novoStatus });
            mostrarAlerta(`Usuário master ${ativo ? 'inativado' : 'ativado'} com sucesso!`);
            fetchMasterUsers(); // Atualizar lista
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            mostrarAlerta('Erro ao atualizar status do usuário');
        }
    };

    // Recalcular categorias de todos os nadadores
    const handleRecalcularCategorias = async () => {
        const confirmar = window.confirm(
            'Tem certeza que deseja recalcular as categorias de TODOS os nadadores?\n\nEsta ação atualizará as categorias conforme as datas de nascimento e a data atual.'
        );

        if (!confirmar) return;

        try {
            setLoadingCategorias(true);
            const response = await api.post('/nadadores/recalcularCategorias');
            mostrarAlerta(
                `✅ Categorias recalculadas com sucesso!\n\n` +
                `Total de nadadores: ${response.data.total}\n` +
                `Atualizados: ${response.data.atualizados}\n` +
                `Erros: ${response.data.erros}`
            );
        } catch (error) {
            console.error('Erro ao recalcular categorias:', error);
            mostrarAlerta('Erro ao recalcular categorias. Verifique os logs.');
        } finally {
            setLoadingCategorias(false);
        }
    };

    return (
        <>
            <CabecalhoAdmin />
            {AlertaComponente}
            <div className={style.superAdminContainer}>
                <h1>🦸 Configurações Globais (Super Admin)</h1>
                <p className={style.subtitle}>Página exclusiva para usuários master - Configure as definições globais da plataforma</p>

                <div className={style.sectionsContainer}>
                    {/* Seção de Regulamento */}
                    <section className={style.section}>
                        <h2>📄 Regulamento da Liga</h2>
                        <div className={style.sectionContent}>
                            <p>Envie o PDF do regulamento atual da Liga Paulista de Natação</p>
                            
                            <div className={style.uploadArea}>
                                <form onSubmit={handleUploadRegulamento}>
                                    <input 
                                        id="fileInput"
                                        type="file" 
                                        accept=".pdf" 
                                        onChange={handleFileChange}
                                        disabled={loading}
                                        className={style.fileInput}
                                    />
                                    <label className={style.fileLabel} htmlFor="fileInput">
                                        {file ? `📁 ${file.name}` : '📂 Clique para selecionar um PDF'}
                                    </label>
                                    <Botao 
                                        onClick={handleUploadRegulamento} 
                                        disabled={!file || loading}
                                    >
                                        {loading ? '⏳ Enviando...' : '⬆️ Upload'}
                                    </Botao>
                                </form>
                            </div>

                            {regulamento && (
                                <div className={style.currentFile}>
                                    <p>✅ <strong>Regulamento atual:</strong></p>
                                    <a 
                                        href={`${process.env.REACT_APP_API_URL.replace('/api', '')}${regulamento}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        download="LPN_Regulamento.pdf"
                                    >
                                        📥 Baixar Regulamento
                                    </a>
                                    <Botao 
                                        onClick={handleDeleteRegulamento}
                                        disabled={loading}
                                        style={{ backgroundColor: '#f44336', marginTop: '1rem' }}
                                    >
                                        🗑️ Deletar Regulamento
                                    </Botao>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Seção de Usuários Master */}
                    <section className={style.section}>
                        <h2>👑 Usuários Master</h2>
                        <div className={style.sectionContent}>
                            <p>Gerenciar todos os usuários com acesso master</p>
                            
                            {loadingMasters ? (
                                <p>Carregando...</p>
                            ) : masterUsers.length > 0 ? (
                                <div className={style.mastersList}>
                                    {masterUsers.map(user => (
                                        <div key={user.id} className={`${style.masterCard} ${user.ativo === 0 ? style.inactive : ''}`}>
                                            <div className={style.masterInfo}>
                                                <h3>{user.nome}</h3>
                                                <p><strong>Email:</strong> {user.email}</p>
                                                <p><strong>CPF:</strong> {user.cpf}</p>
                                                <p><strong>Perfis:</strong> {user.perfis}</p>
                                                <p className={style.status}>
                                                    Status: <span className={user.ativo ? style.active : style.inactive}>
                                                        {user.ativo ? '✅ Ativo' : '❌ Inativo'}
                                                    </span>
                                                </p>
                                            </div>
                                            <Botao 
                                                onClick={() => handleInativarMaster(user.id, user.ativo)}
                                                style={{ 
                                                    backgroundColor: user.ativo ? '#f44336' : '#4CAF50',
                                                    marginTop: '0.5rem'
                                                }}
                                            >
                                                {user.ativo ? '🔴 Inativar' : '🟢 Ativar'}
                                            </Botao>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Nenhum usuário master encontrado</p>
                            )}
                        </div>
                    </section>

                    {/* Seção de Configurações do Sistema */}
                    <section className={style.section}>
                        <h2>⚙️ Configurações do Sistema</h2>
                        <div className={style.sectionContent}>
                            <p>Operações de manutenção e sincronização de dados</p>
                            
                            <div className={style.configSection}>
                                <h3>🎯 Recalcular Categorias dos Nadadores</h3>
                                <p>
                                    Esta ação recalculará automaticamente as categorias de <strong>TODOS os nadadores</strong> 
                                    conforme suas datas de nascimento e a data atual.
                                </p>
                                <p style={{ color: '#666', fontSize: '0.9em' }}>
                                    ⚠️ Use esta função no início de cada ano ou quando necessário atualizar as categorias.
                                </p>
                                <Botao 
                                    onClick={handleRecalcularCategorias}
                                    disabled={loadingCategorias}
                                    style={{ 
                                        backgroundColor: '#2196F3',
                                        marginTop: '1rem'
                                    }}
                                >
                                    {loadingCategorias ? '⏳ Processando...' : '🔄 Recalcular Categorias'}
                                </Botao>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
};

export default SuperAdmin;
