import React from 'react';

export default function News() {
    const [news, setNews] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetch(route('news.index'))
            .then(res => res.json())
            .then(data => {
                setNews(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch news', err);
                setLoading(false);
            });
    }, []);

    return (
        <section className="Recent-news py-5 py-lg-11 py-xl-12 bg-dark" id="world-cup-news">
            <div className="container">
                <div className="row gap-7 gap-xl-0">
                    <div className="col-xl-4 col-xxl-4">
                        <div className="d-flex align-items-center gap-7 py-2" data-aos="fade-right" data-aos-delay="100" data-aos-duration="1000">
                            <span className="round-36 flex-shrink-0 text-white rounded-circle bg-primary hstack justify-content-center fw-medium">04</span>
                            <hr className="border-line bg-white border-opacity-25" />
                            <span className="badge text-dark bg-primary">News</span>
                        </div>
                    </div>
                    <div className="col-xl-8 col-xxl-7">
                        <div className="d-flex flex-column gap-6 mb-8" data-aos="fade-up" data-aos-delay="100" data-aos-duration="1000">
                            <h2 className="mb-0 text-white fw-bold display-6">World Cup 2026 Updates</h2>
                            <p className="fs-5 mb-0 text-white text-opacity-70">Latest news, ticket information, and stadium updates.</p>
                        </div>
                        <div id="world-cup-news-container" className="row g-4">
                            {loading ? (
                                <div className="col-12 text-white opacity-50">Loading live news...</div>
                            ) : news.length > 0 ? (
                                news.map((item, index) => (
                                    <div className="col-md-4" key={index}>
                                        <div className="card bg-transparent border border-white border-opacity-10 h-100">
                                            <div className="card-img-top overflow-hidden position-relative" style={{height: '200px'}}>
                                                <img 
                                                    src={item.image || 'https://via.placeholder.com/400x200?text=News'} 
                                                    className="w-100 h-100 object-fit-cover" 
                                                    alt={item.title} 
                                                    onError={(e) => e.target.src = 'https://via.placeholder.com/400x200?text=News'} 
                                                />
                                            </div>
                                            <div className="card-body d-flex flex-column">
                                                <small className="text-secondary mb-2">{item.date}</small>
                                                <h5 className="card-title text-white mb-3" style={{ fontSize: '1.1rem', lineHeight: '1.4' }}>{item.title}</h5>
                                                {item.excerpt && (
                                                    <p className="card-text text-white text-opacity-70 fs-6 mb-4 text-truncate-3" style={{ display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {item.excerpt}
                                                    </p>
                                                )}
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-glass-pill btn-glass-pill-sm mt-auto align-self-start" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>
                                                    <span>Read Article</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12 text-white opacity-50">
                                    <p>Unable to load live news at the moment.</p>
                                    <small>(Note: Live news requires a valid API key in .env)</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
