import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';
import Carrossel from '../../componentes/Carrossel/Carrossel';
import style from './Inicio.module.css';
import Card from '../../componentes/Card/Card';
import eventos from '../../json/db.json';

const Inicio = () => {
    return (
        <div>
            <Cabecalho />
            <Carrossel />
            <section className={style.container}>
                <h1>EVENTOS</h1>
                {eventos.map((evento) => {
                    return <Card {...evento} key={evento.id} />
                })}
            </section>
            <Rodape />
        </div>
    )
}

export default Inicio