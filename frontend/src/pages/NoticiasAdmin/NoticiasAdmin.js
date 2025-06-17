import { useState } from 'react';
import InputTexto from '../../componentes/InputTexto/InputTexto';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import Botao from '../../componentes/Botao/Botao';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import api from '../../servicos/api';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import Rodape from '../../componentes/Rodape/Rodape';
import style from './NoticiasAdmin.module.css';

const NoticiasAdmin = ({ noticiaInicial = {}, onSalvo }) => {
  const [titulo, setTitulo] = useState(noticiaInicial.titulo || '');
  const [subtitulo, setSubtitulo] = useState(noticiaInicial.subtitulo || '');
  const [resumo, setResumo] = useState(noticiaInicial.resumo || '');
  const [texto, setTexto] = useState(noticiaInicial.texto || '');
  const [imagem, setImagem] = useState(noticiaInicial.imagem || '');
  const [data, setData] = useState(noticiaInicial.data || new Date().toISOString().slice(0,10));
  const [status, setStatus] = useState(noticiaInicial.status || 'publicada');
  const [imagemFile, setImagemFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Simulação de usuário logado
  const usuarios_id = 1; // Troque pelo id real do usuário logado

  const handleImagemChange = e => {
    const file = e.target.files[0];
    setImagemFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setImagem(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const payload = { titulo, subtitulo, resumo, texto, imagem, data, usuarios_id, status };
      if (noticiaInicial.id) {
        await api.put(`/news/${noticiaInicial.id}`, payload);
      } else {
        await api.post('/news', payload);
      }
      if (onSalvo) onSalvo();
      alert('Notícia salva com sucesso!');
    } catch (err) {
      setErro('Erro ao salvar notícia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CabecalhoAdmin />
      <form onSubmit={handleSubmit} className={style.containerNoticiasAdmin}>
        <h2 className={style.tituloNoticiasAdmin}>
          {noticiaInicial.id ? 'Editar Notícia' : 'Nova Notícia'}
        </h2>
        {erro && <div className={style.erroNoticiasAdmin}>{erro}</div>}

        <div className={style.campoNoticiasAdmin}>
          <InputTexto
            id="titulo"
            label="Título*"
            valor={titulo}
            aoAlterar={setTitulo}
            obrigatorio
            placeholder="Digite o título da notícia"
          />
        </div>

        <div className={style.campoNoticiasAdmin}>
          <InputTexto
            id="subtitulo"
            label="Subtítulo"
            valor={subtitulo}
            aoAlterar={setSubtitulo}
            placeholder="Digite o subtítulo"
          />
        </div>

        <div className={style.campoNoticiasAdmin}>
          <InputTexto
            id="resumo"
            label="Resumo"
            valor={resumo}
            aoAlterar={setResumo}
            placeholder="Digite um resumo para a notícia"
          />
        </div>

        <div className={style.campoNoticiasAdmin}>
          <label className={style.labelNoticiasAdmin}>Conteúdo*:</label>
          {/* <ReactQuill value={texto} onChange={setTexto} /> */}
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={8}
            style={{width: '100%'}}
          />
        </div>

        <div className={style.campoNoticiasAdmin}>
          <label className={style.labelNoticiasAdmin}>Imagem de capa:</label><br />
          <input type="file" accept="image/*" onChange={handleImagemChange} />
          {imagem && (
            <div>
              <img src={imagem} alt="Prévia" className={style.imagemPreviewNoticiasAdmin} />
            </div>
          )}
        </div>

        <div className={style.campoNoticiasAdmin}>
          <InputTexto
            id="data"
            label="Data"
            tipo="date"
            valor={data}
            aoAlterar={setData}
            obrigatorio
          />
        </div>

        <div className={style.campoNoticiasAdmin}>
          <ListaSuspensa
            opcoes={[
              { id: 'publicada', nome: 'Publicada' },
              { id: 'rascunho', nome: 'Rascunho' }
            ]}
            onChange={setStatus}
            textoPlaceholder="Selecione o status"
            obrigatorio
            selectId="id"
            selectExibicao="nome"
            valorSelecionado={status}
          />
        </div>

        <div className={style.botoesNoticiasAdmin}>
          <Botao onClick={handleSubmit} className="">Salvar</Botao>
          <Botao onClick={() => window.history.back()} className="">Cancelar</Botao>
        </div>
      </form>
      <Rodape />
    </>
  );
};

export default NoticiasAdmin;