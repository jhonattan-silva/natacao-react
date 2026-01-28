import { useState, useEffect } from 'react';
import InputTexto from '../../componentes/InputTexto/InputTexto';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import Botao from '../../componentes/Botao/Botao';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../../servicos/api';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import Rodape from '../../componentes/Rodape/Rodape';
import style from './NoticiasAdmin.module.css';
import useAlerta from '../../hooks/useAlerta';

// Formata a data para o formato yyyy-MM-dd
const formatDate = (data) => {
  if (!data) return '';
  const d = typeof data === 'string' ? new Date(data) : data;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

function gerarSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const FormNoticia = ({ noticiaInicial = {}, onSalvo, onCancelar }) => {
  const [titulo, setTitulo] = useState('');
  const [slug, setSlug] = useState(''); 
  const [subtitulo, setSubtitulo] = useState('');
  const [resumo, setResumo] = useState('');
  const [texto, setTexto] = useState('');
  const [imagem, setImagem] = useState('');
  const [imagemTemp, setImagemTemp] = useState(''); // Para armazenar imagem temporária
  const [data, setData] = useState('');
  const [status, setStatus] = useState('publicada');
  const [exibirCarrossel, setExibirCarrossel] = useState(true); // Flag para exibir no carrossel
  const [imagemFile, setImagemFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const { mostrar: mostrarAlerta, componente: alertaComponente } = useAlerta();
  const [galeria, setGaleria] = useState([]); // Caminhos das imagens da galeria
  const [galeriaPreview, setGaleriaPreview] = useState([]); // Previews locais

  // Atualiza os campos ao editar
  useEffect(() => {
    setTitulo(noticiaInicial.titulo || '');
    setSlug(noticiaInicial.slug || '');
    setSubtitulo(noticiaInicial.subtitulo || '');
    setResumo(noticiaInicial.resumo || '');
    setTexto(noticiaInicial.texto || '');
    setImagem(noticiaInicial.imagem || '');
    setData(formatDate(noticiaInicial.data) || formatDate(new Date()));
    setStatus(noticiaInicial.status || 'publicada');
    setExibirCarrossel(noticiaInicial.exibir_carrossel !== undefined ? Boolean(noticiaInicial.exibir_carrossel) : true);
    setImagemFile(null);
    setGaleria(noticiaInicial.galeria || []);
    setGaleriaPreview((noticiaInicial.galeria || []).map(img => ({ url: img })));
  }, [noticiaInicial]);

  const usuarios_id = 1; // Simulação

  //handleMudancaImagem vai lidar com a mudança da imagem para que 
  const handleMudancaImagem = async e => {
    const file = e.target.files[0];
    setImagemFile(file);
    if (file) {
      // Mostra prévia local imediatamente
      const reader = new FileReader();
      reader.onload = ev => setImagem(ev.target.result);
      reader.readAsDataURL(file);

      // Faz upload para o backend
      const formData = new FormData();
      formData.append('imagem', file);
      formData.append('noticiaId', noticiaInicial.id ? noticiaInicial.id : 'temp');
      try {
        const resp = await api.post('/upload/noticia', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        // Só troque para a URL pública se a notícia já existir (tem id)
        if (noticiaInicial.id) {
          setImagem(resp.data.url);
        } else {
          // Mantém o preview local até a notícia ser salva
          setImagemTemp(resp.data.url);
        }
      } catch {
        mostrarAlerta('Erro ao fazer upload da imagem.');
      }
    }
  };

  const handleMudancaGaleria = async e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const noticiaId = noticiaInicial.id ? noticiaInicial.id : 'temp';
    let novasImagens = [];
    let novasPreviews = [];
    let filesProcessed = 0;

    files.forEach(file => {
      // Preview local imediato
      const reader = new FileReader();
      reader.onload = ev => {
        novasPreviews.push({ url: ev.target.result });
        filesProcessed++;
        // Quando todos os previews estiverem prontos, atualize o estado
        if (filesProcessed === files.length) {
          setGaleriaPreview(galeriaPreview => [...galeriaPreview, ...novasPreviews]);
        }
      };
      reader.readAsDataURL(file);

      // Upload para backend (mantém url para salvar depois)
      const formData = new FormData();
      formData.append('imagem', file);
      formData.append('noticiaId', noticiaId);
      api.post('/upload/noticia', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
        .then(resp => {
          novasImagens.push(resp.data.url);
          // Quando todos os uploads terminarem, atualize o estado da galeria
          if (novasImagens.length === files.length) {
            setGaleria(galeria => [...galeria, ...novasImagens]);
          }
        })
        .catch(() => {
          mostrarAlerta('Erro ao fazer upload de uma imagem da galeria.');
        });
    });
  };

  const handleRemoverGaleria = idx => {
    setGaleria(galeria => galeria.filter((_, i) => i !== idx));
    setGaleriaPreview(galeriaPreview => galeriaPreview.filter((_, i) => i !== idx));
  };

  // helper para transformar caminhos relativos em URLs acessíveis (dev/prod)
  const backendOrigin = process.env.REACT_APP_API_URL?.replace('/api', '') || '';
  const getImageUrl = url => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Se for um caminho relativo
    if (url.startsWith('/uploads')) {
      // Em produção, se backendOrigin estiver vazio, usa o domínio atual
      const origin = backendOrigin || window.location.origin;
      return `${origin}${url}`;
    }
    return url;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      let payload = { titulo, subtitulo, resumo, texto, imagem, data, usuarios_id: 1, status, galeria, slug, exibir_carrossel: exibirCarrossel ? 1 : 0 };
      // Calcular ano e slug para os uploads
      const noticiaAno = data ? new Date(data).getFullYear().toString() : 'temp';
      const noticiaSlugForMove = slug || gerarSlug(titulo); // Certifique-se de ter ou importar uma função gerarSlug

      if (noticiaInicial.id) {
        // Mover imagens da galeria que estejam em "temp"
        const galeriaFinal = [];
        for (const url of galeria) {
          if (typeof url === 'string' && url.includes('/uploads/imagens/temp/')) {
            try {
              const respMove = await api.post('/upload/noticia/move', { 
                imagemTemp: url, 
                noticiaAno, 
                noticiaSlug: noticiaSlugForMove 
              });
              galeriaFinal.push(respMove.data.url);
            } catch (err) {
              console.warn('Erro ao mover imagem da galeria:', err);
              // se falhar no move, mantenha a url original
              galeriaFinal.push(url);
            }
          } else {
            galeriaFinal.push(url);
          }
        }
        
        // Se imagem principal estiver em temp, mova também
        if (imagemTemp) {
          try {
            const respMain = await api.post('/upload/noticia/move', { 
              imagemTemp, 
              noticiaAno, 
              noticiaSlug: noticiaSlugForMove 
            });
            payload.imagem = respMain.data.url;
          } catch (err) {
            console.warn('Erro ao mover imagem principal:', err);
          }
        }
        
        payload.galeria = galeriaFinal;
        await api.put(`/news/${noticiaInicial.id}`, payload);
      } else {
        // Criar notícia e obter id
        const res = await api.post('/news', payload);
        const noticiaId = res.data.id || null;
        // Mesmo que a notícia tenha sido criada, para os uploads usamos os dados do formulário:
        let imagemFinal = imagem;
        if (imagemTemp && noticiaId) {
          try {
            const respMain = await api.post('/upload/noticia/move', { 
              imagemTemp, 
              noticiaAno, 
              noticiaSlug: noticiaSlugForMove 
            });
            imagemFinal = respMain.data.url;
          } catch (err) {
            console.warn('Erro ao mover imagem principal na criação:', err);
          }
        }

        // mover galeria (se houver) e montar galeriaFinal
        const galeriaFinal = [];
        for (const url of galeria) {
          if (typeof url === 'string' && url.includes('/uploads/imagens/temp/') && noticiaId) {
            try {
              const respMove = await api.post('/upload/noticia/move', { 
                imagemTemp: url, 
                noticiaAno, 
                noticiaSlug: noticiaSlugForMove 
              });
              galeriaFinal.push(respMove.data.url);
            } catch (err) {
              console.warn('Erro ao mover imagem da galeria na criação:', err);
              galeriaFinal.push(url);
            }
          } else {
            galeriaFinal.push(url);
          }
        }
        if (noticiaId) {
          await api.put(`/news/${noticiaId}`, {
            titulo, subtitulo, resumo, texto,
            imagem: imagemFinal,
            data, usuarios_id: 1, status, galeria: galeriaFinal, slug
          });
        }
      }

      if (onSalvo) onSalvo();
      mostrarAlerta('Notícia salva com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar notícia:', err);
      setErro('Erro ao salvar notícia.');
      mostrarAlerta('Erro ao salvar notícia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {alertaComponente}
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
        {/* Novo campo para slug */}
        <div className={style.campoNoticiasAdmin}>
          <InputTexto
            id="slug"
            label="Slug"
            valor={slug}
            aoAlterar={setSlug}
            placeholder="Digite o slug (URL amigável) (opcional)"
            disabled={!!noticiaInicial.id} // desabilita o input em modo de edição
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
          <ReactQuill value={texto} onChange={setTexto} />
        </div>
        <div className={style.campoNoticiasAdmin}>
          <label className={style.labelNoticiasAdmin}>Imagem de capa:</label><br />
          <input type="file" accept="image/*" onChange={handleMudancaImagem} />
          {imagem && (
            <div>
              <img
                src={getImageUrl(imagem)}
                alt="Prévia"
                className={style.imagemPreviewNoticiasAdmin}
                style={{ maxWidth: 180, maxHeight: 120, marginTop: 8, borderRadius: 8, border: '1px solid #ccc' }}
              />
            </div>
          )}
        </div>
        <div className={style.campoNoticiasAdmin}>
          <label className={style.labelNoticiasAdmin}>Galeria de imagens:</label><br />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleMudancaGaleria}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {galeriaPreview.map((img, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <img src={getImageUrl(img.url)} alt={`Galeria ${idx + 1}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #ccc' }} />
                <button
                  type="button"
                  onClick={() => handleRemoverGaleria(idx)}
                  style={{
                    position: 'absolute', top: 0, right: 0, background: '#e74c3c', color: '#fff',
                    border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontWeight: 'bold'
                  }}
                  title="Remover"
                >×</button>
              </div>
            ))}
          </div>
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
        <div className={style.campoNoticiasAdmin}>
          <label className={style.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={exibirCarrossel} 
              onChange={(e) => setExibirCarrossel(e.target.checked)}
            />
            <span>Exibir no carrossel da página inicial</span>
          </label>
        </div>
        <div className={style.botoesNoticiasAdmin}>
          <Botao onClick={handleSubmit} className="">Salvar</Botao>
          <Botao onClick={onCancelar} className="">Cancelar</Botao>
        </div>
      </form>
    </>
  );
};

const NoticiasAdmin = () => {
  const [noticias, setNoticias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modoForm, setModoForm] = useState(false);
  const [noticiaEditando, setNoticiaEditando] = useState(null);
  const { mostrar: mostrarAlerta, componente: alertaComponente, confirmar: confirmarAlerta } = useAlerta();

  const carregarNoticias = async () => {
    setCarregando(true);
    try {
      // Aqui buscamos todas as notícias, inclusive rascunhos (admin)
      const res = await api.get('/news?all=true');
      setNoticias(res.data);
    } catch {
      mostrarAlerta('Erro ao carregar notícias.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!modoForm) carregarNoticias();
  }, [modoForm]);

  // Atualize a função de editar para buscar detalhes completos da notícia
  const handleEditar = noticia => {
    api.get(`/news/${noticia.id}`)
      .then(response => {
        setNoticiaEditando(response.data);
        setModoForm(true);
      })
      .catch(() => {
        mostrarAlerta('Erro ao carregar notícia para edição.');
      });
  };

  const handleExcluir = async noticia => {
    confirmarAlerta(
      'Tem certeza que deseja excluir esta notícia?',
      async () => {
        try {
          await api.delete(`/news/${noticia.id}`);
          mostrarAlerta('Notícia excluída com sucesso!');
          carregarNoticias();
        } catch {
          mostrarAlerta('Erro ao excluir notícia.');
        }
      }
    );
  };

  const handleToggleCarrossel = async noticia => {
    const novoValor = noticia.exibir_carrossel ? 0 : 1;
    try {
      await api.patch(`/news/${noticia.id}/carrossel`, { exibir_carrossel: novoValor });
      setNoticias(prev => prev.map(n => (
        n.id === noticia.id ? { ...n, exibir_carrossel: novoValor } : n
      )));
      mostrarAlerta(novoValor ? 'Notícia exibida no carrossel.' : 'Notícia removida do carrossel.');
    } catch {
      mostrarAlerta('Erro ao atualizar carrossel.');
    }
  };

  //  se o formulário estiver em modo de edição
  if (modoForm) {
    return (
      <>
        <CabecalhoAdmin />
        <FormNoticia
          noticiaInicial={noticiaEditando || {}}
          onSalvo={() => {
            setModoForm(false);
            setNoticiaEditando(null);
          }}
          onCancelar={() => {
            setModoForm(false);
            setNoticiaEditando(null);
          }}
        />
        <Rodape />
      </>
    );
  }

  return (
    <>
      <CabecalhoAdmin />
      {alertaComponente}
      <div className={style.containerNoticiasAdmin}>
        <h2 className={style.tituloNoticiasAdmin}>Gerenciamento de Notícias</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Botao onClick={() => { setModoForm(true); setNoticiaEditando(null); }}>Nova Notícia</Botao>
        </div>
        {carregando ? (
          <p>Carregando...</p>
        ) : (
          <table className={style.tabelaNoticiasAdmin} style={{width: '100%', marginTop: 24}}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Status</th>
                <th>Carrossel</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {noticias.map(n => (
                <tr key={n.id}>
                  <td>{n.id}</td>
                  <td>{n.titulo}</td>
                  <td>{n.status}</td>
                  <td>{n.exibir_carrossel ? 'Sim' : 'Não'}</td>
                  <td>{n.data}</td>
                  <td>
                    <Botao onClick={() => handleEditar(n)} className="">Editar</Botao>
                    <Botao onClick={() => handleExcluir(n)} className="" style={{marginLeft: 8, background: '#e74c3c'}}>Excluir</Botao>
                    <Botao
                      onClick={() => handleToggleCarrossel(n)}
                      className=""
                      style={{ marginLeft: 8, background: n.exibir_carrossel ? '#f39c12' : '#2ecc71' }}
                    >
                      {n.exibir_carrossel ? 'Ocultar Carrossel' : 'Mostrar Carrossel'}
                    </Botao>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Rodape />
    </>
  );
};

export default NoticiasAdmin;