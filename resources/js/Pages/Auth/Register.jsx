import { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import '../../../css/register-dark.css';
import { countries } from '../../Data/countries';
import WorldCup2026Data from '../../Data/WorldCup2026Data';
import SearchableSelect from '../../Components/SearchableSelect';
import axios from 'axios';
import DashboardModal from '@/Components/Common/DashboardModal';
import { TermsOfService, PrivacyPolicy, CookiePolicy } from '../../Components/LegalDocs';

const totalSteps = 4;

export default function Register() {
    const { assetUrl } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        // Auth
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        
        // Personal
        phone: '',
        country: '',
        country_code: '',
        date_of_birth: '',
        
        // Preferences
        team_support: '',
        
        // Financial
        seeking_financing: null, // boolean or null
        employment_status: '',
        loan_return_period: '',
        banking_partners_consent: false,
        
        // Consents
        terms_agreed: false,
        marketing_consent: false,
        community_consent: false, // UI only
        privacy_consent: false
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null
    const [emailSuggestions, setEmailSuggestions] = useState([]);
    const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
    const [validationState, setValidationState] = useState({
        first_name: null, last_name: null, email: null, phone: null, country: null, date_of_birth: null
    });
    const [emailCheckLoading, setEmailCheckLoading] = useState(false);

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    // Live Validation Logic
    const validateField = async (name, value) => {
        let isValid = false;
        if (!value) {
            setValidationState(prev => ({...prev, [name]: null}));
            return;
        }

        switch(name) {
            case 'email':
                if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    setEmailCheckLoading(true);
                    try {
                        const response = await axios.post(route('check-email'), { email: value });
                        if (response.data.exists) {
                            isValid = 'taken'; // special state
                        } else {
                            isValid = true;
                        }
                    } catch (error) {
                        console.error('Email check failed', error);
                        isValid = false;
                    }
                    setEmailCheckLoading(false);
                }
                break;
            case 'password':
                isValid = value.length >= 8;
                break;
            case 'password_confirmation':
                isValid = value === data.password && value.length >= 8;
                break;
            default:
                isValid = value.length > 0;
        }
        
        if (name === 'email' && isValid === 'taken') {
             setValidationState(prev => ({...prev, [name]: 'taken'}));
        } else {
             setValidationState(prev => ({...prev, [name]: isValid}));
        }
    };

    const handleInputChange = (field, value) => {
        setData(field, value);
        
        if (field === 'email') {
             // Email suggestion logic
             const parts = value.split('@');
             if (parts.length === 2 && parts[1].length === 0) {
                 setShowEmailSuggestions(true);
                 setEmailSuggestions(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'].map(s => `${parts[0]}@${s}`));
             } else if (parts.length === 2 && parts[1].length > 0) {
                 const match = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'].filter(s => s.startsWith(parts[1]));
                 if (match.length > 0) {
                    setShowEmailSuggestions(true);
                    setEmailSuggestions(match.map(s => `${parts[0]}@${s}`));
                 } else {
                    setShowEmailSuggestions(false);
                 }
             } else {
                 setShowEmailSuggestions(false);
             }
        }
        
        // Debounce validation for email, immediate for others
        if (field === 'email') {
            const timeoutId = setTimeout(() => validateField(field, value), 500);
            return () => clearTimeout(timeoutId);
        } else {
            validateField(field, value);
        }
    };

    const ValidationIcon = ({ state, loading }) => {
        if (loading) return <i className="fas fa-spinner fa-spin text-white ms-2"></i>;
        if (state === true) return (
             <span className="ms-2 fa-stack" style={{verticalAlign: 'top', fontSize: '0.8em'}}>
                <i className="fas fa-circle fa-stack-2x text-white"></i>
                <i className="fas fa-check fa-stack-1x text-black"></i>
             </span>
        );
        if (state === false || state === 'taken') return <i className="fas fa-times-circle text-danger ms-2"></i>;
        return null;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        window.scrollTo(0, 0);
    };

    const validateStep = (step) => {
        if (step === 1) {
            if (!data.first_name || !data.last_name || !data.email || !data.phone || !data.country || !data.date_of_birth || !data.password) {
                toast.warning('Please fill in all required personal fields.');
                return false;
            }
            if (data.password !== data.password_confirmation) {
                toast.warning('Passwords do not match.');
                return false;
            }
        }
        if (step === 2) {
            if (!data.team_support) {
                toast.warning('Please select a team.');
                return false;
            }
        }
        if (step === 3) {
            if (data.seeking_financing === null) {
                toast.warning('Please select your financing preference.');
                return false;
            }
            if (data.seeking_financing === true) {
                if (!data.employment_status || !data.loan_return_period) {
                     toast.warning('Please complete the financing details.');
                     return false;
                }
            }
        }
        return true;
    };

    const submit = (e) => {
        e.preventDefault();
        if (!data.terms_agreed || !data.privacy_consent) {
            toast.warning('You must agree to the terms and conditions and privacy policy.');
            return;
        }
        
        post(route('register'), {
            onSuccess: () => reset('password', 'password_confirmation'),
            onError: (err) => {
                console.error('Registration errors:', err);
                toast.error('Registration failed. Please check the form for errors.');
            }
        });
    };
    
    const teams = [
        ...WorldCup2026Data.qualifiedTeams.map(teamName => {
            const specialMappings = {
                'England': 'gb-eng', 'Scotland': 'gb-sct', 'Wales': 'gb-wls',
                'Curaçao': 'cw', 'Curacao': 'cw', 'Cabo Verde': 'cv', 'Cape Verde': 'cv',
            };
            let iso = specialMappings[teamName];
            let flag = null;
            if (iso) {
                 flag = `${assetUrl}assets/Flags/${iso.toLowerCase()}.png`;
            } else {
                 const country = countries.find(c => 
                    c.value.toLowerCase() === teamName.toLowerCase() || 
                    (teamName === 'USA' && c.iso === 'US') ||
                    (teamName === 'Korea Republic' && c.iso === 'KR') ||
                    (teamName === 'IR Iran' && c.iso === 'IR') ||
                    (teamName === 'Côte d\'Ivoire' && c.iso === 'CI')
                );
                if (country) {
                    iso = country.iso;
                    flag = `${assetUrl}assets/Flags/${country.iso.toLowerCase()}.png`;
                }
            }
            return {
                name: teamName,
                iso: iso || '',
                flag: flag,
                icon: flag ? null : 'fas fa-futbol'
            };
        }),
        { name: 'Other', icon: 'fas fa-globe' }
    ];

    const progressPercentage = (currentStep / totalSteps) * 100;

    return (
        <div style={{minHeight: '100vh'}}>
            <Head title={`Register - Step ${currentStep}`}>
            </Head>

            <DashboardModal
                open={activeModal !== null}
                onOpenChange={(open) => !open && setActiveModal(null)}
                title="Legal Documents"
                label="Compliance"
                activeTab={activeModal === 'privacy' ? 'privacy' : (activeModal === 'terms' ? 'terms' : 'cookies')}
                onTabChange={(tab) => setActiveModal(tab)}
                tabs={[
                    { id: 'privacy', label: 'Privacy Policy', icon: 'fas fa-shield-alt' },
                    { id: 'terms', label: 'Terms of Service', icon: 'fas fa-file-contract' },
                    { id: 'cookies', label: 'Cookie Policy', icon: 'fas fa-cookie-bite' }
                ]}
            >
                <div className="modal-body overflow-y-auto" style={{ maxHeight: '80vh' }}>
                    {activeModal === 'privacy' && <PrivacyPolicy />}
                    {activeModal === 'terms' && <TermsOfService />}
                    {activeModal === 'cookies' && <CookiePolicy />}
                </div>
            </DashboardModal>

            <div className="container py-5">
                <Link href={route('index')} className="pill-back-btn auth-back-link pill-fixed-left">
                    <i className="fas fa-home" aria-hidden="true"></i>
                    <span>Home</span>
                </Link>
                <Link href={route('login')} className="pill-back-btn pill-fixed-right">
                    <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
                    <span>Sign In</span>
                </Link>

                <h1 className="mb-4 text-center text-white">Register</h1>

                <div className="card">
                    <div className="card-body">
                        <form onSubmit={submit}>
                            <div className="form-top-bar">
                                <div className="progress-indicator mb-4">
                                    <div className="progress-header d-flex justify-content-between text-white">
                                        <div>
                                            <span className="step-counter">Step <span>{currentStep}</span> of {totalSteps}</span>
                                            <span className="progress-percentage ms-2">{Math.round(progressPercentage)}%</span>
                                        </div>
                                    </div>
                                    <div className="progress-bar-container mt-3">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{width: `${progressPercentage}%`}}></div>
                                        </div>
                                    </div>
                                    <div className="progress-steps d-flex gap-2 mt-3 text-white-50">
                                        <div className={`step ${currentStep >= 1 ? 'active text-white fw-bold' : ''}`}>Personal Info</div>
                                        <div className={`step ${currentStep >= 2 ? 'active text-white fw-bold' : ''}`}>Team Support</div>
                                        <div className={`step ${currentStep >= 3 ? 'active text-white fw-bold' : ''}`}>Financing</div>
                                        <div className={`step ${currentStep >= 4 ? 'active text-white fw-bold' : ''}`}>Consent</div>
                                    </div>
                                </div>
                            </div>

                            {currentStep === 1 && (
                                <div className="social-login-section mb-4 text-center">
                                    <p className="text-white-50 small mb-3">Quick Register with Social Account</p>
                                    <div className="d-flex justify-content-center gap-3">
                                        <a href={route('social.redirect', 'google')} className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center gap-2 py-2" style={{borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)'}}>
                                            <i className="fab fa-google text-danger"></i>
                                            <span className="text-white">Sign up with Google</span>
                                        </a>
                                    </div>
                                    <div className="divider text-white-50 my-4" style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                                        <div style={{flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)'}}></div>
                                        <span className="small">OR REGISTER MANUALLY</span>
                                        <div style={{flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)'}}></div>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Personal Information */}
                            {currentStep === 1 && (
                                <div className="form-step active pb-3">
                                    <h3 className="mb-5 font-standard-section-pill">
                                        <i className="fas fa-user me-2"></i>Personal Information
                                    </h3>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label text-white">First Name <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control pill-input" value={data.first_name} onChange={e => handleInputChange('first_name', e.target.value)} required />
                                            {errors.first_name && <div className="invalid-feedback d-block">{errors.first_name}</div>}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-white">Last Name <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control pill-input" value={data.last_name} onChange={e => handleInputChange('last_name', e.target.value)} required />
                                            {errors.last_name && <div className="invalid-feedback d-block">{errors.last_name}</div>}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label d-flex align-items-center text-white">
                                                Email Address <span className="text-danger me-1">*</span>
                                                <ValidationIcon state={validationState.email} loading={emailCheckLoading} />
                                                {validationState.email === 'taken' && <span className="text-danger small ms-2">Email already taken</span>}
                                            </label>
                                            <div className="position-relative">
                                                <input 
                                                    type="email" 
                                                    className={`form-control pill-input ${validationState.email === 'taken' ? 'is-invalid' : ''}`}
                                                    value={data.email} 
                                                    onChange={e => handleInputChange('email', e.target.value)} 
                                                    required 
                                                    autoComplete="off"
                                                />
                                                {showEmailSuggestions && (
                                                    <div className="position-absolute w-100 bg-[#0f0f10] border border-secondary rounded mt-1 overflow-hidden" style={{zIndex: 1000}}>
                                                        {emailSuggestions.map(suggestion => (
                                                            <div 
                                                                key={suggestion} 
                                                                className="p-2 cursor-pointer hover-bg-secondary text-white"
                                                                onClick={() => {
                                                                    handleInputChange('email', suggestion);
                                                                    setShowEmailSuggestions(false);
                                                                }}
                                                                style={{cursor: 'pointer'}}
                                                            >
                                                                {suggestion}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-white">Phone Number <span className="text-danger">*</span></label>
                                            <div className="input-group">
                                                <div style={{width: '140px'}} className="me-2 text-white">
                                                    <SearchableSelect
                                                        options={countries}
                                                        value={data.country_code}
                                                        onChange={(val) => {
                                                            const countryObj = countries.find(c => c.code === val);
                                                            setData(prev => ({
                                                                ...prev, 
                                                                country_code: val,
                                                                country: countryObj ? countryObj.value : prev.country
                                                            }));
                                                        }}
                                                        placeholder="Code"
                                                        labelKey="code"
                                                        valueKey="code"
                                                        searchKeys={['code', 'value', 'iso']}
                                                        renderOption={(option) => (
                                                            <div className="d-flex align-items-center justify-content-between w-100">
                                                                <div className="d-flex align-items-center">
                                                                    <span className="text-white me-2 small">{option.iso}</span>
                                                                    <span className="text-white fw-bold">{option.code}</span>
                                                                </div>
                                                                <span className="text-white-50 small ms-2 text-truncate" style={{maxWidth: '120px'}}>{option.value}</span>
                                                            </div>
                                                        )}
                                                    />
                                                </div>
                                                <input 
                                                    type="tel" 
                                                    className="form-control pill-input" 
                                                    value={data.phone} 
                                                    onChange={e => handleInputChange('phone', e.target.value)} 
                                                    required 
                                                    placeholder="123 456 7890" 
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-white">Country <span className="text-danger">*</span></label>
                                            <div className="text-white">
                                                <SearchableSelect
                                                    options={countries}
                                                    value={data.country}
                                                    onChange={(val) => setData('country', val)}
                                                    placeholder="Select Your Country"
                                                    labelKey="text"
                                                    valueKey="value"
                                                />
                                                {errors.country && <div className="invalid-feedback d-block">{errors.country}</div>}
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-white">Date of Birth <span className="text-danger">*</span></label>
                                            <input type="date" className="form-control pill-input" value={data.date_of_birth} onChange={e => handleInputChange('date_of_birth', e.target.value)} required />
                                            {errors.date_of_birth && <div className="invalid-feedback d-block">{errors.date_of_birth}</div>}
                                        </div>
                                        <div className="col-12 mt-4"><hr className="border-secondary" /></div>
                                        <div className="col-md-6">
                                            <label className="form-label text-white">Password <span className="text-danger">*</span></label>
                                            <input type="password" className="form-control pill-input" value={data.password} onChange={e => setData('password', e.target.value)} required />
                                            {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-white">Confirm Password <span className="text-danger">*</span></label>
                                            <input type="password" className="form-control pill-input" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} required />
                                            {errors.password_confirmation && <div className="invalid-feedback d-block">{errors.password_confirmation}</div>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Team Support */}
                            {currentStep === 2 && (
                                <div className="form-step active pb-3">
                                    <h3 className="mb-5 font-standard-section-pill">
                                        <i className="fas fa-flag me-2"></i>Team Support
                                    </h3>
                                    <label className="form-label mb-3 text-white">Which team will you be supporting? <span className="text-danger">*</span></label>
                                    <div className="team-grid dash-team-grid">
                                        {teams.map(team => (
                                            <div 
                                                key={team.name} 
                                                className={`team-option dash-team-option ${data.team_support === team.name ? 'selected' : ''}`}
                                                onClick={() => setData('team_support', team.name)}
                                            >
                                                {team.flag ? (
                                                    <img src={team.flag} alt={team.name} className="team-flag dash-team-flag" />
                                                ) : (
                                                    <i className={`${team.icon} team-icon`}></i>
                                                )}
                                                <span className="team-name text-white dash-team-name">{team.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.team_support && <div className="invalid-feedback d-block mt-2">{errors.team_support}</div>}
                                </div>
                            )}

                            {/* Step 3: Financing Options */}
                            {currentStep === 3 && (
                                <div className="form-step active pb-3">
                                    <h3 className="mb-5 font-standard-section-pill">
                                        <i className="fas fa-credit-card me-2"></i>Financing Options
                                    </h3>
                                    <div className="mb-4">
                                        <label className="form-label text-white">Are you interested in financing options? <span className="text-danger">*</span></label>
                                        <div className="financing-options">
                                            <div className="form-check mb-2">
                                                <input className="form-check-input" type="radio" name="seeking_financing" id="fin_yes" checked={data.seeking_financing === true} onChange={() => setData('seeking_financing', true)} />
                                                <label className="form-check-label ms-2 text-white" htmlFor="fin_yes">Yes, I'm interested</label>
                                            </div>
                                            <div className="form-check">
                                                <input className="form-check-input" type="radio" name="seeking_financing" id="fin_no" checked={data.seeking_financing === false} onChange={() => setData({ ...data, seeking_financing: false, employment_status: '', loan_return_period: '' })} />
                                                <label className="form-check-label ms-2 text-white" htmlFor="fin_no">No, I'll pay myself</label>
                                            </div>
                                        </div>
                                    </div>
                                    {data.seeking_financing === true && (
                                        <div className="finance-details">
                                            <div className="mb-4">
                                                <label className="form-label text-white">Employment Status <span className="text-danger">*</span></label>
                                                {['fulltime', 'parttime', 'self', 'student', 'unemployed'].map(status => (
                                                    <div className="form-check mb-2" key={status}>
                                                        <input className="form-check-input" type="radio" name="employment_status" id={`emp_${status}`} checked={data.employment_status === status} onChange={() => setData('employment_status', status)} />
                                                        <label className="form-check-label ms-2 text-capitalize text-white" htmlFor={`emp_${status}`}>{status === 'self' ? 'Self-Employed' : status.replace('fulltime', 'Full-Time').replace('parttime', 'Part-Time')}</label>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mb-4">
                                                <label className="form-label text-white">Ideal Loan Return Period <span className="text-danger">*</span></label>
                                                {['12', '18', '24', '36'].map(period => (
                                                    <div className="form-check mb-2" key={period}>
                                                        <input className="form-check-input" type="radio" name="loan_return_period" id={`loan_${period}`} checked={data.loan_return_period === period} onChange={() => setData('loan_return_period', period)} />
                                                        <label className="form-check-label ms-2 text-white" htmlFor={`loan_${period}`}>{period} Months</label>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="form-check">
                                                <input className="form-check-input" type="checkbox" id="banking_consent" checked={data.banking_partners_consent} onChange={e => setData('banking_partners_consent', e.target.checked)} />
                                                <label className="form-check-label ms-2 text-white" htmlFor="banking_consent">I consent to share my banking information for financing assessment.</label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 4: Consent & Terms */}
                            {currentStep === 4 && (
                                <div className="form-step active pb-3">
                                    <h3 className="mb-5 font-standard-section-pill">
                                        <i className="fas fa-check-circle me-2"></i>Consent & Terms
                                    </h3>
                                    <div className="consent-section bg-dark p-4 rounded mb-4 dash-modal-subtle">
                                        <p className="mb-2 text-white">By registering for WCTFE, you agree to:</p>
                                        <ul className="text-white small mb-4 ms-3">
                                            <li>Receive communications about World Cup 2026 travel packages</li>
                                            <li>Participate in our community features and events</li>
                                            <li>Share your information with our trusted travel partners</li>
                                        </ul>
                                        <div className="form-check mb-3">
                                            <input className="form-check-input" type="checkbox" id="terms" 
                                                checked={data.terms_agreed}
                                                onChange={e => {
                                                    setData(prev => ({...prev, terms_agreed: e.target.checked, privacy_consent: e.target.checked}));
                                                }}
                                            />
                                            <label className="form-check-label ms-2 text-white" htmlFor="terms">
                                                I agree to the <button type="button" onClick={() => setActiveModal('terms')} className="text-danger bg-transparent border-0 p-0 text-decoration-underline fw-bold">Terms & Conditions</button> and <button type="button" onClick={() => setActiveModal('privacy')} className="text-danger bg-transparent border-0 p-0 text-decoration-underline fw-bold">Privacy Policy</button> <span className="text-danger">*</span>
                                            </label>
                                        </div>
                                        <div className="form-check mb-3">
                                            <input className="form-check-input" type="checkbox" id="marketing" checked={data.marketing_consent} onChange={e => setData('marketing_consent', e.target.checked)} />
                                            <label className="form-check-label ms-2 text-white" htmlFor="marketing">I would like to receive marketing communications</label>
                                        </div>
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" id="community" checked={data.community_consent} onChange={e => setData('community_consent', e.target.checked)} />
                                            <label className="form-check-label ms-2 text-white" htmlFor="community">I would like to join the WCTFE community</label>
                                        </div>
                                        {errors.terms_agreed && <div className="invalid-feedback d-block mt-2">{errors.terms_agreed}</div>}
                                        {errors.privacy_consent && <div className="invalid-feedback d-block mt-2">{errors.privacy_consent}</div>}
                                    </div>
                                </div>
                            )}

                            <div className="registration-bottom-controls mt-4 pt-3 border-top border-secondary">
                                {currentStep > 1 ? (
                                    <button type="button" className="btn btn-outline-light btn-control" onClick={prevStep}>
                                        <i className="fas fa-arrow-left me-2"></i> Back
                                    </button>
                                ) : (
                                    <div></div>
                                )}
                                {currentStep < totalSteps ? (
                                    <button type="button" className="btn btn-danger btn-control btn-next px-5" onClick={nextStep}>
                                        Next <i className="fas fa-arrow-right ms-2"></i>
                                    </button>
                                ) : (
                                    <button type="submit" className="btn btn-success btn-control btn-next px-5" disabled={processing}>
                                        {processing ? 'Creating Account...' : 'Complete Registration'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
                <div className="text-center mt-4 text-white-50">
                    Already have an account? <Link href={route('login')} className="text-danger text-decoration-none fw-bold">Sign in here</Link>
                </div>
            </div>
        </div>
    );
}
