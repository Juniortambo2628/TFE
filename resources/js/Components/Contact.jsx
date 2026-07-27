import React from 'react';

export default function Contact() {
    return (
        <section className="get-in-touch py-5 py-lg-11 py-xl-12 bg-dark" id="contact">
            <div className="container">
                <div className="row gap-7 gap-xl-0">
                        <div className="col-xl-4 col-xxl-4">
                        <div className="d-flex align-items-center gap-7 py-2" data-aos="fade-right" data-aos-delay="100" data-aos-duration="1000">
                            <span className="round-36 flex-shrink-0 text-white rounded-circle bg-primary hstack justify-content-center fw-medium">05</span>
                            <hr className="border-line bg-white border-opacity-25" />
                            <span className="badge text-dark bg-primary">Contact</span>
                        </div>
                    </div>
                    <div className="col-xl-8 col-xxl-7">
                        <div className="row">
                            <div className="col-xxl-8">
                                    <div className="d-flex flex-column gap-6 mb-8" data-aos="fade-up" data-aos-delay="100" data-aos-duration="1000">
                                    <h2 className="mb-0 text-white fw-bold display-6">Get in touch</h2>
                                    <p className="fs-5 mb-0 text-white text-opacity-70">Have questions about our packages or financing? Our team is here to help.</p>
                                </div>
                            </div>
                        </div>
                        <form action="assets/inc/send_email.php" className="d-flex flex-column gap-4" method="post" data-aos="fade-up" data-aos-delay="200" data-aos-duration="1000">
                                <div className="row">
                                    <div className="col-md-6 mb-4 mb-md-0">
                                    <input type="text" className="form-control py-3 px-4 border-white border-opacity-25 rounded-0 text-white" name="name" placeholder="Your Name" required/>
                                    </div>
                                    <div className="col-md-6">
                                    <input type="email" className="form-control py-3 px-4 border-white border-opacity-25 rounded-0 text-white" name="email" placeholder="Your Email" required/>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-12">
                                        <textarea name="message" className="form-control py-3 px-4 border-white border-opacity-25 rounded-0 text-white" rows="5" placeholder="Your Message" required></textarea>
                                    </div>
                                </div>
                                <div className="align-self-start">
                                    <button type="submit" className="btn-glass-pill d-inline-flex" style={{ background: '#e31b23', borderColor: '#e31b23' }}>
                                        <span>Send Message</span>
                                        <iconify-icon icon="lucide:arrow-up-right" className="btn-icon"></iconify-icon>
                                    </button>
                                </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
