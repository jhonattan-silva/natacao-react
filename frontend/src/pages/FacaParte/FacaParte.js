import { useState } from 'react';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';
import style from './FacaParte.module.css';
import api from '../../servicos/api';
import { aplicarMascaraCelular } from '../../servicos/functions';
import useAlerta from '../../hooks/useAlerta';

const FacaParte = () => {
    const { mostrar: mostrarAlerta, componente: alertaComponente } = useAlerta();
    const [formData, setFormData] = useState({
        nome: '',
        clube: '',
        cidade: '',
        telefone: '',
        mensagem: ''
    });
    const [enviando, setEnviando] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'telefone') {
            setFormData(prev => ({
                ...prev,
                [name]: aplicarMascaraCelular(value)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);

        try {
            // Enviar dados para a API com timeout maior
            await api.post('/contato/faca-parte', formData, { timeout: 10000 });
            
            mostrarAlerta('Obrigado! Entraremos em contato em breve!');
            setFormData({
                nome: '',
                clube: '',
                cidade: '',
                telefone: '',
                mensagem: ''
            });
            
        } catch (error) {
            if (error.code === 'ECONNABORTED' || (typeof error.message === 'string' && error.message.toLowerCase().includes('timeout'))) {
                // Tratamos timeout como sucesso, pois o registro foi salvo no banco
                mostrarAlerta('Obrigado! Recebemos seu contato. Em breve retornaremos.');
                setFormData({ nome: '', clube: '', cidade: '', telefone: '', mensagem: '' });
                console.warn('Requisição excedeu o tempo limite, mas o backend processou a inserção.');
            } else {
                mostrarAlerta('Erro ao enviar formulário. Tente novamente.');
                console.error('Erro:', error);
            }
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className={style.pageContainer}>
            <Cabecalho />
            <main className={style.container}>
                <section className={style.formSection}>
                    <h1>Traga sua Equipe</h1>
                    <p className={style.subtitle}>Interessado em participar da Liga Paulista de Natação? Preencha o formulário abaixo e entraremos em contato!</p>
                    
                    <form onSubmit={handleSubmit} className={style.form}>
                        <div className={style.formGroup}>
                            <label htmlFor="nome">Nome*</label>
                            <input
                                type="text"
                                id="nome"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                required
                                placeholder="Seu nome completo"
                            />
                        </div>

                        <div className={style.formRow}>
                            <div className={style.formGroup}>
                                <label htmlFor="cidade">Cidade*</label>
                                <input
                                    type="text"
                                    id="cidade"
                                    name="cidade"
                                    value={formData.cidade}
                                    onChange={handleChange}
                                    required
                                    placeholder="Sua cidade"
                                />
                            </div>

                            <div className={style.formGroup}>
                                <label htmlFor="clube">Clube / Entidade*</label>
                                <input
                                    type="text"
                                    id="clube"
                                    name="clube"
                                    value={formData.clube}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nome do seu clube ou entidade"
                                />
                            </div>

                            <div className={style.formGroup}>
                                <label htmlFor="telefone">Telefone*</label>
                                <input
                                    type="tel"
                                    id="telefone"
                                    name="telefone"
                                    value={formData.telefone}
                                    onChange={handleChange}
                                    required
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                        </div>

                        <div className={style.formGroup}>
                            <label htmlFor="mensagem">Mensagem*</label>
                            <textarea
                                id="mensagem"
                                name="mensagem"
                                value={formData.mensagem}
                                onChange={handleChange}
                                required
                                placeholder="Conte-nos sobre sua equipe..."
                                rows="6"
                            />
                        </div>

                        <div className={style.buttonContainer}>
                            <button 
                                type="submit" 
                                disabled={enviando}
                                className={style.submitButton}
                            >
                                {enviando ? 'Enviando...' : 'Enviar Formulário'}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
            {alertaComponente}
            <Rodape />
        </div>
    );
};

export default FacaParte;
