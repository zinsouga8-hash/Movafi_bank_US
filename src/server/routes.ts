import express, { Request, Response } from 'express';
import { db, hashString, generateCatCode, generateCotCode } from './db';
import { sendEmail, buildBankEmailHtml } from './email';
import {
  UserProfile,
  BankAccount,
  Transaction,
  TransactionRequest,
  BankCard,
  CardTier,
  LoanApplication,
  PaymentMethod,
  ReferralRecord,
  ReferralStatus,
  ReferralRewardType
} from '../types/banking';

export const apiRouter = express.Router();

// Middleware to mock or extract authenticated user ID
function getAuthProfile(req: Request): UserProfile | null {
  const rawToken = req.headers.authorization?.replace('Bearer ', '')?.trim();
  if (!rawToken) return null;
  const token = rawToken.replace(/^["']|["']$/g, '').trim();
  if (!token) return null;
  const state = db.getState();
  const search = token.toLowerCase();
  const found = state.profiles.find((p) =>
    p.id === token ||
    'prof_' + p.id === token ||
    p.id.replace('prof_', '') === token ||
    p.email.toLowerCase() === search ||
    state.accounts.some((a) =>
      a.profile_id === p.id &&
      (a.client_id.toLowerCase() === search || a.account_number === token || a.iban.toLowerCase() === search)
    )
  );
  return found || null;
}

// -------------------------------------------------------------
// PUBLIC & SETTINGS ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/settings', (req: Request, res: Response) => {
  const state = db.getState();
  res.json({ success: true, settings: state.bank_settings });
});

// -------------------------------------------------------------
// AUTHENTICATION FLOW
// -------------------------------------------------------------

// Step 1: Register credentials & issue OTP
apiRouter.post('/auth/register-step1', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ success: false, message: 'Valid email and minimum 8-character password required.' });
  }

  const state = db.getState();
  if (state.profiles.some((p) => p.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = hashString(otpCode);
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

  // Store OTP
  state.otp_records = state.otp_records.filter((o) => o.email !== email);
  state.otp_records.push({ email, otp_hash: otpHash, expires_at: expiresAt });
  db.save();

  // Send OTP email with prestigious executive formatting
  await sendEmail({
    to: email,
    subject: `Movafi Bank · Votre code de sécurité confidentiel : ${otpCode}`,
    templateKey: 'otp_verification',
    variables: { code: otpCode }
  });

  res.json({
    success: true,
    message: 'Verification code dispatched to your email.'
  });
});

// Step 2: Verify OTP
apiRouter.post('/auth/verify-otp', (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp || !/^\d{6}$/.test(String(otp).trim())) {
    return res.status(400).json({ success: false, message: 'A valid 6-digit numeric verification code is required.' });
  }

  const state = db.getState();
  const record = state.otp_records.find((o) => o.email.toLowerCase() === email.toLowerCase());

  if (!record || record.expires_at < Date.now()) {
    return res.status(400).json({ success: false, message: 'Code expired or not found. Please request a new code.' });
  }

  if (record.otp_hash !== hashString(otp.trim())) {
    return res.status(400).json({ success: false, message: 'Invalid verification code.' });
  }

  // Validated!
  state.otp_records = state.otp_records.filter((o) => o.email.toLowerCase() !== email.toLowerCase());
  db.save();

  res.json({ success: true, verified: true });
});

// Step 3: Complete Account Application & Generate Banking Credentials
apiRouter.post('/auth/submit-application', async (req: Request, res: Response) => {
  const {
    email,
    password,
    first_name,
    last_name,
    phone,
    nationality,
    residence_country,
    city,
    preferred_currency,
    preferred_language,
    account_type,
    occupation,
    monthly_income,
    income_bracket,
    id_document_name,
    id_document_url,
    proof_of_address_name,
    proof_of_address_url,
    activity_duration,
    pin,
    referral_code
  } = req.body;

  if (!email || !password || !pin || pin.length !== 6 || !first_name || !last_name) {
    return res.status(400).json({ success: false, message: 'All profile and security fields are mandatory.' });
  }

  const state = db.getState();
  const clientLanguage: SupportedLanguage = (preferred_language as SupportedLanguage) || 'es';
  const isEs = clientLanguage === 'es';

  // Prevent duplicate profiles or dangling accounts on re-submission
  const cleanEmail = email.trim().toLowerCase();
  const existingProfIdx = state.profiles.findIndex((p) => p.email.toLowerCase() === cleanEmail);
  if (existingProfIdx !== -1) {
    const oldProf = state.profiles[existingProfIdx];
    state.profiles.splice(existingProfIdx, 1);
    state.accounts = state.accounts.filter((a) => a.profile_id !== oldProf.id);
  }

  const profileId = 'prof_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const accountId = 'acc_' + Date.now().toString(36);

  // Generate prototype banking identifiers
  const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
  const clientId = `CL-${Math.floor(10000 + Math.random() * 90000)}`;
  const accountNumber = `9840${randomSuffix}201`;
  const iban = `US94MOVA021000021${accountNumber}`;
  const bicSwift = 'MOVAFUS33XXX';

  const newProfile = {
    id: profileId,
    email: cleanEmail,
    first_name,
    last_name,
    phone: phone || '+1 (555) 000-0000',
    nationality: nationality || 'United States',
    residence_country: residence_country || 'United States',
    city: city || 'New York',
    preferred_currency: preferred_currency || 'USD',
    preferred_language: clientLanguage,
    account_type: account_type || 'Personal',
    occupation: occupation || 'Executive',
    monthly_income: Number(monthly_income) || 25000,
    income_bracket: income_bracket || undefined,
    id_document_name: id_document_name || undefined,
    id_document_url: id_document_url || undefined,
    proof_of_address_name: proof_of_address_name || undefined,
    proof_of_address_url: proof_of_address_url || undefined,
    activity_duration: activity_duration || '5 years',
    is_admin: false,
    admin_role: null,
    password_hash: hashString(password),
    pin_hash: hashString(pin),
    portal_password: password,
    portal_pin: pin,
    application_status: 'pending' as const,
    created_at: new Date().toISOString()
  };

  const newAccount: BankAccount = {
    id: accountId,
    profile_id: profileId,
    client_id: clientId,
    account_number: accountNumber,
    iban: iban,
    bic_swift: bicSwift,
    currency: preferred_currency || 'USD',
    balance: 0.00,
    account_status: 'inactive', // Default status = inactive per banking specification
    application_status: 'pending',
    cat_code: generateCatCode(),
    cot_code: generateCotCode(),
    is_balance_visible: true,
    created_at: new Date().toISOString()
  };

  state.profiles.push(newProfile);
  state.accounts.push(newAccount);

  // Automatically provision a unique personal referral code for the new user
  db.getOrCreateReferralCode(profileId);

  // Handle incoming referral attribution if a code was provided
  if (referral_code && typeof referral_code === 'string') {
    const codeTrimmed = referral_code.trim().toUpperCase();
    const foundCode = db.findReferralCode(codeTrimmed);
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';

    if (foundCode) {
      const referrerProfile = state.profiles.find((p) => p.id === foundCode.profile_id);
      const isSelfReferral = referrerProfile && (
        referrerProfile.id === profileId ||
        referrerProfile.email.toLowerCase() === email.toLowerCase()
      );

      if (!isSelfReferral) {
        foundCode.total_uses = (foundCode.total_uses || 0) + 1;
        const maskedName = `${first_name.charAt(0)}*** ${last_name.charAt(0)}***`;
        const maskedEmail = email.replace(/(^.{2})(.*)(@.*$)/, '$1***$3');
        const now = new Date().toISOString();

        // Check if an invitation record already exists for this email
        let referralRecord = state.referrals.find((r) =>
          r.code_used.toUpperCase() === codeTrimmed &&
          r.referee_email &&
          r.referee_email.toLowerCase() === email.toLowerCase()
        );

        if (referralRecord) {
          referralRecord.referee_profile_id = profileId;
          referralRecord.referee_name = `${first_name} ${last_name}`;
          referralRecord.referee_name_masked = maskedName;
          referralRecord.status = 'registration_completed';
          referralRecord.last_step_reached = 'Inscription terminée — dossier soumis';
          referralRecord.ip_address = clientIp;
          referralRecord.updated_at = now;
          referralRecord.activity_history.push({
            stage: 'registration_completed',
            label: 'Inscription terminée',
            timestamp: now,
            note: 'Dossier d’adhésion finalisé'
          });
        } else {
          const rewardVal = state.referral_settings?.reward_value || 10;
          const rewardType = state.referral_settings?.reward_type || 'points';
          referralRecord = {
            id: 'ref_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
            referrer_profile_id: foundCode.profile_id,
            referrer_name: referrerProfile ? `${referrerProfile.first_name} ${referrerProfile.last_name}` : 'Private Member',
            referrer_email: referrerProfile?.email,
            referee_profile_id: profileId,
            referee_name: `${first_name} ${last_name}`,
            referee_name_masked: maskedName,
            referee_email: maskedEmail,
            code_used: foundCode.code,
            status: 'registration_completed',
            last_step_reached: 'Inscription terminée — dossier soumis',
            reward_type: rewardType,
            reward_value: rewardVal,
            reward_description: `${rewardVal} points Privilège`,
            ip_address: clientIp,
            activity_history: [
              { stage: 'invitation_created', label: 'Code utilisé à l’inscription', timestamp: now },
              { stage: 'registration_completed', label: 'Inscription terminée', timestamp: now }
            ],
            created_at: now,
            updated_at: now
          };
          state.referrals.unshift(referralRecord);
        }

        // Notify referrer
        state.notifications.unshift({
          id: 'notif_ref_' + Date.now().toString(36),
          profile_id: foundCode.profile_id,
          is_for_admin: false,
          title: 'Votre invitation a été utilisée',
          message: `Votre filleul ${maskedName} a terminé son inscription avec votre code ${foundCode.code}.`,
          type: 'success',
          is_read: false,
          created_at: now
        });

        // Notify admin
        state.notifications.unshift({
          id: 'notif_adm_ref_' + Date.now().toString(36),
          is_for_admin: true,
          title: 'Nouveau parrainage enregistré',
          message: `${first_name} ${last_name} a utilisé le code de parrainage ${foundCode.code}.`,
          type: 'info',
          is_read: false,
          created_at: now
        });

        db.addAuditLog('REFERRAL_ATTRIBUTION_SUCCESS', `Code: ${foundCode.code}`, undefined, {
          referrer_id: foundCode.profile_id,
          referee_id: profileId,
          ip: clientIp
        });
      }
    }
  }

  // Notifications
  state.notifications.unshift({
    id: 'notif_' + Date.now().toString(36),
    profile_id: profileId,
    is_for_admin: false,
    title: isEs ? 'Expediente de apertura en espera de revisión' : 'Dossier d’ouverture en attente d’activation',
    message: isEs
      ? 'Su solicitud de apertura de cuenta ha sido enviada. Un administrador revisará su expediente y procesará su solicitud. Su cuenta permanecerá inactiva hasta su aprobación y activación.'
      : 'Votre demande d’ouverture de compte a été envoyée. Un administrateur va examiner votre dossier et traiter votre demande. Votre compte restera inactif jusqu’à son approbation et son activation.',
    type: 'warning',
    is_read: false,
    created_at: new Date().toISOString()
  });

  state.notifications.unshift({
    id: 'notif_admin_' + Date.now().toString(36),
    is_for_admin: true,
    title: 'Nouvelle Demande d’Ouverture Client',
    message: `${first_name} ${last_name} a soumis un dossier d’ouverture (${email}). Statut : Inactif en attente d’examen administratif.`,
    type: 'info',
    is_read: false,
    created_at: new Date().toISOString()
  });

  db.save();

  // Audit log
  db.addAuditLog('ACCOUNT_APPLICATION_SUBMITTED', `Profile: ${email}`, undefined, {
    client_id: clientId,
    account_type,
    account_status: 'inactive'
  });

  // Automated notification email
  await sendEmail({
    to: email,
    templateKey: 'account_created',
    variables: {
      first_name,
      last_name,
      client_id: clientId,
      account_id: accountNumber,
      iban
    },
    lang: clientLanguage
  });

  // Return clean safe response (token is omitted so access is restricted until administrative approval)
  const { password_hash, pin_hash, ...safeProfile } = newProfile;
  res.json({
    success: true,
    message: isEs
      ? 'Su solicitud de apertura de cuenta ha sido enviada. Un administrador revisará su expediente y procesará su solicitud. Su cuenta permanecerá inactiva hasta su aprobación y activación.'
      : 'Votre demande d’ouverture de compte a été envoyée. Un administrateur va examiner votre dossier et traiter votre demande. Votre compte restera inactif jusqu’à son approbation et son activation.',
    account_status: 'inactive',
    user: safeProfile,
    account: newAccount,
    support_email: state.bank_settings?.support_email || process.env.SUPPORT_EMAIL || 'support@movafi-groupes.com'
  });
});

// Login Step 1: Email / Client ID + Password verification
apiRouter.post('/auth/login-step1', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Identifiant et mot de passe requis.' });
  }

  const state = db.getState();
  const searchInput = email.toLowerCase().trim();
  const profile = state.profiles.find((p) => {
    const pEmail = p.email.toLowerCase();
    if (pEmail === searchInput) return true;
    if (p.id.toLowerCase() === searchInput) return true;
    const userAccs = state.accounts.filter((a) => a.profile_id === p.id);
    if (userAccs.some((a) => a.client_id.toLowerCase() === searchInput || a.account_number === searchInput || a.iban.toLowerCase() === searchInput)) {
      return true;
    }
    if (p.is_admin && (searchInput === 'support@movafi-groupes.com' || searchInput === 'admin@movafibank.com')) {
      return true;
    }
    return false;
  });

  if (!profile || profile.password_hash !== hashString(password)) {
    return res.status(401).json({ success: false, message: 'Identifiants invalides. Veuillez vérifier votre adresse e-mail ou identifiant et votre mot de passe.' });
  }

  res.json({
    success: true,
    require_pin: true,
    user_id: profile.id,
    first_name: profile.first_name,
    is_admin: profile.is_admin
  });
});

// Login Step 2: 6-digit PIN verification
apiRouter.post('/auth/login-step2', (req: Request, res: Response) => {
  const { user_id, pin } = req.body;
  const cleanPin = String(pin || '').trim();
  if (!user_id || !cleanPin || cleanPin.length !== 6) {
    return res.status(400).json({ success: false, message: '6-digit Security PIN is required.' });
  }

  const state = db.getState();
  const searchKey = String(user_id || '').toLowerCase().trim();
  const profile = state.profiles.find((p) =>
    p.id === user_id ||
    p.email.toLowerCase() === searchKey ||
    state.accounts.some((a) =>
      a.profile_id === p.id &&
      (a.client_id.toLowerCase() === searchKey || a.account_number === user_id || a.iban.toLowerCase() === searchKey)
    )
  );

  if (!profile) {
    return res.status(401).json({ success: false, message: 'Profil introuvable. Veuillez vérifier vos identifiants.' });
  }

  // Strict cryptographic PIN validation (No hardcoded backdoors)
  const isPinMatch = profile.pin_hash === hashString(cleanPin);

  if (!isPinMatch) {
    return res.status(401).json({ success: false, message: 'Code PIN de sécurité incorrect. Veuillez vérifier votre saisie.' });
  }

  let userAccounts = state.accounts.filter((a) => a.profile_id === profile.id);
  if (userAccounts.length === 0) {
    const fallbackAcc: BankAccount = {
      id: 'acc_' + profile.id,
      profile_id: profile.id,
      client_id: profile.is_admin ? 'EXECUTIVE-01' : 'CL-99001',
      account_number: '984000100201',
      iban: 'US94MOVA021000021984000100201',
      bic_swift: 'MOVAFUS33XXX',
      currency: profile.preferred_currency || 'USD',
      balance: profile.is_admin ? 50000000.00 : 0.00,
      account_status: profile.is_admin ? 'active' : 'inactive',
      cat_code: generateCatCode(),
      cot_code: generateCotCode(),
      is_balance_visible: true,
      created_at: new Date().toISOString()
    };
    state.accounts.push(fallbackAcc);
    userAccounts = [fallbackAcc];
    db.save();
  }

  const primaryAccount = userAccounts[0];

  // If user is not an administrator, verify account status
  if (!profile.is_admin) {
    if (primaryAccount.account_status === 'suspended') {
      return res.status(403).json({
        success: false,
        is_suspended: true,
        message: 'Votre compte est actuellement suspendu. Veuillez contacter le service client.',
        support_email: state.bank_settings?.support_email || process.env.SUPPORT_EMAIL || 'support@movafi-groupes.com'
      });
    }

    if (primaryAccount.account_status === 'rejected' || primaryAccount.application_status === 'rejected') {
      return res.status(403).json({
        success: false,
        is_rejected: true,
        message: 'Votre dossier d’ouverture a été rejeté. Veuillez contacter le service client.',
        support_email: state.bank_settings?.support_email || process.env.SUPPORT_EMAIL || 'support@movafi-groupes.com'
      });
    }

    // Allowed to log in if approved by administrator or active
    const isApproved =
      primaryAccount.application_status === 'approved' ||
      profile.application_status === 'approved' ||
      primaryAccount.account_status === 'active';

    if (!isApproved) {
      return res.status(403).json({
        success: false,
        is_inactive: true,
        message: 'Votre demande d’ouverture de compte est en cours d’examen administratif. Dès que l’administrateur approuve votre dossier, vous pourrez vous connecter et accéder à votre tableau de bord.',
        support_email: state.bank_settings?.support_email || process.env.SUPPORT_EMAIL || 'support@movafi-groupes.com'
      });
    }
  }

  const { password_hash, pin_hash, ...safeProfile } = profile;

  res.json({
    success: true,
    user: safeProfile,
    account: primaryAccount,
    accounts: userAccounts,
    token: profile.id
  });
});

// Get Current User Profile & Account Data
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const profile = getAuthProfile(req);
  if (!profile) {
    return res.status(401).json({ success: false, message: 'Session expired or unauthenticated.' });
  }

  const state = db.getState();
  let accounts = state.accounts.filter((a) => a.profile_id === profile.id);
  if (accounts.length === 0) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
    const fallbackAcc: BankAccount = {
      id: 'acc_' + profile.id,
      profile_id: profile.id,
      client_id: profile.is_admin ? 'EXECUTIVE-01' : `CL-${Math.floor(10000 + Math.random() * 90000)}`,
      account_number: `9840${randomSuffix}201`,
      iban: `US94MOVA0210000219840${randomSuffix}201`,
      bic_swift: 'MOVAFUS33XXX',
      currency: profile.preferred_currency || 'USD',
      balance: profile.is_admin ? 50000000.00 : 0.00,
      account_status: profile.is_admin ? 'active' : 'inactive',
      application_status: profile.application_status || 'approved',
      cat_code: generateCatCode(),
      cot_code: generateCotCode(),
      is_balance_visible: true,
      created_at: new Date().toISOString()
    };
    state.accounts.push(fallbackAcc);
    accounts = [fallbackAcc];
    db.save();
  }
  const account = accounts[0];
  const cards = state.cards.filter((c) => accounts.some((a) => a.id === c.account_id));
  const transactions = state.transactions.filter((t) => accounts.some((a) => a.id === t.account_id));
  const loans = state.loan_applications.filter((l) => accounts.some((a) => a.id === l.account_id));
  const notifications = state.notifications.filter((n) => n.profile_id === profile.id);

  const { password_hash, pin_hash, ...safeProfile } = profile as any;

  res.json({
    success: true,
    user: safeProfile,
    account: account || null,
    accounts,
    cards,
    transactions,
    loans,
    notifications
  });
});

// Client: Open a new digital sub-account (Multi-currency or specialized)
apiRouter.post('/accounts/create', (req: Request, res: Response) => {
  const profile = getAuthProfile(req);
  if (!profile) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { currency = 'EUR', account_type = 'Personal' } = req.body;
  const state = db.getState();

  const accountId = 'acc_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
  const existingAcc = state.accounts.find((a) => a.profile_id === profile.id);
  const clientId = existingAcc?.client_id || `CL-${Math.floor(10000 + Math.random() * 90000)}`;
  const accountNumber = `9840${randomSuffix}201`;
  const iban = `US94MOVA021000021${accountNumber}`;
  const bicSwift = 'MOVAFUS33XXX';

  const newAcc: BankAccount = {
    id: accountId,
    profile_id: profile.id,
    client_id: clientId,
    account_number: accountNumber,
    iban,
    bic_swift: bicSwift,
    currency,
    balance: 0.00,
    account_status: 'active',
    is_balance_visible: true,
    created_at: new Date().toISOString()
  };

  state.accounts.push(newAcc);

  state.notifications.unshift({
    id: 'notif_' + Date.now().toString(36),
    profile_id: profile.id,
    is_for_admin: false,
    title: 'Nouveau Compte Ouvert',
    message: `Votre nouveau compte en ${currency} (N° ${accountNumber}) a été créé et activé.`,
    type: 'success',
    is_read: false,
    created_at: new Date().toISOString()
  });

  db.addAuditLog('ACCOUNT_CREATED', `Account: ${accountNumber} (${currency})`, profile.email, {
    account_type,
    currency
  });

  db.save();

  res.json({
    success: true,
    message: 'Nouveau compte bancaire créé avec succès.',
    account: newAcc
  });
});

// Update Profile
apiRouter.post('/auth/update-profile', (req: Request, res: Response) => {
  const profile = getAuthProfile(req);
  if (!profile) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { preferred_currency, preferred_language, phone, city } = req.body;
  const state = db.getState();
  const found = state.profiles.find((p) => p.id === profile.id);
  if (!found) return res.status(404).json({ success: false, message: 'User not found' });

  if (preferred_currency) found.preferred_currency = preferred_currency;
  if (preferred_language) found.preferred_language = preferred_language;
  if (phone) found.phone = phone;
  if (city) found.city = city;

  // Also update default account currency if modified
  const userAccount = state.accounts.find((a) => a.profile_id === profile.id);
  if (userAccount && preferred_currency) {
    userAccount.currency = preferred_currency;
  }

  db.save();
  const { password_hash, pin_hash, ...safeProfile } = found as any;
  res.json({ success: true, user: safeProfile, account: userAccount });
});

// Change PIN
apiRouter.post('/auth/change-pin', (req: Request, res: Response) => {
  const profile = getAuthProfile(req);
  if (!profile) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { current_pin, new_pin } = req.body;
  if (!new_pin || new_pin.length !== 6) {
    return res.status(400).json({ success: false, message: 'New PIN must be exactly 6 digits.' });
  }

  const state = db.getState();
  const found = state.profiles.find((p) => p.id === profile.id);
  if (!found) return res.status(404).json({ success: false, message: 'User not found' });

  if (found.pin_hash !== hashString(current_pin)) {
    return res.status(400).json({ success: false, message: 'Current PIN is incorrect.' });
  }

  found.pin_hash = hashString(new_pin);
  db.save();

  db.addAuditLog('CLIENT_PIN_CHANGED', `Profile: ${found.email}`, undefined, {});
  res.json({ success: true, message: 'Security PIN updated successfully.' });
});

// -------------------------------------------------------------
// TRANSFERS & SETTLEMENTS
// -------------------------------------------------------------
apiRouter.post('/transfers/submit', async (req: Request, res: Response) => {
  const profile = getAuthProfile(req);
  if (!profile) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const {
    recipient_name,
    recipient_account,
    recipient_bank,
    category,
    amount,
    currency,
    reference,
    description,
    pin
  } = req.body;

  const state = db.getState();
  const foundProfile = state.profiles.find((p) => p.id === profile.id);
  const account = state.accounts.find((a) => a.profile_id === profile.id);

  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

  // Verification 1: Account status check
  if (account.account_status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Votre compte est actuellement inactif. Veuillez contacter le service client afin de demander son activation.',
      support_email: state.bank_settings?.support_email || process.env.SUPPORT_EMAIL || 'support@movafi-groupes.com'
    });
  }

  // Verification 2: Strict PIN Authorization (Cryptographic validation)
  const cleanPin = String(pin || '').trim();
  if (!cleanPin || cleanPin.length !== 6 || foundProfile?.pin_hash !== hashString(cleanPin)) {
    return res.status(401).json({ success: false, message: 'Code PIN de transaction à 6 chiffres incorrect.' });
  }

  // Verification 3: CAT Code Check (Code d'Autorisation de Transfert)
  const userCat = String(req.body.cat_code || '').trim().toUpperCase();
  const expectedCat = String(account.cat_code || '').trim().toUpperCase();
  if (!userCat || (expectedCat && userCat !== expectedCat)) {
    return res.status(401).json({
      success: false,
      message: 'Code d’Autorisation de Transfert (CAT) invalide. Si vous ne possédez pas ce code, contactez le service client.',
      support_email: state.bank_settings?.support_email || process.env.SUPPORT_EMAIL || 'support@movafi-groupes.com'
    });
  }

  // Verification 4: COT Code Check (Code d'Opération de Trésorerie)
  const userCot = String(req.body.cot_code || '').trim().toUpperCase();
  const expectedCot = String(account.cot_code || '').trim().toUpperCase();
  if (!userCot || (expectedCot && userCot !== expectedCot)) {
    return res.status(401).json({
      success: false,
      message: 'Code d’Opération de Trésorerie (COT) invalide. Si vous ne possédez pas ce code, contactez le service client.',
      support_email: state.bank_settings?.support_email || process.env.SUPPORT_EMAIL || 'support@movafi-groupes.com'
    });
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Please enter a valid transfer amount.' });
  }

  if (account.balance < parsedAmount) {
    return res.status(400).json({ success: false, message: 'Insufficient available balance.' });
  }

  const txId = 'tx_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const refCode = reference ? reference.trim() : `MOV-TR-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  // Check if this is an internal transfer between Movafi accounts
  const cleanRecipientAccount = (recipient_account || '').replace(/[\s-]/g, '').toUpperCase();
  const internalRecipientAccount = state.accounts.find(
    (a) =>
      a.id !== account.id &&
      (a.account_number.replace(/[\s-]/g, '') === cleanRecipientAccount ||
        a.iban.replace(/[\s-]/g, '').toUpperCase() === cleanRecipientAccount)
  );

  let newTx: Transaction;
  let responseMsg = '';

  if (internalRecipientAccount && internalRecipientAccount.account_status === 'active') {
    // INTERNAL TRANSFER: Atomic instant debit and credit
    account.balance -= parsedAmount;
    internalRecipientAccount.balance += parsedAmount;

    newTx = {
      id: txId,
      user_id: profile.id,
      account_id: account.id,
      type: 'transfer',
      category: category || 'Internal Wire',
      amount: parsedAmount,
      currency: currency || account.currency,
      recipient_name,
      recipient_account,
      recipient_bank: 'Movafi Bank United States',
      reference: refCode,
      description: description || 'Internal account transfer',
      status: 'completed',
      fee: 0,
      created_at: now,
      updated_at: now,
      approved_at: now,
      approved_by: 'INTERNAL_LEDGER_ROUTER'
    };

    // Credit transaction for recipient
    const recipientTxId = 'tx_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    state.transactions.unshift({
      id: recipientTxId,
      user_id: internalRecipientAccount.profile_id,
      account_id: internalRecipientAccount.id,
      type: 'credit',
      category: 'Internal Wire',
      amount: parsedAmount,
      currency: currency || internalRecipientAccount.currency,
      recipient_name: `${profile.first_name} ${profile.last_name}`,
      recipient_account: account.account_number,
      recipient_bank: 'Movafi Bank United States',
      reference: refCode,
      description: `Internal liquidity receipt from ${profile.first_name} ${profile.last_name} (${refCode})`,
      status: 'completed',
      fee: 0,
      created_at: now,
      updated_at: now,
      approved_at: now,
      approved_by: 'INTERNAL_LEDGER_ROUTER'
    });

    state.notifications.unshift({
      id: 'notif_rec_' + Date.now().toString(36),
      profile_id: internalRecipientAccount.profile_id,
      is_for_admin: false,
      title: 'Funds Received (Internal Transfer)',
      message: `You received ${currency || internalRecipientAccount.currency} ${parsedAmount.toLocaleString()} from ${profile.first_name} ${profile.last_name}.`,
      type: 'success',
      is_read: false,
      created_at: now
    });

    responseMsg = 'Internal transfer executed and reconciled immediately.';
  } else {
    // EXTERNAL TRANSFER: Payout provider check & queued workflow
    account.balance -= parsedAmount;

    newTx = {
      id: txId,
      user_id: profile.id,
      account_id: account.id,
      type: 'transfer',
      category: category || 'International SWIFT Wire',
      amount: parsedAmount,
      currency: currency || account.currency,
      recipient_name,
      recipient_account,
      recipient_bank: recipient_bank || 'External Financial Institution',
      reference: refCode,
      description: `${description || 'External wire transfer'} — External payout provider not configured (Queued for Treasury Clearance)`,
      status: 'pending',
      fee: 0,
      created_at: now,
      updated_at: now
    };

    // Record as transaction_request for executive admin clearance
    state.transaction_requests.unshift({
      id: 'req_wdr_' + Date.now().toString(36),
      user_id: profile.id,
      account_id: account.id,
      client_name: `${profile.first_name} ${profile.last_name}`,
      client_email: profile.email,
      type: 'withdrawal',
      amount: parsedAmount,
      currency: currency || account.currency,
      payment_method: category || 'International SWIFT Wire',
      payout_method: category || 'International SWIFT Wire',
      beneficiary_name: recipient_name,
      beneficiary_account: recipient_account,
      beneficiary_bank: recipient_bank,
      source_reference: refCode,
      status: 'pending',
      admin_notes: 'External payout provider not configured — pending manual treasury release.',
      created_at: now,
      updated_at: now
    });

    responseMsg = 'Wire transfer initiated. External payout provider not configured — request safely recorded in ledger and queued for treasury clearance.';
  }

  state.transactions.unshift(newTx);

  state.notifications.unshift({
    id: 'notif_' + Date.now().toString(36),
    profile_id: profile.id,
    is_for_admin: false,
    title: newTx.status === 'completed' ? 'Transfer Completed' : 'Transfer Queued for Clearance',
    message: `${currency} ${parsedAmount.toLocaleString()} to ${recipient_name} (${refCode}). Status: ${newTx.status}.`,
    type: newTx.status === 'completed' ? 'success' : 'info',
    is_read: false,
    created_at: now
  });

  db.save();

  db.addAuditLog('TRANSFER_INITIATED', `Account: ${account.account_number}`, profile.email, {
    amount: parsedAmount,
    currency,
    recipient: recipient_name,
    reference: refCode,
    status: newTx.status
  }, (req.headers['x-forwarded-for'] as string) || req.ip, req.headers['user-agent'], 'transaction', txId);

  // Send email notice
  await sendEmail({
    to: profile.email,
    templateKey: 'transfer_completed',
    variables: {
      first_name: profile.first_name,
      amount: parsedAmount.toLocaleString(),
      currency,
      reference: refCode,
      account_id: account.account_number
    }
  });

  res.json({
    success: true,
    message: responseMsg,
    transaction: newTx,
    updated_balance: account.balance
  });
});

// -------------------------------------------------------------
// WITHDRAWALS & PAYOUTS
// -------------------------------------------------------------
apiRouter.post('/withdrawals/submit', async (req: Request, res: Response) => {
  const profile = getAuthProfile(req);
  if (!profile) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const {
    amount,
    currency,
    payout_method,
    beneficiary_name,
    beneficiary_account,
    beneficiary_bank,
    reference,
    description,
    pin
  } = req.body;

  const state = db.getState();
  const foundProfile = state.profiles.find((p) => p.id === profile.id);
  const account = state.accounts.find((a) => a.profile_id === profile.id);

  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

  // Verification 1: Account status check
  if (account.account_status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Votre compte est actuellement inactif. Veuillez contacter le service client afin de demander son activation.',
      support_email: state.bank_settings?.support_email || process.env.SUPPORT_EMAIL || 'support@movafi-groupes.com'
    });
  }

  // Verification 2: Strict PIN Authorization (Cryptographic hash validation only)
  const cleanPin = String(pin || '').trim();
  if (!cleanPin || cleanPin.length !== 6 || foundProfile?.pin_hash !== hashString(cleanPin)) {
    return res.status(401).json({ success: false, message: 'Invalid 6-digit transaction PIN.' });
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Please enter a valid withdrawal amount.' });
  }

  if (account.balance < parsedAmount) {
    return res.status(400).json({ success: false, message: 'Insufficient available balance.' });
  }

  // Atomically debit/hold funds from available balance
  account.balance -= parsedAmount;

  const refCode = reference ? reference.trim() : `MOV-WDR-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();
  const reqId = 'req_wdr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const txId = 'tx_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

  const newReq: TransactionRequest = {
    id: reqId,
    user_id: profile.id,
    account_id: account.id,
    client_name: `${profile.first_name} ${profile.last_name}`,
    client_email: profile.email,
    type: 'withdrawal',
    amount: parsedAmount,
    currency: currency || account.currency,
    payment_method: payout_method || 'SWIFT Wire Settlement',
    payout_method: payout_method || 'SWIFT Wire Settlement',
    beneficiary_name: beneficiary_name || `${profile.first_name} ${profile.last_name}`,
    beneficiary_account: beneficiary_account || 'N/A',
    beneficiary_bank: beneficiary_bank || 'Designated Beneficiary Bank',
    source_reference: refCode,
    status: 'pending',
    admin_notes: 'External payout provider not configured — Request safely queued for treasury validation & manual execution.',
    created_at: now,
    updated_at: now
  };

  const newTx: Transaction = {
    id: txId,
    user_id: profile.id,
    account_id: account.id,
    type: 'withdrawal',
    category: payout_method || 'Bank Transfer',
    amount: parsedAmount,
    currency: currency || account.currency,
    recipient_name: beneficiary_name || `${profile.first_name} ${profile.last_name}`,
    recipient_account: beneficiary_account,
    recipient_bank: beneficiary_bank,
    reference: refCode,
    description: `${description || 'Capital withdrawal'} — External payout provider not configured (Queued for Treasury Clearance)`,
    status: 'pending',
    fee: 0,
    created_at: now,
    updated_at: now
  };

  state.transaction_requests.unshift(newReq);
  state.transactions.unshift(newTx);

  state.notifications.unshift({
    id: 'notif_adm_' + Date.now().toString(36),
    is_for_admin: true,
    title: 'New Withdrawal Notice',
    message: `${profile.first_name} ${profile.last_name} submitted withdrawal for ${currency || account.currency} ${parsedAmount.toLocaleString()} (${refCode}).`,
    type: 'action_required',
    is_read: false,
    created_at: now
  });

  state.notifications.unshift({
    id: 'notif_cli_' + Date.now().toString(36),
    profile_id: profile.id,
    is_for_admin: false,
    title: 'Withdrawal Request Recorded',
    message: `Your withdrawal request of ${currency || account.currency} ${parsedAmount.toLocaleString()} (${refCode}) is recorded. External payout provider not configured — queued for treasury clearance.`,
    type: 'info',
    is_read: false,
    created_at: now
  });

  db.save();

  db.addAuditLog('WITHDRAWAL_REQUEST_SUBMITTED', `Account: ${account.account_number}`, profile.email, {
    amount: parsedAmount,
    currency: currency || account.currency,
    rail: payout_method,
    ref: refCode
  }, (req.headers['x-forwarded-for'] as string) || req.ip, req.headers['user-agent'], 'withdrawal', reqId);

  res.json({
    success: true,
    message: 'Withdrawal request recorded. External payout provider not configured — request queued for treasury review & manual clearance.',
    request: newReq,
    transaction: newTx,
    updated_balance: account.balance
  });
});

// -------------------------------------------------------------
// RECHARGE / DEPOSITS
// -------------------------------------------------------------
apiRouter.get('/recharge/methods', (req: Request, res: Response) => {
  const state = db.getState();
  const activeMethods = state.payment_methods.filter((p) => p.is_active).sort((a, b) => a.display_order - b.display_order);
  res.json({ success: true, payment_methods: activeMethods });
});

apiRouter.post('/recharge/submit', (req: Request, res: Response) => {
  const profile = getAuthProfile(req);
  if (!profile) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { amount, currency, payment_method, sender_name, source_reference } = req.body;
  const parsedAmount = Number(amount);

  if (!parsedAmount || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid deposit amount required.' });
  }

  const state = db.getState();
  const account = state.accounts.find((a) => a.profile_id === profile.id);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

  const reqId = 'req_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const newReq = {
    id: reqId,
    account_id: account.id,
    client_name: `${profile.first_name} ${profile.last_name}`,
    client_email: profile.email,
    type: 'deposit' as const,
    amount: parsedAmount,
    currency: currency || account.currency,
    payment_method: payment_method || 'Bank Transfer',
    sender_name: sender_name || `${profile.first_name} ${profile.last_name}`,
    source_reference: source_reference || `DEP-${Date.now().toString(36).toUpperCase()}`,
    status: 'pending' as const,
    created_at: new Date().toISOString()
  };

  state.transaction_requests.unshift(newReq);

  state.notifications.unshift({
    id: 'notif_admin_' + Date.now().toString(36),
    is_for_admin: true,
    title: 'New Deposit Notice',
    message: `${profile.first_name} ${profile.last_name} submitted a deposit request for ${currency} ${parsedAmount.toLocaleString()}.`,
    type: 'action_required',
    is_read: false,
    created_at: new Date().toISOString()
  });

  state.notifications.unshift({
    id: 'notif_client_' + Date.now().toString(36),
    profile_id: profile.id,
    is_for_admin: false,
    title: 'Deposit Notice Received',
    message: `Your deposit notification for ${currency} ${parsedAmount.toLocaleString()} is pending treasury reconciliation.`,
    type: 'info',
    is_read: false,
    created_at: new Date().toISOString()
  });

  db.save();

  db.addAuditLog('DEPOSIT_REQUEST_SUBMITTED', `Account: ${account.account_number}`, profile.email, {
    amount: parsedAmount,
    method: payment_method,
    ref: source_reference
  });

  res.json({
    success: true,
    message: 'Deposit notification submitted for executive treasury validation.',
    request: newReq
  });
});

// -------------------------------------------------------------
// VIRTUAL & PHYSICAL CARDS
// -------------------------------------------------------------
apiRouter.post('/cards/request', (req: Request, res: Response) => {
  const profile = getAuthProfile(req);
  if (!profile) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { cardholder_name, network, tier } = req.body;
  const state = db.getState();
  const account = state.accounts.find((a) => a.profile_id === profile.id);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

  // Generate masked card presentation & PCI token
  const prefix = network === 'mastercard' ? '5412' : '4532';
  const last4 = Math.floor(1000 + Math.random() * 9000);
  const mid1 = Math.floor(1000 + Math.random() * 9000);
  const mid2 = Math.floor(1000 + Math.random() * 9000);
  const masked = `${prefix} •••• •••• ${last4}`;
  const mockFull = `${prefix} ${mid1} ${mid2} ${last4}`;

  const cleanTier: CardTier = tier === 'premium' ? 'premium' : tier === 'gold' ? 'gold' : 'standard';
  const dailyLimit = cleanTier === 'premium' ? 50000 : cleanTier === 'gold' ? 20000 : 5000;
  const monthlyLimit = cleanTier === 'premium' ? 250000 : cleanTier === 'gold' ? 100000 : 25000;

  const cardId = 'card_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const newCard: BankCard = {
    id: cardId,
    account_id: account.id,
    cardholder_name: (cardholder_name || `${profile.first_name} ${profile.last_name}`).toUpperCase(),
    card_number_masked: masked,
    card_number_mock_full: mockFull,
    expiry_month: 12,
    expiry_year: 2030,
    cvc_mock: String(Math.floor(100 + Math.random() * 900)),
    network: network === 'mastercard' ? 'mastercard' : 'visa',
    tier: cleanTier,
    status: 'pending',
    creation_status: 'pending',
    is_active: false,
    daily_limit: dailyLimit,
    monthly_limit: monthlyLimit,
    balance: 0.00,
    allow_balance_transfer: false,
    is_physical: false,
    created_at: new Date().toISOString()
  };

  state.cards.push(newCard);

  // Notification pour l'administrateur
  state.notifications.unshift({
    id: 'notif_adm_card_' + Date.now().toString(36),
    is_for_admin: true,
    title: 'Nouvelle Demande de Carte Bancaire',
    message: `${profile.first_name} ${profile.last_name} (${profile.email}) a demandé une carte ${cleanTier.toUpperCase()} ${network.toUpperCase()}. En attente d'approbation.`,
    type: 'info',
    is_read: false,
    created_at: new Date().toISOString()
  });

  // Notification pour le client
  state.notifications.unshift({
    id: 'notif_' + Date.now().toString(36),
    profile_id: profile.id,
    is_for_admin: false,
    title: 'Demande de carte envoyée',
    message: 'Votre demande de carte a été transmise. Veuillez patienter pendant que le service administratif examine et approuve votre demande.',
    type: 'warning',
    is_read: false,
    created_at: new Date().toISOString()
  });

  db.save();

  db.addAuditLog('CARD_REQUESTED', `Account: ${account.account_number}`, profile.email, {
    card_id: cardId,
    tier: cleanTier,
    network
  });

  res.json({
    success: true,
    message: 'Demande de carte envoyée. Veuillez patienter que le service de l’administration approuve votre demande de création de carte dans les plus brefs délais.',
    card: newCard
  });
});

// Transfer from main balance to card
apiRouter.post('/cards/transfer-from-balance', (req: Request, res: Response) => {
  const profile = getAuthProfile(req);
  if (!profile) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { card_id, amount, pin } = req.body;
  const parsedAmount = Number(amount);

  if (!parsedAmount || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Montant de rechargement invalide.' });
  }

  const state = db.getState();
  const foundProfile = state.profiles.find((p) => p.id === profile.id);
  const account = state.accounts.find((a) => a.profile_id === profile.id);
  const card = state.cards.find((c) => c.id === card_id && c.account_id === account?.id);

  if (!account || !card) {
    return res.status(404).json({ success: false, message: 'Compte ou carte bancaire introuvable.' });
  }

  // Vérifier statut d'approbation et d'activation de la carte
  if (card.creation_status !== 'approved' || !card.is_active) {
    return res.status(403).json({
      success: false,
      message: 'Votre carte doit être formellement approuvée et activée par l\'administration avant de pouvoir recevoir des fonds.'
    });
  }

  // Vérifier l'autorisation de transfert par l'administrateur
  if (!card.allow_balance_transfer) {
    return res.status(403).json({
      success: false,
      is_blocked: true,
      message: 'Le transfert est bloqué pour cette carte. Veuillez contacter le service client pour activer le transfert depuis le solde principal.'
    });
  }

  const cleanPin = String(pin || '').trim();
  if (!cleanPin || cleanPin.length !== 6 || foundProfile?.pin_hash !== hashString(cleanPin)) {
    return res.status(401).json({ success: false, message: 'Code PIN de sécurité à 6 chiffres incorrect.' });
  }

  if (account.balance < parsedAmount) {
    return res.status(400).json({ success: false, message: 'Solde principal disponible insuffisant.' });
  }

  // Exécuter le transfert
  account.balance -= parsedAmount;
  card.balance += parsedAmount;

  const txId = 'tx_' + Date.now().toString(36);
  state.transactions.unshift({
    id: txId,
    account_id: account.id,
    type: 'card_funding',
    category: 'Digital Wallet',
    amount: parsedAmount,
    currency: account.currency,
    recipient_name: `Carte Virtuelle (${card.card_number_masked})`,
    reference: `CRD-FND-${Math.floor(100000 + Math.random() * 900000)}`,
    description: `Transfert depuis solde principal vers carte ${card.card_number_masked}`,
    status: 'completed',
    fee: 0,
    created_at: new Date().toISOString()
  });

  db.save();

  db.addAuditLog('CARD_FUNDED', `Card: ${card.card_number_masked}`, profile.email, {
    amount: parsedAmount,
    card_balance: card.balance
  });

  res.json({
    success: true,
    message: 'Transfert effectué',
    card_balance: card.balance,
    account_balance: account.balance
  });
});

// Order physical metal card with 6-stage tracker
apiRouter.post('/cards/order-physical', (req: Request, res: Response) => {
  const profile = getAuthProfile(req);
  if (!profile) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { card_id, recipient_full_name, street_address, building_unit, city, postal_code, country, phone } = req.body;

  const state = db.getState();
  const card = state.cards.find((c) => c.id === card_id);
  if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

  const trackingNum = `MVF-PRIORITY-${Math.floor(10000000 + Math.random() * 90000000)}`;
  card.is_physical = true;
  card.delivery = {
    id: 'del_' + Date.now().toString(36),
    card_id: card.id,
    recipient_full_name: recipient_full_name || `${profile.first_name} ${profile.last_name}`,
    street_address: street_address || 'Adresse à confirmer auprès du support',
    building_unit,
    city: city || profile.city || 'New York',
    postal_code: postal_code || '10001',
    country: country || profile.residence_country || 'United States',
    phone: phone || profile.phone || '+1',
    tracking_number: trackingNum,
    current_stage: 'request_received', // Étape 1 activée automatiquement
    updated_at: new Date().toISOString()
  };

  // Notification client
  state.notifications.unshift({
    id: 'notif_' + Date.now().toString(36),
    profile_id: profile.id,
    is_for_admin: false,
    title: 'Livraison de carte physique demandée',
    message: `Votre demande de fabrication et livraison de carte physique a été transmise. Étape 1 : Demande reçue. Suivi : ${trackingNum}.`,
    type: 'info',
    is_read: false,
    created_at: new Date().toISOString()
  });

  // Notification administrateur obligatoire
  state.notifications.unshift({
    id: 'notif_adm_del_' + Date.now().toString(36),
    is_for_admin: true,
    title: 'Demande de Livraison de Carte Physique',
    message: `Le client ${profile.first_name} ${profile.last_name} (${profile.email}) a demandé la livraison physique de sa carte ${card.tier.toUpperCase()} ${card.network.toUpperCase()}. Première étape enclenchée.`,
    type: 'info',
    is_read: false,
    created_at: new Date().toISOString()
  });

  db.save();

  db.addAuditLog('PHYSICAL_CARD_ORDERED', `Card: ${card.card_number_masked}`, profile.email, {
    tracking: trackingNum,
    destination: `${city}, ${country}`
  });

  res.json({
    success: true,
    message: 'Demande de livraison physique enregistrée. La première étape a été activée automatiquement.',
    delivery: card.delivery
  });
});

// -------------------------------------------------------------
// FINANCING & LOANS
// -------------------------------------------------------------
apiRouter.get('/financing/rates', (req: Request, res: Response) => {
  const state = db.getState();
  res.json({ success: true, rates: state.loan_rates });
});

apiRouter.post('/financing/apply', async (req: Request, res: Response) => {
  const profile = getAuthProfile(req);
  if (!profile) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { project_type, amount, duration_months, terms_accepted } = req.body;

  if (!terms_accepted) {
    return res.status(400).json({ success: false, message: 'You must review and accept the Loan Terms before submitting.' });
  }

  const parsedAmount = Number(amount);
  const parsedMonths = Number(duration_months);

  if (isNaN(parsedAmount) || parsedAmount < 2000 || parsedAmount > 1000000) {
    return res.status(400).json({ success: false, message: 'Loan amount must be between 2,000 and 1,000,000 USD.' });
  }

  const state = db.getState();
  const account = state.accounts.find((a) => a.profile_id === profile.id);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

  // Get current rate for category from database
  const rateCategory = state.loan_rates.find((r) => r.category.toLowerCase() === (project_type || '').toLowerCase()) ||
    state.loan_rates.find((r) => r.category === 'Other') || { annual_rate_percent: 3.50 };

  const ratePercent = rateCategory.annual_rate_percent;
  const monthlyRate = ratePercent / 100 / 12;
  const monthlyPayment = (parsedAmount * (monthlyRate * Math.pow(1 + monthlyRate, parsedMonths))) / (Math.pow(1 + monthlyRate, parsedMonths) - 1);
  const totalCost = monthlyPayment * parsedMonths;

  const loanId = 'loan_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const newLoan: LoanApplication = {
    id: loanId,
    account_id: account.id,
    borrower_name: `${profile.first_name} ${profile.last_name}`,
    borrower_email: profile.email,
    project_type: project_type || 'General Purpose',
    amount: parsedAmount,
    currency: account.currency,
    duration_months: parsedMonths,
    rate_percent: ratePercent,
    monthly_payment: Number(monthlyPayment.toFixed(2)),
    total_cost: Number(totalCost.toFixed(2)),
    terms_accepted: true,
    terms_accepted_at: new Date().toISOString(),
    credit_parameters_agreed: false,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  state.loan_applications.unshift(newLoan);

  state.notifications.unshift({
    id: 'notif_admin_' + Date.now().toString(36),
    is_for_admin: true,
    title: 'New Financing Application',
    message: `${profile.first_name} ${profile.last_name} applied for ${account.currency} ${parsedAmount.toLocaleString()} (${project_type}).`,
    type: 'action_required',
    is_read: false,
    created_at: new Date().toISOString()
  });

  // Envoi de l'e-mail de confirmation au client
  sendEmail({
    to: profile.email,
    templateKey: 'loan_applied',
    variables: {
      first_name: profile.first_name,
      amount: parsedAmount.toLocaleString(),
      currency: account.currency,
      project_type: project_type || 'General Purpose'
    },
    lang: profile.preferred_language || 'es'
  }).catch(() => {});

  db.save();

  db.addAuditLog('LOAN_APPLICATION_SUBMITTED', `Loan: ${loanId}`, profile.email, {
    amount: parsedAmount,
    project: project_type,
    rate: ratePercent
  });

  res.json({ success: true, message: 'Financing application submitted for committee review.', loan: newLoan });
});

// Client electronic agreement on approved Credit Parameters
apiRouter.post('/financing/:id/agree-parameters', (req: Request, res: Response) => {
  const profile = getAuthProfile(req);
  if (!profile) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { id } = req.params;
  const state = db.getState();
  const loan = state.loan_applications.find((l) => l.id === id);

  if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
  if (loan.status !== 'approved') {
    return res.status(400).json({ success: false, message: 'Parameters can only be confirmed for approved loans.' });
  }

  loan.credit_parameters_agreed = true;
  loan.credit_parameters_agreed_at = new Date().toISOString();

  state.notifications.unshift({
    id: 'notif_admin_' + Date.now().toString(36),
    is_for_admin: true,
    title: 'Loan Credit Parameters Accepted',
    message: `Client ${loan.borrower_name} agreed to Credit Parameters for facility ${loan.id}. Funds release ready.`,
    type: 'action_required',
    is_read: false,
    created_at: new Date().toISOString()
  });

  // Email de confirmation au client
  sendEmail({
    to: profile.email,
    subject: `Movafi Bank · Paramètres de crédit validés (Prêt #${loan.id})`,
    text: `Bonjour ${profile.first_name},\n\nVous avez validé avec succès vos paramètres de crédit relatifs à votre prêt #${loan.id} d'un montant de ${loan.amount.toLocaleString()} ${loan.currency}.\n\nL'administration a été notifiée afin de procéder au déblocage immédiat des fonds sur votre solde principal.\n\nCordialement,\nService Crédit — Movafi Bank`
  }).catch(() => {});

  db.save();
  res.json({ success: true, message: 'Credit parameters accepted. Treasury notified for fund release.', loan });
});

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
apiRouter.post('/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const state = db.getState();
  const notif = state.notifications.find((n) => n.id === id);
  if (notif) {
    notif.is_read = true;
    db.save();
  }
  res.json({ success: true });
});

apiRouter.post('/notifications/mark-all-read', (req: Request, res: Response) => {
  const profile = getAuthProfile(req);
  const state = db.getState();
  if (profile?.is_admin) {
    state.notifications.filter((n) => n.is_for_admin).forEach((n) => (n.is_read = true));
  } else if (profile) {
    state.notifications.filter((n) => n.profile_id === profile.id).forEach((n) => (n.is_read = true));
  }
  db.save();
  res.json({ success: true });
});

// -------------------------------------------------------------
// ADMINISTRATION PORTAL ENDPOINTS (/api/admin/*)
// -------------------------------------------------------------
function requireAdmin(req: Request, res: Response, next: express.NextFunction) {
  const profile = getAuthProfile(req);
  if (!profile || !profile.is_admin) {
    return res.status(403).json({ success: false, message: 'Access denied: Administrative privileges required.' });
  }
  next();
}

// Admin Accounts List with search, pagination, and filter
apiRouter.get('/admin/accounts', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();
  const search = ((req.query.search as string) || '').toLowerCase();
  const status = req.query.status as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  let combined = state.accounts
    .filter((acc) => {
      const prof = state.profiles.find((p) => p.id === acc.profile_id);
      return prof && !prof.is_admin;
    })
    .map((acc) => {
      const prof = state.profiles.find((p) => p.id === acc.profile_id);
    return {
      account: acc,
      profile: prof ? {
        id: prof.id,
        email: prof.email,
        first_name: prof.first_name,
        last_name: prof.last_name,
        phone: prof.phone,
        nationality: prof.nationality,
        residence_country: prof.residence_country,
        city: prof.city,
        account_type: prof.account_type,
        occupation: prof.occupation,
        monthly_income: prof.monthly_income,
        application_status: prof.application_status,
        created_at: prof.created_at
      } : null
    };
  });

  if (search) {
    combined = combined.filter((c) =>
      c.profile?.first_name.toLowerCase().includes(search) ||
      c.profile?.last_name.toLowerCase().includes(search) ||
      c.profile?.email.toLowerCase().includes(search) ||
      c.account.account_number.includes(search) ||
      c.account.client_id.toLowerCase().includes(search)
    );
  }

  if (status && status !== 'all') {
    combined = combined.filter((c) => {
      const accStatus = c.account.account_status;
      const appStatus = c.account.application_status || c.profile?.application_status || 'pending';
      if (status === 'pending') return appStatus === 'pending' || (accStatus === 'inactive' && appStatus !== 'approved');
      if (status === 'active') return accStatus === 'active' || appStatus === 'approved';
      if (status === 'inactive') return accStatus === 'inactive';
      if (status === 'suspended') return accStatus === 'suspended';
      if (status === 'rejected') return accStatus === 'rejected' || appStatus === 'rejected';
      return accStatus === status;
    });
  }

  const total = combined.length;
  const startIndex = (page - 1) * limit;
  const paginated = combined.slice(startIndex, startIndex + limit);

  res.json({
    success: true,
    total,
    page,
    limit,
    accounts: paginated
  });
});

// Admin Manage Banking File (Account details, transactions, KYC)
apiRouter.get('/admin/accounts/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const state = db.getState();
  const account = state.accounts.find((a) => a.id === id);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

  const profile = state.profiles.find((p) => p.id === account.profile_id);
  const transactions = state.transactions.filter((t) => t.account_id === account.id);
  const cards = state.cards.filter((c) => c.account_id === account.id);
  const loans = state.loan_applications.filter((l) => l.account_id === account.id);

  const { password_hash, pin_hash, ...safeProfile } = profile as any;

  res.json({
    success: true,
    account,
    profile: safeProfile,
    transactions,
    cards,
    loans
  });
});

// Admin Credit / Debit Balance with Mandatory Audit Reason
apiRouter.post('/admin/accounts/:id/adjust-balance', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const { type, amount, reason } = req.body; // type: 'credit' | 'debit'

  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({ success: false, message: 'Mandatory audit justification required (min 5 chars).' });
  }

  const parsedAmount = Number(amount);
  if (!parsedAmount || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid positive amount required.' });
  }

  const state = db.getState();
  const account = state.accounts.find((a) => a.id === id);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

  if (type === 'debit' && account.balance < parsedAmount) {
    return res.status(400).json({ success: false, message: 'Account balance cannot be debited below zero.' });
  }

  const oldBalance = account.balance;
  if (type === 'credit') {
    account.balance += parsedAmount;
  } else {
    account.balance -= parsedAmount;
  }

  // Record transaction in ledger
  const txRef = `ADM-${type.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
  state.transactions.unshift({
    id: 'tx_adm_' + Date.now().toString(36),
    account_id: account.id,
    type: type as any,
    category: 'Bank Transfer',
    amount: parsedAmount,
    currency: account.currency,
    recipient_name: account.account_number,
    reference: txRef,
    description: `Administrative ${type}: ${reason}`,
    status: 'completed',
    fee: 0,
    created_at: new Date().toISOString()
  });

  db.save();

  db.addAuditLog(`BALANCE_${type.toUpperCase()}`, `Account: ${account.account_number}`, admin?.email, {
    amount: parsedAmount,
    old_balance: oldBalance,
    new_balance: account.balance,
    justification: reason
  });

  res.json({
    success: true,
    message: `Account balance successfully ${type === 'credit' ? 'credited' : 'debited'}.`,
    new_balance: account.balance
  });
});

// Admin Update Account Status (Approve, Reject, Suspend, Activate)
apiRouter.post('/admin/accounts/:id/status', requireAdmin, async (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const { status, notes } = req.body;

  const state = db.getState();
  const account = state.accounts.find((a) => a.id === id);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

  const prevStatus = account.account_status;
  account.account_status = status;

  const profile = state.profiles.find((p) => p.id === account.profile_id);

  // Notify client
  state.notifications.unshift({
    id: 'notif_' + Date.now().toString(36),
    profile_id: account.profile_id,
    is_for_admin: false,
    title: `Account Status: ${status.toUpperCase()}`,
    message: `Your account status has been updated to ${status}. ${notes ? `Note: ${notes}` : ''}`,
    type: status === 'active' ? 'success' : 'warning',
    is_read: false,
    created_at: new Date().toISOString()
  });

  db.save();

  db.addAuditLog('ACCOUNT_STATUS_CHANGED', `Account: ${account.account_number}`, admin?.email, {
    previous: prevStatus,
    new: status,
    notes
  });

  if (profile && status === 'active') {
    // Check if there is an active referral for this referee profile
    const refRecord = state.referrals.find((r) => r.referee_profile_id === profile.id);
    if (refRecord && refRecord.status !== 'referral_validated' && refRecord.status !== 'referral_rejected') {
      const now = new Date().toISOString();
      refRecord.status = 'referral_validated';
      refRecord.last_step_reached = 'Compte approuvé & parrainage validé';
      refRecord.validated_at = now;
      refRecord.updated_at = now;
      refRecord.activity_history.push({
        stage: 'referral_validated',
        label: 'Parrainage validé',
        timestamp: now,
        note: 'Validation suite à l’approbation du compte'
      });

      // Notify the referrer
      state.notifications.unshift({
        id: 'notif_val_' + Date.now().toString(36),
        profile_id: refRecord.referrer_profile_id,
        is_for_admin: false,
        title: 'Votre parrainage est maintenant validé',
        message: `Félicitations ! Votre parrainage pour ${refRecord.referee_name_masked || 'votre invité'} a été validé avec succès.`,
        type: 'success',
        is_read: false,
        created_at: now
      });

      db.save();
    }

    await sendEmail({
      to: profile.email,
      templateKey: 'account_approved',
      variables: {
        first_name: profile.first_name,
        account_id: account.account_number,
        iban: account.iban
      }
    });
  }

  res.json({ success: true, message: `Account status updated to ${status}.`, account });
});

// Admin Regenerate Individual CAT Code
apiRouter.post('/admin/accounts/:id/regenerate-cat', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const state = db.getState();
  const account = state.accounts.find((a) => a.id === id);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

  account.cat_code = generateCatCode();
  db.save();

  db.addAuditLog('CAT_CODE_REGENERATED', `Account: ${account.account_number}`, admin?.email, {
    cat_code: account.cat_code
  });

  res.json({
    success: true,
    message: 'Code CAT régénéré individuellement avec succès.',
    cat_code: account.cat_code
  });
});

// Admin Regenerate Individual COT Code
apiRouter.post('/admin/accounts/:id/regenerate-cot', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const state = db.getState();
  const account = state.accounts.find((a) => a.id === id);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

  account.cot_code = generateCotCode();
  db.save();

  db.addAuditLog('COT_CODE_REGENERATED', `Account: ${account.account_number}`, admin?.email, {
    cot_code: account.cot_code
  });

  res.json({
    success: true,
    message: 'Code COT régénéré individuellement avec succès.',
    cot_code: account.cot_code
  });
});

// Admin Master Save Client File (Atomic Save / Enregistrer les modifications)
apiRouter.post('/admin/accounts/:id/save-client-file', requireAdmin, async (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const {
    account_status,
    application_status,
    balance,
    cat_code,
    cot_code,
    first_name,
    last_name,
    phone,
    nationality,
    residence_country,
    city,
    occupation,
    monthly_income,
    income_bracket,
    account_type,
    currency
  } = req.body;

  const state = db.getState();
  const account = state.accounts.find((a) => a.id === id);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

  const profile = state.profiles.find((p) => p.id === account.profile_id);
  if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

  const prevAccountStatus = account.account_status;
  const prevAppStatus = account.application_status || profile.application_status;

  // Update Account Fields
  if (account_status) {
    account.account_status = account_status;
  }
  if (application_status) {
    account.application_status = application_status;
    profile.application_status = application_status;
    // Rule: Upon application approval, account status MUST remain inactive by default until admin explicitly activates it!
  }
  if (balance !== undefined && !isNaN(Number(balance))) account.balance = Number(balance);
  if (cat_code) account.cat_code = cat_code.trim();
  if (cot_code) account.cot_code = cot_code.trim();
  if (currency) account.currency = currency;
  account.updated_at = new Date().toISOString();

  // Update Profile Fields
  if (first_name) profile.first_name = first_name.trim();
  if (last_name) profile.last_name = last_name.trim();
  if (phone) profile.phone = phone.trim();
  if (nationality) profile.nationality = nationality.trim();
  if (residence_country) profile.residence_country = residence_country.trim();
  if (city) profile.city = city.trim();
  if (occupation) profile.occupation = occupation.trim();
  if (monthly_income !== undefined && !isNaN(Number(monthly_income))) profile.monthly_income = Number(monthly_income);
  if (income_bracket) profile.income_bracket = income_bracket;
  if (account_type) profile.account_type = account_type;
  if (currency) profile.preferred_currency = currency;
  profile.updated_at = new Date().toISOString();

  const isNowApproved = application_status === 'approved' && prevAppStatus !== 'approved';
  const isNowActive = account_status === 'active' && prevAccountStatus !== 'active';
  const clientLang = profile.preferred_language || 'es';
  const isEs = clientLang === 'es';

  // DISTINCT NOTIFICATION 1: APPLICATION APPROVED (Account remains inactive until explicit admin activation)
  if (isNowApproved) {
    state.notifications.unshift({
      id: 'notif_app_' + Date.now().toString(36),
      profile_id: profile.id,
      is_for_admin: false,
      title: isEs ? 'Solicitud de apertura aprobada' : 'Demande d’ouverture approuvée',
      message: isEs
        ? 'Su solicitud de apertura de cuenta ha sido aprobada por la administración. Por medidas de seguridad y protocolo bancario, su cuenta permanece inactiva por defecto hasta que el administrador proceda a su activación.'
        : 'Votre demande d’ouverture de compte a été formellement approuvée par l’administration. Par mesure de conformité, votre compte demeure inactif par défaut jusqu’à son activation opérationnelle.',
      type: 'info',
      is_read: false,
      created_at: new Date().toISOString()
    });

    await sendEmail({
      to: profile.email,
      templateKey: 'application_approved',
      variables: {
        first_name: profile.first_name,
        client_id: account.client_id,
        account_id: account.account_number,
        iban: account.iban
      },
      lang: clientLang
    });
  }

  // DISTINCT NOTIFICATION 2: ACCOUNT ACTIVATED (Account is now active and operational)
  if (isNowActive) {
    state.notifications.unshift({
      id: 'notif_act_' + Date.now().toString(36),
      profile_id: profile.id,
      is_for_admin: false,
      title: isEs ? 'Cuenta bancaria activada' : 'Compte bancaire activé',
      message: isEs
        ? '¡Enhorabuena! Su cuenta bancaria en MOVAFI BANK ha sido formalmente activada por la administración y ya está plenamente operativa para todas sus operaciones.'
        : 'Votre compte bancaire Movafi Bank a été officiellement activé par l’administration et est désormais pleinement opérationnel.',
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString()
    });

    // Validate referral reward on account activation
    const refRecord = state.referrals.find((r) => r.referee_profile_id === profile.id);
    if (refRecord && refRecord.status !== 'referral_validated' && refRecord.status !== 'referral_rejected') {
      const now = new Date().toISOString();
      refRecord.status = 'referral_validated';
      refRecord.last_step_reached = 'Compte activé & parrainage validé';
      refRecord.validated_at = now;
      refRecord.updated_at = now;
    }

    await sendEmail({
      to: profile.email,
      templateKey: 'account_activated',
      variables: {
        first_name: profile.first_name,
        account_id: account.account_number,
        iban: account.iban
      },
      lang: clientLang
    });
  }

  db.save();
  db.addAuditLog('CLIENT_FILE_SAVED', `Account: ${account.account_number} (${profile.email})`, admin?.email, {
    account_status: account.account_status,
    application_status: account.application_status,
    balance: account.balance
  });

  const { password_hash, pin_hash, ...safeProfile } = profile as any;

  res.json({
    success: true,
    message: 'Modifications appliquées et enregistrées avec succès sur le dossier client.',
    account,
    profile: safeProfile
  });
});

// Admin Update Client Profile Information
apiRouter.post('/admin/accounts/:id/update-profile', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const {
    first_name,
    last_name,
    phone,
    nationality,
    residence_country,
    city,
    occupation,
    monthly_income,
    income_bracket
  } = req.body;

  const state = db.getState();
  const account = state.accounts.find((a) => a.id === id);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

  const profile = state.profiles.find((p) => p.id === account.profile_id);
  if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

  if (first_name) profile.first_name = first_name.trim();
  if (last_name) profile.last_name = last_name.trim();
  if (phone) profile.phone = phone.trim();
  if (nationality) profile.nationality = nationality.trim();
  if (residence_country) profile.residence_country = residence_country.trim();
  if (city) profile.city = city.trim();
  if (occupation) profile.occupation = occupation.trim();
  if (monthly_income !== undefined) profile.monthly_income = Number(monthly_income);
  if (income_bracket) profile.income_bracket = income_bracket;
  profile.updated_at = new Date().toISOString();

  db.save();
  db.addAuditLog('ADMIN_UPDATE_CLIENT_PROFILE', `Profile: ${profile.email}`, admin?.email, {});

  const { password_hash, pin_hash, ...safeProfile } = profile;
  res.json({
    success: true,
    message: 'Informations du profil client mises à jour avec succès.',
    profile: safeProfile
  });
});

// Admin Delete Account
apiRouter.delete('/admin/accounts/:id', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const state = db.getState();

  const accountIndex = state.accounts.findIndex((a) => a.id === id);
  if (accountIndex === -1) return res.status(404).json({ success: false, message: 'Account not found' });

  const account = state.accounts[accountIndex];
  state.accounts.splice(accountIndex, 1);
  state.profiles = state.profiles.filter((p) => p.id !== account.profile_id);
  state.transactions = state.transactions.filter((t) => t.account_id !== account.id);
  state.cards = state.cards.filter((c) => c.account_id !== account.id);

  db.save();
  db.addAuditLog('ACCOUNT_DELETED', `Account: ${account.account_number}`, admin?.email, {});

  res.json({ success: true, message: 'Account and associated profiles removed.' });
});

// Admin Deposits & Withdrawals Management
apiRouter.get('/admin/transactions', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();
  res.json({
    success: true,
    requests: state.transaction_requests,
    transactions: state.transactions
  });
});

apiRouter.post('/admin/transactions/requests/:id/action', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const { action, notes } = req.body; // 'approve' | 'reject'

  const state = db.getState();
  const request = state.transaction_requests.find((r) => r.id === id);
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  const account = state.accounts.find((a) => a.id === request.account_id);
  if (!account) return res.status(404).json({ success: false, message: 'Associated account not found' });

  const now = new Date().toISOString();

  if (request.type === 'deposit') {
    if (action === 'approve') {
      request.status = 'completed';
      request.approved_at = now;
      request.approved_by = admin?.email;
      request.updated_at = now;

      // Credit account
      account.balance += request.amount;

      // Record completed transaction
      state.transactions.unshift({
        id: 'tx_' + Date.now().toString(36),
        user_id: account.profile_id,
        account_id: account.id,
        type: 'deposit',
        category: request.payment_method,
        amount: request.amount,
        currency: request.currency,
        recipient_name: account.account_number,
        reference: request.source_reference,
        description: `Deposit via ${request.payment_method} approved by treasury`,
        status: 'completed',
        fee: 0,
        created_at: now,
        updated_at: now,
        approved_at: now,
        approved_by: admin?.email
      });

      state.notifications.unshift({
        id: 'notif_' + Date.now().toString(36),
        profile_id: account.profile_id,
        is_for_admin: false,
        title: 'Deposit Approved & Settled',
        message: `Your deposit of ${request.currency} ${request.amount.toLocaleString()} has been reconciled and credited to your available balance.`,
        type: 'success',
        is_read: false,
        created_at: now
      });
    } else {
      request.status = 'rejected';
      request.admin_notes = notes;
      request.rejection_reason = notes;
      request.updated_at = now;

      state.notifications.unshift({
        id: 'notif_' + Date.now().toString(36),
        profile_id: account.profile_id,
        is_for_admin: false,
        title: 'Deposit Notice Rejected',
        message: `Deposit notice ${request.source_reference} could not be reconciled. ${notes ? `Reason: ${notes}` : ''}`,
        type: 'warning',
        is_read: false,
        created_at: now
      });
    }
  } else if (request.type === 'withdrawal') {
    if (action === 'approve') {
      request.status = 'completed';
      request.approved_at = now;
      request.approved_by = admin?.email;
      request.updated_at = now;

      // Find and update pending transaction
      const linkedTx = state.transactions.find((t) => t.reference === request.source_reference && t.type === 'withdrawal');
      if (linkedTx) {
        linkedTx.status = 'completed';
        linkedTx.approved_at = now;
        linkedTx.approved_by = admin?.email;
        linkedTx.updated_at = now;
        linkedTx.description = `Withdrawal to ${request.beneficiary_name || 'beneficiary'} — Settled & Dispatched`;
      }

      state.notifications.unshift({
        id: 'notif_' + Date.now().toString(36),
        profile_id: account.profile_id,
        is_for_admin: false,
        title: 'Withdrawal Approved & Executed',
        message: `Your withdrawal of ${request.currency} ${request.amount.toLocaleString()} (${request.source_reference}) has been cleared and disbursed by treasury.`,
        type: 'success',
        is_read: false,
        created_at: now
      });
    } else {
      request.status = 'rejected';
      request.admin_notes = notes;
      request.rejection_reason = notes;
      request.updated_at = now;

      // Refund held amount back to available balance!
      account.balance += request.amount;

      // Update linked transaction
      const linkedTx = state.transactions.find((t) => t.reference === request.source_reference && t.type === 'withdrawal');
      if (linkedTx) {
        linkedTx.status = 'rejected';
        linkedTx.updated_at = now;
        linkedTx.description = `Withdrawal to ${request.beneficiary_name || 'beneficiary'} — Rejected & Refunded (${notes || 'Compliance notice'})`;
      }

      state.notifications.unshift({
        id: 'notif_' + Date.now().toString(36),
        profile_id: account.profile_id,
        is_for_admin: false,
        title: 'Withdrawal Request Rejected — Funds Refunded',
        message: `Your withdrawal notice (${request.source_reference}) was rejected by treasury: ${notes || 'Compliance check failed'}. The amount has been refunded back to your available balance.`,
        type: 'warning',
        is_read: false,
        created_at: now
      });
    }
  }

  db.save();

  db.addAuditLog(`${request.type.toUpperCase()}_REQUEST_${action.toUpperCase()}`, `Request: ${request.id}`, admin?.email, {
    amount: request.amount,
    account: account.account_number,
    action,
    notes
  }, (req.headers['x-forwarded-for'] as string) || req.ip, req.headers['user-agent'], request.type, request.id);

  res.json({ success: true, message: `${request.type === 'deposit' ? 'Deposit' : 'Withdrawal'} request has been ${action}d.`, request, account_balance: account.balance });
});

// Admin Cards Management
apiRouter.get('/admin/cards', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();
  const enrichedCards = state.cards.map((card) => {
    const acc = state.accounts.find((a) => a.id === card.account_id);
    const prof = acc ? state.profiles.find((p) => p.id === acc.profile_id) : null;
    return {
      ...card,
      client_name: prof ? `${prof.first_name} ${prof.last_name}` : 'Unknown Client',
      client_email: prof?.email
    };
  });
  res.json({ success: true, cards: enrichedCards });
});

apiRouter.post('/admin/cards/:id/manage', requireAdmin, async (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const { creation_status, is_active, allow_balance_transfer, monthly_limit, daily_limit, delivery_stage, status } = req.body;

  const state = db.getState();
  const card = state.cards.find((c) => c.id === id);
  if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

  const prevCreationStatus = card.creation_status || (card.status === 'active' ? 'approved' : 'pending');

  if (creation_status) {
    card.creation_status = creation_status;
    if (creation_status === 'approved') {
      card.status = 'active';
    } else if (creation_status === 'rejected') {
      card.status = 'cancelled';
      card.is_active = false;
    } else {
      card.status = 'pending';
    }
  }

  if (typeof is_active === 'boolean') {
    card.is_active = is_active;
  }

  if (typeof allow_balance_transfer === 'boolean') {
    card.allow_balance_transfer = allow_balance_transfer;
  }

  if (monthly_limit !== undefined) card.monthly_limit = Number(monthly_limit);
  if (daily_limit !== undefined) card.daily_limit = Number(daily_limit);
  if (status) card.status = status;

  // Delivery progression requires client to have requested delivery first
  if (delivery_stage) {
    if (!card.delivery) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier l\'étape de livraison : le client n\'a pas encore demandé de livraison physique de sa carte.'
      });
    }
    card.delivery.current_stage = delivery_stage;
    card.delivery.updated_at = new Date().toISOString();
  }

  // If newly approved, send notification & email
  if (creation_status === 'approved' && prevCreationStatus !== 'approved') {
    const acc = state.accounts.find((a) => a.id === card.account_id);
    const prof = acc ? state.profiles.find((p) => p.id === acc.profile_id) : null;
    if (prof) {
      state.notifications.unshift({
        id: 'notif_' + Date.now().toString(36),
        profile_id: prof.id,
        is_for_admin: false,
        title: 'Demande de Carte Approuvée',
        message: `Votre demande de carte ${card.tier.toUpperCase()} ${card.network.toUpperCase()} a été approuvée par l'administration. Veuillez contacter le service client pour activer votre carte et obtenir votre code CVC.`,
        type: 'success',
        is_read: false,
        created_at: new Date().toISOString()
      });

      await sendEmail({
        to: prof.email,
        subject: `Movafi Bank · Demande de carte ${card.network.toUpperCase()} approuvée`,
        text: `Cher(e) ${prof.first_name},\n\nVotre demande de création de carte ${card.tier.toUpperCase()} ${card.network.toUpperCase()} (${card.card_number_masked}) a été validée avec succès par le service d'administration.\n\nVotre carte est actuellement inactive pour des raisons de conformité et de sécurité. Veuillez contacter l'assistance pour demander son activation et démasquer votre code CVC.\n\nCordialement,\nService Monétique Privé — Movafi Bank`
      });
    }
  }

  db.save();
  db.addAuditLog('CARD_MANAGED', `Card: ${card.card_number_masked}`, admin?.email, req.body);

  res.json({ success: true, message: 'Modifications de la carte enregistrées avec succès.', card });
});

apiRouter.post('/admin/cards/:id/status', requireAdmin, async (req: Request, res: Response) => {
  // Delegate to manage for unified handling
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const { status, allow_balance_transfer, monthly_limit, delivery_stage, creation_status, is_active, daily_limit } = req.body;

  const state = db.getState();
  const card = state.cards.find((c) => c.id === id);
  if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

  if (creation_status) card.creation_status = creation_status;
  if (typeof is_active === 'boolean') card.is_active = is_active;
  if (status) card.status = status;
  if (typeof allow_balance_transfer === 'boolean') card.allow_balance_transfer = allow_balance_transfer;
  if (monthly_limit) card.monthly_limit = Number(monthly_limit);
  if (daily_limit) card.daily_limit = Number(daily_limit);
  if (delivery_stage && card.delivery) {
    card.delivery.current_stage = delivery_stage;
    card.delivery.updated_at = new Date().toISOString();
  }

  db.save();
  db.addAuditLog('CARD_CONFIG_UPDATED', `Card: ${card.card_number_masked}`, admin?.email, req.body);

  res.json({ success: true, message: 'Card updated.', card });
});

// Admin Loans Management
apiRouter.get('/admin/loans', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();
  res.json({ success: true, loans: state.loan_applications });
});

apiRouter.post('/admin/loans/:id/status', requireAdmin, async (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  const state = db.getState();
  const loan = state.loan_applications.find((l) => l.id === id);
  if (!loan) return res.status(404).json({ success: false, message: 'Loan application not found' });

  loan.status = status;
  if (admin_notes !== undefined) loan.admin_notes = admin_notes;

  const account = state.accounts.find((a) => a.id === loan.account_id);
  const profile = account ? state.profiles.find((p) => p.id === account.profile_id) : null;

  if (account && profile) {
    const isApproved = status === 'approved';
    const isRejected = status === 'rejected';
    const userLang = profile.preferred_language || 'es';
    const isEs = userLang === 'es';

    state.notifications.unshift({
      id: 'notif_' + Date.now().toString(36),
      profile_id: account.profile_id,
      is_for_admin: false,
      title: isApproved
        ? (isEs ? 'Solicitud de Préstamo Aprobada' : 'Demande de Prêt Approuvée')
        : isRejected
        ? (isEs ? 'Solicitud de Préstamo Denegada' : 'Demande de Prêt Rejetée')
        : (isEs ? 'Solicitud de Préstamo en Espera' : 'Demande de Prêt Mise en Attente'),
      message: isApproved
        ? (isEs
            ? 'Su solicitud de crédito ha sido formalmente aprobada por la administración. Por favor consulte los parámetros de crédito y confirme su conformidad para autorizar el desembolso de los fondos.'
            : 'Votre demande de crédit a été formellement approuvée par l\'administration. Veuillez consulter les paramètres de crédit et donner votre accord pour que les fonds soient débloqués.')
        : isRejected
        ? (isEs
            ? 'Su expediente de préstamo no ha sido admitido por el comité de riesgo. Contacte con atención al cliente para más información.'
            : 'Votre dossier de demande de prêt a été rejeté par le comité d\'engagement. Contactez le service client pour plus d\'informations.')
        : (isEs
            ? 'Su solicitud de préstamo está pendiente de información complementaria por parte de la administración.'
            : 'Votre demande de prêt a été placée en attente d\'informations complémentaires par l\'administration.'),
      type: isApproved ? 'success' : isRejected ? 'warning' : 'info',
      is_read: false,
      created_at: new Date().toISOString()
    });

    if (isApproved) {
      await sendEmail({
        to: profile.email,
        templateKey: 'loan_approved',
        variables: {
          first_name: profile.first_name,
          amount: loan.amount.toLocaleString(),
          currency: loan.currency,
          project_type: loan.project_type,
          loan_id: loan.id
        },
        lang: userLang
      });
    }
  }

  db.save();
  db.addAuditLog(`LOAN_${status.toUpperCase()}`, `Loan: ${loan.id}`, admin?.email, {
    borrower: loan.borrower_name,
    amount: loan.amount
  });

  res.json({ success: true, message: `Dossier de prêt mis à jour (${status}).`, loan });
});

// Release Loan Funds into Client Account Balance
apiRouter.post('/admin/loans/:id/release-funds', requireAdmin, async (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;

  const state = db.getState();
  const loan = state.loan_applications.find((l) => l.id === id);
  if (!loan) return res.status(404).json({ success: false, message: 'Dossier de prêt introuvable.' });

  if (loan.status !== 'approved') {
    return res.status(400).json({ success: false, message: 'Seul un prêt formellement approuvé peut être débloqué.' });
  }

  if (!loan.credit_parameters_agreed) {
    return res.status(400).json({
      success: false,
      message: 'Le client doit obligatoirement consulter et valider ses paramètres de crédit avant que les fonds puissent être débloqués.'
    });
  }

  const account = state.accounts.find((a) => a.id === loan.account_id);
  if (!account) return res.status(404).json({ success: false, message: 'Compte bancaire introuvable.' });

  const profile = state.profiles.find((p) => p.id === account.profile_id);

  // Disburse funds directly into client ledger
  account.balance += loan.amount;
  loan.status = 'funds_released';
  loan.funds_released_at = new Date().toISOString();

  const txId = 'tx_loan_' + Date.now().toString(36);
  state.transactions.unshift({
    id: txId,
    account_id: account.id,
    type: 'loan_disbursement',
    category: 'Bank Transfer',
    amount: loan.amount,
    currency: loan.currency,
    recipient_name: account.account_number,
    reference: `DISB-${Math.floor(100000 + Math.random() * 900000)}`,
    description: `Institutional Credit Disbursement — Facility #${loan.id} (${loan.project_type})`,
    status: 'completed',
    fee: 0,
    created_at: new Date().toISOString()
  });

  state.notifications.unshift({
    id: 'notif_' + Date.now().toString(36),
    profile_id: account.profile_id,
    is_for_admin: false,
    title: 'Loan Funds Disbursed',
    message: `Facility funds of ${loan.currency} ${loan.amount.toLocaleString()} have been credited to your main balance.`,
    type: 'success',
    is_read: false,
    created_at: new Date().toISOString()
  });

  db.save();

  db.addAuditLog('LOAN_FUNDS_DISBURSED', `Loan: ${loan.id}`, admin?.email, {
    disbursed_amount: loan.amount,
    account: account.account_number
  });

  if (profile) {
    await sendEmail({
      to: profile.email,
      templateKey: 'loan_disbursed',
      variables: {
        first_name: profile.first_name,
        amount: loan.amount.toLocaleString(),
        currency: loan.currency,
        project_type: loan.project_type
      }
    });
  }

  res.json({ success: true, message: 'Facility funds released to client account.', loan, account_balance: account.balance });
});

// Admin Loan Rates Management
apiRouter.get('/admin/rates', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();
  res.json({ success: true, rates: state.loan_rates });
});

apiRouter.post('/admin/rates/update', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id, annual_rate_percent, min_amount, max_amount, min_duration_months, max_duration_months } = req.body;

  const state = db.getState();
  const rateItem = state.loan_rates.find((r) => r.id === id);
  if (!rateItem) return res.status(404).json({ success: false, message: 'Rate category not found' });

  const oldRate = rateItem.annual_rate_percent;
  if (annual_rate_percent !== undefined) rateItem.annual_rate_percent = Number(annual_rate_percent);
  if (min_amount !== undefined) rateItem.min_amount = Number(min_amount);
  if (max_amount !== undefined) rateItem.max_amount = Number(max_amount);
  if (min_duration_months !== undefined) rateItem.min_duration_months = Number(min_duration_months);
  if (max_duration_months !== undefined) rateItem.max_duration_months = Number(max_duration_months);

  db.save();

  db.addAuditLog('LOAN_RATE_MODIFIED', `Rate Category: ${rateItem.category}`, admin?.email, {
    old_rate: oldRate,
    new_rate: rateItem.annual_rate_percent
  });

  res.json({ success: true, message: 'Rate updated successfully.', rate: rateItem });
});

// Admin Payment Methods Management
apiRouter.get('/admin/payment-methods', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();
  res.json({ success: true, methods: state.payment_methods });
});

apiRouter.post('/admin/payment-methods/save', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id, name, category, description, account_info, instructions, wallet_address, crypto_network, is_active, display_order } = req.body;
  const state = db.getState();

  if (id) {
    const existing = state.payment_methods.find((m) => m.id === id);
    if (!existing) return res.status(404).json({ success: false, message: 'Method not found' });
    Object.assign(existing, {
      name,
      category,
      description,
      account_info,
      instructions,
      wallet_address,
      crypto_network,
      is_active,
      display_order
    });
  } else {
    const newMethod: PaymentMethod = {
      id: 'pm_' + Date.now().toString(36),
      name,
      category,
      description,
      account_info: account_info || wallet_address || '',
      instructions: instructions || '',
      wallet_address: wallet_address || '',
      crypto_network: crypto_network || '',
      is_active: is_active ?? true,
      display_order: display_order || state.payment_methods.length + 1
    };
    state.payment_methods.push(newMethod);
  }

  db.save();
  db.addAuditLog('PAYMENT_METHOD_SAVED', `Method: ${name}`, admin?.email, {});
  res.json({ success: true, message: 'Payment channel updated.' });
});

apiRouter.delete('/admin/payment-methods/:id', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const state = db.getState();
  state.payment_methods = state.payment_methods.filter((m) => m.id !== id);
  db.save();
  db.addAuditLog('PAYMENT_METHOD_DELETED', `Method ID: ${id}`, admin?.email, {});
  res.json({ success: true, message: 'Payment method removed.' });
});

// Admin Email Templates & History
apiRouter.get('/admin/emails/history', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();
  res.json({ success: true, logs: state.email_logs });
});

apiRouter.get('/admin/emails/templates', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();
  res.json({ success: true, templates: state.email_templates });
});

apiRouter.post('/admin/emails/templates/save', requireAdmin, (req: Request, res: Response) => {
  const { id, template_key, name, subject, body_text } = req.body;
  const state = db.getState();
  const template = state.email_templates.find((t) => t.id === id || t.template_key === template_key);

  if (template) {
    template.subject = subject;
    template.body_text = body_text;
    template.name = name;
    template.updated_at = new Date().toISOString();
  } else {
    state.email_templates.push({
      id: 'tmpl_' + Date.now().toString(36),
      template_key,
      name,
      language: 'en',
      subject,
      body_text,
      updated_at: new Date().toISOString()
    });
  }

  db.save();
  res.json({ success: true, message: 'Template saved.' });
});

apiRouter.post('/admin/emails/send', requireAdmin, async (req: Request, res: Response) => {
  const { recipient, subject, content } = req.body;
  if (!recipient || !subject || !content) {
    return res.status(400).json({ success: false, message: 'Recipient, subject, and content are required.' });
  }

  const result = await sendEmail({
    to: recipient,
    subject,
    text: content,
    html: buildBankEmailHtml({
      title: subject,
      contentHtml: `<div style="font-size: 14px; line-height: 1.7; color: #cbd5e1;"><p>${content.replace(/\n/g, '<br>')}</p></div>`,
      supportEmail: 'support@movafi-groupes.com'
    }),
    variables: {}
  });

  res.json({ success: true, message: 'Email officiel MOVAFI BANK expédié avec succès.', result });
});

// Admin Bank Settings
apiRouter.get('/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();
  res.json({ success: true, settings: state.bank_settings });
});

apiRouter.post('/admin/settings/update', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const state = db.getState();
  Object.assign(state.bank_settings, req.body, { updated_at: new Date().toISOString() });
  db.save();
  db.addAuditLog('BANK_SETTINGS_MODIFIED', 'Bank Settings', admin?.email, req.body);
  res.json({ success: true, message: 'Bank settings saved.', settings: state.bank_settings });
});

// Admin Blocked IPs
apiRouter.get('/admin/security/ips', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();
  res.json({ success: true, blocked_ips: state.blocked_ips });
});

apiRouter.post('/admin/security/ips/add', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { ip_address, reason } = req.body;
  if (!ip_address || !reason) return res.status(400).json({ success: false, message: 'IP and reason are required.' });

  const state = db.getState();
  state.blocked_ips.unshift({
    id: 'bip_' + Date.now().toString(36),
    ip_address,
    reason,
    blocked_by: admin?.email,
    created_at: new Date().toISOString()
  });

  db.save();
  db.addAuditLog('IP_BLOCKED', `IP: ${ip_address}`, admin?.email, { reason });
  res.json({ success: true, message: `IP ${ip_address} added to blocklist.` });
});

apiRouter.delete('/admin/security/ips/:id', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const state = db.getState();
  state.blocked_ips = state.blocked_ips.filter((b) => b.id !== id);
  db.save();
  db.addAuditLog('IP_UNBLOCKED', `ID: ${id}`, admin?.email, {});
  res.json({ success: true, message: 'IP unblocked.' });
});

// Admin Team & RBAC
apiRouter.get('/admin/team', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();
  const admins = state.profiles.filter((p) => p.is_admin).map((p) => {
    const { password_hash, pin_hash, ...safe } = p;
    return safe;
  });
  res.json({ success: true, team: admins });
});

apiRouter.post('/admin/team/invite', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { email, first_name, last_name, admin_role, temporary_password } = req.body;

  if (!email || !first_name || !last_name || !temporary_password) {
    return res.status(400).json({ success: false, message: 'All invitation fields are mandatory.' });
  }

  const state = db.getState();
  const newAdminId = 'prof_adm_' + Date.now().toString(36);
  state.profiles.push({
    id: newAdminId,
    email: email.toLowerCase(),
    first_name,
    last_name,
    phone: '+1 (212) 555-0100',
    nationality: 'United States',
    residence_country: 'United States',
    city: 'New York',
    preferred_currency: 'USD',
    preferred_language: 'en',
    account_type: 'Business',
    occupation: admin_role === 'moderator' ? 'Compliance Moderator' : 'Executive Officer',
    monthly_income: 80000,
    activity_duration: '8 years',
    is_admin: true,
    admin_role: admin_role || 'moderator',
    password_hash: hashString(temporary_password),
    pin_hash: hashString('123456'),
    created_at: new Date().toISOString()
  });

  db.save();
  db.addAuditLog('ADMIN_INVITED', `Email: ${email}`, admin?.email, { role: admin_role });

  res.json({ success: true, message: `Staff member invited with role: ${admin_role}.` });
});

// Admin Audit Logs
apiRouter.get('/admin/audit-logs', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();
  const limit = parseInt(req.query.limit as string) || 50;
  res.json({ success: true, logs: state.audit_logs.slice(0, limit) });
});

// -------------------------------------------------------------
// REFERRAL PROGRAM ENDPOINTS (Client & Public)
// -------------------------------------------------------------

// Public: Check code validity
apiRouter.get('/referrals/check/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  const state = db.getState();
  const settings = state.referral_settings;

  if (settings && !settings.is_enabled) {
    return res.json({ success: true, valid: false, message: 'Programme de parrainage momentanément inactif.' });
  }

  const found = db.findReferralCode(code);
  if (!found) {
    return res.json({ success: true, valid: false, message: 'Code de parrainage introuvable ou expiré.' });
  }

  const referrer = state.profiles.find((p) => p.id === found.profile_id);
  const referrerName = referrer ? `${referrer.first_name} ${referrer.last_name.charAt(0)}.` : 'Un membre privé Movafi';

  res.json({
    success: true,
    valid: true,
    code: found.code,
    referrer_name: referrerName,
    message: `Invitation vérifiée de ${referrerName}.`
  });
});

// Client: Get current user's referral code and link details
apiRouter.get('/referrals/my-code', (req: Request, res: Response) => {
  const user = getAuthProfile(req);
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const codeObj = db.getOrCreateReferralCode(user.id);
  const state = db.getState();
  const settings = state.referral_settings;

  res.json({
    success: true,
    code: codeObj.code,
    total_uses: codeObj.total_uses || 0,
    created_at: codeObj.created_at,
    settings: settings || {}
  });
});

// Client: Generate a new referral code with confirmation
apiRouter.post('/referrals/generate-code', (req: Request, res: Response) => {
  const user = getAuthProfile(req);
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const newCode = db.regenerateReferralCode(user.id);
  db.addAuditLog('REFERRAL_CODE_REGENERATED', `Profile: ${user.email}`, undefined, {
    new_code: newCode.code
  });

  res.json({
    success: true,
    code: newCode.code,
    message: 'Nouveau lien et code de parrainage générés avec succès.'
  });
});

// Client: Get referral statistics, referrals list, and settings
apiRouter.get('/referrals/stats', (req: Request, res: Response) => {
  const user = getAuthProfile(req);
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const state = db.getState();
  const stats = db.getReferralStats(user.id);
  const myReferrals = state.referrals
    .filter((r) => r.referrer_profile_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((r) => {
      // Sensitive fields masked for privacy
      return {
        id: r.id,
        referee_name_masked: r.referee_name_masked || 'Filleul Privé',
        code_used: r.code_used,
        status: r.status,
        last_step_reached: r.last_step_reached,
        reward_type: r.reward_type,
        reward_value: r.reward_value,
        reward_description: r.reward_description,
        validated_at: r.validated_at,
        created_at: r.created_at,
        activity_history: r.activity_history
      };
    });

  const codeObj = db.getOrCreateReferralCode(user.id);

  res.json({
    success: true,
    stats,
    code: codeObj.code,
    referrals: myReferrals,
    settings: state.referral_settings
  });
});

// Client: Create and send invitation
apiRouter.post('/referrals/invite', async (req: Request, res: Response) => {
  const user = getAuthProfile(req);
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { email, name, custom_message } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Adresse email valide requise.' });
  }

  // Anti self-referral
  if (email.toLowerCase() === user.email.toLowerCase()) {
    return res.status(400).json({
      success: false,
      message: 'Prévention anti-auto-parrainage : vous ne pouvez pas vous inviter vous-même.'
    });
  }

  const state = db.getState();
  const settings = state.referral_settings;

  if (settings && !settings.is_enabled) {
    return res.status(400).json({ success: false, message: 'Le programme de parrainage est temporairement inactif.' });
  }

  // Check invitation limit
  const userSentCount = state.referrals.filter((r) => r.referrer_profile_id === user.id).length;
  if (settings && userSentCount >= settings.max_invitations_per_user) {
    return res.status(400).json({
      success: false,
      message: `Limite maximale d'invitations atteinte (${settings.max_invitations_per_user}).`
    });
  }

  const codeObj = db.getOrCreateReferralCode(user.id);
  const now = new Date().toISOString();
  const maskedName = name ? `${name.charAt(0)}***` : email.replace(/(^.{2})(.*)(@.*$)/, '$1***$3');

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';

  const newReferral: ReferralRecord = {
    id: 'ref_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    referrer_profile_id: user.id,
    referrer_name: `${user.first_name} ${user.last_name}`,
    referrer_email: user.email,
    referee_name: name || undefined,
    referee_name_masked: maskedName,
    referee_email: email.toLowerCase(),
    code_used: codeObj.code,
    status: 'invitation_sent',
    last_step_reached: 'Invitation transmise',
    reward_type: settings.reward_type || 'points',
    reward_value: settings.reward_value || 10,
    reward_description: `${settings.reward_value || 10} points Privilège`,
    ip_address: clientIp,
    notes: custom_message ? `Message personnalisé: ${custom_message.slice(0, 100)}` : undefined,
    activity_history: [
      { stage: 'invitation_created', label: 'Invitation créée', timestamp: now },
      { stage: 'invitation_sent', label: 'Invitation envoyée par email', timestamp: now }
    ],
    created_at: now,
    updated_at: now
  };

  state.referrals.unshift(newReferral);

  // Send invitation email simulation
  await sendEmail({
    to: email,
    subject: `Invitation privée Movafi Bank de la part de ${user.first_name} ${user.last_name}`,
    templateKey: 'referral_invitation',
    variables: {
      inviter_name: `${user.first_name} ${user.last_name}`,
      referral_code: codeObj.code,
      message: custom_message || settings.default_share_message
    }
  });

  // Client Notification
  state.notifications.unshift({
    id: 'notif_' + Date.now().toString(36),
    profile_id: user.id,
    is_for_admin: false,
    title: 'Invitation envoyée',
    message: `Votre invitation a été transmise à ${email} avec votre code ${codeObj.code}.`,
    type: 'info',
    is_read: false,
    created_at: now
  });

  db.save();

  res.json({
    success: true,
    message: 'Invitation transmise avec succès.',
    referral: {
      id: newReferral.id,
      referee_name_masked: newReferral.referee_name_masked,
      code_used: newReferral.code_used,
      status: newReferral.status,
      created_at: newReferral.created_at
    }
  });
});

// -------------------------------------------------------------
// ADMIN REFERRAL MANAGEMENT ENDPOINTS
// -------------------------------------------------------------

// Admin: Get all referrals, global stats, codes & settings
apiRouter.get('/admin/referrals', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();

  const total = state.referrals.length;
  const validated = state.referrals.filter((r) => r.status === 'referral_validated').length;
  const pending = state.referrals.filter((r) =>
    r.status === 'verification_pending' ||
    r.status === 'registration_completed' ||
    r.status === 'account_approved'
  ).length;
  const rejected = state.referrals.filter((r) => r.status === 'referral_rejected' || r.status === 'expired').length;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newRecent = state.referrals.filter((r) => new Date(r.created_at).getTime() >= sevenDaysAgo).length;

  // Compute most active users (top referrers)
  const referrerCounts: Record<string, { count: number; validated: number; name: string; email: string }> = {};
  state.referrals.forEach((r) => {
    if (!referrerCounts[r.referrer_profile_id]) {
      const prof = state.profiles.find((p) => p.id === r.referrer_profile_id);
      referrerCounts[r.referrer_profile_id] = {
        count: 0,
        validated: 0,
        name: prof ? `${prof.first_name} ${prof.last_name}` : r.referrer_name || 'Utilisateur',
        email: prof ? prof.email : r.referrer_email || ''
      };
    }
    referrerCounts[r.referrer_profile_id].count += 1;
    if (r.status === 'referral_validated') {
      referrerCounts[r.referrer_profile_id].validated += 1;
    }
  });

  const topReferrers = Object.entries(referrerCounts)
    .map(([profile_id, data]) => ({ profile_id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Return list with populated details
  const referralsList = state.referrals.map((r) => {
    const referrer = state.profiles.find((p) => p.id === r.referrer_profile_id);
    const referee = r.referee_profile_id ? state.profiles.find((p) => p.id === r.referee_profile_id) : null;
    return {
      ...r,
      referrer_name: referrer ? `${referrer.first_name} ${referrer.last_name}` : r.referrer_name || 'Inconnu',
      referrer_email: referrer ? referrer.email : r.referrer_email,
      referee_name: referee ? `${referee.first_name} ${referee.last_name}` : r.referee_name
    };
  });

  res.json({
    success: true,
    referrals: referralsList,
    codes: state.referral_codes,
    settings: state.referral_settings,
    kpis: {
      total,
      new_recent: newRecent,
      pending,
      validated,
      rejected
    },
    top_referrers: topReferrers
  });
});

// Admin: Get referral rules/settings
apiRouter.get('/admin/referral-settings', requireAdmin, (req: Request, res: Response) => {
  const state = db.getState();
  res.json({ success: true, settings: state.referral_settings });
});

// Admin: Update referral rules/settings
apiRouter.put('/admin/referral-settings', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const state = db.getState();
  const updates = req.body;

  state.referral_settings = {
    ...state.referral_settings,
    ...updates,
    updated_at: new Date().toISOString()
  };

  db.save();

  db.addAuditLog('REFERRAL_SETTINGS_UPDATED', 'Referral Program Rules', admin?.email, {
    is_enabled: state.referral_settings.is_enabled,
    reward_type: state.referral_settings.reward_type,
    reward_value: state.referral_settings.reward_value
  });

  res.json({ success: true, settings: state.referral_settings, message: 'Paramètres du programme de parrainage enregistrés.' });
});

// Admin: Update a single referral (change status, add notes, validate/reject)
apiRouter.put('/admin/referrals/:id', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { id } = req.params;
  const { status, notes, reward_value, last_step_reached } = req.body;

  const state = db.getState();
  const referral = state.referrals.find((r) => r.id === id);
  if (!referral) return res.status(404).json({ success: false, message: 'Parrainage introuvable.' });

  const prevStatus = referral.status;
  const now = new Date().toISOString();

  if (status) referral.status = status;
  if (notes !== undefined) referral.notes = notes;
  if (reward_value !== undefined) referral.reward_value = Number(reward_value);
  if (last_step_reached) referral.last_step_reached = last_step_reached;

  referral.updated_at = now;

  if (status && status !== prevStatus) {
    const stageLabels: Record<string, string> = {
      invitation_created: 'Invitation créée',
      invitation_sent: 'Invitation envoyée',
      registration_started: 'Inscription commencée',
      registration_completed: 'Inscription terminée',
      verification_pending: 'Vérification en attente',
      account_approved: 'Compte approuvé',
      referral_validated: 'Parrainage validé',
      referral_rejected: 'Parrainage rejeté',
      expired: 'Invitation expirée'
    };

    referral.activity_history.push({
      stage: status,
      label: stageLabels[status] || status,
      timestamp: now,
      note: notes ? `Action administrative: ${notes}` : 'Mise à jour par la conformité'
    });

    if (status === 'referral_validated') {
      referral.validated_at = now;
      // Notify Referrer
      state.notifications.unshift({
        id: 'notif_val_' + Date.now().toString(36),
        profile_id: referral.referrer_profile_id,
        is_for_admin: false,
        title: 'Votre parrainage est maintenant validé',
        message: `Votre parrainage pour ${referral.referee_name_masked || 'votre invité'} a été validé par la conformité.`,
        type: 'success',
        is_read: false,
        created_at: now
      });
    } else if (status === 'referral_rejected') {
      state.notifications.unshift({
        id: 'notif_rej_' + Date.now().toString(36),
        profile_id: referral.referrer_profile_id,
        is_for_admin: false,
        title: 'Mise à jour de votre invitation',
        message: `Le parrainage pour ${referral.referee_name_masked || 'votre invité'} n'a pas pu être validé.`,
        type: 'warning',
        is_read: false,
        created_at: now
      });
    }
  }

  db.save();

  db.addAuditLog('REFERRAL_RECORD_UPDATED', `Referral: ${id}`, admin?.email, {
    previous_status: prevStatus,
    new_status: status,
    notes
  });

  res.json({ success: true, message: 'Statut du parrainage mis à jour avec succès.', referral });
});

// Admin: Regenerate referral code for a specific user
apiRouter.post('/admin/referrals/regenerate-user-code', requireAdmin, (req: Request, res: Response) => {
  const admin = getAuthProfile(req);
  const { profile_id } = req.body;
  if (!profile_id) return res.status(400).json({ success: false, message: 'profile_id requis.' });

  const state = db.getState();
  const profile = state.profiles.find((p) => p.id === profile_id);
  if (!profile) return res.status(404).json({ success: false, message: 'Profil utilisateur introuvable.' });

  const newCode = db.regenerateReferralCode(profile_id);

  db.addAuditLog('ADMIN_REGENERATED_USER_REFERRAL_CODE', `User: ${profile.email}`, admin?.email, {
    new_code: newCode.code
  });

  res.json({ success: true, code: newCode.code, message: `Nouveau code généré pour ${profile.first_name} ${profile.last_name}: ${newCode.code}` });
});
