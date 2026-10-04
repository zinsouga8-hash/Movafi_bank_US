import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  Building,
  User,
  KeyRound,
  Globe,
  Phone,
  Search,
  AlertCircle,
  HelpCircle,
  Mail,
  Server,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { SupportedLanguage, SupportedCurrency, UserProfile, BankAccount } from '../types/banking';
import { translations } from '../i18n/translations';
import { COUNTRIES, CountryInfo, getLocalizedCountryName } from '../utils/countries';
import { MovafiLogo } from './MovafiLogo';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
  onSuccess: (user: UserProfile, account: BankAccount) => void;
  supportEmail?: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onSuccess,
  supportEmail = 'support@movafi-groupes.com'
}) => {
  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);

  useEffect(() => {
    setIsHelpExpanded(false);
  }, [step]);

  // Step 1: Security Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Referral Code state (Rule: Only prefilled if clicked on a referral link via URL query param)
  const [referralCode, setReferralCode] = useState(() => {
    const urlRef = new URLSearchParams(window.location.search).get('ref');
    if (urlRef) return urlRef.toUpperCase();
    return '';
  });
  const [referrerHint, setReferrerHint] = useState<string | null>(null);

  useEffect(() => {
    if (referralCode && referralCode.trim().length >= 4) {
      api.referrals.checkCode(referralCode.trim())
        .then((res) => {
          if (res.success && res.valid) {
            setReferrerHint(res.referrer_name || 'Membre Movafibank');
          } else {
            setReferrerHint(null);
          }
        })
        .catch(() => setReferrerHint(null));
    } else {
      setReferrerHint(null);
    }
  }, [referralCode]);

  // Step 2: Real 6-Digit Email OTP
  const [otp, setOtp] = useState('');

  // Step 3: Detailed Profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Phone Country & Number
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<CountryInfo>(
    () => COUNTRIES.find((c) => c.code === 'US') || COUNTRIES[0]
  );
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [showPhoneCountryPicker, setShowPhoneCountryPicker] = useState(false);
  const [phoneNumberOnly, setPhoneNumberOnly] = useState('');

  // Residence Country & City
  const [selectedResidenceCountry, setSelectedResidenceCountry] = useState<CountryInfo>(
    () => COUNTRIES.find((c) => c.code === 'US') || COUNTRIES[0]
  );
  const [residenceSearchQuery, setResidenceSearchQuery] = useState('');
  const [showResidencePicker, setShowResidencePicker] = useState(false);
  const [city, setCity] = useState('New York');
  const [isCustomCity, setIsCustomCity] = useState(false);

  // Currency & Account Parameters
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [accountType, setAccountType] = useState<'Personal' | 'Business'>('Personal');
  const [professionCategory, setProfessionCategory] = useState<string>('Salarié');
  const [occupation, setOccupation] = useState('Salarié');

  // Income selection: Either bracket OR exact amount, never both simultaneously. Default empty!
  const [incomeBracket, setIncomeBracket] = useState<string>('');
  const [exactIncome, setExactIncome] = useState<string>('');
  const [activityDuration] = useState('5 years');

  // Server Processing Simulation for Step 5
  const [serverProcessingStep, setServerProcessingStep] = useState<number>(0);

  // Step 4: Digital Identity Documents (Real base64 DataURL uploaded by client)
  const [idFileName, setIdFileName] = useState<string | null>(null);
  const [idDocumentDataUrl, setIdDocumentDataUrl] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [proofAddressDataUrl, setProofAddressDataUrl] = useState<string | null>(null);

  const handleDocumentUpload = (type: 'id' | 'proof', file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (type === 'id') {
        setIdFileName(file.name);
        setIdDocumentDataUrl(dataUrl);
      } else {
        setProofFileName(file.name);
        setProofAddressDataUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 5: PIN
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Step 6: Generated Account Result
  const [generatedAccount, setGeneratedAccount] = useState<BankAccount | null>(null);
  const [generatedUser, setGeneratedUser] = useState<UserProfile | null>(null);

  // Filtered phone country list
  const filteredPhoneCountries = useMemo(() => {
    const q = phoneSearchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.nameEn.toLowerCase().includes(q) ||
        c.nameFr.toLowerCase().includes(q) ||
        c.nameEs.toLowerCase().includes(q) ||
        c.nameAr.includes(q) ||
        c.dialCode.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [phoneSearchQuery]);

  // Filtered residence country list
  const filteredResidenceCountries = useMemo(() => {
    const q = residenceSearchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.nameEn.toLowerCase().includes(q) ||
        c.nameFr.toLowerCase().includes(q) ||
        c.nameEs.toLowerCase().includes(q) ||
        c.nameAr.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [residenceSearchQuery]);

  // Handle direct prefix typing in phone number input
  const handlePhoneInputChange = (val: string) => {
    // If user starts typing a dial code e.g. "+229" or "+33"
    const cleaned = val.trim();
    if (cleaned.startsWith('+')) {
      const match = COUNTRIES.find((c) => cleaned.startsWith(c.dialCode));
      if (match) {
        setSelectedPhoneCountry(match);
        const remainder = cleaned.slice(match.dialCode.length).trim();
        setPhoneNumberOnly(remainder);
        return;
      }
    }
    setPhoneNumberOnly(val.replace(/[^\d\s-]/g, ''));
  };

  if (!isOpen) return null;

  // Password complexity calculation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordMatch = password.length > 0 && password === confirmPassword;

  // Assistance strings by language (brief 1-2 line summary when collapsed + collapsible details)
  const stepAssistance = {
    step1: {
      en: {
        title: 'Step 1: Security Credentials',
        shortSummary: 'Enter a valid email and a master password (8+ chars) with numbers and letters.',
        why: 'Why this is required: To create your encrypted cryptographic vault credentials. Your password protects your private ledger.',
        format: 'Format: Email must be valid. Password must contain at least 8 characters with numbers and letters.',
        next: 'What happens next: An encrypted 6-digit one-time code will be dispatched to your email.'
      },
      fr: {
        title: 'Étape 1 : Identifiants de Sécurité',
        shortSummary: 'Saisissez une adresse email valide et un mot de passe sécurisé (8+ car.).',
        why: 'Pourquoi cette information est demandée : Pour générer vos identifiants cryptographiques sécurisés qui protègent votre coffre-fort bancaire.',
        format: 'Format requis : Adresse email valide. Mot de passe d’au moins 8 caractères contenant des chiffres et des lettres.',
        next: 'Ce qui se passe après : Un code de vérification sécurisé à 6 chiffres sera envoyé à votre adresse e-mail.'
      },
      es: {
        title: 'Paso 1: Credenciales de Seguridad',
        shortSummary: 'Ingrese un correo válido y una contraseña segura (8+ caracteres).',
        why: 'Por qué se solicita: Para crear sus credenciales criptográficas seguras que protegen su bóveda bancaria privada.',
        format: 'Formato: Correo electrónico válido. Contraseña de al menos 8 caracteres con números y letras.',
        next: 'Qué sucede después: Se enviará un código de verificación de 6 dígitos a su correo.'
      },
      ar: {
        title: 'الخطوة 1: بيانات اعتماد الأمان',
        shortSummary: 'أدخل بريداً إلكترونياً صالحاً وكلمة مرور قوية (8 أحرف فأكثر).',
        why: 'سبب طلب هذه البيانات: لإنشاء بيانات اعتماد مشفرة لحسابك المصرفي الخاص وحماية أصولك الرقمية.',
        format: 'المطلوب: بريد إلكتروني صالح. كلمة مرور مكونة من 8 أحرف على الأقل تحتوي على أرقام وحروف.',
        next: 'ماذا يحدث بعد المتابعة: سيتم إرسال رمز تحقق سري مكون من 6 أرقام إلى بريدك الإلكتروني.'
      }
    },
    step2: {
      en: {
        title: 'Step 2: Email OTP Verification',
        shortSummary: 'Enter the 6-digit verification code received by email (check spam if needed).',
        notice:
          "A verification code has been sent to your email address. Enter the 6-digit code to continue. If you don't see the email in your inbox, please check your Spam, Junk or Promotions folder.",
        why: 'Why this is required: Two-factor authentication (2FA) confirms that you own this email address and prevents unauthorized registration.',
        format: 'Format: Exactly 6 numeric digits (e.g. 849201).',
        next: 'What happens next: Upon code verification, your profile information and KYC setup will unlock.'
      },
      fr: {
        title: 'Étape 2 : Vérification du Code OTP par E-mail',
        shortSummary: 'Saisissez le code de sécurité à 6 chiffres reçu par e-mail (vérifiez vos spams si besoin).',
        notice:
          "Un code de vérification a été envoyé à votre adresse e-mail. Saisissez le code à 6 chiffres pour continuer. Si vous ne voyez pas le message dans votre boîte de réception, vérifiez vos dossiers Spam, Courrier indésirable ou Promotions.",
        why: 'Pourquoi cette information est demandée : L’authentification à deux facteurs (2FA) certifie votre identité et sécurise l’ouverture du compte.',
        format: 'Format : Exactement 6 chiffres numériques (ex. 849201).',
        next: 'Ce qui se passe après : Dès validation du code, le formulaire de profil et de personnalisation bancaire s’ouvrira.'
      },
      es: {
        title: 'Paso 2: Verificación de Código OTP por Correo',
        shortSummary: 'Ingrese el código de 6 dígitos recibido por correo (revise spam si es necesario).',
        notice:
          "Se ha enviado un código de verificación a su dirección de correo electrónico. Ingrese el código de 6 dígitos para continuar. Si no ve el correo en su bandeja de entrada, revise su carpeta de Spam, Correo no deseado o Promociones.",
        why: 'Por qué se solicita: La verificación en dos pasos (2FA) garantiza la propiedad del correo electrónico y la seguridad de su cuenta.',
        format: 'Formato: Exactamente 6 dígitos numéricos (ej. 849201).',
        next: 'Qué sucede después: Al validar el código, continuará con el registro de su información personal y KYC.'
      },
      ar: {
        title: 'الخطوة 2: التحقق من رمز OTP عبر البريد الإلكتروني',
        shortSummary: 'أدخل رمز الأمان المكون من 6 أرقام المستلم بالبريد (تفقد الرسائل غير المرغوب فيها).',
        notice:
          "تم إرسال رمز التحقق إلى عنوان بريدك الإلكتروني. أدخل الرمز المكون من 6 أرقام للمتابعة. إذا لم تجد الرسالة في صندوق الوارد، يرجى التحقق من مجلد الرسائل غير المرغوب فيها (Spam) أو العروض الترويجية.",
        why: 'سبب طلب هذه البيانات: المصادقة الثنائية (2FA) تضمن ملكيتك للبريد الإلكتروني وأمان حسابك المالي.',
        format: 'المطلوب: 6 أرقام رقمية فقط (مثال: 849201).',
        next: 'ماذا يحدث بعد المتابعة: بمجرد التحقق من صحة الرمز، ستنتقل إلى إكمال ملفك الشخصي والامتثال المصرفي.'
      }
    },
    step3: {
      en: {
        title: 'Step 3: Personal & Banking Profile',
        shortSummary: 'Fill in your legal identity, contact phone, residence and preferred currency.',
        why: 'Why this is required: International banking compliance (KYC/AML) mandates accurate identity, tax residence, and source of funds verification.',
        format: 'Format: Fill in your legal first and last name, select your phone country prefix, enter your phone number, select your country and city of residence, and choose your account currency.',
        next: 'What happens next: You will be asked to attach standard verification documents (identity document and proof of address).'
      },
      fr: {
        title: 'Étape 3 : Informations Personnelles & Profil Bancaire',
        shortSummary: 'Renseignez vos coordonnées d’identité légale, pays de résidence et devise.',
        why: 'Pourquoi cette information est demandée : La réglementation bancaire internationale (KYC/AML) exige la vérification légale de l’identité, de la résidence fiscale et de l’origine des fonds.',
        format: 'Format requis : Renseignez votre nom et prénom légaux, sélectionnez l’indicatif international de votre téléphone, votre pays de résidence, votre ville et votre devise principale.',
        next: 'Ce qui se passe après : Vous pourrez joindre vos documents justificatifs officiels (pièce d’identité et justificatif de domicile).'
      },
      es: {
        title: 'Paso 3: Información Personal y Perfil Bancario',
        shortSummary: 'Complete sus datos de identidad, teléfono, país de residencia y divisa.',
        why: 'Por qué se solicita: Las regulaciones bancarias internacionales (KYC/AML) exigen verificar la identidad, la residencia y el origen de los fondos.',
        format: 'Formato: Ingrese su nombre y apellido legales, prefijo telefónico internacional, teléfono, país y ciudad de residencia, y divisa principal.',
        next: 'Qué sucede después: Se le solicitará adjuntar sus documentos de verificación oficiales.'
      },
      ar: {
        title: 'الخطوة 3: المعلومات الشخصية والملف المصرفي',
        shortSummary: 'أدخل بيانات هويتك القانونية، ورقم الهاتف، ودولة الإقامة والعملة المصرفية.',
        why: 'سبب طلب هذه البيانات: تتطلب معايير الامتثال المصرفي الدولي (KYC/AML) التحقق القانوني من الهوية والإقامة ومصدر الدخل.',
        format: 'المطلوب: إدخال الاسم واللقب القانونيين، واختيار رمز الدولة لرقم الهاتف، وبلد ومدينة الإقامة، والعملة المصرفية المفضلة.',
        next: 'ماذا يحدث بعد المتابعة: سيُطلب منك إرفاق وثائق الهوية وإثبات العنوان الرسمية.'
      }
    },
    step4: {
      en: {
        title: 'Step 4: Digital KYC Compliance',
        shortSummary: 'Attach your government ID and recent utility bill / proof of address (optional).',
        why: 'Why this is required: Proof of identity and address are required by banking regulators to activate international payment rails.',
        format: 'Format: PDF, PNG or JPEG files (Passport, National ID Card, Utility Bill or Bank Statement).',
        next: 'What happens next: You will configure your 6-digit transaction authorization PIN.'
      },
      fr: {
        title: 'Étape 4 : Justificatifs de Conformité KYC',
        shortSummary: 'Téléversez vos justificatifs d’identité et de domicile récents (optionnel).',
        why: 'Pourquoi cette information est demandée : Les régulateurs bancaires exigent une pièce d’identité et un justificatif de domicile pour ouvrir les flux de virement internationaux.',
        format: 'Format requis : Fichiers PDF, PNG ou JPEG (Passeport, Carte Nationale d’Identité, Facture de domicile ou Relevé bancaire).',
        next: 'Ce qui se passe après : Vous définirez votre code PIN secret de transaction à 6 chiffres.'
      },
      es: {
        title: 'Paso 4: Cumplimiento de Identidad KYC',
        shortSummary: 'Adjunte su documento de identidad y comprobante de domicilio (opcional).',
        why: 'Por qué se solicita: Los reguladores bancarios requieren prueba de identidad y domicilio para activar las transferencias internacionales.',
        format: 'Formato: Archivos PDF, PNG o JPEG (Pasaporte, DNI, factura de servicios o extracto bancario).',
        next: 'Qué sucede después: Configurará su código PIN secreto de 6 dígitos.'
      },
      ar: {
        title: 'الخطوة 4: وثائق التحقق من الهوية (KYC)',
        shortSummary: 'أرفق وثيقة الهوية وإثبات العنوان الحديث (اختياري).',
        why: 'سبب طلب هذه البيانات: تتطلب الهيئات التنظيمية المصرفية وثيقة هوية وإثبات عنوان لتفعيل ميزات التحويل الدولي والبطاقات.',
        format: 'المطلوب: ملفات PDF أو PNG أو JPEG (جواز سفر، بطاقة هوية وطنية، أو فاتورة خدمات).',
        next: 'ماذا يحدث بعد المتابعة: ستقوم بتعيين رمز PIN السري المكون من 6 أرقام لتأكيد العمليات.'
      }
    },
    step5: {
      en: {
        title: 'Step 5: 6-Digit Transaction PIN',
        shortSummary: 'Create your 6-digit secret PIN to cryptographically authorize all wire transfers.',
        why: 'Why this is required: This personal PIN will cryptographically sign all outbound wire transfers, card commands, and sensitive banking orders.',
        format: 'Format: Exactly 6 numeric digits (e.g. 739104).',
        next: 'What happens next: Your account will be registered and your international IBAN, BIC/SWIFT, and Client ID will be generated immediately.'
      },
      fr: {
        title: 'Étape 5 : Code PIN de Transaction à 6 Chiffres',
        shortSummary: 'Créez votre code PIN secret à 6 chiffres pour signer et valider vos opérations.',
        why: 'Pourquoi cette information est demandée : Ce code PIN personnel signera cryptographiquement l’ensemble de vos virements sortants, ordres de trésorerie et commandes de cartes.',
        format: 'Format requis : Exactement 6 chiffres numériques (ex. 739104).',
        next: 'Ce qui se passe après : Votre compte sera officiellement activé et vos identifiants IBAN international, BIC/SWIFT et Identifiant Client seront générés en direct.'
      },
      es: {
        title: 'Paso 5: PIN de Transacción de 6 Dígitos',
        shortSummary: 'Cree su código PIN secreto de 6 dígitos para autorizar transferencias.',
        why: 'Por qué se solicita: Este código PIN autorizará criptográficamente todas sus transferencias salientes y gestiones de tarjetas.',
        format: 'Formato: Exactamente 6 dígitos numéricos (ej. 739104).',
        next: 'Qué sucede después: Su cuenta se activará y sus identificadores IBAN, BIC y Client ID se generarán de inmediato.'
      },
      ar: {
        title: 'الخطوة 5: رمز PIN للعمليات المصرفية (6 أرقام)',
        shortSummary: 'عيّن رمز PIN السري المكون من 6 أرقام لتوقيع وتأكيد كافة العمليات المصرفية.',
        why: 'سبب طلب هذه البيانات: يُستخدم هذا الرمز السري لتوقيع واعتماد جميع الحوالات المالية وإصدار البطاقات بأمان تام.',
        format: 'المطلوب: 6 أرقام رقمية فقط (مثال: 739104).',
        next: 'ماذا يحدث بعد المتابعة: سيتم إنشاء وتفعيل حسابك وتوليد رقم الآيبان الدولي ورمز السويفت فوراً.'
      }
    }
  };

  const currentAssistance = stepAssistance[`step${step}` as keyof typeof stepAssistance]?.[currentLang] ||
    stepAssistance[`step${step}` as keyof typeof stepAssistance]?.en;

  // Handlers
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(
        currentLang === 'fr'
          ? 'Veuillez saisir une adresse e-mail valide.'
          : currentLang === 'es'
          ? 'Por favor, ingrese un correo electrónico válido.'
          : currentLang === 'ar'
          ? 'يرجى إدخال عنوان بريد إلكتروني صالح.'
          : 'Please enter a valid email address.'
      );
      return;
    }

    if (!hasMinLength || !hasNumber) {
      setError(
        currentLang === 'fr'
          ? 'Le mot de passe doit comporter au moins 8 caractères et inclure au moins un chiffre.'
          : currentLang === 'es'
          ? 'La contraseña debe tener al menos 8 caracteres e incluir un número.'
          : currentLang === 'ar'
          ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل وتتضمن رقماً.'
          : 'Password must have at least 8 characters and include a number.'
      );
      return;
    }
    if (!passwordMatch) {
      setError(
        currentLang === 'fr'
          ? 'Les mots de passe ne correspondent pas.'
          : currentLang === 'es'
          ? 'Las contraseñas no coinciden.'
          : currentLang === 'ar'
          ? 'كلمات المرور غير متطابقة.'
          : 'Passwords do not match.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerStep1(email, password);
      if (res.success) {
        setStep(2);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError(
        currentLang === 'fr'
          ? 'Veuillez saisir exactement le code de vérification à 6 chiffres.'
          : currentLang === 'es'
          ? 'Por favor, ingrese exactamente el código de verificación de 6 dígitos.'
          : currentLang === 'ar'
          ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام بالكامل.'
          : 'Please enter the exact 6-digit verification code.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp(email, otp);
      if (res.success) {
        setStep(3);
      } else {
        setError(
          res.message ||
            (currentLang === 'fr'
              ? 'Code de vérification invalide ou expiré.'
              : currentLang === 'es'
              ? 'Código de verificación no válido o expirado.'
              : currentLang === 'ar'
              ? 'رمز التحقق غير صالح أو منتهي الصلاحية.'
              : 'Invalid or expired verification code.')
        );
      }
    } catch (err: any) {
      setError(err.message || 'Verification error.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullPhone = `${selectedPhoneCountry.dialCode} ${phoneNumberOnly.trim()}`;

    // Validate mandatory fields
    if (!lastName.trim()) {
      setError(currentLang === 'fr' ? 'Le champ Nom de famille est obligatoire.' : 'Last name is required.');
      return;
    }
    if (!firstName.trim()) {
      setError(currentLang === 'fr' ? 'Le champ Prénom est obligatoire.' : 'First name is required.');
      return;
    }
    if (!phoneNumberOnly.trim()) {
      setError(currentLang === 'fr' ? 'Le numéro de téléphone est obligatoire.' : 'Phone number is required.');
      return;
    }
    if (!city.trim()) {
      setError(currentLang === 'fr' ? 'La ville de résidence est obligatoire.' : 'City of residence is required.');
      return;
    }
    if (!occupation.trim()) {
      setError(currentLang === 'fr' ? 'La profession / activité est obligatoire.' : 'Professional occupation is required.');
      return;
    }
    const hasIncome = (incomeBracket && incomeBracket.trim() !== '') || (exactIncome && Number(exactIncome) > 0);
    if (!hasIncome) {
      setError(
        currentLang === 'fr'
          ? 'Veuillez sélectionner une tranche de salaire ou saisir un montant fixe.'
          : 'Please select an income bracket or enter a fixed amount.'
      );
      return;
    }

    setStep(4);
  };

  const handleStep4Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep(5);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError(
        currentLang === 'fr'
          ? 'Le code PIN de sécurité doit comporter exactement 6 chiffres.'
          : 'Security PIN must be exactly 6 digits.'
      );
      return;
    }
    if (pin !== confirmPin) {
      setError(
        currentLang === 'fr'
          ? 'La confirmation du code PIN ne correspond pas.'
          : 'PIN confirmation does not match.'
      );
      return;
    }

    setLoading(true);
    setServerProcessingStep(1);
    const t1 = setTimeout(() => setServerProcessingStep(2), 400);
    const t2 = setTimeout(() => setServerProcessingStep(3), 850);

    const fullPhone = `${selectedPhoneCountry.dialCode} ${phoneNumberOnly.trim()}`;
    const countryName = getLocalizedCountryName(selectedResidenceCountry, 'en');

    const calculatedMonthlyIncome = exactIncome
      ? Number(exactIncome)
      : incomeBracket === '0 - 2 000'
      ? 1500
      : incomeBracket === '2 000 - 5 000'
      ? 3500
      : incomeBracket === '5 000 - 10 000'
      ? 7500
      : incomeBracket === '10 000 - 25 000'
      ? 15000
      : incomeBracket === '25 000 ou plus'
      ? 30000
      : 0;

    try {
      const resPromise = api.submitApplication({
        email,
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: fullPhone,
        nationality: countryName,
        residence_country: countryName,
        city: city.trim(),
        preferred_currency: currency,
        account_type: accountType,
        occupation: occupation.trim(),
        monthly_income: calculatedMonthlyIncome,
        income_bracket: incomeBracket || undefined,
        id_document_name: idFileName || undefined,
        id_document_url: idDocumentDataUrl || undefined,
        proof_of_address_name: proofFileName || undefined,
        proof_of_address_url: proofAddressDataUrl || undefined,
        activity_duration: activityDuration,
        pin,
        referral_code: referralCode ? referralCode.trim() : undefined
      });

      // Quick 1.4s execution with visual server feedback
      const [res] = await Promise.all([
        resPromise,
        new Promise((resolve) => setTimeout(resolve, 1400))
      ]);

      if (res.success && res.account && res.user) {
        setGeneratedAccount(res.account);
        setGeneratedUser(res.user);
        setStep(6);
        localStorage.removeItem('movafi_referral_ref');
        localStorage.removeItem('movafi_referral_expiry');
      } else {
        setError(res.message || 'Account registration failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Submission error.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
      setServerProcessingStep(0);
    }
  };

  const handleCompleteAndEnter = () => {
    if (generatedUser && generatedAccount) {
      onSuccess(generatedUser, generatedAccount);
      onClose();
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-xl my-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <MovafiLogo size="sm" layout="horizontal" />
            <div className="hidden sm:block">
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                {currentLang === 'fr'
                  ? 'Ouverture de Compte Digital'
                  : currentLang === 'es'
                  ? 'Apertura de Cuenta Digital'
                  : currentLang === 'ar'
                  ? 'فتح حساب مصرفي رقمي'
                  : 'Open Digital Banking Account'}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {currentLang === 'fr'
                  ? 'Movafibank · Banque Privée & Trésorerie'
                  : currentLang === 'es'
                  ? 'Movafibank · Banca Privada y Tesorería'
                  : currentLang === 'ar'
                  ? 'موفافيبانك · الخدمات المصرفية والخزينة'
                  : 'Movafibank · Institutional Wealth & Treasury'}
              </p>
            </div>
          </div>

          {step !== 6 && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Stepper Progress Bar */}
        {step !== 6 && (
          <div className="shrink-0 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {currentLang === 'fr' ? `Étape ${step} sur 5` : currentLang === 'ar' ? `الخطوة ${step} من 5` : `Step ${step} of 5`}
              </span>
              <span>
                {step === 1 && (currentLang === 'fr' ? 'Identifiants' : 'Security Credentials')}
                {step === 2 && (currentLang === 'fr' ? 'Vérification Email' : 'Email Verification')}
                {step === 3 && (currentLang === 'fr' ? 'Profil Client' : 'Client Profile')}
                {step === 4 && (currentLang === 'fr' ? 'Conformité KYC' : 'KYC Compliance')}
                {step === 5 && (currentLang === 'fr' ? 'Code PIN Secret' : 'Security PIN')}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 h-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-full rounded-full transition-colors ${
                    step >= s ? 'bg-amber-600' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Compact Assistance Card with Collapsible Details (Brief 1-2 lines by default) */}
        {step !== 6 && currentAssistance && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 shrink-0 transition-all">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <HelpCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className={`text-[11px] text-amber-900 dark:text-amber-200 leading-snug font-medium truncate ${isHelpExpanded ? '' : 'line-clamp-1'}`}>
                  {(currentAssistance as any).shortSummary || currentAssistance.format || currentAssistance.why || ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpExpanded(!isHelpExpanded)}
                className="text-[10px] font-bold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 flex items-center gap-1 shrink-0 cursor-pointer bg-amber-200/60 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-900 px-2 py-0.5 rounded-md transition-colors"
              >
                <span>
                  {isHelpExpanded
                    ? (currentLang === 'fr' ? 'Voir moins' : currentLang === 'es' ? 'Ver menos' : currentLang === 'ar' ? 'عرض أقل' : 'Show less')
                    : (currentLang === 'fr' ? 'Voir plus / Tout lire' : currentLang === 'es' ? 'Ver más / Leer todo' : currentLang === 'ar' ? 'عرض المزيد / قراءة الكل' : 'Read more')}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isHelpExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Collapsible expanded full guidance */}
            {isHelpExpanded && (
              <div className="pt-2 mt-1.5 border-t border-amber-200/70 dark:border-amber-900/50 space-y-1.5 text-[10.5px] animate-in fade-in duration-150">
                <div className="font-bold text-amber-800 dark:text-amber-300 text-xs">
                  {currentAssistance.title || (currentLang === 'fr' ? 'Aide & Instructions' : 'Guidance')}
                </div>
                {currentAssistance.why && (
                  <p className="leading-relaxed opacity-95">
                    <strong className="text-amber-950 dark:text-amber-100">{currentLang === 'fr' ? 'Pourquoi : ' : 'Why: '}</strong>
                    {currentAssistance.why}
                  </p>
                )}
                {currentAssistance.format && (
                  <p className="leading-relaxed font-medium">
                    <strong className="text-amber-950 dark:text-amber-100">{currentLang === 'fr' ? 'Format requis : ' : 'Format: '}</strong>
                    {currentAssistance.format}
                  </p>
                )}
                {currentAssistance.next && (
                  <p className="leading-relaxed text-[10px] opacity-80">
                    <strong className="text-amber-950 dark:text-amber-100">{currentLang === 'fr' ? 'Étape suivante : ' : 'Next: '}</strong>
                    {currentAssistance.next}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* STEP 1: SECURITY CREDENTIALS */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {currentLang === 'fr' ? 'Adresse E-mail Professionnelle ou Personnelle' : 'Professional or Personal Email'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@domaine.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {currentLang === 'fr' ? 'Mot de passe sécurisé' : 'Master Security Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {currentLang === 'fr' ? 'Confirmer le mot de passe' : 'Confirm Master Password'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Password criteria chips */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] space-y-1 text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={hasMinLength ? 'text-emerald-500 font-bold' : ''}>
                    • {currentLang === 'fr' ? '8+ caractères' : currentLang === 'es' ? '8+ caracteres' : currentLang === 'ar' ? '8+ أحرف' : '8+ characters'}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className={hasNumber ? 'text-emerald-500 font-bold' : ''}>
                    • {currentLang === 'fr' ? 'Inclut un chiffre' : currentLang === 'es' ? 'Incluye un número' : currentLang === 'ar' ? 'يتضمن رقماً' : 'Includes a number'}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className={passwordMatch ? 'text-emerald-500 font-bold' : ''}>
                    • {currentLang === 'fr' ? 'Mots de passe identiques' : currentLang === 'es' ? 'Contraseñas coinciden' : currentLang === 'ar' ? 'كلمات المرور متطابقة' : 'Passwords match'}
                  </span>
                </div>
              </div>

              {/* Referral Code (Optional) */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t.referralCodeOptional || 'Code de parrainage (optionnel)'}
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="MOV-8K4P2X"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {referrerHint && (
                  <div className="mt-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.invitedByMember || 'Vous avez été invité par un membre de Movafi Bank.'} ({referrerHint})</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4"
              >
                <span>{loading ? (currentLang === 'fr' ? 'Génération de l’envoi...' : 'Sending code...') : (currentLang === 'fr' ? 'Envoyer le code OTP de vérification' : 'Send Verification OTP')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: REAL 6-DIGIT EMAIL OTP (Rule 9, 10, 11) */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="truncate">
                    {currentLang === 'fr' ? 'Code expédié à ' : 'Code sent to '}
                    <strong className="font-mono text-amber-950 dark:text-white">{email}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 shrink-0 font-bold bg-amber-200/50 dark:bg-amber-900/50 px-2 py-0.5 rounded-md">
                  15 min
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                  {currentLang === 'fr' ? 'Saisissez le code à 6 chiffres' : 'Enter 6-Digit Verification Code'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.5em] font-mono font-bold text-2xl py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <p className="text-[11px] text-slate-400 text-center mt-1">
                  {otp.length}/6 {currentLang === 'fr' ? 'chiffres saisis' : 'digits entered'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{currentLang === 'fr' ? 'Retour' : 'Back'}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                    otp.length === 6 && !loading
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>{loading ? (currentLang === 'fr' ? 'Vérification...' : 'Verifying...') : (currentLang === 'fr' ? 'Valider le code' : 'Verify Code')}</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PERSONAL & BANKING PROFILE (Rule 13, 14, 15, 16) */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-3.5">
              {/* Name & First Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {currentLang === 'fr' ? 'Nom de famille (Last Name) *' : 'Legal Last Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={currentLang === 'fr' ? 'Ex: Dupont' : 'Ex: Vance'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {currentLang === 'fr' ? 'Prénom (First Name) *' : 'Legal First Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={currentLang === 'fr' ? 'Ex: Jean' : 'Ex: Alexander'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* International Phone with Country Selector (Rule 14) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {currentLang === 'fr' ? 'Téléphone de contact (Indicatif + Numéro) *' : 'Contact Phone (Country Code + Number) *'}
                </label>
                <div className="flex gap-2">
                  {/* Country Dial Picker Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPhoneCountryPicker(!showPhoneCountryPicker)}
                      className="h-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      <span className="text-base">{selectedPhoneCountry.flag}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {getLocalizedCountryName(selectedPhoneCountry, currentLang)}
                      </span>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                        {selectedPhoneCountry.dialCode}
                      </span>
                    </button>

                    {/* Dropdown with search */}
                    {showPhoneCountryPicker && (
                      <div className="absolute z-30 left-0 top-full mt-1 w-72 max-h-60 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 space-y-1">
                        <div className="sticky top-0 bg-white dark:bg-slate-900 pb-1.5">
                          <input
                            type="text"
                            value={phoneSearchQuery}
                            onChange={(e) => setPhoneSearchQuery(e.target.value)}
                            placeholder={currentLang === 'fr' ? 'Rechercher pays ou indicatif...' : 'Search country or code...'}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                          />
                        </div>
                        {filteredPhoneCountries.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setSelectedPhoneCountry(c);
                              setShowPhoneCountryPicker(false);
                              setPhoneSearchQuery('');
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-amber-500/10 text-left flex items-center justify-between text-xs cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span>{c.flag}</span>
                              <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[130px]">
                                {getLocalizedCountryName(c, currentLang)}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-amber-600">{c.dialCode}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Phone Number Input */}
                  <div className="flex-1">
                    <input
                      type="tel"
                      required
                      value={phoneNumberOnly}
                      onChange={(e) => handlePhoneInputChange(e.target.value)}
                      placeholder="97 00 11 22"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Country of Residence & City / State of Residence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Country of Residence */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {currentLang === 'fr' ? 'Pays de résidence *' : 'Country of Residence *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowResidencePicker(!showResidencePicker)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-left flex items-center justify-between cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{selectedResidenceCountry.flag}</span>
                      <span className="text-slate-800 dark:text-slate-200 truncate">
                        {getLocalizedCountryName(selectedResidenceCountry, currentLang)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </button>

                  {/* Searchable Residence Country Dropdown */}
                  {showResidencePicker && (
                    <div className="absolute z-30 left-0 top-full mt-1 w-full max-h-60 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 space-y-1">
                      <div className="sticky top-0 bg-white dark:bg-slate-900 pb-1.5">
                        <input
                          type="text"
                          value={residenceSearchQuery}
                          onChange={(e) => setResidenceSearchQuery(e.target.value)}
                          placeholder={currentLang === 'fr' ? 'Filtrer les pays...' : 'Search country...'}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                      {filteredResidenceCountries.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setSelectedResidenceCountry(c);
                            setShowResidencePicker(false);
                            setResidenceSearchQuery('');
                            setIsCustomCity(false);
                            if (c.cities && c.cities.length > 0) {
                              setCity(c.cities[0]);
                            } else {
                              setCity('');
                              setIsCustomCity(true);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-amber-500/10 text-left flex items-center gap-2 text-xs cursor-pointer"
                        >
                          <span>{c.flag}</span>
                          <span className="text-slate-800 dark:text-slate-200">
                            {getLocalizedCountryName(c, currentLang)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* City of Residence (Display ALL cities of selected country) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {currentLang === 'fr' ? 'Ville de résidence *' : 'City of Residence *'}
                    </label>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      {selectedResidenceCountry.cities.length} {currentLang === 'fr' ? 'villes' : 'cities'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <select
                      value={selectedResidenceCountry.cities.includes(city) ? city : 'custom'}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomCity(true);
                          setCity('');
                        } else {
                          setIsCustomCity(false);
                          setCity(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-amber-500 shadow-sm"
                    >
                      <option value="" disabled>
                        {currentLang === 'fr'
                          ? `Sélectionner une ville (${selectedResidenceCountry.flag} ${getLocalizedCountryName(selectedResidenceCountry, currentLang)})...`
                          : `Select a city (${selectedResidenceCountry.nameEn})...`}
                      </option>
                      {selectedResidenceCountry.cities.map((ct) => (
                        <option key={ct} value={ct}>
                          {ct}
                        </option>
                      ))}
                      <option value="custom">
                        {currentLang === 'fr' ? '➕ Autre ville (saisie libre manuelle)...' : '➕ Other city (manual entry)...'}
                      </option>
                    </select>

                    {isCustomCity && (
                      <input
                        type="text"
                        required
                        autoFocus
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={currentLang === 'fr' ? 'Saisissez le nom exact de votre ville...' : 'Type your city name...'}
                        className="w-full px-3 py-2 rounded-xl border border-amber-400 dark:border-amber-600 bg-amber-50/40 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Currency Selector (Rule 15: USD, EUR, CAD, TND, JPY, SAR, AED, BHD, MXN) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {currentLang === 'fr' ? 'Devise principale du compte *' : 'Primary Account Currency *'}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="USD">USD — Dollar ($ / USD)</option>
                    <option value="EUR">EUR — Euro (€ / EUR)</option>
                    <option value="CAD">CAD — Dollar Canadien (C$ / CAD)</option>
                    <option value="TND">TND — Dinar Tunisien (TND)</option>
                    <option value="JPY">JPY — Yen Japonais (¥ / JPY)</option>
                    <option value="AED">AED — Dirham des Émirats (AED)</option>
                    <option value="SAR">SAR — Riyal Saoudien (SAR)</option>
                    <option value="BHD">BHD — Dinar de Bahreïn (BHD)</option>
                    <option value="MXN">MXN — Peso Mexicain ($ / MXN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {currentLang === 'fr' ? 'Structure du compte *' : 'Account Structure *'}
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as 'Personal' | 'Business')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Personal">
                      {currentLang === 'fr' ? 'Compte Privé (Private Wealth)' : 'Private Wealth (Personal)'}
                    </option>
                    <option value="Business">
                      {currentLang === 'fr' ? 'Trésorerie d’Entreprise (Corporate)' : 'Corporate Treasury (Business)'}
                    </option>
                  </select>
                </div>
              </div>

              {/* Profession (Dropdown category + Direct text input) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {currentLang === 'fr' ? 'Profession / Activité économique *' : 'Professional Occupation *'}
                  </label>
                  <div className="space-y-1.5">
                    <select
                      value={professionCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProfessionCategory(val);
                        if (val && val !== 'autre') {
                          setOccupation(val);
                        } else if (val === 'autre') {
                          setOccupation('');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-amber-500 shadow-sm"
                    >
                      <option value="Salarié">{currentLang === 'fr' ? 'Salarié' : 'Salaried Employee'}</option>
                      <option value="Retraité">{currentLang === 'fr' ? 'Retraité' : 'Retired'}</option>
                      <option value="Étudiant">{currentLang === 'fr' ? 'Étudiant' : 'Student'}</option>
                      <option value="Travailleur indépendant à son compte">
                        {currentLang === 'fr' ? 'Travailleur indépendant à son compte' : 'Self-employed / Freelance'}
                      </option>
                      <option value="autre">
                        {currentLang === 'fr' ? 'Autre / Préciser sa profession (saisie libre)...' : 'Other / Custom occupation...'}
                      </option>
                    </select>

                    <input
                      type="text"
                      required
                      value={occupation}
                      onChange={(e) => {
                        setOccupation(e.target.value);
                        if (professionCategory !== 'autre' && e.target.value !== professionCategory) {
                          setProfessionCategory('autre');
                        }
                      }}
                      placeholder={currentLang === 'fr' ? 'Précisez votre poste ou métier exact...' : 'Specify job title or role...'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Monthly Income: EITHER bracket OR exact amount, never both simultaneously */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {currentLang === 'fr'
                        ? `Revenus mensuels (${currency}) *`
                        : `Monthly Income (${currency}) *`}
                    </label>
                    {incomeBracket ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold font-mono">
                        {incomeBracket}
                      </span>
                    ) : exactIncome ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                        {exactIncome} {currency}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <select
                        value={incomeBracket}
                        onChange={(e) => {
                          const val = e.target.value;
                          setIncomeBracket(val);
                          setExactIncome(''); // LE CHAMP MONTANT FIXE DOIT RESTER VIDE !
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-amber-500 shadow-sm"
                      >
                        <option value="">{currentLang === 'fr' ? '-- Choisir une tranche (ou montant fixe ci-dessous) --' : '-- Choose a bracket (or fixed amount below) --'}</option>
                        <option value="0 - 2 000">Entre 0 et 2 000 {currency}</option>
                        <option value="2 000 - 5 000">Entre 2 000 et 5 000 {currency}</option>
                        <option value="5 000 - 10 000">Entre 5 000 et 10 000 {currency}</option>
                        <option value="10 000 - 25 000">Entre 10 000 et 25 000 {currency}</option>
                        <option value="25 000 ou plus">25 000 {currency} ou plus</option>
                      </select>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        value={exactIncome}
                        onChange={(e) => {
                          setExactIncome(e.target.value);
                          setIncomeBracket(''); // DÉSACTIVE LA TRANCHE SI SAISIE D'UN MONTANT FIXE !
                        }}
                        placeholder={currentLang === 'fr' ? 'Ou saisir un montant fixe (ex: 4500)...' : 'Or enter exact fixed amount...'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-amber-500 pr-14"
                      />
                      <span className="absolute right-3 top-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{currentLang === 'fr' ? 'Retour' : 'Back'}</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-md"
                >
                  <span>{currentLang === 'fr' ? 'Continuer vers la conformité KYC' : 'Continue to KYC Compliance'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: KYC DOCUMENTS */}
          {step === 4 && (
            <form onSubmit={handleStep4Submit} className="space-y-4">
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {currentLang === 'fr' ? 'Pièce d’identité officielle / Passeport' : 'Official ID / Passport'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {idFileName || (currentLang === 'fr' ? 'Aucun fichier sélectionné (optionnel)' : 'No file selected (optional)')}
                      </div>
                    </div>
                  </div>
                  <label className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-colors">
                    <span>{currentLang === 'fr' ? 'Parcourir' : 'Browse'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocumentUpload('id', file);
                      }}
                    />
                  </label>
                </div>

                <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {currentLang === 'fr' ? 'Justificatif de domicile récent (< 3 mois)' : 'Proof of Address (< 3 months)'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {proofFileName || (currentLang === 'fr' ? 'Aucun fichier sélectionné (optionnel)' : 'No file selected (optional)')}
                      </div>
                    </div>
                  </div>
                  <label className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-colors">
                    <span>{currentLang === 'fr' ? 'Parcourir' : 'Browse'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocumentUpload('proof', file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{currentLang === 'fr' ? 'Retour' : 'Back'}</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-md"
                >
                  <span>{currentLang === 'fr' ? 'Continuer vers le code PIN' : 'Continue to Security PIN'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: 6-DIGIT TRANSACTION PIN */}
          {step === 5 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {currentLang === 'fr' ? 'Définir votre code PIN secret à 6 chiffres' : 'Set 6-Digit Transaction PIN'}
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="w-full text-center tracking-[0.5em] font-mono font-bold text-2xl py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {currentLang === 'fr' ? 'Confirmer le code PIN secret à 6 chiffres' : 'Confirm 6-Digit Transaction PIN'}
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.5em] font-mono font-bold text-2xl py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{currentLang === 'fr' ? 'Retour' : 'Back'}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || pin.length !== 6 || confirmPin.length !== 6}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-md ${
                    pin.length === 6 && confirmPin.length === 6 && !loading
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>
                    {loading
                      ? (currentLang === 'fr' ? 'Génération sécurisée...' : currentLang === 'es' ? 'Generando cuenta...' : currentLang === 'ar' ? 'جارٍ إنشاء الحساب...' : 'Generating account...')
                      : (currentLang === 'fr' ? 'Générer les informations de mon compte' : currentLang === 'es' ? 'Generar información de la cuenta' : currentLang === 'ar' ? 'إنشاء بيانات الحساب' : 'Generate Account Information')}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* Animated Fast Server Processing Overlay */}
          {loading && serverProcessingStep > 0 && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md rounded-3xl text-center space-y-4 animate-in fade-in duration-200">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400 animate-spin" />
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Server className="w-7 h-7 animate-pulse" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-sm">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-semibold text-xs border border-amber-500/20">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Serveur Central Sécurisé · Traitement en direct</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Génération des informations du compte
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  {serverProcessingStep === 1 && 'Chiffrement et sécurisation des protocoles bancaires...'}
                  {serverProcessingStep === 2 && 'Allocation du numéro de compte, IBAN et BIC...'}
                  {serverProcessingStep >= 3 && 'Inscription sur le grand livre sécurisé Movafi Bank...'}
                </p>
              </div>

              <div className="w-52 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-500"
                  style={{
                    width: serverProcessingStep === 1 ? '35%' : serverProcessingStep === 2 ? '70%' : '95%'
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 6: APPLICATION COMPLETED & INACTIVE STATUS CONFIRMATION (REQUIREMENT 8) */}
          {step === 6 && generatedAccount && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner border border-amber-500/20">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold text-[11px] border border-amber-500/20">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>{t.accountInactiveBadge || 'Statut du compte : Inactif — En attente d\'approbation administrative'}</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {t.applicationSubmittedTitle || 'Demande d’ouverture de compte envoyée'}
                </h3>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-lg mx-auto bg-slate-100/70 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  « {t.accountInactiveNotice || 'Votre demande d’ouverture de compte a été envoyée. Un administrateur va examiner votre dossier et traiter votre demande. Votre compte restera inactif jusqu’à son approbation et son activation.'} »
                </p>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.noFixedDelayNotice || 'Aucun délai fixe n’est garanti. Vous recevrez une notification par e-mail dès le traitement de votre dossier.'}
                </p>
              </div>

              {/* Banking Identifiers for client's record */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {currentLang === 'fr' ? 'Coordonnées du Dossier Déposé' : currentLang === 'es' ? 'Datos del Expediente' : currentLang === 'ar' ? 'بيانات الملف المصرفي' : 'Application Dossier Coordinates'}
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">
                    {currentLang === 'fr' ? 'Identifiant Client' : currentLang === 'es' ? 'Identificador de Cliente' : currentLang === 'ar' ? 'معرّف العميل' : 'Client ID'}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {generatedAccount.client_id}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">
                    {currentLang === 'fr' ? 'Numéro de Compte' : currentLang === 'es' ? 'Número de Cuenta' : currentLang === 'ar' ? 'رقم الحساب' : 'Account Number'}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {generatedAccount.account_number}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">
                    {currentLang === 'fr' ? 'IBAN International' : currentLang === 'es' ? 'IBAN Internacional' : currentLang === 'ar' ? 'الآيبان الدولي' : 'International IBAN'}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white break-all text-[11px]">
                    {generatedAccount.iban}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">
                    {currentLang === 'fr' ? 'Code BIC / SWIFT' : currentLang === 'es' ? 'Código BIC / SWIFT' : currentLang === 'ar' ? 'رمز السويفت BIC' : 'BIC / SWIFT'}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {generatedAccount.bic_swift}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">
                    {currentLang === 'fr' ? 'Devise Principale' : currentLang === 'es' ? 'Divisa Principal' : currentLang === 'ar' ? 'العملة الأساسية' : 'Primary Currency'}
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {generatedAccount.currency}
                  </span>
                </div>
              </div>

              {/* Customer Service mailto: link */}
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300">
                  {t.contactSupportPrompt || 'Pour toute question concernant votre dossier, contactez le service client :'}
                </span>
                <a
                  href={`mailto:${supportEmail}?subject=Dossier%20Ouverture%20Compte%20${generatedAccount.client_id}`}
                  className="font-bold text-amber-600 dark:text-amber-400 underline hover:no-underline inline-flex items-center gap-1.5 shrink-0"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{supportEmail}</span>
                </a>
              </div>

              {/* Return to Home (Requirement 8: Replace Access My Banking Space) */}
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t.backToHome || 'Retour à l\'accueil'}</span>
                <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
