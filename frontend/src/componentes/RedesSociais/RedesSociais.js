import style from './RedesSociais.module.css';

const RedesSociais = () => {
    return (
        <div className={style.container}>
            <h4>Redes Sociais</h4>
            <ul className={style.iconesSociais}>
                <li><a href="https://www.instagram.com/ligapaulistadenatacao/" target="_blank"><img src="https://th.bing.com/th/id/R.26d9974a1feec9905a4e0d5e5ddf8db6?rik=Og1ujXM2C1AJHQ&riu=http%3a%2f%2fupload.wikimedia.org%2fwikipedia%2fcommons%2fa%2fa5%2fInstagram_icon.png&ehk=1%2fZWXYn2nN%2fR80TOtcKH5SsdLkkUvMLrB%2fHUXRDHk9I%3d&risl=&pid=ImgRaw&r=0" alt="Instagram" /></a></li>
            </ul>
        </div>
    )
}

export default RedesSociais;