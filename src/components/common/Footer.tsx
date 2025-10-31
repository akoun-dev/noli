import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
  const footerLinks = {
    Produits: [
      { name: 'Assurance Auto', href: '/comparer' },
      { name: 'Assurance Moto', href: '/comparer' },
      { name: 'Assurance Professionnelle', href: '/comparer' },
    ],
    Entreprise: [
      { name: 'À propos', href: '/a-propos' },
      { name: 'Contact', href: '/contact' },
      { name: 'Carrières', href: '/carrieres' },
      { name: 'Presse', href: '/presse' },
    ],
    Support: [
      { name: 'Aide', href: '/aide' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Conditions Générales', href: '/conditions' },
      { name: 'Politique de Confidentialité', href: '/confidentialite' },
    ],
    Assureurs: [
      { name: 'Devenir Partenaire', href: '/assureurs/inscription' },
      { name: 'Espace Assureur', href: '/assureur/connexion' },
      { name: 'Documentation', href: '/assureurs/docs' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">NOLI Assurance</span>
            </div>
            <p className="text-gray-300 mb-6">
              Votre plateforme de comparaison d'assurances automobiles en Côte d'Ivoire.
              Trouvez la meilleure assurance au meilleur prix.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="h-4 w-4" />
                <span>+225 27 20 00 00 00</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="h-4 w-4" />
                <span>contact@noliassurance.ci</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="h-4 w-4" />
                <span>Abidjan, Côte d'Ivoire</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 text-sm">
              © {new Date().getFullYear()} NOLI Assurance. Tous droits réservés.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};