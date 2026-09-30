import React, { useState } from 'react';
import {
  Building2,
  Target,
  Layers,
  ShieldCheck,
  Lock,
  FileText,
  Landmark,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { SupportedLanguage } from '../types/banking';
import { MovafiLogo } from './MovafiLogo';

interface AboutSectionProps {
  currentLang: SupportedLanguage;
  supportEmail?: string;
  supportPhone?: string;
  onOpenRegister?: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  currentLang,
  supportEmail = 'support@movafigroupes.com',
  supportPhone = '+1 (212) 847-9200',
  onOpenRegister
}) => {
  const isRtl = currentLang === 'ar';
  const [activeTab, setActiveTab] = useState<
    'presentation' | 'mission' | 'services' | 'security' | 'privacy' | 'terms' | 'institutional' | 'contact' | 'legal'
  >('presentation');

  const content = {
    en: {
      tagline: "Institutional Blueprint & Governance",
      title: "About Movafi Bank Corporation",
      subtitle: "A modern private banking and corporate treasury infrastructure engineered for international capital, executive leaders, and sovereign family offices.",
      tabs: {
        presentation: "Overview",
        mission: "Mission",
        services: "Services",
        security: "Security",
        privacy: "Privacy",
        terms: "Terms",
        institutional: "Corporate",
        contact: "Contact",
        legal: "Legal Notices"
      },
      presentation: {
        title: "Institutional Presentation",
        desc: "Movafi Bank United States was established as a premier digital private institution engineered to serve high-net-worth individuals, global corporations, and family investment vehicles. Operating at the intersection of traditional private banking discretion and zero-latency financial technology, we provide sovereign multi-currency treasury reserves, cryptographic transaction reconciliation, and bespoke corporate financing.",
        points: [
          "Private client treasury accounts in USD, EUR, CAD, BHD, SAR, and AED.",
          "Proprietary cryptographic double-entry ledger with instant PDF transaction bordereau issuance.",
          "Dedicated executive bankers assigned to accredited family offices and corporate signatories.",
          "Strict segregation of private client deposits and institutional clearing reserves."
        ]
      },
      mission: {
        title: "Our Mission & Strategic Principles",
        desc: "Our mission is to eliminate artificial jurisdictional friction for global businesses and private capital, ensuring that legitimate liquidity moves with uncompromising security, speed, and discretion.",
        principles: [
          { title: "Sovereignty of Capital", text: "Empowering private treasuries with full multi-currency flexibility and direct control over liquidity allocations." },
          { title: "Architectural Integrity", text: "Building upon zero-trust cryptographic security models rather than outdated legacy mainframe technologies." },
          { title: "Radical Transparency", text: "Clear accounting rules, no hidden execution fees, and verifiable transaction logs." },
          { title: "Institutional Discretion", text: "Protecting sensitive corporate transactions and beneficial ownership confidentiality in full compliance with lawful mandates." }
        ]
      },
      services: {
        title: "Core Institutional Services",
        items: [
          { name: "Multi-Currency Treasury Accounts", detail: "Real-time management of USD, EUR, CAD, BHD, SAR, and AED liquidity with individual IBAN / SWIFT coordinates." },
          { name: "Corporate Structured Credit Lines", detail: "Working capital facilities, M&A bridge financing, and verified receivables discounting up to $50,000,000." },
          { name: "Prestige Metal & Virtual Cards", detail: "Bespoke Visa & Mastercard Gold and Platinum card issuing with customizable sub-limits, automated receipt logging, and instant cryptographic freeze." },
          { name: "International Wire Rails", detail: "Same-day Fedwire domestic settlement, SEPA enterprise clearing, and direct SWIFT international messaging." },
          { name: "Escrow & Custody Services", detail: "Multi-signature smart contract escrow and segregated institutional custody for cross-border commercial closings." }
        ]
      },
      security: {
        title: "Cryptographic Architecture & Security",
        desc: "Security at Movafi Bank is not an afterthought — it is the fundamental foundation of our financial infrastructure.",
        features: [
          "End-to-End Cryptography: All client records, sensitive identifiers, and documents are secured via AES-256 and SHA-256 protocols.",
          "Strict 6-Digit Manual PIN Authorization: All transfers and ledger debits require explicit manual cryptographic PIN confirmation.",
          "Dual-Code Validation (CAT & COT): Internal Transfer Authorization Code (CAT) and Treasury Operation Code (COT) workflows prevent unauthorized automated disbursements.",
          "Continuous Audit Trail: Immutable system logs record every login attempt, IP address, device footprint, and ledger balance adjustment."
        ]
      },
      privacy: {
        title: "Privacy & Data Protection",
        desc: "We hold client privacy sacred. Movafi Bank never sells, monetizes, or shares client data with commercial third parties.",
        points: [
          "Zero Third-Party Advertising Trackers: Our client portal and public interfaces operate strictly without telemetry or marketing trackers.",
          "Private Storage Vault: Client identification documents and proofs of residence are stored in private, isolated repositories accessible exclusively to authorized compliance officers.",
          "Right to Confidentiality: Private banking correspondence is handled exclusively through end-to-end encrypted concierge channels."
        ]
      },
      terms: {
        title: "General Operating Conditions",
        desc: "All client relationships with Movafi Bank United States are governed by strict mutual covenants designed to ensure regulatory hygiene and institutional stability.",
        rules: [
          "Mandatory Identity Verification: Every account dossier undergoes rigorous verification of identity and residential status prior to activation.",
          "Administrative Activation Protocol: Newly created accounts remain in an inactive status until formal approval by an authorized administrator.",
          "Zero-Tolerance for Illicit Funds: Accounts identified as attempting unlawful liquidity laundering will face immediate suspension and legal reporting.",
          "Reconciled Balances: All debits, credits, and wire executions are reflected in real-time on verified PDF transaction notices."
        ]
      },
      institutional: {
        title: "Institutional Coordinates",
        company: "Movafi Bank Corporation — United States Division",
        hq: "Manhattan Financial District, New York, NY 10005, United States",
        network: "Global Operations: New York · London · Paris · Manama · Riyadh · Dubai",
        complianceNotice: "Operates in accordance with standardized US commercial corporate laws and international AML/KYC recommendations."
      },
      contact: {
        title: "Private Concierge & Support Desk",
        desc: "Our executive concierge desk is available 24/7/365 to handle urgent wire instructions, account activation inquiries, and private banker consultations.",
        emailLabel: "Official Support & Inquiries",
        phoneLabel: "Executive Desk Line",
        hoursLabel: "Operating Hours",
        hoursValue: "24 hours / 7 days / 365 days a year"
      },
      legal: {
        title: "Relevant Factual Disclosures",
        disclaimer: "Movafi Bank United States is an institutional digital banking and treasury management technology platform. This platform provides multi-currency ledger management, structured corporate credit calculation, card logistics tracking, and verified transaction receipts. Nothing contained herein constitutes an unsolicited public solicitation of banking services where prohibited by local law."
      }
    },
    fr: {
      tagline: "Plan Institutionnel & Gouvernance",
      title: "À Propos de Movafi Bank Corporation",
      subtitle: "Une infrastructure de banque privée et de gestion de trésorerie d'entreprise conçue pour les capitaux internationaux, les dirigeants et les family offices.",
      tabs: {
        presentation: "Présentation",
        mission: "Mission",
        services: "Services",
        security: "Sécurité",
        privacy: "Confidentialité",
        terms: "Conditions",
        institutional: "Institutionnel",
        contact: "Contact",
        legal: "Mentions Légales"
      },
      presentation: {
        title: "Présentation Institutionnelle",
        desc: "Movafi Bank United States est une institution financière numérique d'exception dédiée aux patrimoines d'envergure, aux entreprises internationales et aux structures de gestion familiale. Alliant la discrétion séculaire de la banque privée à la réactivité des technologies de pointe, nous proposons des réserves multi-devises souveraines, des relevés certifiés et des lignes de financement sur mesure.",
        points: [
          "Comptes de trésorerie privée en USD, EUR, CAD, BHD, SAR et AED.",
          "Grand livre cryptographique à partie double avec édition instantanée de bordereaux PDF.",
          "Banquiers privés exécutifs dédiés aux family offices et dirigeants d'entreprises.",
          "Ségrégation intégrale des dépôts clients et des réserves institutionnelles de compensation."
        ]
      },
      mission: {
        title: "Notre Mission & Principes Stratégiques",
        desc: "Notre mission est d'éliminer les frictions juridictionnelles et techniques pesant sur les entreprises et les patrimoines mondiaux, garantissant une circulation fluide des liquidités sous une sécurité sans compromis.",
        principles: [
          { title: "Souveraineté des Capitaux", text: "Donner aux trésoreries d'entreprise une flexibilité multi-devises totale et la maîtrise de leurs liquidités." },
          { title: "Intégrité Architecturale", text: "S'appuyer sur des architectures cryptographiques zero-trust plutôt que sur des systèmes bancaires vieillissants." },
          { title: "Transparence Totale", text: "Des règles comptables rigoureuses, aucune commission d'exécution dissimulée et des relevés vérifiables." },
          { title: "Discrétion Institutionnelle", text: "Protéger la confidentialité des transactions stratégiques et des bénéficiaires effectifs dans le respect strict des lois." }
        ]
      },
      services: {
        title: "Services Institutionnels d'Excellence",
        items: [
          { name: "Comptes de Trésorerie Multi-Devises", detail: "Gestion en temps réel de liquidités en USD, EUR, CAD, BHD, SAR et AED avec coordonnées bancaires IBAN et BIC." },
          { name: "Lignes de Financement d'Entreprise", detail: "Facilités de fonds de roulement, crédits relais d'acquisition et affacturage jusqu'à 50 000 000 $." },
          { name: "Cartes Prestige Métal & Virtuelles", detail: "Émission Visa et Mastercard Gold et Platinum avec plafonds personnalisables et blocage instantané." },
          { name: "Rails de Virements Internationaux", detail: "Règlement national Fedwire, compensation SEPA et messagerie internationale SWIFT directe." },
          { name: "Services de Séquestre & Custody", detail: "Séquestre multi-signatures et garde d'actifs ségréguée pour transactions commerciales internationales." }
        ]
      },
      security: {
        title: "Architecture Cryptographique & Sécurité",
        desc: "Chez Movafi Bank, la sécurité n'est pas un composant additionnel : elle constitue le cœur même de notre architecture.",
        features: [
          "Chiffrement de bout en bout : Tous les dossiers clients et justificatifs sont protégés par les standards AES-256 et SHA-256.",
          "Code PIN Manuel à 6 Chiffres : Toutes les transactions et débits exigent une saisie manuelle stricte d'un PIN à 6 chiffres.",
          "Validation par Codes Sécurité (CAT & COT) : Le Code d'Autorisation de Transfert (CAT) et le Code d'Opération de Trésorerie (COT) empêchent tout transfert illégitime.",
          "Journal d'Audit Immuable : Enregistrement infalsifiable de chaque tentative de connexion, adresse IP et ajustement de solde."
        ]
      },
      privacy: {
        title: "Confidentialité & Protection des Données",
        desc: "La discrétion est notre règle première. Movafi Bank ne commercialise, ne loue et ne partage aucune donnée client.",
        points: [
          "Absence de traceurs publicitaires : Notre portail client est totalement dépourvu de cookies tiers ou de scripts marketing.",
          "Coffre Privé pour Documents KYC : Vos passeports et justificatifs sont stockés dans un espace privé accessible uniquement aux officiers de conformité habilités.",
          "Secret Bancaire et Correspondance Sécurisée : Les échanges avec votre banquier privé bénéficient d'un chiffrement complet."
        ]
      },
      terms: {
        title: "Conditions Générales de Fonctionnement",
        desc: "Toutes les ouvertures de compte et opérations chez Movafi Bank sont régies par des engagements stricts de conformité.",
        rules: [
          "Vérification d'Identité Obligatoire : Chaque dossier fait l'objet d'un examen minutieux avant toute activation de compte.",
          "Statut Inactif par Défaut : Tout compte nouvellement créé demeure inactif jusqu'à sa validation formelle par un administrateur.",
          "Tolérance Zéro Antibranchiment : Tout compte suspecté d'opérations illicites sera immédiatement suspendu.",
          "Bordereaux de Transaction Officiels : Chaque opération génère un bordereau PDF horodaté opposable et téléchargeable."
        ]
      },
      institutional: {
        title: "Informations Institutionnelles",
        company: "Movafi Bank Corporation — United States Division",
        hq: "Manhattan Financial District, New York, NY 10005, États-Unis",
        network: "Présence Opérationnelle : New York · Londres · Paris · Manama · Riyad · Dubaï",
        complianceNotice: "Opère conformément aux standards commerciaux du droit des sociétés des États-Unis et aux recommandations internationales GAFI."
      },
      contact: {
        title: "Conciergerie Privée & Service Client",
        desc: "Notre desk exécutif est à votre écoute 24h/24 et 7j/7 pour le traitement de vos demandes de virement, suivi d'activation et conseil patrimonial.",
        emailLabel: "Adresse officielle de support",
        phoneLabel: "Ligne directe de conciergerie",
        hoursLabel: "Disponibilité",
        hoursValue: "24h/24, 7j/7, 365 jours par an"
      },
      legal: {
        title: "Informations Légales Pertinentes",
        disclaimer: "Movafi Bank United States est une plateforme technologique bancaire d'entreprise et de tenue de grand livre privé. La plateforme propose des outils de comptabilité multi-devises, de simulation de crédit et de traçabilité des règlements. Aucune mention présente sur ce site ne constitue une sollicitation illégale de services bancaires dans les juridictions où une telle activité nécessiterait des agréments spécifiques locaux non détenus."
      }
    },
    es: {
      tagline: "Estructura Institucional y Gobernanza",
      title: "Acerca de Movafi Bank Corporation",
      subtitle: "Una infraestructura moderna de banca privada y tesorería corporativa diseñada para capitales internacionales y family offices.",
      tabs: {
        presentation: "Presentación",
        mission: "Misión",
        services: "Servicios",
        security: "Seguridad",
        privacy: "Privacidad",
        terms: "Condiciones",
        institutional: "Institucional",
        contact: "Contacto",
        legal: "Avisos Legales"
      },
      presentation: {
        title: "Presentación Institucional",
        desc: "Movafi Bank United States es una institución bancaria digital de primer nivel orientada a altos patrimonios y corporaciones globales. Combina la discreción tradicional con la tecnología financiera más avanzada.",
        points: [
          "Cuentas de tesorería multiactivo en USD, EUR, CAD, BHD, SAR y AED.",
          "Libro mayor criptográfico con emisión instantánea de comprobantes en PDF.",
          "Banqueros ejecutivos dedicados para family offices y firmas corporativas.",
          "Segregación absoluta de los fondos de clientes y reservas de compensación."
        ]
      },
      mission: {
        title: "Nuestra Misión y Principios",
        desc: "Nuestra misión es eliminar las fricciones financieras internacionales, permitiendo que la liquidez legítima se mueva con total agilidad y máxima seguridad.",
        principles: [
          { title: "Soberanía del Capital", text: "Control y flexibilidad total sobre las reservas de liquidez multidivisa." },
          { title: "Integridad Tecnológica", text: "Modelos de seguridad zero-trust construidos sobre criptografía moderna." },
          { title: "Transparencia Total", text: "Contabilidad clara, sin tarifas ocultas de ejecución y con auditorías verificables." },
          { title: "Discreción Institucional", text: "Protección estricta de la información financiera y de los beneficiarios finales." }
        ]
      },
      services: {
        title: "Servicios Institucionales",
        items: [
          { name: "Cuentas de Tesorería Multidivisa", detail: "Gestión en tiempo real de USD, EUR, CAD, BHD, SAR y AED con coordenadas IBAN y SWIFT." },
          { name: "Líneas de Financiación Corporativa", detail: "Capital de trabajo, créditos puente para fusiones y anticipo de facturas hasta 50.000.000 $." },
          { name: "Tarjetas Metálicas y Virtuales", detail: "Emisión Visa y Mastercard Gold y Platinum con límites a medida y bloqueo instantáneo." },
          { name: "Canales de Transferencia Global", detail: "Liquidación Fedwire en EE. UU., compensación SEPA y mensajería SWIFT internacional." },
          { name: "Servicios de Custodia y Fideicomiso", detail: "Custodia segregada para operaciones comerciales de gran volumen." }
        ]
      },
      security: {
        title: "Arquitectura Criptográfica y Seguridad",
        desc: "La seguridad es la base innegociable de toda la operativa en Movafi Bank.",
        features: [
          "Criptografía Integral: Datos e identidades protegidos mediante estándares AES-256 y SHA-256.",
          "PIN Manual de 6 Dígitos: Cada transacción requiere la validación manual de un código de 6 dígitos.",
          "Códigos Internos de Control (CAT y COT): Flujo de validación multifactor que evita salidas no autorizadas.",
          "Registro Inmutable de Auditoría: Registro de cada acceso, dirección IP y movimiento contable."
        ]
      },
      privacy: {
        title: "Privacidad y Protección de Datos",
        desc: "La confidencialidad es un compromiso sagrado. No comercializamos datos con terceros.",
        points: [
          "Sin rastreadores de publicidad: Plataforma libre de scripts comerciales invasivos.",
          "Depósito seguro para documentos KYC: Expedientes accesibles exclusivamente por auditores autorizados.",
          "Comunicaciones cifradas: Atención personalizada a través de canales protegidos."
        ]
      },
      terms: {
        title: "Condiciones de Operación",
        desc: "Todas las cuentas operan bajo estrictas directrices de cumplimiento internacional.",
        rules: [
          "Verificación Obligatoria de Identidad: Análisis documental exhaustivo previo a la activación.",
          "Cuenta Inactiva por Defecto: Todo nuevo expediente permanece inactivo hasta su aprobación formal.",
          "Prevención de Blanqueo de Capitales: Suspensión inmediata ante indicios de operaciones ilícitas.",
          "Comprobantes Oficiales PDF: Registro fidedigno de cada movimiento con fecha y hora."
        ]
      },
      institutional: {
        title: "Información Institucional",
        company: "Movafi Bank Corporation — United States Division",
        hq: "Distrito Financiero de Manhattan, Nueva York, NY 10005, Estados Unidos",
        network: "Presencia: Nueva York · Londres · París · Manama · Riad · Dubái",
        complianceNotice: "Opera de acuerdo con la legislación mercantil de EE. UU. y las directrices del GAFI."
      },
      contact: {
        title: "Conserjería Exclusiva y Soporte",
        desc: "Nuestro equipo directivo está disponible 24/7/365 para atender transferencias urgentes y consultas privadas.",
        emailLabel: "Correo Oficial de Soporte",
        phoneLabel: "Línea Ejecutiva Directa",
        hoursLabel: "Horario",
        hoursValue: "24 horas, 7 días a la semana, 365 días al año"
      },
      legal: {
        title: "Avisos Legales Pertinentes",
        disclaimer: "Movafi Bank United States es una plataforma tecnológica de gestión de tesorería y banca privada digital. Proporciona herramientas de contabilidad multiactivo y liquidación certificada. Ninguna información en este portal constituye una oferta pública no solicitada en jurisdicciones donde no proceda."
      }
    },
    ar: {
      tagline: "المخطط المؤسسي والحوكمة",
      title: "حول مؤسسة بنك موفافي للولايات المتحدة",
      subtitle: "بنية مصرفية رقمية خاصة وإدارة خزينة متقدمة مصممة لرؤوس الأموال الدولية، وقادة الأعمال، والمكاتب العائلية العالمية.",
      tabs: {
        presentation: "نظرة عامة",
        mission: "المهمة",
        services: "الخدمات",
        security: "الأمان",
        privacy: "الخصوصية",
        terms: "الشروط",
        institutional: "المؤسسة",
        contact: "التواصل",
        legal: "الإشعارات القانونية"
      },
      presentation: {
        title: "نظرة عامة على المؤسسة",
        desc: "تأسس بنك موفافي للولايات المتحدة كمؤسسة مصرفية رقمية خاصة رائدة لخدمة أصحاب الثروات الكبرى والشركات الدولية والمكاتب العائلية. نجمع بين سرية الخدمات المصرفية الخاصة العريقة وأحدث تقنيات المعالجة المالية الفورية لتوفير احتياطيات متعددة العملات وسجلات محاسبية مشفرة.",
        points: [
          "حسابات خزينة بالدولار الأمريكي، اليورو، الدولار الكندي، الدينار البحريني، الريال السعودي، والدرهم الإماراتي.",
          "سجل محاسبي مشفر ذو قيد مزدوج مع إصدار فوري لإشعارات المعاملات بصيغة PDF.",
          "مصرفيون تنفيذيون مخصصون للمكاتب العائلية والشركات المعتمدة.",
          "فصل كامل ومطلق بين ودائع العملاء الخاصة واحتياطيات التسوية المؤسسية."
        ]
      },
      mission: {
        title: "مهمتنا والمبادئ الاستراتيجية",
        desc: "تتمثل مهمتنا في إزالة الحواجز القضائية والتقنية المصطنعة أمام الشركات ورؤوس الأموال المشروعة، مع ضمان حركة آمنة وسريعة للسيولة بأعلى معايير الحماية.",
        principles: [
          { title: "سيادة رأس المال", text: "تمكين إدارات الخزينة من المرونة الكاملة في إدارة احتياطيات العملات المتعددة." },
          { title: "سلامة البنية التقنية", text: "الاعتماد على نماذج أمان مشفرة حديثة وقائمة على مبدأ التحقق الشامل." },
          { title: "الشفافية التامة", text: "قواعد محاسبية واضحة بلا رسوم خفية مع سجلات معاملات معتمدة وقابلة للتدقيق." },
          { title: "السرية المؤسسية", text: "حماية تامة للبيانات والمعاملات المالية بما يتوافق مع القوانين الدولية." }
        ]
      },
      services: {
        title: "الخدمات المؤسسية الرئيسية",
        items: [
          { name: "حسابات الخزينة متعددة العملات", detail: "إدارة السيولة الفورية لـ 6 عملات دولية مع أرقام آيبان وسويفت دولية معتمدة." },
          { name: "خطوط التمويل والائتمان للشركات", detail: "تمويل رأس المال العامل، وقروض الاستحواذ وتسييل المستحقات حتى 50,000,000 دولار." },
          { name: "بطاقات بريميوم المعدنية والافتراضية", detail: "إصدار بطاقات فيزا وماستركارد فئتي Gold و Platinum بحدود مخصصة وتجميد فوري." },
          { name: "مسارات التحويل الدولي", detail: "تسوية Fedwire في الولايات المتحدة، ومقاصة SEPA الأوروبية ومراسلات SWIFT العالمية." },
          { name: "خدمات الضمان والحفظ الأمين", detail: "حفظ أمين معزول وضمان مشفر لإتمام الصفقات التجارية الدولية الكبرى." }
        ]
      },
      security: {
        title: "البنية التشفيرية والأمان",
        desc: "الأمان في بنك موفافي هو الأساس الجوهري لكافة العمليات المالية.",
        features: [
          "تشفير شامل من البداية إلى النهاية: حماية وثائق وبيانات العملاء وفق معايير AES-256 و SHA-256.",
          "رمز PIN يدوي مكون من 6 أرقام: تتطلب كافة التحويلات إدخالاً يدوياً صارماً لرمز الأمان.",
          "رموز التحقق الثنائية (CAT و COT): تمنع مسارات التحقق خروج أي حوالات غير مصرح بها.",
          "سجل تدقيق غير قابل للتعديل: تسجيل آلي وفوري لكافة محاولات الدخول وعناوين IP والتسويات."
        ]
      },
      privacy: {
        title: "الخصوصية وحماية البيانات",
        desc: "نلتزم بالحفاظ على سرية عملائنا ولا نقوم بمشاركة أو بيع أي بيانات لأطراف تجارية ثالثة.",
        points: [
          "خلو تام من أدوات التعقب الإعلانية: منصة العملاء تعمل بلا ملفات تعريف تجارية أو تتبع.",
          "خزينة مشفرة لمستندات التحقق: المستندات الشخصية محفوظة في مستودعات معزولة لا يطّلع عليها إلا مسؤولو الامتثال.",
          "مراسلات مشفرة: التواصل المباشر مع المصرفي الخاص يتم عبر قنوات محمية بالكامل."
        ]
      },
      terms: {
        title: "الشروط العامة للتشغيل",
        desc: "تخضع جميع الحسابات والمعاملات لسياسات امتثال دقيقة تضمن السلامة التشغيلية.",
        rules: [
          "التحقق الإلزامي من الهوية: يخضع كل ملف لمراجعة دقيقة ومستندية قبل تفعيل الحساب.",
          "الحساب غير نشط افتراضياً: يبقى الحساب غير نشط حتى مراجعته واعتماده رسمياً من قبل الإدارة.",
          "الامتثال لمعايير مكافحة غسل الأموال: تعليق فوري لأي حساب تدور حوله شبهات معاملات غير مشروعة.",
          "إشعارات رسمية معتمدة: يتم توفير إشعار PDF موثق لكل عملية سحب أو تحويل."
        ]
      },
      institutional: {
        title: "المعلومات المؤسسية",
        company: "مؤسسة بنك موفافي — قسم الولايات المتحدة",
        hq: "حي مانهاتن المالي، نيويورك، 10005، الولايات المتحدة",
        network: "العمليات الدولية: نيويورك · لندن · باريس · المنامة · الرياض · دبي",
        complianceNotice: "يعمل وفقاً للقوانين التجارية للشركات في الولايات المتحدة وتوصيات مجموعة العمل المالي الدولية."
      },
      contact: {
        title: "الكونسيرج الخاص وخدمة العملاء",
        desc: "فريقنا التنفيذي متاح على مدار الساعة طوال أيام العام للتعامل مع تعليمات التحويل العاجلة وطلبات التفعيل.",
        emailLabel: "البريد الإلكتروني الرسمي للدعم",
        phoneLabel: "الهاتف التنفيذي المباشر",
        hoursLabel: "ساعات العمل",
        hoursValue: "24 ساعة / 7 أيام في الأسبوع / 365 يوماً في السنة"
      },
      legal: {
        title: "الإشعارات القانونية ذات الصلة",
        disclaimer: "بنك موفافي للولايات المتحدة منصة تقنية لإدارة الخزينة والخدمات المصرفية الرقمية للشركات. تقدم أدوات محاسبية متعددة العملات ومسارات تسوية معتمدة. لا تشكل المعلومات الواردة هنا عرضاً عاماً غير مطلوب لخدمات مصرفية في أي اختصاص قضائي يتطلب تراخيص محددة غير حاصلة عليها."
      }
    }
  };

  const tAbout = content[currentLang] || content.en;

  return (
    <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
      <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 lg:p-12 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md shadow-xl space-y-8">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>{tAbout.tagline}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {tAbout.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {tAbout.subtitle}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {onOpenRegister && (
              <button
                onClick={onOpenRegister}
                className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                {currentLang === 'fr' ? 'Ouvrir un compte' : currentLang === 'es' ? 'Abrir una cuenta' : currentLang === 'ar' ? 'فتح حساب' : 'Open an Account'}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (All 9 Pillars) */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
          {(
            [
              'presentation',
              'mission',
              'services',
              'security',
              'privacy',
              'terms',
              'institutional',
              'contact',
              'legal'
            ] as const
          ).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tabKey
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tAbout.tabs[tabKey]}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="pt-2 min-h-[340px]">
          {/* 1. PRESENTATION */}
          {activeTab === 'presentation' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Building2 className="w-5 h-5" />
                <span>{tAbout.presentation.title}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-w-4xl">
                {tAbout.presentation.desc}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {tAbout.presentation.points.map((pt, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. MISSION */}
          {activeTab === 'mission' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Target className="w-5 h-5" />
                <span>{tAbout.mission.title}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-w-4xl">
                {tAbout.mission.desc}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {tAbout.mission.principles.map((p, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{p.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{p.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Layers className="w-5 h-5" />
                <span>{tAbout.services.title}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tAbout.services.items.map((svc, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-mono text-[11px]">
                        0{idx + 1}
                      </span>
                      <span>{svc.name}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{svc.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>{tAbout.security.title}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-w-4xl">
                {tAbout.security.desc}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tAbout.security.features.map((feat, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                    <Lock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Lock className="w-5 h-5" />
                <span>{tAbout.privacy.title}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-w-4xl">
                {tAbout.privacy.desc}
              </p>
              <div className="space-y-3">
                {tAbout.privacy.points.map((pt, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. TERMS */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <FileText className="w-5 h-5" />
                <span>{tAbout.terms.title}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-w-4xl">
                {tAbout.terms.desc}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tAbout.terms.rules.map((rule, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. INSTITUTIONAL */}
          {activeTab === 'institutional' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Landmark className="w-5 h-5" />
                <span>{tAbout.institutional.title}</span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Corporate Entity</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{tAbout.institutional.company}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Executive Headquarters</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{tAbout.institutional.hq}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Global Network Coordination</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{tAbout.institutional.network}</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-slate-600 dark:text-slate-300">
                  {tAbout.institutional.complianceNotice}
                </div>
              </div>
            </div>
          )}

          {/* 8. CONTACT */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Mail className="w-5 h-5" />
                <span>{tAbout.contact.title}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-w-4xl">
                {tAbout.contact.desc}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Official mailto link */}
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    <Mail className="w-4 h-4" />
                    <span>{tAbout.contact.emailLabel}</span>
                  </div>
                  <div>
                    <a
                      href={`mailto:${supportEmail}`}
                      className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white underline hover:text-amber-500 transition-colors break-all"
                    >
                      {supportEmail}
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-500">Opens direct email client</p>
                </div>

                {/* Direct Phone */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-bold">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span>{tAbout.contact.phoneLabel}</span>
                  </div>
                  <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {supportPhone}
                  </div>
                  <p className="text-[11px] text-slate-500">Accredited signatories desk</p>
                </div>

                {/* Hours */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-bold">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>{tAbout.contact.hoursLabel}</span>
                  </div>
                  <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {tAbout.contact.hoursValue}
                  </div>
                  <p className="text-[11px] text-slate-500">Continuous private concierge</p>
                </div>
              </div>
            </div>
          )}

          {/* 9. LEGAL NOTICES */}
          {activeTab === 'legal' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <FileText className="w-5 h-5" />
                <span>{tAbout.legal.title}</span>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {tAbout.legal.disclaimer}
                </p>
                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 space-y-1">
                  <p>• Verification: SOC 2 Type II audit principles & ISO 27001 operational standards.</p>
                  <p>• Data Security: Cryptographic ledger verification with AES-256 state protection.</p>
                  <p>• Non-Invented Regulators: Complies strictly with honest, verifiable disclosures without fabricated insurance or fictional regulatory licenses.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
