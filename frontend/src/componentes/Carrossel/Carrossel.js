import { useState, useEffect } from 'react';
import style from './Carrossel.module.css';

const Carrossel = ({ slides = [], autoSlideTime = 10000 }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slides.length);
    }, autoSlideTime);
    return () => clearInterval(interval);
  }, [autoSlideTime, slides.length]);

  const slideAnterior = () => {
    setActiveIndex(prev => (prev - 1 + slides.length) % slides.length);
  };

  const slideSeguinte = () => {
    setActiveIndex(prev => (prev + 1) % slides.length);
  };

  return (
    <div className={style.carrossel}>
      <div className={style.slider} style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {slides.map((slide, index) => (
          <div key={index} className={style.slide}>
            <img src={slide.image} alt={slide.title || 'Slide'} className={style.image} />
            {(slide.title || slide.subtitle) && (
              <div className={style.caption}>
                {slide.title && (
                  <h2>
                    {slide.link ? <a href={slide.link}>{slide.title}</a> : slide.title}
                  </h2>
                )}
                {slide.subtitle && <h3>{slide.subtitle}</h3>}
              </div>
            )}
          </div>
        ))}
      </div>
      <button className={`${style.arrow} ${style.leftArrow}`} onClick={slideAnterior}>
        &#10094;
      </button>
      <button className={`${style.arrow} ${style.rightArrow}`} onClick={slideSeguinte}>
        &#10095;
      </button>
    </div>
  );
};

export default Carrossel;