import React from 'react';
import { Building2, Shield, Lock, Award, FileCheck, CheckCircle } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-slate-900/40 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              Gouvernance & Sécurité
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Une Institution Dédiée à la Protection et au Développement de Votre Capital
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Fondée avec pour mission d'allier la discrétion et le prestige des banques privées internationales aux standards technologiques les plus exigeants, Movafi Bank United States protège vos liquidités grâce à des protocoles de ségrégation stricte des fonds.
            </p>

            <div className="space-y-3 pt-2">
              {[
                'Comptes de dépôt sous ségrégation d\'actifs et protection des dépôts',
                'Surveillance transactionnelle 24/7 par algorithmes de détection anti-fraude',
                'Cryptographie bancaire TLS 1.3 et hachage renforcé SHA-256',
                'Gestionnaire de fortune dédié et conciergerie privée pour les titulaires de cartes Infinite'
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
              <Building2 className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <strong className="text-white block">Siège Institutionnel</strong>
                540 Madison Avenue, Penthouse 40, New York, NY 10022 · États-Unis
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Normes PCI-DSS & ISO</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conformité aux plus hauts standards internationaux de traitement des flux de paiement électroniques.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Coffre-fort Numérique</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conservation sécurisée de vos pièces justificatives d'identité et contrats de financement.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Discrétion Absolue</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Politique de confidentialité renforcée sans exploitation commerciale des données de vos transactions.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Audits Permanents</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Traçabilité comptable inviolable et réconciliation automatisée de l'ensemble des dépôts et retraits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
